import { useState, useCallback, useEffect } from 'react'
import {
  useAlerts,
  useAlertStats,
  useBulkAcknowledgeAlerts,
  useAlertRules,
  useCreateAlertRule,
} from '@/hooks/useAlerts'
import { useAuthStore } from '@/stores/authStore'
import axios from 'axios'
import {
  AlertType,
  AlertSeverity,
  AlertRule,
  AlertCondition,
  AlertAction,
} from '@/types/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Check,
  Plus,
  Bell,
  BellOff,
  Settings,
  Zap,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Gauge,
  MapPin,
  Clock,
  Battery,
  Wrench,
  Fuel,
  Activity,
  Trash2,
  TrendingUp,
  Save,
  Download,
  X,
  PauseCircle,
  Archive,
} from 'lucide-react'
import { formatDateTime, getSeverityColor, formatTimeAgo } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Alert type configuration for the rule builder
const alertTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; description: string; fields: string[] }
> = {
  [AlertType.OVERSPEED]: {
    label: 'Excès de vitesse',
    icon: <Gauge size={18} />,
    description: 'Alerte quand le véhicule dépasse la limite de vitesse',
    fields: ['speedLimit'],
  },
  [AlertType.GEOFENCE_ENTRY]: {
    label: 'Entrée géoclôture',
    icon: <MapPin size={18} />,
    description: 'Alerte quand le véhicule entre dans une zone géoclôture',
    fields: ['geofenceId'],
  },
  [AlertType.GEOFENCE_EXIT]: {
    label: 'Sortie géoclôture',
    icon: <MapPin size={18} />,
    description: 'Alerte quand le véhicule quitte une zone géoclôture',
    fields: ['geofenceId'],
  },
  [AlertType.IDLE_TIMEOUT]: {
    label: 'Inactivité prolongée',
    icon: <Clock size={18} />,
    description: 'Alerte quand le véhicule est inactif trop longtemps',
    fields: ['idleMinutes'],
  },
  [AlertType.OFFLINE]: {
    label: 'Hors ligne',
    icon: <BellOff size={18} />,
    description: 'Alerte quand le véhicule se déconnecte',
    fields: ['offlineMinutes'],
  },
  [AlertType.LOW_BATTERY]: {
    label: 'Batterie faible',
    icon: <Battery size={18} />,
    description: 'Alerte quand la batterie du tracker est faible',
    fields: ['batteryPercent'],
  },
  [AlertType.MAINTENANCE_DUE]: {
    label: 'Entretien prévu',
    icon: <Wrench size={18} />,
    description: 'Alerte pour l\'entretien prévu',
    fields: ['kmThreshold'],
  },
  [AlertType.FUEL_ALERT]: {
    label: 'Alerte carburant',
    icon: <Fuel size={18} />,
    description: 'Alerte en cas de variation soudaine du carburant',
    fields: ['fuelDropPercent'],
  },
  [AlertType.HARSH_ACCELERATION]: {
    label: 'Accélération brusque',
    icon: <Activity size={18} />,
    description: 'Alerte lors d\'événements d\'accélération soudaine',
    fields: ['gForce'],
  },
  [AlertType.HARSH_BRAKING]: {
    label: 'Freinage brusque',
    icon: <Activity size={18} />,
    description: 'Alerte lors d\'événements de freinage soudain',
    fields: ['gForce'],
  },
}

const severityOptions = [
  { value: AlertSeverity.CRITICAL, label: 'Critical', color: 'text-red-600' },
  { value: AlertSeverity.HIGH, label: 'High', color: 'text-orange-600' },
  { value: AlertSeverity.MEDIUM, label: 'Medium', color: 'text-yellow-600' },
  { value: AlertSeverity.LOW, label: 'Low', color: 'text-blue-600' },
  { value: AlertSeverity.INFO, label: 'Info', color: 'text-gray-600' },
]

interface MultiCondition {
  id: string
  field: 'vitesse' | 'géoclôture' | 'batterie' | 'contact' | 'GPS'
  operator: '>' | '<' | '=' | 'entre'
  value: string
  value2?: string
  logicOperator?: 'ET' | 'OU'
}

interface RuleFormState {
  name: string
  description: string
  type: AlertType | ''
  severity: AlertSeverity
  conditionValue: string
  conditionDuration: string
  conditions: MultiCondition[]
  actions: AlertAction[]
  enabled: boolean
  escalationEnabled: boolean
  escalationDelay: '5min' | '15min' | '30min' | '1h'
  escalationTarget: 'Manager' | 'Admin' | 'Super Admin'
  escalationEmail?: string
  parentRuleId?: string
  silentHoursEnabled: boolean
  silentHoursFrom: string
  silentHoursTo: string
  silentHoursDays: boolean[]
  notificationChannels: {
    email: boolean
    pushMobile: boolean
    whatsapp: boolean
    sms: boolean
  }
}

const defaultRuleForm: RuleFormState = {
  name: '',
  description: '',
  type: '',
  severity: AlertSeverity.MEDIUM,
  conditionValue: '',
  conditionDuration: '',
  conditions: [],
  actions: [],
  enabled: true,
  escalationEnabled: false,
  escalationDelay: '15min',
  escalationTarget: 'Manager',
  escalationEmail: '',
  parentRuleId: undefined,
  silentHoursEnabled: false,
  silentHoursFrom: '22:00',
  silentHoursTo: '06:00',
  silentHoursDays: [true, true, true, true, true, true, true],
  notificationChannels: {
    email: true,
    pushMobile: false,
    whatsapp: false,
    sms: true,
  },
}

// Alert templates
const alertTemplates = [
  {
    id: 'overspeed-highway',
    name: 'Excès de vitesse autoroute',
    description: 'Alerte quand la vitesse dépasse 130 km/h',
    type: AlertType.OVERSPEED,
    severity: AlertSeverity.CRITICAL,
    conditionValue: '130',
    conditions: [],
  },
  {
    id: 'overspeed-city',
    name: 'Excès de vitesse ville',
    description: 'Alerte quand la vitesse dépasse 50 km/h',
    type: AlertType.OVERSPEED,
    severity: AlertSeverity.HIGH,
    conditionValue: '50',
    conditions: [],
  },
  {
    id: 'low-battery',
    name: 'Batterie faible',
    description: 'Alerte quand la batterie descend en dessous de 20%',
    type: AlertType.LOW_BATTERY,
    severity: AlertSeverity.MEDIUM,
    conditionValue: '20',
    conditions: [],
  },
  {
    id: 'geofence-exit',
    name: 'Sortie zone de travail',
    description: 'Alerte quand le véhicule quitte la zone',
    type: AlertType.GEOFENCE_EXIT,
    severity: AlertSeverity.HIGH,
    conditionValue: '',
    conditions: [],
  },
  {
    id: 'idle-timeout',
    name: 'Véhicule immobile >2h',
    description: 'Alerte après 2 heures d\'inactivité',
    type: AlertType.IDLE_TIMEOUT,
    severity: AlertSeverity.LOW,
    conditionValue: '120',
    conditions: [],
  },
]

type TabView = 'alerts' | 'rules' | 'trends' | 'archives'

