import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVehicles } from '@/hooks/useVehicles'
import { useAlerts } from '@/hooks/useAlerts'
import { useAuthStore } from '@/stores/authStore'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import {
  Truck,
  Activity,
  Navigation,
  Wifi,
  WifiOff,
  Clock,
  MapPin,
  Gauge,
  ChevronRight,
  AlertCircle,
  FileText,
  Zap,
  Plus,
  Route,
  Settings,
  GripHorizontal,
  Building2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  LogOut,
  LogIn,
  AlertTriangle,
  Shield,
  HelpCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { TOMTOM_TILE_URL } from '@/lib/constants'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

// Fleet Tracker Design System Colors
const TZ_COLORS = {
  bgMain: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgHover: '#F3F4F6',
  bgActive: '#F9FAFB',
  borderDefault: '#E5E7EB',
  borderHover: '#E5E7EB',
  textPrimary: '#1F2937',
  textMuted: '#6B7280',
  textDim: '#9CA3AF',
  accentCyan: '#4361EE',
  accentDanger: '#EF4444',
  accentWarning: '#F59E0B',
}

const PROVIDER_COLORS_DARK = {
  Flespi: '#8B5CF6',
  Echoes: '#3B82F6',
  KeepTrace: '#4361EE',
  Ubiwan: '#F59E0B',
  Autre: '#6B7280',
}

type WidgetSize = 'compact' | 'normal' | 'expanded'
type WidgetId =
  | 'hourly-activity'
  | 'fleet-status'
  | 'alert-distribution'
  | 'quick-actions'
  | 'alerts-feed'
  | 'status-summary'
  | 'speed-distribution'
  | 'weekly-comparison'
  | 'heatmap'
  | 'fleet-activity'
  | 'providers'
  | 'recent-updates'
  | 'departments'
  | 'daily-summary'
  | 'activity-feed'
  | 'mileage-trend'
  | 'fleet-utilization'
  | 'alert-frequency'

interface WidgetConfig {
  visible: boolean
  size: WidgetSize
}

interface Department {
  id: string
  name: string
  vehicleCount: number
  driverCount: number
  performanceScore: number
}

// Keyboard Shortcuts Modal Component
function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        setIsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-white border border-gray-200 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 font-sans">Raccourcis clavier</DialogTitle>
          <DialogDescription className="text-gray-500">Appuyez sur ? pour afficher ce menu</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Tableau de bord</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">D</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Carte</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">M</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Véhicules</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">V</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Alertes</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">A</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Rapports</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">R</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Géobarrières</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">G</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200">
              <span className="text-sm text-gray-900">Paramètres</span>
              <kbd className="px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]">S</kbd>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Heatmap Marker Component
function HeatmapMarker({
  position,
  density,
}: {
  position: [number, number]
  density: 'faible' | 'moyen' | 'élevé'
}) {
  const colorMap = {
    faible: '#3b82f6',
    moyen: '#f59e0b',
    élevé: '#ef4444',
  }
  const radiusMap = {
    faible: 10,
    moyen: 20,
    élevé: 30,
  }

  return (
    <CircleMarker
      center={position}
      radius={radiusMap[density]}
      fillColor={colorMap[density]}
      color={colorMap[density]}
      weight={2}
      opacity={0.8}
      fillOpacity={0.6}
    >
      <Popup>{`Densité: ${density}`}</Popup>
    </CircleMarker>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: vehiclesData, isLoading } = useVehicles({ limit: 500 })
  const { data: alertsData } = useAlerts({ limit: 5, status: 'unacknowledged' })
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''

  // Widget Configuration State
  const defaultWidgetOrder: WidgetId[] = [
    'daily-summary',
    'activity-feed',
    'hourly-activity',
    'fleet-status',
    'alert-distribution',
    'quick-actions',
    'alerts-feed',
    'status-summary',
    'mileage-trend',
    'fleet-utilization',
    'speed-distribution',
    'alert-frequency',
    'weekly-comparison',
    'heatmap',
    'fleet-activity',
    'providers',
    'recent-updates',
    'departments',
  ]

  const [widgetConfig, setWidgetConfig] = useState<Record<WidgetId, WidgetConfig>>(() => {
    const saved = localStorage.getItem('dashboard_widgets')
    const defaultConfig: Record<WidgetId, WidgetConfig> = {
      'daily-summary': { visible: true, size: 'normal' },
      'activity-feed': { visible: true, size: 'normal' },
      'hourly-activity': { visible: true, size: 'normal' },
      'fleet-status': { visible: true, size: 'normal' },
      'alert-distribution': { visible: true, size: 'normal' },
      'quick-actions': { visible: true, size: 'normal' },
      'alerts-feed': { visible: true, size: 'normal' },
      'status-summary': { visible: true, size: 'normal' },
      'mileage-trend': { visible: true, size: 'normal' },
      'fleet-utilization': { visible: true, size: 'normal' },
      'speed-distribution': { visible: true, size: 'normal' },
      'alert-frequency': { visible: true, size: 'normal' },
      'weekly-comparison': { visible: true, size: 'normal' },
      heatmap: { visible: true, size: 'expanded' },
      'fleet-activity': { visible: true, size: 'normal' },
      providers: { visible: true, size: 'normal' },
      'recent-updates': { visible: true, size: 'normal' },
      departments: { visible: true, size: 'normal' },
    }
    try {
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig
    } catch {
      return defaultConfig
    }
  })

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() => {
    const saved = localStorage.getItem('dashboard_widget_order')
    try {
      return saved ? JSON.parse(saved) : defaultWidgetOrder
    } catch {
      return defaultWidgetOrder
    }
  })

  const [showWidgetConfig, setShowWidgetConfig] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Logistique', vehicleCount: 24, driverCount: 8, performanceScore: 92 },
    { id: '2', name: 'Maintenance', vehicleCount: 8, driverCount: 3, performanceScore: 85 },
    { id: '3', name: 'Livraison', vehicleCount: 15, driverCount: 12, performanceScore: 88 },
    { id: '4', name: 'Commercial', vehicleCount: 6, driverCount: 4, performanceScore: 90 },
  ])
  const [newDeptName, setNewDeptName] = useState('')
  const [showNewDeptDialog, setShowNewDeptDialog] = useState(false)

  // Save widget config to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(widgetConfig))
  }, [widgetConfig])

  // Save widget order to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_widget_order', JSON.stringify(widgetOrder))
  }, [widgetOrder])

  const widgetLabels: Record<WidgetId, string> = {
    'daily-summary': 'Résumé du jour',
    'activity-feed': 'Fil d\'activité récente',
    'hourly-activity': 'Activité horaire',
    'fleet-status': 'État de la flotte',
    'alert-distribution': 'Distribution des alertes',
    'quick-actions': 'Actions rapides',
    'alerts-feed': 'Flux d\'alertes',
    'status-summary': 'Résumé du statut',
    'mileage-trend': 'Tendance kilométrique',
    'fleet-utilization': 'Utilisation de la flotte',
    'speed-distribution': 'Distribution des vitesses',
    'alert-frequency': 'Fréquence des alertes',
    'weekly-comparison': 'Comparaison hebdomadaire',
    heatmap: 'Carte thermique',
    'fleet-activity': 'Activité de la flotte',
    providers: 'Fournisseurs GPS',
    'recent-updates': 'Mises à jour récentes',
    departments: 'Départements',
  }

  const toggleWidgetVisibility = (id: WidgetId) => {
    setWidgetConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id].visible },
    }))
  }

  const setWidgetSize = (id: WidgetId, size: WidgetSize) => {
    setWidgetConfig((prev) => ({
      ...prev,
      [id]: { ...prev[id], size },
    }))
  }

  const moveWidgetUp = (id: WidgetId) => {
    const currentIndex = widgetOrder.indexOf(id)
    if (currentIndex > 0) {
      const reordered: WidgetId[] = [...widgetOrder]
      const temp = reordered[currentIndex - 1]
      reordered[currentIndex - 1] = reordered[currentIndex]
      reordered[currentIndex] = temp
      setWidgetOrder(reordered)
    }
  }

  const moveWidgetDown = (id: WidgetId) => {
    const currentIndex = widgetOrder.indexOf(id)
    if (currentIndex < widgetOrder.length - 1) {
      const reordered: WidgetId[] = [...widgetOrder]
      const temp = reordered[currentIndex + 1]
      reordered[currentIndex + 1] = reordered[currentIndex]
      reordered[currentIndex] = temp
      setWidgetOrder(reordered)
    }
  }

  const resetWidgetConfig = () => {
    const defaultConfig: Record<WidgetId, WidgetConfig> = {
      'daily-summary': { visible: true, size: 'normal' },
      'activity-feed': { visible: true, size: 'normal' },
      'hourly-activity': { visible: true, size: 'normal' },
      'fleet-status': { visible: true, size: 'normal' },
      'alert-distribution': { visible: true, size: 'normal' },
      'quick-actions': { visible: true, size: 'normal' },
      'alerts-feed': { visible: true, size: 'normal' },
      'status-summary': { visible: true, size: 'normal' },
      'mileage-trend': { visible: true, size: 'normal' },
      'fleet-utilization': { visible: true, size: 'normal' },
      'speed-distribution': { visible: true, size: 'normal' },
      'alert-frequency': { visible: true, size: 'normal' },
      'weekly-comparison': { visible: true, size: 'normal' },
      heatmap: { visible: true, size: 'expanded' },
      'fleet-activity': { visible: true, size: 'normal' },
      providers: { visible: true, size: 'normal' },
      'recent-updates': { visible: true, size: 'normal' },
      departments: { visible: true, size: 'normal' },
    }
    setWidgetConfig(defaultConfig)
    setWidgetOrder(defaultWidgetOrder)
  }

  const addDepartment = () => {
    if (newDeptName.trim()) {
      setDepartments((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: newDeptName,
          vehicleCount: 0,
          driverCount: 0,
          performanceScore: 80,
        },
      ])
      setNewDeptName('')
      setShowNewDeptDialog(false)
    }
  }

  const vehicles = useMemo(() => vehiclesData?.data || [], [vehiclesData])

  // Compute stats
  const stats = useMemo(() => {
    const total = vehicles.length
    const withGps = vehicles.filter((v: any) => v.currentLat && v.currentLng)
    const moving = withGps.filter((v: any) => (v.currentSpeed || 0) > 2)
    const stopped = withGps.filter((v: any) => (v.currentSpeed || 0) <= 2)
    const noGps = vehicles.filter((v: any) => !v.currentLat || !v.currentLng)

    // Provider breakdown from metadata
    const providers: Record<string, number> = {}
    for (const v of vehicles) {
      const meta = (v as any).metadata || {}
      if (meta.flespiChannelId) providers['Flespi'] = (providers['Flespi'] || 0) + 1
      else if (meta.echoesUid) providers['Echoes'] = (providers['Echoes'] || 0) + 1
      else if (meta.keeptraceId) providers['KeepTrace'] = (providers['KeepTrace'] || 0) + 1
      else if (meta.ubiwanId) providers['Ubiwan'] = (providers['Ubiwan'] || 0) + 1
      else providers['Autre'] = (providers['Autre'] || 0) + 1
    }

    // Top speed
    const maxSpeed = Math.max(...vehicles.map((v: any) => v.currentSpeed || 0), 0)
    const avgSpeed =
      withGps.length > 0
        ? withGps.reduce((sum: number, v: any) => sum + (v.currentSpeed || 0), 0) / withGps.length
        : 0

    // Recently active (last 10 minutes)
    const tenMinAgo = Date.now() - 10 * 60 * 1000
    const recentlyActive = vehicles.filter(
      (v: any) => v.lastCommunication && new Date(v.lastCommunication).getTime() > tenMinAgo
    )

    return {
      total,
      withGps: withGps.length,
      moving: moving.length,
      stopped: stopped.length,
      noGps: noGps.length,
      providers,
      maxSpeed,
      avgSpeed,
      recentlyActive: recentlyActive.length,
    }
  }, [vehicles])

  // Sorted vehicles by speed (moving first)
  const topMoving = useMemo(
    () =>
      [...vehicles]
        .filter((v: any) => v.currentLat && v.currentLng)
        .sort((a: any, b: any) => (b.currentSpeed || 0) - (a.currentSpeed || 0))
        .slice(0, 8),
    [vehicles]
  )

  // Recently updated vehicles
  const recentlyUpdated = useMemo(
    () =>
      [...vehicles]
        .filter((v: any) => v.lastCommunication)
        .sort(
          (a: any, b: any) =>
            new Date(b.lastCommunication).getTime() - new Date(a.lastCommunication).getTime()
        )
        .slice(0, 5),
    [vehicles]
  )

  const providerColors: Record<string, string> = {
    Flespi: 'bg-[#8B5CF6]',
    Echoes: 'bg-[#3B82F6]',
    KeepTrace: 'bg-blue-600',
    Ubiwan: 'bg-amber-500',
    Autre: 'bg-[#9CA3AF]',
  }

  // Generate mock hourly fleet activity data
  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      moving: Math.floor(Math.random() * stats.moving * 0.3 + stats.moving * 0.5),
      stopped: Math.floor(Math.random() * stats.stopped * 0.3 + stats.stopped * 0.5),
    }))
  }, [stats.moving, stats.stopped])

  // Alerts data
  const alertsList = useMemo(() => alertsData?.data || [], [alertsData])

  // Vehicle status distribution for pie chart
  const vehicleStatusData = useMemo(() => {
    const active = vehicles.filter((v: any) => (v.currentSpeed || 0) > 2).length
    const idle = vehicles.filter((v: any) => (v.currentSpeed || 0) <= 2 && v.currentLat && v.currentLng).length
    const offline = vehicles.filter((v: any) => !v.currentLat || !v.currentLng).length
    const maintenance = Math.floor(vehicles.length * 0.05) // Mock maintenance count (5% of fleet)

    return [
      { name: 'En mouvement', value: active, color: '#22c55e' },
      { name: 'Arrêtés', value: idle, color: '#eab308' },
      { name: 'Hors ligne', value: offline, color: '#9ca3af' },
      { name: 'Maintenance', value: maintenance, color: '#f97316' },
    ].filter((item) => item.value > 0)
  }, [vehicles])

  // Alert distribution by type
  const alertDistributionData = useMemo(() => {
    // Mock data for alert distribution by type
    const counts = {
      'Vitesse excessive': 12,
      'Géobarrière': 8,
      'Batterie faible': 5,
      'Maintenance': 3,
      'Diagnostic': 2,
    }
    return Object.entries(counts).map(([type, count]) => ({
      type: type,
      count: count,
    }))
  }, [])

  // Mileage trend data (30 days)
  const mileageTrendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: `${i + 1}`,
      km: Math.floor(Math.random() * 500 + 1200),
    }))
  }, [])

  // Fleet utilization data
  const fleetUtilizationData = useMemo(() => {
    const total = Math.max(stats.total, 1)
    return [
      { name: 'En service', value: Math.floor(total * 0.65), color: '#22c55e' },
      { name: 'En maintenance', value: Math.floor(total * 0.15), color: '#f97316' },
      { name: 'Inactif', value: Math.floor(total * 0.12), color: '#eab308' },
      { name: 'Hors ligne', value: Math.floor(total * 0.08), color: '#9ca3af' },
    ]
  }, [stats.total])

  // Speed distribution data (6 ranges)
  const speedDistributionData = useMemo(() => {
    return [
      { range: '0-30 km/h', count: 45 },
      { range: '31-60 km/h', count: 82 },
      { range: '61-90 km/h', count: 63 },
      { range: '91-120 km/h', count: 28 },
      { range: '>120 km/h', count: 5 },
    ]
  }, [])

  // Alert frequency data (7 days)
  const alertFrequencyData = useMemo(() => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    return days.map((day) => ({
      day,
      count: Math.floor(Math.random() * 25 + 5),
    }))
  }, [])

  // Enhanced heatmap density data (10 points around Nice)
  const heatmapData = useMemo(() => {
    return [
      { position: [43.7, 7.12] as [number, number], density: 'élevé' as const },
      { position: [43.71, 7.15] as [number, number], density: 'moyen' as const },
      { position: [43.68, 7.1] as [number, number], density: 'moyen' as const },
      { position: [43.72, 7.08] as [number, number], density: 'faible' as const },
      { position: [43.65, 7.2] as [number, number], density: 'faible' as const },
      { position: [43.73, 7.18] as [number, number], density: 'moyen' as const },
      { position: [43.66, 7.05] as [number, number], density: 'faible' as const },
      { position: [43.75, 7.22] as [number, number], density: 'faible' as const },
      { position: [43.64, 7.15] as [number, number], density: 'moyen' as const },
      { position: [43.69, 7.25] as [number, number], density: 'faible' as const },
    ]
  }, [])

  // Daily summary metrics
  const dailySummary = useMemo(() => {
    const totalKm = Math.round(stats.total * 45 + Math.random() * 100)
    const trips = Math.round(stats.moving * 3 + Math.random() * 20)
    const avgDriveTime = 280 + Math.floor(Math.random() * 60)
    const todayAlerts = alertsList.length
    const geofenceViolations = 3

    // Calculate day-over-day comparison
    const yesterdayKm = totalKm - Math.floor(totalKm * 0.08)
    const yesterdayTrips = trips - Math.floor(trips * 0.12)
    const yesterdayAlerts = todayAlerts - 1

    const kmDiff = ((totalKm - yesterdayKm) / yesterdayKm) * 100
    const tripsDiff = ((trips - yesterdayTrips) / yesterdayTrips) * 100
    const alertsDiff = ((todayAlerts - yesterdayAlerts) / Math.max(yesterdayAlerts, 1)) * 100

    return {
      totalKm,
      trips,
      avgDriveTime,
      todayAlerts,
      geofenceViolations,
      comparisons: {
        km: kmDiff,
        trips: tripsDiff,
        alerts: alertsDiff,
      },
    }
  }, [stats.total, stats.moving, alertsList.length])

  // Activity feed events
  const activityFeedEvents = useMemo(() => {
    const events: Array<{
      id: string
      type: 'online' | 'offline' | 'alert' | 'geofence' | 'speed'
      title: string
      description: string
      vehicleName: string
      timestamp: Date
      icon: any
    }> = []

    // Generate mock events from the last hour
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Vehicle online/offline events
    for (let i = 0; i < 3; i++) {
      events.push({
        id: `evt-online-${i}`,
        type: 'online',
        title: `${vehicles[i % vehicles.length]?.name || 'Véhicule'} connecté`,
        description: 'Le véhicule s\'est connecté au serveur',
        vehicleName: vehicles[i % vehicles.length]?.name || 'Véhicule',
        timestamp: new Date(oneHourAgo.getTime() + i * 12 * 60 * 1000),
        icon: LogIn,
      })
    }

    // Offline events
    for (let i = 0; i < 2; i++) {
      events.push({
        id: `evt-offline-${i}`,
        type: 'offline',
        title: `${vehicles[(i + 4) % vehicles.length]?.name || 'Véhicule'} déconnecté`,
        description: 'Le véhicule s\'est déconnecté',
        vehicleName: vehicles[(i + 4) % vehicles.length]?.name || 'Véhicule',
        timestamp: new Date(oneHourAgo.getTime() + (3 + i * 8) * 10 * 60 * 1000),
        icon: LogOut,
      })
    }

    // Speed violations
    for (let i = 0; i < 2; i++) {
      events.push({
        id: `evt-speed-${i}`,
        type: 'speed',
        title: `Vitesse excessive - ${vehicles[(i + 7) % vehicles.length]?.name || 'Véhicule'}`,
        description: `${88 + i * 5} km/h dans une zone limitée à 90 km/h`,
        vehicleName: vehicles[(i + 7) % vehicles.length]?.name || 'Véhicule',
        timestamp: new Date(oneHourAgo.getTime() + (14 + i * 15) * 4 * 60 * 1000),
        icon: AlertTriangle,
      })
    }

    // Geofence events
    for (let i = 0; i < 2; i++) {
      events.push({
        id: `evt-geo-${i}`,
        type: 'geofence',
        title: `Géobarrière ${i === 0 ? 'entrée' : 'sortie'} - ${vehicles[(i + 10) % vehicles.length]?.name || 'Véhicule'}`,
        description: `Le véhicule a ${i === 0 ? 'quitté' : 'approché'} la zone Zone Commercial`,
        vehicleName: vehicles[(i + 10) % vehicles.length]?.name || 'Véhicule',
        timestamp: new Date(oneHourAgo.getTime() + (22 + i * 10) * 3 * 60 * 1000),
        icon: Shield,
      })
    }

    // Alert triggered events
    for (let i = 0; i < 2; i++) {
      events.push({
        id: `evt-alert-${i}`,
        type: 'alert',
        title: `Alerte - ${vehicles[(i + 13) % vehicles.length]?.name || 'Véhicule'}`,
        description: i === 0 ? 'Batterie faible détectée' : 'Maintenance préventive due',
        vehicleName: vehicles[(i + 13) % vehicles.length]?.name || 'Véhicule',
        timestamp: new Date(oneHourAgo.getTime() + (32 + i * 12) * 2 * 60 * 1000),
        icon: AlertCircle,
      })
    }

    // Sort by timestamp descending (most recent first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [vehicles])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="space-y-5">
        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal />

        {/* Header with Widget Configuration */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-sans text-gray-900">Tableau de bord</h1>
            <p className="mt-0.5 text-[13px] text-gray-400">
              {stats.total} véhicules · {stats.withGps} GPS actifs · Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetConfig(!showWidgetConfig)}
              className="gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 rounded-lg text-[12px] h-8"
            >
              <Settings size={14} />
              <span>Personnaliser</span>
            </Button>
          </div>
        </div>

        {/* Widget Configuration Panel */}
        {showWidgetConfig && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="pb-4 px-4 md:px-6 pt-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-sans text-base font-bold text-gray-900">Personnaliser les widgets</h3>
                  <p className="text-sm mt-1 text-gray-500">
                    Gérez la visibilité, la taille et l'ordre des widgets de votre tableau de bord
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetWidgetConfig}
                  className="gap-2 text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
                >
                  <RotateCcw size={14} />
                  <span>Réinitialiser</span>
                </Button>
              </div>
            </div>
            <div className="px-4 md:px-6 py-6">
              <div className="space-y-3">
                {widgetOrder.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-200 hover:border-[#E5E7EB] transition-colors"
                  >
                    {/* Visibility Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={widgetConfig[id].visible}
                        onChange={() => toggleWidgetVisibility(id)}
                        className="w-4 h-4 rounded cursor-pointer accent-[#4361EE]"
                      />
                    </label>

                    {/* Widget Label */}
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${
                        widgetConfig[id].visible ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {widgetLabels[id]}
                      </span>
                    </div>

                    {/* Size Selector */}
                    <div className="flex gap-1 bg-white rounded-lg p-1">
                      {(['compact', 'normal', 'expanded'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setWidgetSize(id, size)}
                          title={size === 'compact' ? 'Compact' : size === 'normal' ? 'Normal' : 'Large'}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            widgetConfig[id].size === size
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {size === 'compact' ? 'C' : size === 'normal' ? 'N' : 'L'}
                        </button>
                      ))}
                    </div>

                    {/* Reorder Buttons */}
                    <div className="flex gap-1 border-l border-gray-200 pl-3">
                      <button
                        onClick={() => moveWidgetUp(id)}
                        disabled={widgetOrder.indexOf(id) === 0}
                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Monter"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => moveWidgetDown(id)}
                        disabled={widgetOrder.indexOf(id) === widgetOrder.length - 1}
                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Descendre"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards - Always visible */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Vehicles */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Truck className="text-blue-500" size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Total</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-gray-900">{stats.total}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{stats.withGps} GPS actifs</p>
          </div>

          {/* Moving Vehicles */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Navigation className="text-emerald-500" size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">En route</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-emerald-600">{stats.moving}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{stats.stopped} à l'arrêt</p>
          </div>

          {/* Recently Active */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                <Activity className="text-amber-500" size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Récents</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-amber-600">{stats.recentlyActive}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">dernières 10 min</p>
          </div>

          {/* Offline */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                <WifiOff className="text-red-400" size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Hors ligne</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-red-500">{stats.noGps}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">sans position GPS</p>
          </div>

          {/* Daily KM */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Route className="text-indigo-500" size={18} />
              </div>
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Km/jour</span>
            </div>
            <p className="text-2xl font-bold tabular-nums text-indigo-600">{(dailySummary.totalKm / 1000).toFixed(1)}K</p>
            <div className="flex items-center gap-1 mt-0.5">
              {dailySummary.comparisons.km >= 0 ? (
                <TrendingUp size={12} className="text-emerald-500" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}
              <span className={`text-[11px] font-semibold ${dailySummary.comparisons.km >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {dailySummary.comparisons.km >= 0 ? '+' : ''}{dailySummary.comparisons.km.toFixed(1)}%
              </span>
              <span className="text-[11px] text-gray-300">vs hier</span>
            </div>
          </div>
        </div>

        {/* Daily Summary Widget */}
        {widgetConfig['daily-summary'].visible && (
        <div
          className={`${
            widgetConfig['daily-summary'].size === 'expanded'
              ? 'md:col-span-2 lg:col-span-4'
              : widgetConfig['daily-summary'].size === 'normal'
                ? 'md:col-span-2 lg:col-span-2'
                : 'md:col-span-1 lg:col-span-1'
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Résumé du jour</h3>
                <p className="text-xs text-gray-500 mt-1">Métriques clés d'aujourd'hui</p>
              </div>
              <div className="px-4 md:px-4 md:px-6 py-4">
                <div className="space-y-4">
                  {/* Kilomètres */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
                    <div className="flex items-center gap-3">
                      <Route className="text-[#3B82F6]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Kilomètres parcourus</p>
                        <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">{dailySummary.totalKm.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.km >= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-red-500'
                      }`}
                    >
                      {dailySummary.comparisons.km >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {dailySummary.comparisons.km >= 0 ? '+' : ''}{dailySummary.comparisons.km.toFixed(1)}%
                    </div>
                  </div>

                  {/* Trajets */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)]">
                    <div className="flex items-center gap-3">
                      <Navigation className="text-[#8B5CF6]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Nombre de trajets</p>
                        <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">{dailySummary.trips}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.trips >= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-red-500'
                      }`}
                    >
                      {dailySummary.comparisons.trips >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {dailySummary.comparisons.trips >= 0 ? '+' : ''}{dailySummary.comparisons.trips.toFixed(1)}%
                    </div>
                  </div>

                  {/* Temps moyen */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,181,71,0.08)] border border-[rgba(255,181,71,0.15)]">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-500" size={20} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Temps de conduite moyen</p>
                        <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">
                          {Math.floor(dailySummary.avgDriveTime / 60)}h {dailySummary.avgDriveTime % 60}m
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alertes */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.15)]">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-red-500" size={20} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Alertes du jour</p>
                        <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">{dailySummary.todayAlerts}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.alerts <= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-red-500'
                      }`}
                    >
                      {dailySummary.comparisons.alerts <= 0 ? (
                        <TrendingDown size={14} />
                      ) : (
                        <TrendingUp size={14} />
                      )}
                      {dailySummary.comparisons.alerts >= 0 ? '+' : ''}{dailySummary.comparisons.alerts.toFixed(1)}%
                    </div>
                  </div>

                  {/* Géoclôtures violées */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[rgba(0,229,204,0.08)] border border-[rgba(0,229,204,0.15)]">
                    <div className="flex items-center gap-3">
                      <Shield className="text-blue-600" size={20} />
                      <div>
                        <p className="text-xs font-medium text-gray-500">Géoclôtures violées</p>
                        <p className="text-lg font-bold font-mono text-gray-900 mt-0.5">{dailySummary.geofenceViolations}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Activity Feed Widget */}
        {widgetConfig['activity-feed'].visible && (
        <div
          className={`${
            widgetConfig['activity-feed'].size === 'expanded'
              ? 'md:col-span-2 lg:col-span-4'
              : widgetConfig['activity-feed'].size === 'normal'
                ? 'md:col-span-2 lg:col-span-2'
                : 'md:col-span-1 lg:col-span-1'
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans text-base font-bold text-gray-900">Fil d'activité récente</h3>
                    <p className="text-xs text-gray-500 mt-1">Événements de la dernière heure</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 hover:bg-gray-100"
                    onClick={() => navigate('/activity')}
                  >
                    Tout voir
                  </Button>
                </div>
              </div>
              <div className="px-4 md:px-4 md:px-6 py-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activityFeedEvents.slice(0, 12).map((event) => {
                    const IconComponent = event.icon
                    const timeAgo = formatTimeAgo(event.timestamp)
                    const iconColorMap = {
                      online: 'text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.15)]',
                      offline: 'text-red-500 bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                      alert: 'text-red-500 bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                      geofence: 'text-[#8B5CF6] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.15)]',
                      speed: 'text-amber-500 bg-[rgba(255,181,71,0.1)] border border-[rgba(255,181,71,0.15)]',
                    }

                    return (
                      <div
                        key={event.id}
                        className="flex gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className={`rounded-lg p-2 flex-shrink-0 ${iconColorMap[event.type]}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-[#9CA3AF]">{event.vehicleName}</span>
                            <span className="text-xs text-[#9CA3AF]">·</span>
                            <span className="text-xs text-[#9CA3AF]">{timeAgo}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Configurable Widgets Grid */}
        <div className="grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4">
        {/* Hourly Activity Chart */}
        {widgetConfig['hourly-activity'].visible && (
          <div
            className={`${
              widgetConfig['hourly-activity'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['hourly-activity'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Activité horaire (24h)</h3>
                  <p className="text-xs text-gray-500 mt-1">Véhicules en mouvement vs arrêtés</p>
                </div>
                <div className="px-4 md:px-4 md:px-6 py-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorMoving" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorStopped" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value: any) => [value, '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="moving"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorMoving)"
                        name="En mouvement"
                      />
                      <Area
                        type="monotone"
                        dataKey="stopped"
                        stroke="#EF4444"
                        fillOpacity={1}
                        fill="url(#colorStopped)"
                        name="Arrêtés"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fleet Status Pie Chart */}
        {widgetConfig['fleet-status'].visible && (
          <div
            className={`${
              widgetConfig['fleet-status'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['fleet-status'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">État de la flotte</h3>
                  <p className="text-xs text-gray-500 mt-1">Distribution par statut véhicule</p>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {vehicleStatusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `${value} véhicules`}
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#1F2937',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Distribution Bar Chart */}
        {widgetConfig['alert-distribution'].visible && (
          <div
            className={`${
              widgetConfig['alert-distribution'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['alert-distribution'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Distribution des alertes</h3>
                  <p className="text-xs text-gray-500 mt-1">Nombre d'alertes par type (dernières 24h)</p>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={alertDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="type" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          color: '#1F2937',
                        }}
                        formatter={(value: any) => [`${value} alertes`, 'Nombre']}
                      />
                      <Bar dataKey="count" fill="#4361EE" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {widgetConfig['quick-actions'].visible && (
          <div
            className={`${
              widgetConfig['quick-actions'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['quick-actions'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Actions rapides</h3>
                  <p className="text-xs text-gray-500 mt-1">Accès direct aux fonctionnalités</p>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
                      onClick={() => navigate('/map')}
                    >
                      <MapPin size={16} />
                      <span className="text-xs">Voir Carte</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
                      onClick={() => navigate('/reports')}
                    >
                      <FileText size={16} />
                      <span className="text-xs">Rapport</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
                      onClick={() => navigate('/geofences')}
                    >
                      <Zap size={16} />
                      <span className="text-xs">Géobarrière</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
                      onClick={() => navigate('/alerts/new')}
                    >
                      <Plus size={16} />
                      <span className="text-xs">Alerte</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activity Feed & Alerts Section */}
      <div className="grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4">
        {/* Recent Activity Feed */}
        {widgetConfig['alerts-feed'].visible && (
          <div
            className={`${
              widgetConfig['alerts-feed'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['alerts-feed'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans text-base font-bold text-gray-900">Fil d'activité récente</h3>
                      <p className="text-xs text-gray-500 mt-1">Alertes et changements de statut</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 hover:bg-gray-100"
                      onClick={() => navigate('/alerts')}
                    >
                      Voir tous
                    </Button>
                  </div>
                </div>
                <div className="px-4 md:px-6 py-4">
                  {alertsList.length > 0 ? (
                    <div className="space-y-3">
                      {alertsList.map((alert: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <AlertCircle
                            size={16}
                            className={
                              alert.severity === 'critical'
                                ? 'text-red-500 flex-shrink-0 mt-0.5'
                                : 'text-amber-500 flex-shrink-0 mt-0.5'
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                              <Badge
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className={`flex-shrink-0 text-xs ${
                                  alert.severity === 'critical'
                                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                    : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                                }`}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{alert.message}</p>
                            <p className="text-xs text-[#9CA3AF] mt-2">{formatTimeAgo(alert.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle size={24} className="text-[#9CA3AF] mb-2" />
                      <p className="text-sm text-gray-500">Aucune alerte récente</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary */}
        {widgetConfig['status-summary'].visible && (
          <div
            className={`${
              widgetConfig['status-summary'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['status-summary'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-2'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Résumé des statuts</h3>
                  <p className="text-xs text-gray-500 mt-1">Dernières mises à jour véhicule</p>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <div className="space-y-3">
                    {recentlyUpdated.slice(0, 8).map((v: any) => {
                      const isMoving = (v.currentSpeed || 0) > 2
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 hover:bg-gray-100 cursor-pointer"
                          onClick={() => navigate(`/vehicles/${v.id}`)}
                        >
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-[#22C55E]' : 'bg-amber-500'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
                            <p className="text-xs text-gray-500">
                              {isMoving ? 'En mouvement' : 'Arrêté'} · {formatTimeAgo(v.lastCommunication)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold font-mono text-gray-900 flex-shrink-0">
                            {(v.currentSpeed || 0).toFixed(0)}
                            <span className="text-gray-500 font-normal"> km/h</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mileage Trend Line Chart */}
      {widgetConfig['mileage-trend'].visible && (
        <div
          className={`${
            widgetConfig['mileage-trend'].size === 'expanded'
              ? 'lg:col-span-4'
              : widgetConfig['mileage-trend'].size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Tendance kilométrique</h3>
                <p className="text-xs text-gray-500 mt-1">Kilométrage quotidien sur 30 jours</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mileageTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#1F2937',
                      }}
                      formatter={(value: any) => [`${value} km`, 'Kilométrage']}
                    />
                    <Line
                      type="monotone"
                      dataKey="km"
                      stroke="#4361EE"
                      dot={false}
                      strokeWidth={2}
                      name="Kilométrage"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Utilization Pie Chart */}
      {widgetConfig['fleet-utilization'].visible && (
        <div
          className={`${
            widgetConfig['fleet-utilization'].size === 'expanded'
              ? 'lg:col-span-2'
              : widgetConfig['fleet-utilization'].size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Utilisation de la flotte</h3>
                <p className="text-xs text-gray-500 mt-1">État des véhicules</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={fleetUtilizationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {fleetUtilizationData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${value} véhicules`}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#1F2937',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Speed Distribution Chart */}
      {widgetConfig['speed-distribution'].visible && (
        <div
          className={`${
            widgetConfig['speed-distribution'].size === 'expanded'
              ? 'lg:col-span-2'
              : widgetConfig['speed-distribution'].size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Distribution des vitesses</h3>
                <p className="text-xs text-gray-500 mt-1">Nombre de véhicules par plage de vitesse</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={speedDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="range" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#1F2937',
                      }}
                      formatter={(value: any) => [`${value} véhicules`, 'Nombre']}
                    />
                    <Bar dataKey="count" fill="#4361EE" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Frequency Bar Chart (7 days) */}
      {widgetConfig['alert-frequency'].visible && (
        <div
          className={`${
            widgetConfig['alert-frequency'].size === 'expanded'
              ? 'lg:col-span-2'
              : widgetConfig['alert-frequency'].size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Fréquence des alertes</h3>
                <p className="text-xs text-gray-500 mt-1">Nombre d'alertes par jour (7 derniers jours)</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={alertFrequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="day" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#1F2937',
                      }}
                      formatter={(value: any) => [`${value} alertes`, 'Nombre']}
                    />
                    <Bar dataKey="count" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Comparison Chart */}
      {widgetConfig['weekly-comparison'].visible && (
        <div
          className={`${
            widgetConfig['weekly-comparison'].size === 'expanded'
              ? 'lg:col-span-2'
              : widgetConfig['weekly-comparison'].size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Comparaison hebdomadaire</h3>
                <p className="text-xs text-gray-500 mt-1">Cette semaine vs semaine dernière</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Km parcourus', current: 12450, previous: 11200 },
                      { name: 'Alertes', current: 23, previous: 31 },
                      { name: 'Heures actives', current: 856, previous: 790 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        color: '#1F2937',
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#6B7280' }} />
                    <Bar dataKey="current" fill="#4361EE" radius={[8, 8, 0, 0]} name="Cette semaine" />
                    <Bar dataKey="previous" fill="#9CA3AF" radius={[8, 8, 0, 0]} name="Semaine dernière" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Geographic Heatmap */}
      {widgetConfig.heatmap.visible && (
        <div
          className={`${
            widgetConfig.heatmap.size === 'expanded'
              ? 'w-full'
              : widgetConfig.heatmap.size === 'normal'
                ? 'lg:col-span-2'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <h3 className="font-sans text-base font-bold text-gray-900">Zones d'activité (Carte thermique)</h3>
                <p className="text-xs text-gray-500 mt-1">Densité de véhicules autour de Nice</p>
              </div>
              <div className="px-4 md:px-6 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-gray-500">Élevé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                      <span className="text-gray-500">Moyen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-gray-500">Faible</span>
                    </div>
                  </div>
                  <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                    <MapContainer
                      center={[43.7, 7.12]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url={TOMTOM_TILE_URL('basic')}
                        attribution='&copy; TomTom'
                      />
                      {heatmapData.map((marker, idx) => (
                        <HeatmapMarker
                          key={idx}
                          position={marker.position}
                          density={marker.density}
                        />
                      ))}
                    </MapContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments Section */}
      {widgetConfig.departments.visible && (
        <div
          className={`${
            widgetConfig.departments.size === 'expanded'
              ? 'w-full'
              : widgetConfig.departments.size === 'normal'
                ? 'w-full'
                : ''
          }`}
        >
          <div className="relative group">
            <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={16} className="text-gray-500" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-sans text-base font-bold text-gray-900">Départements</h3>
                    <p className="text-xs text-gray-500 mt-1">Statut et performance par département</p>
                  </div>
                  <Dialog open={showNewDeptDialog} onOpenChange={setShowNewDeptDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1 bg-blue-600 text-white hover:bg-blue-600/80">
                        <Plus size={14} />
                        Nouveau
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border border-gray-200">
                      <DialogHeader>
                        <DialogTitle className="text-gray-900 font-sans">Ajouter un département</DialogTitle>
                        <DialogDescription className="text-gray-500">Entrez le nom du nouveau département</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nom du département"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                          onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowNewDeptDialog(false)} className="border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]">
                            Annuler
                          </Button>
                          <Button onClick={addDepartment} className="bg-blue-600 text-white hover:bg-blue-600/80">Ajouter</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="px-4 md:px-6 py-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-4 rounded-lg border border-gray-200 hover:border-[#E5E7EB] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-[rgba(59,130,246,0.1)] p-2">
                            <Building2 size={16} className="text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{dept.name}</p>
                            <p className="text-xs text-gray-500">Département</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Véhicules</p>
                          <p className="text-2xl font-bold font-mono text-gray-900">{dept.vehicleCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chauffeurs actifs</p>
                          <p className="text-2xl font-bold font-mono text-gray-900">{dept.driverCount}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-500">Performance</p>
                            <p className="text-xs font-bold text-gray-900">{dept.performanceScore}%</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                dept.performanceScore >= 90
                                  ? 'bg-[#22C55E]'
                                  : dept.performanceScore >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${dept.performanceScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Activity & Providers Section */}
      <div className="grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4">
        {/* Fleet activity - top moving vehicles */}
        {widgetConfig['fleet-activity'].visible && (
          <div
            className={`${
              widgetConfig['fleet-activity'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['fleet-activity'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-3'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans text-base font-bold text-gray-900">Activité de la flotte</h3>
                      <p className="text-xs text-gray-500 mt-1">Véhicules avec position GPS, triés par vitesse</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-blue-600 hover:bg-gray-100"
                      onClick={() => navigate('/map')}
                    >
                      Carte
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <div className="space-y-2">
                    {topMoving.map((vehicle: any) => {
                      const isMoving = (vehicle.currentSpeed || 0) > 2
                      return (
                        <div
                          key={vehicle.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-[#22C55E]' : 'bg-[#9CA3AF]'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{vehicle.name}</p>
                            <p className="text-xs text-gray-500">{vehicle.plate}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold font-mono text-gray-900">
                              {(vehicle.currentSpeed || 0).toFixed(0)}{' '}
                              <span className="text-xs font-normal text-gray-500">km/h</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-20">
                            <p className="text-xs text-[#9CA3AF]">{formatTimeAgo(vehicle.lastCommunication)}</p>
                          </div>
                          <ChevronRight size={14} className="text-[#9CA3AF]" />
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full text-sm border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]"
                    onClick={() => navigate('/vehicles')}
                  >
                    Voir tous les véhicules
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Provider breakdown */}
        {widgetConfig.providers.visible && (
          <div
            className={`${
              widgetConfig.providers.size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig.providers.size === 'normal'
                  ? 'md:col-span-2 lg:col-span-1'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Fournisseurs GPS</h3>
                  <p className="text-xs text-gray-500 mt-1">Répartition par provider</p>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <div className="space-y-3">
                    {Object.entries(stats.providers)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([name, count]) => {
                        const pct = stats.total > 0 ? ((count as number) / stats.total) * 100 : 0
                        return (
                          <div key={name}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-3 w-3 rounded-full ${providerColors[name] || 'bg-[#9CA3AF]'}`}
                                ></span>
                                <span className="font-medium text-gray-900">{name}</span>
                              </div>
                              <span className="text-gray-500 font-medium">{count as number}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className={`h-2 rounded-full ${providerColors[name] || 'bg-[#9CA3AF]'} transition-all`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                    <p className="text-xs text-gray-500">
                      Vitesse max: <span className="font-bold text-gray-900">{stats.maxSpeed.toFixed(0)} km/h</span>
                      {' · '}
                      Moyenne: <span className="font-bold text-gray-900">{stats.avgSpeed.toFixed(0)} km/h</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recently updated */}
        {widgetConfig['recent-updates'].visible && (
          <div
            className={`${
              widgetConfig['recent-updates'].size === 'expanded'
                ? 'md:col-span-2 lg:col-span-4'
                : widgetConfig['recent-updates'].size === 'normal'
                  ? 'md:col-span-2 lg:col-span-1'
                  : 'md:col-span-1 lg:col-span-1'
            }`}
          >
            <div className="relative group">
              <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripHorizontal size={16} className="text-gray-500" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h3 className="font-sans text-base font-bold text-gray-900">Mises à jour récentes</h3>
                </div>
                <div className="px-4 md:px-6 py-4">
                  <div className="space-y-2.5">
                    {recentlyUpdated.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <Clock size={12} className="text-gray-500 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate flex-1">{v.name}</span>
                        <span className="text-[#9CA3AF] flex-shrink-0">{formatTimeAgo(v.lastCommunication)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
