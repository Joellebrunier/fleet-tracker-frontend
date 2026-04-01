import { useState, useCallback } from 'react'
import {
  useAlerts,
  useAlertStats,
  useBulkAcknowledgeAlerts,
  useAlertRules,
  useCreateAlertRule,
} from '@/hooks/useAlerts'
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
} from 'lucide-react'
import { formatDateTime, getSeverityColor } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Alert type configuration for the rule builder
const alertTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; description: string; fields: string[] }
> = {
  [AlertType.OVERSPEED]: {
    label: 'Overspeed',
    icon: <Gauge size={18} />,
    description: 'Alert when vehicle exceeds speed limit',
    fields: ['speedLimit'],
  },
  [AlertType.GEOFENCE_ENTRY]: {
    label: 'Geofence Entry',
    icon: <MapPin size={18} />,
    description: 'Alert when vehicle enters a geofence zone',
    fields: ['geofenceId'],
  },
  [AlertType.GEOFENCE_EXIT]: {
    label: 'Geofence Exit',
    icon: <MapPin size={18} />,
    description: 'Alert when vehicle exits a geofence zone',
    fields: ['geofenceId'],
  },
  [AlertType.IDLE_TIMEOUT]: {
    label: 'Idle Timeout',
    icon: <Clock size={18} />,
    description: 'Alert when vehicle is idle for too long',
    fields: ['idleMinutes'],
  },
  [AlertType.OFFLINE]: {
    label: 'Offline',
    icon: <BellOff size={18} />,
    description: 'Alert when vehicle goes offline',
    fields: ['offlineMinutes'],
  },
  [AlertType.LOW_BATTERY]: {
    label: 'Low Battery',
    icon: <Battery size={18} />,
    description: 'Alert when tracker battery is low',
    fields: ['batteryPercent'],
  },
  [AlertType.MAINTENANCE_DUE]: {
    label: 'Maintenance Due',
    icon: <Wrench size={18} />,
    description: 'Alert for scheduled maintenance',
    fields: ['kmThreshold'],
  },
  [AlertType.FUEL_ALERT]: {
    label: 'Fuel Alert',
    icon: <Fuel size={18} />,
    description: 'Alert on sudden fuel level changes',
    fields: ['fuelDropPercent'],
  },
  [AlertType.HARSH_ACCELERATION]: {
    label: 'Harsh Acceleration',
    icon: <Activity size={18} />,
    description: 'Alert on sudden acceleration events',
    fields: ['gForce'],
  },
  [AlertType.HARSH_BRAKING]: {
    label: 'Harsh Braking',
    icon: <Activity size={18} />,
    description: 'Alert on sudden braking events',
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

interface RuleFormState {
  name: string
  description: string
  type: AlertType | ''
  severity: AlertSeverity
  conditionValue: string
  conditionDuration: string
  actions: AlertAction[]
  enabled: boolean
  escalationEnabled: boolean
  escalationDelay: '5min' | '15min' | '30min' | '1h'
  escalationTarget: 'Manager' | 'Admin' | 'Super Admin'
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
  actions: [],
  enabled: true,
  escalationEnabled: false,
  escalationDelay: '15min',
  escalationTarget: 'Manager',
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

type TabView = 'alerts' | 'rules' | 'trends'

export default function AlertsPage() {
  const [tab, setTab] = useState<TabView>('alerts')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'unacknowledged' | 'acknowledged' | undefined>('unacknowledged')
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

  const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status })
  const { data: stats } = useAlertStats()
  const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts()
  const { data: rules, isLoading: rulesLoading } = useAlertRules()
  const createRuleMutation = useCreateAlertRule()

  const alerts = alertsData?.data || []
  const totalPages = alertsData?.totalPages || 1

  const filteredAlerts = alerts.filter((a) => {
    // Keyword search filter
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.message.toLowerCase().includes(search.toLowerCase())) {
      return false
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
    return true
  })

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
    setShowRuleModal(true)
  }

  const handleCreateRule = async () => {
    setFormError('')
    if (!ruleForm.name.trim()) {
      setFormError('Rule name is required')
      return
    }
    if (!ruleForm.type) {
      setFormError('Please select an alert type')
      return
    }

    const condition: AlertCondition = {
      field: ruleForm.type === AlertType.OVERSPEED ? 'speed' : ruleForm.type,
      operator: 'greater_than',
      value: parseFloat(ruleForm.conditionValue) || 0,
      duration: parseInt(ruleForm.conditionDuration) || undefined,
    }

    try {
      await createRuleMutation.mutateAsync({
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        type: ruleForm.type as AlertType,
        severity: ruleForm.severity,
        condition,
        actions: ruleForm.actions.length > 0 ? ruleForm.actions : [{ type: 'push', target: 'all' }],
        enabled: ruleForm.enabled,
      })
      setShowRuleModal(false)
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create rule')
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityDot = (type: string) => {
    if (['OVERSPEED', 'ACCIDENT'].includes(type)) {
      return <span className="inline-block w-2 h-2 rounded-full bg-red-600 mr-2" />
    } else if (['GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY'].includes(type)) {
      return <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2" />
    } else {
      return <span className="inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" />
    }
  }

  const trendData = [
    { name: 'Lun', alerts: 12 },
    { name: 'Mar', alerts: 19 },
    { name: 'Mer', alerts: 15 },
    { name: 'Jeu', alerts: 25 },
    { name: 'Ven', alerts: 18 },
    { name: 'Sam', alerts: 10 },
    { name: 'Dim', alerts: 8 },
  ]

  const assignmentOptions = ['Admin', 'Manager', 'Opérateur']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
          <p className="mt-1 text-gray-600">Surveiller et gérer les alertes et les règles de la flotte</p>
        </div>
        <div className="flex gap-2">
          {selectedAlerts.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={handleBulkAcknowledge}>
              <Check size={16} />
              Reconnaître ({selectedAlerts.length})
            </Button>
          )}
          <Button className="gap-2" onClick={openRuleCreator}>
            <Plus size={16} />
            Créer une règle
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Bell size={18} className="text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Non reconnus</p>
                  <p className="text-xl font-bold text-amber-600">{stats.unacknowledged}</p>
                </div>
                <AlertCircle size={18} className="text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 font-medium">Critical</p>
                  <p className="text-xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <Shield size={18} className="text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">High</p>
                  <p className="text-xl font-bold text-orange-600">{stats.high}</p>
                </div>
                <Zap size={18} className="text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Medium</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.medium}</p>
                </div>
                <Activity size={18} className="text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Low / Info</p>
                  <p className="text-xl font-bold text-blue-600">{stats.low + stats.info}</p>
                </div>
                <Bell size={18} className="text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Skeleton className="h-20" />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('alerts')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'alerts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alertes ({stats?.total || 0})
        </button>
        <button
          onClick={() => setTab('trends')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'trends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Tendances
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'rules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Règles ({(rules as any)?.length || 0})
        </button>
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Rechercher les alertes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'unacknowledged', 'acknowledged'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s === 'all' ? undefined : s)
                      setPage(1)
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      (s === 'all' && !status) || status === s
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'Tout' : s === 'unacknowledged' ? 'Actif' : 'Reconnu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">À</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
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
                >
                  Réinitialiser
                </Button>
              )}
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
            <Card className="text-center">
              <CardContent className="py-12">
                <Bell className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-700">Aucune alerte trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Essayez un terme de recherche différent' : 'Tout clair ! Aucune alerte active.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`transition-all cursor-pointer ${
                    selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-400' : ''
                  } ${selectedAlertId === alert.id ? 'ring-2 ring-green-400' : ''}`}
                  onClick={() => {
                    setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id)
                    setShowNoteForm(false)
                    setShowAssignDropdown(false)
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                        className="mt-1 rounded border-gray-300"
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
                            <h3 className="font-medium text-gray-900">{alert.title}</h3>
                            <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            {alert.isAcknowledged ? (
                              <Badge variant="secondary" className="text-xs">
                                <Check size={12} className="mr-1" />
                                Reconnu
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs"
                                onClick={() => bulkAcknowledge([alert.id])}
                              >
                                <Check size={12} />
                                Reconnaître
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{formatDateTime(alert.createdAt)}</p>

                        {selectedAlertId === alert.id && (
                          <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                            {alertAssignments[alert.id] && (
                              <div className="text-xs">
                                <span className="text-gray-600">Assigné à: </span>
                                <Badge variant="outline" className="ml-1">
                                  {alertAssignments[alert.id]}
                                </Badge>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1 text-xs"
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowNoteForm(!showNoteForm)
                                  setNoteInput(alertNotes[alert.id] || '')
                                }}
                              >
                                Notes
                              </Button>
                            </div>

                            {showAssignDropdown && (
                              <div className="flex gap-1 flex-wrap">
                                {assignmentOptions.map((opt) => (
                                  <Badge
                                    key={opt}
                                    variant="secondary"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setAlertAssignments({
                                        ...alertAssignments,
                                        [alert.id]: opt,
                                      })
                                      setShowAssignDropdown(false)
                                    }}
                                  >
                                    {opt}
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
                                  className="w-full text-xs p-2 border border-gray-300 rounded resize-none"
                                  rows={2}
                                />
                                <Button
                                  size="sm"
                                  className="gap-1 text-xs w-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setAlertNotes({
                                      ...alertNotes,
                                      [alert.id]: noteInput,
                                    })
                                    setShowNoteForm(false)
                                  }}
                                >
                                  <Save size={12} />
                                  Enregistrer
                                </Button>
                              </div>
                            )}

                            {alertNotes[alert.id] && (
                              <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                                <p className="font-medium text-gray-700">Note:</p>
                                <p className="text-gray-600 mt-1">{alertNotes[alert.id]}</p>
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Alertes cette semaine</p>
                  <p className="mt-2 text-2xl font-bold">87</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Alertes ce mois</p>
                  <p className="mt-2 text-2xl font-bold">342</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">Type le plus fréquent</p>
                  <p className="mt-2 text-lg font-bold text-orange-600">Overspeed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Fréquence des alertes - 7 derniers jours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {/* Silent Hours Configuration Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={18} className="text-blue-600" />
                Heures silencieuses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="silentEnabled"
                  defaultChecked={false}
                  className="rounded border-gray-300"
                />
                <label htmlFor="silentEnabled" className="text-sm font-medium text-gray-700">
                  Activer les heures silencieuses globales
                </label>
              </div>
              <p className="text-xs text-gray-600">
                Les alertes non-critiques seront mises en attente pendant cette période
              </p>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-600">De</span>
                <input
                  type="time"
                  defaultValue="22:00"
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-600">à</span>
                <input
                  type="time"
                  defaultValue="06:00"
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
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
            <Card className="text-center">
              <CardContent className="py-12">
                <Settings className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-700">Aucune règle d'alerte configurée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Créez des règles pour générer automatiquement des alertes en fonction des conditions des véhicules.
                </p>
                <Button className="mt-4 gap-2" onClick={openRuleCreator}>
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
                  <Card key={rule.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-2.5 ${
                            rule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {typeConf?.icon || <Bell size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{rule.name}</h3>
                            <Badge variant={!disabledRules.has(rule.id) && rule.enabled ? 'default' : 'secondary'}>
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
                          <p className="mt-0.5 text-sm text-gray-500">
                            {rule.description || typeConf?.description || rule.type}
                          </p>
                          {/* Escalation info */}
                          {(rule as any).escalationEnabled && (
                            <p className="mt-1 text-xs text-orange-600">
                              <span className="font-medium">Escalade:</span> {(rule as any).escalationDelay} → {(rule as any).escalationTarget}
                            </p>
                          )}
                          {/* Dependencies info */}
                          {(rule as any).parentRuleId && (
                            <p className="mt-1 text-xs text-purple-600">
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
                            className={`h-8 w-12 rounded-full transition-colors ${
                              disabledRules.has(rule.id)
                                ? 'bg-gray-300'
                                : 'bg-blue-500'
                            }`}
                          />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Settings size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
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
      <Dialog open={showRuleModal} onOpenChange={() => setShowRuleModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une règle d'alerte</DialogTitle>
            <DialogDescription>
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
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < ruleStep
                      ? 'bg-green-100 text-green-600'
                      : step === ruleStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step < ruleStep ? <Check size={14} /> : step + 1}
                </div>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5 ${step < ruleStep ? 'bg-green-300' : 'bg-gray-200'}`}
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
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 ${
                    ruleForm.type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-600">{config.icon}</div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{config.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Configure */}
          {ruleStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom de la règle *</label>
                <Input
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex. Alerte de vitesse sur autoroute"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description facultative..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gravité</label>
                <div className="flex flex-wrap gap-2">
                  {severityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRuleForm((prev) => ({ ...prev, severity: opt.value }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        ruleForm.severity === opt.value
                          ? `${getSeverityBadgeClass(opt.value)}`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Value */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                  />
                  <Input
                    type="number"
                    value={ruleForm.conditionDuration}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, conditionDuration: e.target.value }))
                    }
                    placeholder="Durée (secondes)"
                    className="flex-1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Durée : combien de temps la condition doit être respectée avant le déclenchement
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Activer la règle immédiatement
              </label>
            </div>
          )}

          {/* Step 2: Actions */}
          {ruleStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choisissez comment être averti lorsque cette règle se déclenche :
              </p>

              {['push', 'email', 'sms', 'webhook'].map((actionType) => {
                const isSelected = ruleForm.actions.some((a) => a.type === actionType)
                return (
                  <label
                    key={actionType}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
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
                      className="rounded border-gray-300"
                    />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {actionType === 'push'
                          ? 'Notification Push'
                          : actionType === 'email'
                            ? 'Notification Email'
                            : actionType === 'sms'
                              ? 'Notification SMS'
                              : 'Webhook'}
                      </p>
                      <p className="text-xs text-gray-500">
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
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-sm mb-3 text-gray-900">Canaux de notification</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.email}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, email: e.target.checked },
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Email</span>
                    <span className="ml-auto text-xs text-green-600">✅</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.pushMobile}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, pushMobile: e.target.checked },
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>Push mobile</span>
                    <span className="ml-auto text-xs text-yellow-600">⚠️ Non configuré</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm opacity-50">
                    <input type="checkbox" disabled className="rounded border-gray-300" />
                    <span>WhatsApp</span>
                    <span className="ml-auto text-xs text-red-600">❌ Non disponible</span>
                  </label>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={ruleForm.notificationChannels.sms}
                      onChange={(e) =>
                        setRuleForm((prev) => ({
                          ...prev,
                          notificationChannels: { ...prev.notificationChannels, sms: e.target.checked },
                        }))
                      }
                      className="rounded border-gray-300"
                    />
                    <span>SMS</span>
                    <span className="ml-auto text-xs text-green-600">✅</span>
                  </label>
                </div>
              </div>

              {/* Escalation */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-sm mb-3 text-gray-900">Escalade</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ruleForm.escalationEnabled}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, escalationEnabled: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span>Activer l'escalade automatique</span>
                  </label>
                  {ruleForm.escalationEnabled && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Délai avant escalade</label>
                        <select
                          value={ruleForm.escalationDelay}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              escalationDelay: e.target.value as any,
                            }))
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                        >
                          <option value="5min">5 minutes</option>
                          <option value="15min">15 minutes</option>
                          <option value="30min">30 minutes</option>
                          <option value="1h">1 heure</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Escalader vers</label>
                        <select
                          value={ruleForm.escalationTarget}
                          onChange={(e) =>
                            setRuleForm((prev) => ({
                              ...prev,
                              escalationTarget: e.target.value as any,
                            }))
                          }
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
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
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-sm mb-3 text-gray-900">Heures silencieuses</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ruleForm.silentHoursEnabled}
                      onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursEnabled: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span>Activer les heures silencieuses</span>
                  </label>
                  {ruleForm.silentHoursEnabled && (
                    <div className="ml-6 space-y-3">
                      <div className="flex gap-2 items-end">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">De</label>
                          <input
                            type="time"
                            value={ruleForm.silentHoursFrom}
                            onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursFrom: e.target.value }))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                        <span className="text-gray-400">à</span>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">À</label>
                          <input
                            type="time"
                            value={ruleForm.silentHoursTo}
                            onChange={(e) => setRuleForm((prev) => ({ ...prev, silentHoursTo: e.target.value }))}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700">Jours applicables</label>
                        <div className="flex gap-2">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const newDays = [...ruleForm.silentHoursDays]
                                newDays[idx] = !newDays[idx]
                                setRuleForm((prev) => ({ ...prev, silentHoursDays: newDays }))
                              }}
                              className={`h-8 w-8 rounded-md border text-xs font-medium transition-colors ${
                                ruleForm.silentHoursDays[idx]
                                  ? 'border-blue-500 bg-blue-500 text-white'
                                  : 'border-gray-300 bg-white text-gray-600'
                              }`}
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
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-sm mb-3 text-gray-900">Dépendances</h4>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Alerte parente (optionnel)</label>
                  <select
                    value={ruleForm.parentRuleId || ''}
                    onChange={(e) =>
                      setRuleForm((prev) => ({
                        ...prev,
                        parentRuleId: e.target.value || undefined,
                      }))
                    }
                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="">Aucune dépendance</option>
                    {(rules as AlertRule[])?.map((rule) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Cette alerte ne se déclenchera que si l'alerte parente est active
                  </p>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <DialogFooter>
            {ruleStep > 0 && (
              <Button variant="outline" onClick={() => setRuleStep((s) => s - 1)}>
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
              >
                Suivant
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? 'Création...' : 'Créer une règle'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