export default function AlertsPage() {
  const [tab, setTab] = useState<TabView>('alerts')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'unacknowledged' | 'acknowledged' | 'resolved' | undefined>('unacknowledged')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState<RuleFormState>(defaultRuleForm)
  const [ruleStep, setRuleStep] = useState(0)
  const [formError, setFormError] = useState('')
  const [disabledRules, setDisabledRules] = useState<Set<string>>(new Set())
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null)
  const [alertNotes, setAlertNotes] = useState<Record<string, string>>({})
  const [alertAssignments, setAlertAssignments] = useState<Record<string, string>>({})
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteInput, setNoteInput] = useState('')
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [globalSilentHoursEnabled, setGlobalSilentHoursEnabled] = useState(false)
  const [globalSilentHoursFrom, setGlobalSilentHoursFrom] = useState('22:00')
  const [globalSilentHoursTo, setGlobalSilentHoursTo] = useState('06:00')
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({})
  const [savingAssignment, setSavingAssignment] = useState<Record<string, boolean>>({})
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'vehicle' | 'severity'>('none')
  const [quickFilterSeverity, setQuickFilterSeverity] = useState<AlertSeverity | 'all'>('all')
  const [quickFilterTime, setQuickFilterTime] = useState<'all' | 'today' | 'week'>('all')
  // Snooze/Archive features
  const [snoozedAlerts, setSnoozedAlerts] = useState<Record<string, number>>({})
  const [archivedAlerts, setArchivedAlerts] = useState<Set<string>>(new Set())
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null)

  const organizationId = useAuthStore((s: any) => s.user?.organizationId) || ''

  const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status })
  const { data: stats } = useAlertStats()
  const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts()
  const { data: rules, isLoading: rulesLoading } = useAlertRules()
  const createRuleMutation = useCreateAlertRule()

  const alerts = alertsData?.data || []
  const totalPages = alertsData?.totalPages || 1

  const filteredAlerts = alerts.filter((a) => {
    // Exclude archived alerts unless on archives tab
    if (tab !== 'archives' && archivedAlerts.has(a.id)) {
      return false
    }
    // Only show archived alerts on archives tab
    if (tab === 'archives' && !archivedAlerts.has(a.id)) {
      return false
    }

    // Keyword search filter - search by vehicle name, alert type, and message
    if (search) {
      const searchLower = search.toLowerCase()
      const matchesSearch =
        a.title.toLowerCase().includes(searchLower) ||
        a.message.toLowerCase().includes(searchLower) ||
        ((a as any).vehicleName && (a as any).vehicleName.toLowerCase().includes(searchLower))
      if (!matchesSearch) return false
    }
    // Date range filter
    if (dateFrom || dateTo) {
      const alertDate = new Date(a.createdAt)
      if (dateFrom && alertDate < new Date(dateFrom)) return false
      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (alertDate > endOfDay) return false
      }
    }
    // Quick filter: severity (Critical only)
    if (quickFilterSeverity !== 'all' && a.severity !== quickFilterSeverity) {
      return false
    }
    // Quick filter: time period
    if (quickFilterTime !== 'all') {
      const alertDate = new Date(a.createdAt)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      if (quickFilterTime === 'today' && alertDate < today) {
        return false
      } else if (quickFilterTime === 'week') {
        const weekAgo = new Date(now)
        weekAgo.setDate(weekAgo.getDate() - 7)
        if (alertDate < weekAgo) return false
      }
    }
    return true
  })

  // Group alerts based on selected grouping option
  const groupedAlerts = (() => {
    if (groupBy === 'none') {
      return { 'Toutes les alertes': filteredAlerts }
    }

    const groups: Record<string, any[]> = {}

    if (groupBy === 'type') {
      filteredAlerts.forEach((alert) => {
        const typeLabel = alertTypeConfig[alert.type]?.label || alert.type
        if (!groups[typeLabel]) groups[typeLabel] = []
        groups[typeLabel].push(alert)
      })
    } else if (groupBy === 'vehicle') {
      filteredAlerts.forEach((alert) => {
        const vehicleLabel = (alert as any).vehicleName || 'Non attribué'
        if (!groups[vehicleLabel]) groups[vehicleLabel] = []
        groups[vehicleLabel].push(alert)
      })
    } else if (groupBy === 'severity') {
      filteredAlerts.forEach((alert) => {
        const severityLabel = alert.severity
        if (!groups[severityLabel]) groups[severityLabel] = []
        groups[severityLabel].push(alert)
      })
    }

    return groups
  })()

  const handleSelectAlert = (id: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleBulkAcknowledge = () => {
    if (selectedAlerts.length > 0) {
      bulkAcknowledge(selectedAlerts)
      setSelectedAlerts([])
    }
  }

  const openRuleCreator = () => {
    setRuleForm(defaultRuleForm)
    setRuleStep(0)
    setFormError('')
    setEditingRuleId(null)
    setShowRuleModal(true)
  }

  const handleSaveAlertNote = async (alertId: string, note: string) => {
    if (!organizationId) return
    setSavingNotes((prev) => ({ ...prev, [alertId]: true }))
    try {
      await axios.put(
        `/api/organizations/${organizationId}/alerts/${alertId}`,
        { note }
      )
      setAlertNotes((prev) => ({ ...prev, [alertId]: note }))
      setShowNoteForm(false)
    } catch (err) {
      console.error('Failed to save alert note:', err)
    } finally {
      setSavingNotes((prev) => ({ ...prev, [alertId]: false }))
    }
  }

  const handleSaveAlertAssignment = async (alertId: string, role: string) => {
    if (!organizationId) return
    setSavingAssignment((prev) => ({ ...prev, [alertId]: true }))
    try {
      await axios.put(
        `/api/organizations/${organizationId}/alerts/${alertId}`,
        { assignedRole: role }
      )
      setAlertAssignments((prev) => ({ ...prev, [alertId]: role }))
      setShowAssignDropdown(false)
    } catch (err) {
      console.error('Failed to save alert assignment:', err)
    } finally {
      setSavingAssignment((prev) => ({ ...prev, [alertId]: false }))
    }
  }

  const handleMarkAlertResolved = async (alertId: string) => {
    if (!organizationId) return
    setSavingAssignment((prev) => ({ ...prev, [alertId]: true }))
    try {
      await axios.patch(
        `/api/organizations/${organizationId}/alerts/${alertId}`,
        { status: 'resolved' }
      )
      window.location.reload()
    } catch (err) {
      console.error('Failed to mark alert as resolved:', err)
    } finally {
      setSavingAssignment((prev) => ({ ...prev, [alertId]: false }))
    }
  }

  const handleEditRule = (rule: AlertRule) => {
    const condition = rule.condition as any
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      type: rule.type,
      severity: rule.severity,
      conditionValue: String(condition?.value || ''),
      conditionDuration: String(condition?.duration || ''),
      conditions: [],
      actions: rule.actions || [],
      enabled: rule.enabled,
      escalationEnabled: (rule as any).escalationEnabled || false,
      escalationDelay: (rule as any).escalationDelay || '15min',
      escalationTarget: (rule as any).escalationTarget || 'Manager',
      parentRuleId: (rule as any).parentRuleId,
      silentHoursEnabled: (rule as any).silentHoursEnabled || false,
      silentHoursFrom: (rule as any).silentHoursFrom || '22:00',
      silentHoursTo: (rule as any).silentHoursTo || '06:00',
      silentHoursDays: (rule as any).silentHoursDays || [true, true, true, true, true, true, true],
      notificationChannels: (rule as any).notificationChannels || {
        email: true,
        pushMobile: false,
        whatsapp: false,
        sms: true,
      },
    })
    setEditingRuleId(rule.id)
    setRuleStep(0)
    setFormError('')
    setShowRuleModal(true)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!organizationId) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return
    try {
      await axios.delete(
        `/api/organizations/${organizationId}/alerts/rules/${ruleId}`
      )
      window.location.reload()
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }

  const handleSnoozeAlert = (alertId: string, minutes: number) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000
    setSnoozedAlerts((prev) => ({ ...prev, [alertId]: snoozeUntil }))
    setShowSnoozeMenu(null)
  }

  const handleArchiveAlert = (alertId: string) => {
    setArchivedAlerts((prev) => new Set([...prev, alertId]))
  }

  const handleUnarchiveAlert = (alertId: string) => {
    setArchivedAlerts((prev) => {
      const newSet = new Set(prev)
      newSet.delete(alertId)
      return newSet
    })
  }

  const handleExportAlerts = () => {
    const dataToExport = filteredAlerts.map((alert) => ({
      'Date': formatDateTime(alert.createdAt),
      'Titre': alert.title,
      'Message': alert.message,
      'Sévérité': alert.severity,
      'Type': alert.type,
      'Statut': alert.isAcknowledged ? 'Reconnu' : 'Non reconnu',
      'Véhicule': (alert as any).vehicleName || 'N/A',
    }))

    const csv = [
      Object.keys(dataToExport[0] || {}).join(','),
      ...dataToExport.map((row) =>
        Object.values(row)
          .map((val) => `"${val}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `alerts-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSaveGlobalSilentHours = async () => {
    if (!organizationId) return
    try {
      await axios.put(
        `/api/organizations/${organizationId}/alerts/settings`,
        {
          globalSilentHours: {
            enabled: globalSilentHoursEnabled,
            from: globalSilentHoursFrom,
            to: globalSilentHoursTo,
          },
        }
      )
    } catch (err) {
      console.error('Failed to save global silent hours:', err)
    }
  }

  const handleCreateRule = async () => {
    setFormError('')
    if (!ruleForm.name.trim()) {
      setFormError('Le nom de la règle est requis')
      return
    }
    if (!ruleForm.type) {
      setFormError('Veuillez sélectionner un type d\'alerte')
      return
    }

    const condition: AlertCondition = {
      field: ruleForm.type === AlertType.OVERSPEED ? 'speed' : ruleForm.type,
      operator: 'greater_than',
      value: parseFloat(ruleForm.conditionValue) || 0,
      duration: parseInt(ruleForm.conditionDuration) || undefined,
    }

    try {
      const ruleData = {
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        type: ruleForm.type as AlertType,
        severity: ruleForm.severity,
        condition,
        actions: ruleForm.actions.length > 0 ? ruleForm.actions : [{ type: 'push', target: 'all' }],
        enabled: ruleForm.enabled,
        escalationEnabled: ruleForm.escalationEnabled,
        escalationDelay: ruleForm.escalationDelay,
        escalationTarget: ruleForm.escalationTarget,
        silentHoursEnabled: ruleForm.silentHoursEnabled,
        silentHoursFrom: ruleForm.silentHoursFrom,
        silentHoursTo: ruleForm.silentHoursTo,
        silentHoursDays: ruleForm.silentHoursDays,
        parentRuleId: ruleForm.parentRuleId,
      }

      if (editingRuleId) {
        await axios.put(
          `/api/organizations/${organizationId}/alerts/rules/${editingRuleId}`,
          ruleData
        )
      } else {
        await createRuleMutation.mutateAsync(ruleData as any)
      }
      setShowRuleModal(false)
      setEditingRuleId(null)
      window.location.reload()
    } catch (err: any) {
      setFormError(err.response?.data?.message || (editingRuleId ? 'Échec de la modification de la règle' : 'Échec de la création de la règle'))
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A] border-[#FF4D6A] border-opacity-30'
      case 'high':
        return 'bg-[#FFB547] bg-opacity-20 text-[#FFB547] border-[#FFB547] border-opacity-30'
      case 'medium':
        return 'bg-[#00E5CC] bg-opacity-20 text-[#00E5CC] border-[#00E5CC] border-opacity-30'
      case 'low':
        return 'bg-[#6B6B80] bg-opacity-20 text-[#6B6B80] border-[#6B6B80] border-opacity-30'
      default:
        return 'bg-[#1F1F2E] text-[#F0F0F5] border-[#2A2A3D]'
    }
  }

  const getPriorityDot = (type: string) => {
    if (['OVERSPEED', 'ACCIDENT'].includes(type)) {
      return <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#FF4D6A' }} />
    } else if (['GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY'].includes(type)) {
      return <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#FFB547' }} />
    } else {
      return <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#00E5CC' }} />
    }
  }

  const [trendData, setTrendData] = useState([
    { name: 'Lun', alerts: 12 },
    { name: 'Mar', alerts: 19 },
    { name: 'Mer', alerts: 15 },
    { name: 'Jeu', alerts: 25 },
    { name: 'Ven', alerts: 18 },
    { name: 'Sam', alerts: 10 },
    { name: 'Dim', alerts: 8 },
  ])
  const [trendsLoading, setTrendsLoading] = useState(false)

  // Generate heatmap data (24 hours)
  const heatmapData = Array.from({ length: 24 }, (_, hour) => {
    const alertsInHour = alerts.filter((a) => {
      const alertHour = new Date(a.createdAt).getHours()
      return alertHour === hour
    }).length
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      count: alertsInHour,
      intensity: Math.min((alertsInHour / 10) * 100, 100),
    }
  })

  useEffect(() => {
    const fetchTrendsData = async () => {
      if (!organizationId) return
      setTrendsLoading(true)
      try {
        const response = await axios.get(
          `/api/organizations/${organizationId}/alerts/statistics`
        )
        if (response.data?.trendData && Array.isArray(response.data.trendData)) {
          setTrendData(response.data.trendData)
        }
      } catch (err) {
        console.error('Failed to fetch trends data, using generated data:', err)
      } finally {
        setTrendsLoading(false)
      }
    }
    fetchTrendsData()
  }, [organizationId])

  const assignmentOptions = ['Admin', 'Manager', 'Opérateur']

  const generateConditionId = () => `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0A0A0F' }}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-syne" style={{ color: '#F0F0F5' }}>Alertes</h1>
          <p className="mt-1" style={{ color: '#6B6B80' }}>Surveiller et gérer les alertes et les règles de la flotte</p>
        </div>
        <div className="flex gap-2">
          {selectedAlerts.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={handleBulkAcknowledge} style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}>
              <Check size={16} />
              Reconnaître ({selectedAlerts.length})
            </Button>
          )}
          <Button className="gap-2" onClick={openRuleCreator} style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}>
            <Plus size={16} />
            Créer une règle
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: '#6B6B80' }}>Total</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#F0F0F5' }}>{stats.total}</p>
                </div>
                <Bell size={18} style={{ color: '#6B6B80' }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: '#6B6B80' }}>Non reconnus</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#FFB547' }}>{stats.unacknowledged}</p>
                </div>
                <AlertCircle size={18} style={{ color: '#FFB547' }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#FF4D6A' }}>Critical</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#FF4D6A' }}>{stats.critical}</p>
                </div>
                <Shield size={18} style={{ color: '#FF4D6A' }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#FFB547' }}>High</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#FFB547' }}>{stats.high}</p>
                </div>
                <Zap size={18} style={{ color: '#FFB547' }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#00E5CC' }}>Medium</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#00E5CC' }}>{stats.medium}</p>
                </div>
                <Activity size={18} style={{ color: '#00E5CC' }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: '#6B6B80' }}>Low / Info</p>
                  <p className="text-xl font-bold font-syne" style={{ color: '#6B6B80' }}>{stats.low + stats.info}</p>
                </div>
                <Bell size={18} style={{ color: '#6B6B80' }} />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Skeleton className="h-20" />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ backgroundColor: '#12121A' }}>
        <button
          onClick={() => setTab('alerts')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`}
          style={{
            backgroundColor: tab === 'alerts' ? '#1A1A25' : 'transparent',
            color: tab === 'alerts' ? '#F0F0F5' : '#6B6B80',
            borderBottom: tab === 'alerts' ? '2px solid #00E5CC' : 'none',
          }}
        >
          Alertes ({stats?.total || 0})
        </button>
        <button
          onClick={() => setTab('trends')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`}
          style={{
            backgroundColor: tab === 'trends' ? '#1A1A25' : 'transparent',
            color: tab === 'trends' ? '#F0F0F5' : '#6B6B80',
            borderBottom: tab === 'trends' ? '2px solid #00E5CC' : 'none',
          }}
        >
          Tendances
        </button>
        <button
          onClick={() => setTab('archives')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`}
          style={{
            backgroundColor: tab === 'archives' ? '#1A1A25' : 'transparent',
            color: tab === 'archives' ? '#F0F0F5' : '#6B6B80',
            borderBottom: tab === 'archives' ? '2px solid #00E5CC' : 'none',
          }}
        >
          Archives ({archivedAlerts.size})
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`}
          style={{
            backgroundColor: tab === 'rules' ? '#1A1A25' : 'transparent',
            color: tab === 'rules' ? '#F0F0F5' : '#6B6B80',
            borderBottom: tab === 'rules' ? '2px solid #00E5CC' : 'none',
          }}
        >
          Règles ({(rules as any)?.length || 0})
        </button>
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <>
          {/* Export Button */}
          {filteredAlerts.length > 0 && (
            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={handleExportAlerts}
                style={{ backgroundColor: 'transparent', color: '#00E5CC', borderColor: '#00E5CC', border: '1px solid' }}
              >
                <Download size={16} />
                Exporter CSV
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#44445A' }} />
                <Input
                  placeholder="Rechercher les alertes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  style={{
                    backgroundColor: '#12121A',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                  }}
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'unacknowledged', 'acknowledged', 'resolved'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s === 'all' ? undefined : s)
                      setPage(1)
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                    style={{
                      backgroundColor: (s === 'all' && !status) || status === s ? '#1A1A25' : '#12121A',
                      color: (s === 'all' && !status) || status === s ? '#00E5CC' : '#6B6B80',
                      borderColor: '#1F1F2E',
                      border: '1px solid',
                    }}
                  >
                    {s === 'all' ? 'Tout' : s === 'unacknowledged' ? 'Actif' : s === 'acknowledged' ? 'Reconnu' : 'Résolu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1" style={{ color: '#F0F0F5' }}>De</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                  style={{
                    backgroundColor: '#12121A',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                  }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1" style={{ color: '#F0F0F5' }}>À</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                  style={{
                    backgroundColor: '#12121A',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                  }}
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setPage(1)
                  }}
                  style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setQuickFilterTime('all')
                    setQuickFilterSeverity('all')
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: quickFilterTime === 'all' && quickFilterSeverity === 'all' ? '#00E5CC' : '#12121A',
                    color: quickFilterTime === 'all' && quickFilterSeverity === 'all' ? '#0A0A0F' : '#6B6B80',
                    borderColor: '#1F1F2E',
                    border: '1px solid',
                  }}
                >
                  Réinitialiser filtres
                </button>
                <button
                  onClick={() => {
                    setQuickFilterTime('today')
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: quickFilterTime === 'today' ? '#00E5CC' : '#12121A',
                    color: quickFilterTime === 'today' ? '#0A0A0F' : '#6B6B80',
                    borderColor: '#1F1F2E',
                    border: '1px solid',
                  }}
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => {
                    setQuickFilterTime('week')
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: quickFilterTime === 'week' ? '#00E5CC' : '#12121A',
                    color: quickFilterTime === 'week' ? '#0A0A0F' : '#6B6B80',
                    borderColor: '#1F1F2E',
                    border: '1px solid',
                  }}
                >
                  Cette semaine
                </button>
                <button
                  onClick={() => {
                    setQuickFilterSeverity(quickFilterSeverity === AlertSeverity.CRITICAL ? 'all' : AlertSeverity.CRITICAL)
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: quickFilterSeverity === AlertSeverity.CRITICAL ? '#FF4D6A' : '#12121A',
                    color: quickFilterSeverity === AlertSeverity.CRITICAL ? '#F0F0F5' : '#6B6B80',
                    borderColor: '#1F1F2E',
                    border: '1px solid',
                  }}
                >
                  Critique uniquement
                </button>
                <button
                  onClick={() => {
                    setStatus('unacknowledged')
                    setPage(1)
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`}
                  style={{
                    backgroundColor: status === 'unacknowledged' ? '#FFB547' : '#12121A',
                    color: status === 'unacknowledged' ? '#0A0A0F' : '#6B6B80',
                    borderColor: '#1F1F2E',
                    border: '1px solid',
                  }}
                >
                  Non acquittées
                </button>
              </div>

              {/* Grouping Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium" style={{ color: '#F0F0F5' }}>Grouper par:</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as 'none' | 'type' | 'vehicle' | 'severity')}
                  style={{
                    backgroundColor: '#12121A',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                    border: '1px solid',
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                >
                  <option value="none">Aucun</option>
                  <option value="type">Type</option>
                  <option value="vehicle">Véhicule</option>
                  <option value="severity">Sévérité</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alert List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }} className="text-center">
              <CardContent className="py-12">
                <Bell className="mx-auto mb-4" size={48} style={{ color: '#44445A' }} />
                <h3 className="text-lg font-medium font-syne" style={{ color: '#F0F0F5' }}>Aucune alerte trouvée</h3>
                <p className="mt-1 text-sm" style={{ color: '#6B6B80' }}>
                  {search ? 'Essayez un terme de recherche différent' : 'Tout clair ! Aucune alerte active.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedAlerts).map(([groupTitle, groupAlerts]) => (
                <div key={groupTitle}>
                  {groupBy !== 'none' && (
                    <h4 className="text-sm font-semibold mb-2 px-1" style={{ color: '#F0F0F5' }}>{groupTitle} ({groupAlerts.length})</h4>
                  )}
                  <div className="space-y-2">
                    {groupAlerts.map((alert) => (
                      <Card
                        key={alert.id}
                        className={`transition-all cursor-pointer ${snoozedAlerts[alert.id] ? 'opacity-60' : ''}`}
                        style={{
                          backgroundColor: snoozedAlerts[alert.id] ? '#0F0F14' : '#12121A',
                          borderColor: selectedAlerts.includes(alert.id) ? '#00E5CC' : selectedAlertId === alert.id ? '#00E5CC' : '#1F1F2E',
                          borderWidth: '1px',
                        }}
                        onClick={() => {
                          setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id)
                          setShowNoteForm(false)
                          setShowAssignDropdown(false)
                          setShowSnoozeMenu(null)
                        }}
                      >
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedAlerts.includes(alert.id)}
                              onChange={() => handleSelectAlert(alert.id)}
                              style={{
                                accentColor: '#00E5CC',
                                marginTop: '4px',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div
                              className={`rounded-lg p-2 ${getSeverityBadgeClass(alert.severity)}`}
                            >
                              {getPriorityDot(alert.type)}
                              <AlertCircle size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className="font-medium font-syne" style={{ color: '#F0F0F5' }}>{alert.title}</h3>
                                  <p className="mt-0.5 text-sm line-clamp-1" style={{ color: '#6B6B80' }}>{alert.message}</p>
                              {snoozedAlerts[alert.id] && (
                                <p className="mt-1 text-xs" style={{ color: '#00E5CC' }}>
                                  Reporté jusqu'à {new Date(snoozedAlerts[alert.id]).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <span
                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                      alert.severity
                                    )}`}
                                  >
                                    {alert.severity}
                                  </span>
                                  {(alert as any).status === 'resolved' ? (
                                    <Badge style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }} className="text-xs">
                                      <Check size={12} className="mr-1" />
                                      Résolu
                                    </Badge>
                                  ) : alert.isAcknowledged ? (
                                    <Badge variant="secondary" className="text-xs" style={{ backgroundColor: '#1A1A25', color: '#F0F0F5', borderColor: '#1F1F2E' }}>
                                      <Check size={12} className="mr-1" />
                                      Reconnu
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 gap-1 text-xs"
                                      style={{ color: '#00E5CC' }}
                                      onClick={() => bulkAcknowledge([alert.id])}
                                    >
                                      <Check size={12} />
                                      Reconnaître
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <p className="mt-1 text-xs" style={{ color: '#44445A' }}>{formatTimeAgo(alert.createdAt)}</p>

                              {selectedAlertId === alert.id && (
                                <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: '#1F1F2E' }}>
                                  {alertAssignments[alert.id] && (
                                    <div className="text-xs">
                                      <span style={{ color: '#6B6B80' }}>Assigné à: </span>
                                      <Badge variant="outline" className="ml-1" style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}>
                                        {alertAssignments[alert.id]}
                                      </Badge>
                                    </div>
                                  )}
                                  <div className="flex gap-2 flex-wrap">
                                    <div className="relative">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-xs"
                                        style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setShowSnoozeMenu(showSnoozeMenu === alert.id ? null : alert.id)
                                        }}
                                      >
                                        <PauseCircle size={12} />
                                        Reporter
                                      </Button>
                                      {showSnoozeMenu === alert.id && (
                                        <div
                                          className="absolute top-full mt-1 left-0 z-10 rounded-lg border bg-[#1A1A25] border-[#1F1F2E]"
                                          style={{ minWidth: '120px' }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {[
                                            { label: '15 min', minutes: 15 },
                                            { label: '30 min', minutes: 30 },
                                            { label: '1h', minutes: 60 },
                                            { label: '4h', minutes: 240 },
                                            { label: '24h', minutes: 1440 },
                                          ].map((option) => (
                                            <button
                                              key={option.minutes}
                                              onClick={() => handleSnoozeAlert(alert.id, option.minutes)}
                                              className="w-full text-left px-3 py-2 text-xs hover:bg-[#1F1F2E] text-[#F0F0F5]"
                                            >
                                              {option.label}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleArchiveAlert(alert.id)
                                      }}
                                    >
                                      <Archive size={12} />
                                      Archiver
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowAssignDropdown(!showAssignDropdown)
                                      }}
                                    >
                                      Assigner
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-xs"
                                      style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setShowNoteForm(!showNoteForm)
                                        setNoteInput(alertNotes[alert.id] || '')
                                      }}
                                    >
                                      Notes
                                    </Button>
                                    {(alert as any).status !== 'resolved' && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-xs"
                                        style={{ borderColor: '#00E5CC', color: '#00E5CC' }}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMarkAlertResolved(alert.id)
                                        }}
                                        disabled={savingAssignment[alert.id]}
                                      >
                                        <Check size={12} />
                                        Marquer résolu
                                      </Button>
                                    )}
                                  </div>

                                  {showAssignDropdown && (
                                    <div className="flex gap-1 flex-wrap">
                                      {assignmentOptions.map((opt) => (
                                        <Badge
                                          key={opt}
                                          variant="secondary"
                                          className="cursor-pointer opacity-70 hover:opacity-100"
                                          style={{ backgroundColor: '#1A1A25', color: '#F0F0F5', borderColor: '#1F1F2E' }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleSaveAlertAssignment(alert.id, opt)
                                          }}
                                        >
                                          {savingAssignment[alert.id] ? '...' : opt}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}

                                  {showNoteForm && (
                                    <div className="space-y-2">
                                      <textarea
                                        placeholder="Ajouter une note..."
                                        value={noteInput}
                                        onChange={(e) => setNoteInput(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-xs p-2 rounded resize-none"
                                        style={{
                                          backgroundColor: '#1A1A25',
                                          borderColor: '#1F1F2E',
                                          color: '#F0F0F5',
                                          border: '1px solid',
                                        }}
                                        rows={2}
                                      />
                                      <Button
                                        size="sm"
                                        className="gap-1 text-xs w-full"
                                        style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}
                                        disabled={savingNotes[alert.id]}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleSaveAlertNote(alert.id, noteInput)
                                        }}
                                      >
                                        <Save size={12} />
                                        {savingNotes[alert.id] ? 'Enregistrement...' : 'Enregistrer'}
                                      </Button>
                                    </div>
                                  )}

                                  {alertNotes[alert.id] && (
                                    <div className="text-xs p-2 rounded" style={{ backgroundColor: '#1A1A25', borderColor: '#1F1F2E', border: '1px solid' }}>
                                      <p className="font-medium" style={{ color: '#F0F0F5' }}>Note:</p>
                                      <p className="mt-1" style={{ color: '#6B6B80' }}>{alertNotes[alert.id]}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#6B6B80' }}>
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Archives Tab */}
      {tab === 'archives' && (
        <>
          {filteredAlerts.length === 0 ? (
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }} className="text-center">
              <CardContent className="py-12">
                <Archive className="mx-auto mb-4" size={48} style={{ color: '#44445A' }} />
                <h3 className="text-lg font-medium font-syne" style={{ color: '#F0F0F5' }}>Aucune alerte archivée</h3>
                <p className="mt-1 text-sm" style={{ color: '#6B6B80' }}>
                  Les alertes que vous archivez apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="transition-all"
                  style={{
                    backgroundColor: '#12121A',
                    borderColor: '#1F1F2E',
                    borderWidth: '1px',
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-lg p-2 ${getSeverityBadgeClass(alert.severity)}`}
                      >
                        {getPriorityDot(alert.type)}
                        <AlertCircle size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-medium font-syne" style={{ color: '#F0F0F5' }}>{alert.title}</h3>
                            <p className="mt-0.5 text-sm line-clamp-1" style={{ color: '#6B6B80' }}>{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            <Badge style={{ backgroundColor: '#6B6B80', color: '#F0F0F5' }} className="text-xs">
                              Archivé
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}
                              onClick={() => handleUnarchiveAlert(alert.id)}
                            >
                              <X size={12} />
                              Restaurer
                            </Button>
                          </div>
                        </div>
                        <p className="mt-1 text-xs" style={{ color: '#44445A' }}>{formatTimeAgo(alert.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm" style={{ color: '#6B6B80' }}>Alertes cette semaine</p>
                  <p className="mt-2 text-2xl font-bold font-syne" style={{ color: '#F0F0F5' }}>87</p>
                </div>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm" style={{ color: '#6B6B80' }}>Alertes ce mois</p>
                  <p className="mt-2 text-2xl font-bold font-syne" style={{ color: '#F0F0F5' }}>342</p>
                </div>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm" style={{ color: '#6B6B80' }}>Type le plus fréquent</p>
                  <p className="mt-2 text-lg font-bold font-syne" style={{ color: '#FFB547' }}>Overspeed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-syne" style={{ color: '#F0F0F5' }}>
                <TrendingUp size={20} />
                Fréquence des alertes - 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00E5CC" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F1F2E" />
                  <XAxis dataKey="name" stroke="#6B6B80" />
                  <YAxis stroke="#6B6B80" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A25', borderColor: '#1F1F2E' }} />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#00E5CC"
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Heatmap - Alert concentration by time of day */}
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-syne" style={{ color: '#F0F0F5' }}>
                <Clock size={20} />
                Concentration des alertes par heure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 items-end justify-between h-40">
                {heatmapData.map((data, idx) => {
                  const getHeatColor = (intensity: number) => {
                    if (intensity === 0) return '#1F1F2E'
                    if (intensity < 25) return '#6B6B80'
                    if (intensity < 50) return '#00E5CC'
                    if (intensity < 75) return '#FFB547'
                    return '#FF4D6A'
                  }
                  return (
                    <div
                      key={idx}
                      className="flex-1 rounded-t-sm transition-all hover:opacity-80 cursor-pointer"
                      style={{
                        backgroundColor: getHeatColor(data.intensity),
                        height: `${Math.max(10, (data.count / Math.max(...heatmapData.map((d) => d.count))) * 100)}%`,
                        minHeight: '8px',
                      }}
                      title={`${data.hour}: ${data.count} alertes`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between mt-3 text-xs" style={{ color: '#6B6B80' }}>
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {/* Alert Templates */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold" style={{ color: '#F0F0F5' }}>Modèles d'alerte</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {alertTemplates.map((template) => (
                <Card
                  key={template.id}
                  style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}
                  className="cursor-pointer hover:border-[#00E5CC] transition-colors"
                >
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium" style={{ color: '#F0F0F5' }}>{template.name}</h4>
                        <p className="text-xs mt-1 line-clamp-2" style={{ color: '#6B6B80' }}>{template.description}</p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1 text-xs shrink-0 ml-2"
                        style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}
                        onClick={() => {
                          setRuleForm((prev) => ({
                            ...prev,
                            name: template.name,
                            description: template.description,
                            type: template.type,
                            severity: template.severity,
                            conditionValue: template.conditionValue,
                          }))
                          setRuleStep(1)
                          setShowRuleModal(true)
                        }}
                      >
                        Utiliser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Silent Hours Configuration Card */}
          <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid', backgroundImage: 'linear-gradient(135deg, rgba(0, 229, 204, 0.1) 0%, rgba(0, 229, 204, 0.05) 100%)' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-syne" style={{ color: '#00E5CC' }}>
                <Clock size={18} />
                Heures silencieuses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="silentEnabled"
                  checked={globalSilentHoursEnabled}
                  onChange={(e) => {
                    setGlobalSilentHoursEnabled(e.target.checked)
                    handleSaveGlobalSilentHours()
                  }}
                  style={{ accentColor: '#00E5CC' }}
                />
                <label htmlFor="silentEnabled" className="text-sm font-medium" style={{ color: '#F0F0F5' }}>
                  Activer les heures silencieuses globales
                </label>
              </div>
              <p className="text-xs" style={{ color: '#6B6B80' }}>
                Les alertes non-critiques seront mises en attente pendant cette période
              </p>
              <div className="flex gap-2 items-center">
                <span className="text-sm" style={{ color: '#6B6B80' }}>De</span>
                <input
                  type="time"
                  value={globalSilentHoursFrom}
                  onChange={(e) => {
                    setGlobalSilentHoursFrom(e.target.value)
                  }}
                  onBlur={handleSaveGlobalSilentHours}
                  style={{
                    backgroundColor: '#1A1A25',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                    border: '1px solid',
                  }}
                  className="rounded-md px-2 py-1 text-sm"
                />
                <span className="text-sm" style={{ color: '#6B6B80' }}>à</span>
                <input
                  type="time"
                  value={globalSilentHoursTo}
                  onChange={(e) => {
                    setGlobalSilentHoursTo(e.target.value)
                  }}
                  onBlur={handleSaveGlobalSilentHours}
                  style={{
                    backgroundColor: '#1A1A25',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                    border: '1px solid',
                  }}
                  className="rounded-md px-2 py-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {rulesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : !rules || (rules as any[]).length === 0 ? (
            <Card style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }} className="text-center">
              <CardContent className="py-12">
                <Settings className="mx-auto mb-4" size={48} style={{ color: '#44445A' }} />
                <h3 className="text-lg font-medium font-syne" style={{ color: '#F0F0F5' }}>Aucune règle d'alerte configurée</h3>
                <p className="mt-1 text-sm" style={{ color: '#6B6B80' }}>
                  Créez des règles pour générer automatiquement des alertes en fonction des conditions des véhicules.
                </p>
                <Button className="mt-4 gap-2" onClick={openRuleCreator} style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}>
                  <Plus size={16} />
                  Créer votre première règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(rules as AlertRule[]).map((rule) => {
                const typeConf = alertTypeConfig[rule.type]
                return (
                  <Card key={rule.id} style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-2.5`}
                          style={{
                            backgroundColor: rule.enabled ? 'rgba(0, 229, 204, 0.2)' : 'rgba(68, 68, 90, 0.2)',
                            color: rule.enabled ? '#00E5CC' : '#44445A',
                          }}
                        >
                          {typeConf?.icon || <Bell size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium font-syne" style={{ color: '#F0F0F5' }}>{rule.name}</h3>
                            <Badge variant={!disabledRules.has(rule.id) && rule.enabled ? 'default' : 'secondary'} style={{ backgroundColor: !disabledRules.has(rule.id) && rule.enabled ? '#00E5CC' : '#1A1A25', color: !disabledRules.has(rule.id) && rule.enabled ? '#0A0A0F' : '#F0F0F5' }}>
                              {!disabledRules.has(rule.id) && rule.enabled ? 'Actif' : 'Désactivé'}
                            </Badge>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                rule.severity
                              )}`}
                            >
                              {rule.severity}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm" style={{ color: '#6B6B80' }}>
                            {rule.description || typeConf?.description || rule.type}
                          </p>
                          {(rule as any).escalationEnabled && (
                            <p className="mt-1 text-xs" style={{ color: '#FFB547' }}>
                              <span className="font-medium">Escalade:</span> {(rule as any).escalationDelay} → {(rule as any).escalationTarget}
                            </p>
                          )}
                          {(rule as any).parentRuleId && (
                            <p className="mt-1 text-xs" style={{ color: '#00E5CC' }}>
                              <span className="font-medium">Dépend de:</span> Règle parente
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => {
                              setDisabledRules((prev) => {
                                const next = new Set(prev)
                                if (next.has(rule.id)) {
                                  next.delete(rule.id)
                                } else {
                                  next.add(rule.id)
                                }
                                return next
                              })
                            }}
                            className={`h-8 w-12 rounded-full transition-colors`}
                            style={{
                              backgroundColor: disabledRules.has(rule.id)
                                ? '#44445A'
                                : '#00E5CC',
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            style={{ color: '#6B6B80' }}
                            onClick={() => handleEditRule(rule)}
                          >
                            <Settings size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            style={{ color: '#FF4D6A' }}
                            onClick={() => handleDeleteRule(rule.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rule Creation Wizard Modal */}
      <Dialog open={showRuleModal} onOpenChange={() => {
        setShowRuleModal(false)
        setEditingRuleId(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#F0F0F5', fontFamily: 'Syne' }}>{editingRuleId ? 'Modifier la règle d\'alerte' : 'Créer une règle d\'alerte'}</DialogTitle>
            <DialogDescription style={{ color: '#6B6B80' }}>
              {ruleStep === 0
                ? 'Étape 1 : Choisir un type d\'alerte'
                : ruleStep === 1
                  ? 'Étape 2 : Configurer la règle'
                  : ruleStep === 2
                    ? 'Étape 3 : Définir les actions de notification'
                    : 'Étape 4 : Configuration avancée'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {[0, 1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium`}
                  style={{
                    backgroundColor: step < ruleStep ? '#00E5CC' : step === ruleStep ? '#1A1A25' : '#44445A',
                    color: step < ruleStep ? '#0A0A0F' : '#F0F0F5',
                    border: step === ruleStep ? '2px solid #00E5CC' : 'none',
                  }}
                >
                  {step < ruleStep ? <Check size={14} /> : step + 1}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5`}
                    style={{ backgroundColor: step < ruleStep ? '#00E5CC' : '#1F1F2E' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Select Alert Type */}
          {ruleStep === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(alertTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => {
                    setRuleForm((prev) => ({
                      ...prev,
                      type: type as AlertType,
                      name: prev.name || config.label + ' Alert',
                    }))
                    setRuleStep(1)
                  }}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors`}
                  style={{
                    borderColor: ruleForm.type === type ? '#00E5CC' : '#1F1F2E',
                    backgroundColor: ruleForm.type === type ? 'rgba(0, 229, 204, 0.1)' : '#1A1A25',
                  }}
                >
                  <div className="rounded-lg p-2" style={{ backgroundColor: '#44445A', color: '#6B6B80' }}>{config.icon}</div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#F0F0F5' }}>{config.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B6B80' }}>{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Configure */}
          {ruleStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#F0F0F5' }}>Nom de la règle *</label>
                <Input
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex. Alerte de vitesse sur autoroute"
                  style={{
                    backgroundColor: '#1A1A25',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#F0F0F5' }}>Description</label>
                <Input
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description facultative..."
                  style={{
                    backgroundColor: '#1A1A25',
                    borderColor: '#1F1F2E',
                    color: '#F0F0F5',
                  }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#F0F0F5' }}>Gravité</label>
                <div className="flex flex-wrap gap-2">
                  {severityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRuleForm((prev) => ({ ...prev, severity: opt.value }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors`}
                      style={{
                        borderColor: ruleForm.severity === opt.value ? '#00E5CC' : '#1F1F2E',
                        backgroundColor: ruleForm.severity === opt.value ? 'rgba(0, 229, 204, 0.15)' : 'transparent',
                        color: ruleForm.severity === opt.value ? '#F0F0F5' : '#6B6B80',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: '#F0F0F5' }}>
                  Valeur de seuil
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={ruleForm.conditionValue}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, conditionValue: e.target.value }))
                    }
                    placeholder={
                      ruleForm.type === AlertType.OVERSPEED
                        ? 'Limite de vitesse (km/h)'
                        : ruleForm.type === AlertType.IDLE_TIMEOUT
                          ? 'Minutes'
                          : ruleForm.type === AlertType.LOW_BATTERY
                            ? 'Batterie %'
                            : 'Valeur'
                    }
                    className="flex-1"
                    style={{
                      backgroundColor: '#1A1A25',
                      borderColor: '#1F1F2E',
                      color: '#F0F0F5',
                    }}
                  />
                  <Input
                    type="number"
                    value={ruleForm.conditionDuration}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, conditionDuration: e.target.value }))
                    }
                    placeholder="Durée (secondes)"
                    className="flex-1"
                    style={{
                      backgroundColor: '#1A1A25',
                      borderColor: '#1F1F2E',
                      color: '#F0F0F5',
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: '#6B6B80' }}>
                  Durée : combien de temps la condition doit être respectée avant le déclenchement
                </p>
              </div>

              {/* Multi-Conditions */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#1F1F2E' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm" style={{ color: '#F0F0F5' }}>Conditions supplémentaires</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs"
                    style={{ borderColor: '#00E5CC', color: '#00E5CC' }}
                    onClick={() => {
                      setRuleForm((prev) => ({
                        ...prev,
                        conditions: [
                          ...prev.conditions,
                          {
                            id: generateConditionId(),
                            field: 'vitesse',
                            operator: '>',
                            value: '',
                            logicOperator: prev.conditions.length > 0 ? 'ET' : undefined,
                          },
                        ],
                      }))
                    }}
                  >
                    <Plus size={12} />
                    Ajouter condition
                  </Button>
                </div>

                {ruleForm.conditions.length > 0 && (
                  <div className="space-y-3">
                    {ruleForm.conditions.map((cond, idx) => (
                      <div key={cond.id} className="space-y-2 pb-3 border-b" style={{ borderColor: '#1F1F2E' }}>
                        {idx > 0 && (
                          <select
                            value={cond.logicOperator || 'ET'}
                            onChange={(e) => {
                              const newConds = [...ruleForm.conditions]
                              newConds[idx].logicOperator = e.target.value as 'ET' | 'OU'
                              setRuleForm((prev) => ({ ...prev, conditions: newConds }))
                            }}
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                              border: '1px solid',
                            }}
                            className="rounded-md px-2 py-1 text-xs font-medium w-16"
                          >
                            <option value="ET">ET</option>
                            <option value="OU">OU</option>
                          </select>
                        )}
                        <div className="flex gap-2">
                          <select
                            value={cond.field}
                            onChange={(e) => {
                              const newConds = [...ruleForm.conditions]
                              newConds[idx].field = e.target.value as any
                              setRuleForm((prev) => ({ ...prev, conditions: newConds }))
                            }}
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                              border: '1px solid',
                            }}
                            className="rounded-md px-2 py-1 text-xs flex-1"
                          >
                            <option value="vitesse">Vitesse</option>
                            <option value="géoclôture">Géoclôture</option>
                            <option value="batterie">Batterie</option>
                            <option value="contact">Contact</option>
                            <option value="GPS">GPS</option>
                          </select>

                          <select
                            value={cond.operator}
                            onChange={(e) => {
                              const newConds = [...ruleForm.conditions]
                              newConds[idx].operator = e.target.value as any
                              setRuleForm((prev) => ({ ...prev, conditions: newConds }))
                            }}
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                              border: '1px solid',
                            }}
                            className="rounded-md px-2 py-1 text-xs"
                          >
                            <option value=">">Supérieur à</option>
                            <option value="<">Inférieur à</option>
                            <option value="=">=</option>
                            <option value="entre">Entre</option>
                          </select>

                          <Input
                            type="text"
                            value={cond.value}
                            onChange={(e) => {
                              const newConds = [...ruleForm.conditions]
                              newConds[idx].value = e.target.value
                              setRuleForm((prev) => ({ ...prev, conditions: newConds }))
                            }}
                            placeholder="Valeur"
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                            }}
                            className="flex-1"
                          />

                          {cond.operator === 'entre' && (
                            <Input
                              type="text"
                              value={cond.value2 || ''}
                              onChange={(e) => {
                                const newConds = [...ruleForm.conditions]
                                newConds[idx].value2 = e.target.value
                                setRuleForm((prev) => ({ ...prev, conditions: newConds }))
                              }}
                              placeholder="Valeur 2"
                              style={{
                                backgroundColor: '#1A1A25',
                                borderColor: '#1F1F2E',
                                color: '#F0F0F5',
                              }}
                              className="flex-1"
                            />
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            style={{ color: '#FF4D6A' }}
                            onClick={() => {
                              setRuleForm((prev) => ({
                                ...prev,
                                conditions: prev.conditions.filter((c) => c.id !== cond.id),
                              }))
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm" style={{ color: '#F0F0F5' }}>
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                  style={{ accentColor: '#00E5CC' }}
                />
                Activer la règle immédiatement
              </label>
            </div>
          )}

          {/* Step 2: Actions */}
          {ruleStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: '#6B6B80' }}>
                Choisissez comment être averti lorsque cette règle se déclenche :
              </p>

              {['push', 'email', 'sms', 'webhook'].map((actionType) => {
                const isSelected = ruleForm.actions.some((a) => a.type === actionType)
                return (
                  <label
                    key={actionType}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors`}
                    style={{
                      borderColor: isSelected ? '#00E5CC' : '#1F1F2E',
                      backgroundColor: isSelected ? 'rgba(0, 229, 204, 0.1)' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setRuleForm((prev) => ({
                          ...prev,
                          actions: isSelected
                            ? prev.actions.filter((a) => a.type !== actionType)
                            : [
                                ...prev.actions,
                                { type: actionType as AlertAction['type'], target: 'all' },
                              ],
                        }))
                      }}
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <div>
                      <p className="font-medium text-sm capitalize" style={{ color: '#F0F0F5' }}>
                        {actionType === 'push'
                          ? 'Notification Push'
                          : actionType === 'email'
                            ? 'Notification Email'
                            : actionType === 'sms'
                              ? 'Notification SMS'
                              : 'Webhook'}
                      </p>
                      <p className="text-xs" style={{ color: '#6B6B80' }}>
                        {actionType === 'push'
                          ? 'Notification in-app pour tous les membres de l\'équipe'
                          : actionType === 'email'
                            ? 'Envoyer un email aux destinataires configurés'
                            : actionType === 'sms'
                              ? 'Envoyer un SMS aux numéros de téléphone configurés'
                              : 'Appeler l\'URL webhook externe'}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {/* Step 3: Advanced Configuration */}
          {ruleStep === 3 && (
            <div className="space-y-5">
              {/* Notification Channels */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#1F1F2E' }}>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#F0F0F5' }}>Canaux de notification</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm" style={{ color: '#F0F0F5' }}>
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.email}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, email: e.target.checked },
                        }))
                      }
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <span>Email</span>
                    <span className="ml-auto text-xs" style={{ color: '#00E5CC' }}>✅</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm" style={{ color: '#F0F0F5' }}>
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.pushMobile}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, pushMobile: e.target.checked },
                        }))
                      }
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <span>Push mobile</span>
                    <span className="ml-auto text-xs" style={{ color: '#FFB547' }}>⚠️ Non configuré</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm opacity-50" style={{ color: '#F0F0F5' }}>
                    <input type="checkbox" disabled style={{ accentColor: '#00E5CC' }} />
                    <span>WhatsApp</span>
                    <span className="ml-auto text-xs" style={{ color: '#FF4D6A' }}>❌ Non disponible</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm" style={{ color: '#F0F0F5' }}>
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.sms}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, sms: e.target.checked },
                        }))
                      }
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <span>SMS</span>
                    <span className="ml-auto text-xs" style={{ color: '#00E5CC' }}>✅</span>
                  </label>
                </div>
              </div>

              {/* Escalation */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#1F1F2E' }}>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#F0F0F5' }}>Escalade</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm" style={{ color: '#F0F0F5' }}>
                    <input
                      type="checkbox"
                      checked={ruleForm.escalationEnabled}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, escalationEnabled: e.target.checked }))}
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <span>Activer l'escalade automatique</span>
                  </label>
                  {ruleForm.escalationEnabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>Si non acquittée après (minutes)</label>
                        <select
                          value={ruleForm.escalationDelay}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              escalationDelay: e.target.value as any,
                            }))
                          }
                          style={{
                            width: '100%',
                            backgroundColor: '#1A1A25',
                            borderColor: '#1F1F2E',
                            color: '#F0F0F5',
                            border: '1px solid',
                          }}
                          className="rounded-md px-2 py-1 text-sm"
                        >
                          <option value="5min">5 minutes</option>
                          <option value="15min">15 minutes</option>
                          <option value="30min">30 minutes</option>
                          <option value="1h">1 heure</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>Envoyer à</label>
                        <Input
                          type="email"
                          value={ruleForm.escalationEmail || ''}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              escalationEmail: e.target.value,
                            }))
                          }
                          placeholder="email@example.com"
                          style={{
                            backgroundColor: '#1A1A25',
                            borderColor: '#1F1F2E',
                            color: '#F0F0F5',
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>Ou escalader vers</label>
                        <select
                          value={ruleForm.escalationTarget}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              escalationTarget: e.target.value as any,
                            }))
                          }
                          style={{
                            width: '100%',
                            backgroundColor: '#1A1A25',
                            borderColor: '#1F1F2E',
                            color: '#F0F0F5',
                            border: '1px solid',
                          }}
                          className="rounded-md px-2 py-1 text-sm"
                        >
                          <option value="Manager">Manager</option>
                          <option value="Admin">Admin</option>
                          <option value="Super Admin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Silent Hours */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#1F1F2E' }}>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#F0F0F5' }}>Heures silencieuses</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm" style={{ color: '#F0F0F5' }}>
                    <input
                      type="checkbox"
                      checked={ruleForm.silentHoursEnabled}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursEnabled: e.target.checked }))}
                      style={{ accentColor: '#00E5CC' }}
                    />
                    <span>Activer les heures silencieuses</span>
                  </label>
                  {ruleForm.silentHoursEnabled && (
                    <div className="ml-6 space-y-3">
                      <div className="flex gap-2 items-end">
                        <div>
                          <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>De</label>
                          <input
                            type="time"
                            value={ruleForm.silentHoursFrom}
                            onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursFrom: e.target.value }))}
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                              border: '1px solid',
                            }}
                            className="rounded-md px-2 py-1 text-sm"
                          />
                        </div>
                        <span style={{ color: '#44445A' }}>à</span>
                        <div>
                          <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>À</label>
                          <input
                            type="time"
                            value={ruleForm.silentHoursTo}
                            onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursTo: e.target.value }))}
                            style={{
                              backgroundColor: '#1A1A25',
                              borderColor: '#1F1F2E',
                              color: '#F0F0F5',
                              border: '1px solid',
                            }}
                            className="rounded-md px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium" style={{ color: '#F0F0F5' }}>Jours applicables</label>
                        <div className="flex gap-2">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const newDays = [...ruleForm.silentHoursDays]
                                newDays[idx] = !newDays[idx]
                                setRuleForm((prev) => ({ ...prev, silentHoursDays: newDays }))
                              }}
                              className={`h-8 w-8 rounded-md border text-xs font-medium transition-colors`}
                              style={{
                                borderColor: ruleForm.silentHoursDays[idx] ? '#00E5CC' : '#1F1F2E',
                                backgroundColor: ruleForm.silentHoursDays[idx] ? '#00E5CC' : 'transparent',
                                color: ruleForm.silentHoursDays[idx] ? '#0A0A0F' : '#6B6B80',
                              }}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dependencies */}
              <div className="rounded-lg border p-4" style={{ borderColor: '#1F1F2E' }}>
                <h4 className="font-medium text-sm mb-3" style={{ color: '#F0F0F5' }}>Dépendances</h4>
                <div>
                  <label className="mb-1 block text-xs font-medium" style={{ color: '#F0F0F5' }}>Alerte parente (optionnel)</label>
                  <select
                    value={ruleForm.parentRuleId || ''}
                    onChange={(e) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        parentRuleId: e.target.value || undefined,
                      }))
                    }
                    style={{
                      width: '100%',
                      backgroundColor: '#1A1A25',
                      borderColor: '#1F1F2E',
                      color: '#F0F0F5',
                      border: '1px solid',
                    }}
                    className="rounded-md px-2 py-1 text-sm"
                  >
                    <option value="">Aucune dépendance</option>
                    {(rules as AlertRule[])?.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs" style={{ color: '#6B6B80' }}>
                    Cette alerte ne se déclenchera que si l'alerte parente est active
                  </p>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="rounded-lg border p-4" style={{ borderColor: '#FF4D6A', backgroundColor: 'rgba(255, 77, 106, 0.1)', color: '#FF4D6A' }}>
              {formError}
            </div>
          )}

          <DialogFooter>
            {ruleStep > 0 && (
              <Button variant="outline" onClick={() => setRuleStep((s) => s - 1)} style={{ borderColor: '#1F1F2E', color: '#F0F0F5' }}>
                Retour
              </Button>
            )}
            {ruleStep < 3 ? (
              <Button
                onClick={() => {
                  if (ruleStep === 0 && !ruleForm.type) {
                    setFormError('Veuillez sélectionner un type d\'alerte')
                    return
                  }
                  setFormError('')
                  setRuleStep((s) => s + 1)
                }}
                style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}
              >
                Suivant
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending} style={{ backgroundColor: '#00E5CC', color: '#0A0A0F' }}>
                {createRuleMutation.isPending ? (editingRuleId ? 'Modification...' : 'Création...') : (editingRuleId ? 'Modifier la règle' : 'Créer une règle')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
