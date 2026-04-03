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
import { MAPBOX_TILE_URL } from '@/lib/constants'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import 'leaflet/dist/leaflet.css'

// TrackZone Design System Colors
const TZ_COLORS = {
  bgMain: '#0A0A0F',
  bgCard: '#12121A',
  bgHover: '#1A1A25',
  bgActive: '#1E1E2A',
  borderDefault: '#1F1F2E',
  borderHover: '#2A2A3D',
  textPrimary: '#F0F0F5',
  textMuted: '#6B6B80',
  textDim: '#44445A',
  accentCyan: '#00E5CC',
  accentDanger: '#FF4D6A',
  accentWarning: '#FFB547',
}

const PROVIDER_COLORS_DARK = {
  Flespi: '#A855F7',
  Echoes: '#3B82F6',
  KeepTrace: '#00E5CC',
  Ubiwan: '#FFB547',
  Autre: '#6B6B80',
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
    'speed-distribution',
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
      'speed-distribution': { visible: true, size: 'normal' },
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
    'speed-distribution': 'Distribution des vitesses',
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
      'speed-distribution': { visible: true, size: 'normal' },
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
    Flespi: 'bg-[#A855F7]',
    Echoes: 'bg-[#3B82F6]',
    KeepTrace: 'bg-[#00E5CC]',
    Ubiwan: 'bg-[#FFB547]',
    Autre: 'bg-[#6B6B80]',
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

  // Heatmap density data (simulated around Nice)
  const heatmapData = useMemo(() => {
    return [
      { position: [43.7, 7.12] as [number, number], density: 'élevé' as const },
      { position: [43.71, 7.15] as [number, number], density: 'moyen' as const },
      { position: [43.68, 7.1] as [number, number], density: 'moyen' as const },
      { position: [43.72, 7.08] as [number, number], density: 'faible' as const },
      { position: [43.65, 7.2] as [number, number], density: 'faible' as const },
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
    <div className="space-y-6 bg-[#0A0A0F]">
      {/* Header with Widget Configuration */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-syne text-[#F0F0F5]">Tableau de bord</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">
            Vue d'ensemble de votre flotte — {stats.total} véhicules, {stats.withGps} avec GPS actif
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWidgetConfig(!showWidgetConfig)}
          className="gap-2 border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <Settings size={16} />
          <span>Personnaliser</span>
        </Button>
      </div>

      {/* Widget Configuration Panel */}
      {showWidgetConfig && (
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
          <div className="pb-4 px-6 pt-6 border-b border-[#1F1F2E]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Personnaliser les widgets</h3>
                <p className="text-sm mt-1 text-[#6B6B80]">
                  Gérez la visibilité, la taille et l'ordre des widgets de votre tableau de bord
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetWidgetConfig}
                className="gap-2 text-[#FFB547] border-[#FFB547]/30 bg-[#FFB547]/10 hover:bg-[#FFB547]/20"
              >
                <RotateCcw size={14} />
                <span>Réinitialiser</span>
              </Button>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-3">
              {widgetOrder.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 bg-[#1A1A25] rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] hover:border-[#2A2A3D] transition-colors"
                >
                  {/* Visibility Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetConfig[id].visible}
                      onChange={() => toggleWidgetVisibility(id)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#00E5CC]"
                    />
                  </label>

                  {/* Widget Label */}
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${
                      widgetConfig[id].visible ? 'text-[#F0F0F5]' : 'text-[#6B6B80]'
                    }`}>
                      {widgetLabels[id]}
                    </span>
                  </div>

                  {/* Size Selector */}
                  <div className="flex gap-1 bg-[#12121A] rounded-[var(--tz-radius-sm)] p-1">
                    {(['compact', 'normal', 'expanded'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setWidgetSize(id, size)}
                        title={size === 'compact' ? 'Compact' : size === 'normal' ? 'Normal' : 'Large'}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          widgetConfig[id].size === size
                            ? 'bg-[#00E5CC] text-[#0A0A0F]'
                            : 'text-[#6B6B80] hover:text-[#F0F0F5]'
                        }`}
                      >
                        {size === 'compact' ? 'C' : size === 'normal' ? 'N' : 'L'}
                      </button>
                    ))}
                  </div>

                  {/* Reorder Buttons */}
                  <div className="flex gap-1 border-l border-[#1F1F2E] pl-3">
                    <button
                      onClick={() => moveWidgetUp(id)}
                      disabled={widgetOrder.indexOf(id) === 0}
                      className="p-1 text-[#6B6B80] hover:text-[#00E5CC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Monter"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveWidgetDown(id)}
                      disabled={widgetOrder.indexOf(id) === widgetOrder.length - 1}
                      className="p-1 text-[#6B6B80] hover:text-[#00E5CC] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 stagger-children">
        {/* Total Vehicles */}
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B6B80] uppercase tracking-wide">Total véhicules</p>
              <p className="text-3xl font-bold font-mono text-[#F0F0F5] mt-1">{stats.total}</p>
              <p className="text-xs text-[#6B6B80] mt-1">{stats.withGps} GPS actif</p>
            </div>
            <div className="rounded-[var(--tz-radius)] bg-[rgba(59,130,246,0.1)] p-3 border border-[rgba(59,130,246,0.2)]">
              <Truck className="text-[#3B82F6]" size={24} />
            </div>
          </div>
        </div>

        {/* Moving Vehicles */}
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B6B80] uppercase tracking-wide">En mouvement</p>
              <p className="text-3xl font-bold font-mono text-[#22C55E] mt-1">{stats.moving}</p>
              <p className="text-xs text-[#6B6B80] mt-1">{stats.stopped} à l'arrêt</p>
            </div>
            <div className="rounded-[var(--tz-radius)] bg-[rgba(34,197,94,0.1)] p-3 border border-[rgba(34,197,94,0.2)]">
              <Navigation className="text-[#22C55E]" size={24} />
            </div>
          </div>
        </div>

        {/* Recently Active */}
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B6B80] uppercase tracking-wide">Actifs récents</p>
              <p className="text-3xl font-bold font-mono text-[#FFB547] mt-1">{stats.recentlyActive}</p>
              <p className="text-xs text-[#6B6B80] mt-1">dernières 10 min</p>
            </div>
            <div className="rounded-[var(--tz-radius)] bg-[rgba(255,181,71,0.1)] p-3 border border-[rgba(255,181,71,0.2)]">
              <Activity className="text-[#FFB547]" size={24} />
            </div>
          </div>
        </div>

        {/* Offline */}
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B6B80] uppercase tracking-wide">Hors ligne</p>
              <p className="text-3xl font-bold font-mono text-[#FF4D6A] mt-1">{stats.noGps}</p>
              <p className="text-xs text-[#6B6B80] mt-1">sans position GPS</p>
            </div>
            <div className="rounded-[var(--tz-radius)] bg-[rgba(255,77,106,0.1)] p-3 border border-[rgba(255,77,106,0.2)]">
              <WifiOff className="text-[#FF4D6A]" size={24} />
            </div>
          </div>
        </div>

        {/* Daily KM */}
        <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#6B6B80] uppercase tracking-wide">Km du jour</p>
              <p className="text-3xl font-bold font-mono text-[#00E5CC] mt-1">{(dailySummary.totalKm / 1000).toFixed(1)}K</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs font-medium ${dailySummary.comparisons.km >= 0 ? 'text-[#22C55E]' : 'text-[#FF4D6A]'}`}>
                  {dailySummary.comparisons.km >= 0 ? '+' : ''}{dailySummary.comparisons.km.toFixed(1)}%
                </span>
                <span className="text-xs text-[#6B6B80]">vs hier</span>
              </div>
            </div>
            <div className="rounded-[var(--tz-radius)] bg-[rgba(0,229,204,0.1)] p-3 border border-[rgba(0,229,204,0.2)]">
              <Route className="text-[#00E5CC]" size={24} />
            </div>
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Résumé du jour</h3>
                <p className="text-xs text-[#6B6B80] mt-1">Métriques clés d'aujourd'hui</p>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {/* Kilomètres */}
                  <div className="flex items-center justify-between p-3 rounded-[var(--tz-radius-sm)] bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]">
                    <div className="flex items-center gap-3">
                      <Route className="text-[#3B82F6]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-[#6B6B80]">Kilomètres parcourus</p>
                        <p className="text-lg font-bold font-mono text-[#F0F0F5] mt-0.5">{dailySummary.totalKm.toLocaleString()} km</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.km >= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-[#FF4D6A]'
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
                  <div className="flex items-center justify-between p-3 rounded-[var(--tz-radius-sm)] bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)]">
                    <div className="flex items-center gap-3">
                      <Navigation className="text-[#A855F7]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-[#6B6B80]">Nombre de trajets</p>
                        <p className="text-lg font-bold font-mono text-[#F0F0F5] mt-0.5">{dailySummary.trips}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.trips >= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-[#FF4D6A]'
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
                  <div className="flex items-center justify-between p-3 rounded-[var(--tz-radius-sm)] bg-[rgba(255,181,71,0.08)] border border-[rgba(255,181,71,0.15)]">
                    <div className="flex items-center gap-3">
                      <Clock className="text-[#FFB547]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-[#6B6B80]">Temps de conduite moyen</p>
                        <p className="text-lg font-bold font-mono text-[#F0F0F5] mt-0.5">
                          {Math.floor(dailySummary.avgDriveTime / 60)}h {dailySummary.avgDriveTime % 60}m
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alertes */}
                  <div className="flex items-center justify-between p-3 rounded-[var(--tz-radius-sm)] bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.15)]">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="text-[#FF4D6A]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-[#6B6B80]">Alertes du jour</p>
                        <p className="text-lg font-bold font-mono text-[#F0F0F5] mt-0.5">{dailySummary.todayAlerts}</p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${
                        dailySummary.comparisons.alerts <= 0
                          ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                          : 'bg-[rgba(255,77,106,0.2)] text-[#FF4D6A]'
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
                  <div className="flex items-center justify-between p-3 rounded-[var(--tz-radius-sm)] bg-[rgba(0,229,204,0.08)] border border-[rgba(0,229,204,0.15)]">
                    <div className="flex items-center gap-3">
                      <Shield className="text-[#00E5CC]" size={20} />
                      <div>
                        <p className="text-xs font-medium text-[#6B6B80]">Géoclôtures violées</p>
                        <p className="text-lg font-bold font-mono text-[#F0F0F5] mt-0.5">{dailySummary.geofenceViolations}</p>
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Fil d'activité récente</h3>
                    <p className="text-xs text-[#6B6B80] mt-1">Événements de la dernière heure</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-[#00E5CC] hover:bg-[#1A1A25]"
                    onClick={() => navigate('/activity')}
                  >
                    Tout voir
                  </Button>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activityFeedEvents.slice(0, 12).map((event) => {
                    const IconComponent = event.icon
                    const timeAgo = formatTimeAgo(event.timestamp)
                    const iconColorMap = {
                      online: 'text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.15)]',
                      offline: 'text-[#FF4D6A] bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                      alert: 'text-[#FF4D6A] bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                      geofence: 'text-[#A855F7] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.15)]',
                      speed: 'text-[#FFB547] bg-[rgba(255,181,71,0.1)] border border-[rgba(255,181,71,0.15)]',
                    }

                    return (
                      <div
                        key={event.id}
                        className="flex gap-3 p-2.5 rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] hover:bg-[#1A1A25] transition-colors"
                      >
                        <div className={`rounded-[var(--tz-radius-sm)] p-2 flex-shrink-0 ${iconColorMap[event.type]}`}>
                          <IconComponent size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#F0F0F5]">{event.title}</p>
                          <p className="text-xs text-[#6B6B80] mt-0.5">{event.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-[#44445A]">{event.vehicleName}</span>
                            <span className="text-xs text-[#44445A]">·</span>
                            <span className="text-xs text-[#44445A]">{timeAgo}</span>
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Activité horaire (24h)</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Véhicules en mouvement vs arrêtés</p>
                </div>
                <div className="px-6 py-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorMoving" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorStopped" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF4D6A" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#FF4D6A" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                      <XAxis dataKey="hour" stroke="#6B6B80" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B6B80" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12121A',
                          border: '1px solid #1F1F2E',
                          borderRadius: '8px',
                          color: '#F0F0F5',
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
                        stroke="#FF4D6A"
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

        {/* Fleet Utilization Pie Chart */}
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">État de la flotte</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Distribution par statut véhicule</p>
                </div>
                <div className="px-6 py-4">
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
                          backgroundColor: '#12121A',
                          border: '1px solid #1F1F2E',
                          borderRadius: '8px',
                          color: '#F0F0F5',
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Distribution des alertes</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Nombre d'alertes par type (dernières 24h)</p>
                </div>
                <div className="px-6 py-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={alertDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                      <XAxis dataKey="type" stroke="#6B6B80" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#6B6B80" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12121A',
                          border: '1px solid #1F1F2E',
                          borderRadius: '8px',
                          color: '#F0F0F5',
                        }}
                        formatter={(value: any) => [`${value} alertes`, 'Nombre']}
                      />
                      <Bar dataKey="count" fill="#00E5CC" radius={[8, 8, 0, 0]} />
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Actions rapides</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Accès direct aux fonctionnalités</p>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                      onClick={() => navigate('/map')}
                    >
                      <MapPin size={16} />
                      <span className="text-xs">Voir Carte</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                      onClick={() => navigate('/reports')}
                    >
                      <FileText size={16} />
                      <span className="text-xs">Rapport</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                      onClick={() => navigate('/geofences')}
                    >
                      <Zap size={16} />
                      <span className="text-xs">Géobarrière</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]"
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Fil d'activité récente</h3>
                      <p className="text-xs text-[#6B6B80] mt-1">Alertes et changements de statut</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#00E5CC] hover:bg-[#1A1A25]"
                      onClick={() => navigate('/alerts')}
                    >
                      Voir tous
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  {alertsList.length > 0 ? (
                    <div className="space-y-3">
                      {alertsList.map((alert: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] p-3 hover:bg-[#1A1A25] cursor-pointer transition-colors"
                        >
                          <AlertCircle
                            size={16}
                            className={
                              alert.severity === 'critical'
                                ? 'text-[#FF4D6A] flex-shrink-0 mt-0.5'
                                : 'text-[#FFB547] flex-shrink-0 mt-0.5'
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-[#F0F0F5] truncate">{alert.title}</p>
                              <Badge
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className={`flex-shrink-0 text-xs ${
                                  alert.severity === 'critical'
                                    ? 'bg-[#FF4D6A]/20 text-[#FF4D6A] border-[#FF4D6A]/30'
                                    : 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/30'
                                }`}
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-[#6B6B80] line-clamp-2 mt-1">{alert.message}</p>
                            <p className="text-xs text-[#44445A] mt-2">{formatTimeAgo(alert.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle size={24} className="text-[#44445A] mb-2" />
                      <p className="text-sm text-[#6B6B80]">Aucune alerte récente</p>
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Résumé des statuts</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Dernières mises à jour véhicule</p>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {recentlyUpdated.slice(0, 8).map((v: any) => {
                      const isMoving = (v.currentSpeed || 0) > 2
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] p-2.5 hover:bg-[#1A1A25] cursor-pointer"
                          onClick={() => navigate(`/vehicles/${v.id}`)}
                        >
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-[#22C55E]' : 'bg-[#FFB547]'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F0F0F5] truncate">{v.name}</p>
                            <p className="text-xs text-[#6B6B80]">
                              {isMoving ? 'En mouvement' : 'Arrêté'} · {formatTimeAgo(v.lastCommunication)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold font-mono text-[#F0F0F5] flex-shrink-0">
                            {(v.currentSpeed || 0).toFixed(0)}
                            <span className="text-[#6B6B80] font-normal"> km/h</span>
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Distribution des vitesses</h3>
                <p className="text-xs text-[#6B6B80] mt-1">Nombre de véhicules par plage de vitesse</p>
              </div>
              <div className="px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { range: '0-30 km/h', count: 45 },
                      { range: '30-60 km/h', count: 82 },
                      { range: '60-90 km/h', count: 63 },
                      { range: '90-120 km/h', count: 28 },
                      { range: '>120 km/h', count: 5 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                    <XAxis dataKey="range" stroke="#6B6B80" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B6B80" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121A',
                        border: '1px solid #1F1F2E',
                        borderRadius: '8px',
                        color: '#F0F0F5',
                      }}
                      formatter={(value: any) => [`${value} véhicules`, 'Nombre']}
                    />
                    <Bar dataKey="count" fill="#00E5CC" radius={[8, 8, 0, 0]} />
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Comparaison hebdomadaire</h3>
                <p className="text-xs text-[#6B6B80] mt-1">Cette semaine vs semaine dernière</p>
              </div>
              <div className="px-6 py-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Km parcourus', current: 12450, previous: 11200 },
                      { name: 'Alertes', current: 23, previous: 31 },
                      { name: 'Heures actives', current: 856, previous: 790 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" />
                    <XAxis dataKey="name" stroke="#6B6B80" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6B6B80" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121A',
                        border: '1px solid #1F1F2E',
                        borderRadius: '8px',
                        color: '#F0F0F5',
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#6B6B80' }} />
                    <Bar dataKey="current" fill="#00E5CC" radius={[8, 8, 0, 0]} name="Cette semaine" />
                    <Bar dataKey="previous" fill="#6B6B80" radius={[8, 8, 0, 0]} name="Semaine dernière" />
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Zones d'activité (Carte thermique)</h3>
                <p className="text-xs text-[#6B6B80] mt-1">Densité de véhicules autour de Nice</p>
              </div>
              <div className="px-6 py-4">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-[#6B6B80]">Élevé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                      <span className="text-[#6B6B80]">Moyen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-[#6B6B80]">Faible</span>
                    </div>
                  </div>
                  <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #1F1F2E' }}>
                    <MapContainer
                      center={[43.7, 7.12]}
                      zoom={12}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url={MAPBOX_TILE_URL('streets-v12')}
                        attribution='&copy; Mapbox'
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
              <GripHorizontal size={16} className="text-[#6B6B80]" />
            </div>
            <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
              <div className="px-6 py-4 border-b border-[#1F1F2E]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Départements</h3>
                    <p className="text-xs text-[#6B6B80] mt-1">Statut et performance par département</p>
                  </div>
                  <Dialog open={showNewDeptDialog} onOpenChange={setShowNewDeptDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00E5CC]/80">
                        <Plus size={14} />
                        Nouveau
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#12121A] border border-[#1F1F2E]">
                      <DialogHeader>
                        <DialogTitle className="text-[#F0F0F5] font-syne">Ajouter un département</DialogTitle>
                        <DialogDescription className="text-[#6B6B80]">Entrez le nom du nouveau département</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nom du département"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full px-3 py-2 border border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] rounded-[var(--tz-radius-sm)] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]"
                          onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowNewDeptDialog(false)} className="border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]">
                            Annuler
                          </Button>
                          <Button onClick={addDepartment} className="bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00E5CC]/80">Ajouter</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="px-6 py-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-4 rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] hover:border-[#2A2A3D] transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-[var(--tz-radius-sm)] bg-[rgba(59,130,246,0.1)] p-2">
                            <Building2 size={16} className="text-[#3B82F6]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#F0F0F5]">{dept.name}</p>
                            <p className="text-xs text-[#6B6B80]">Département</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-[#6B6B80] uppercase tracking-wide mb-1">Véhicules</p>
                          <p className="text-2xl font-bold font-mono text-[#F0F0F5]">{dept.vehicleCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B6B80] uppercase tracking-wide mb-1">Chauffeurs actifs</p>
                          <p className="text-2xl font-bold font-mono text-[#F0F0F5]">{dept.driverCount}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-[#6B6B80]">Performance</p>
                            <p className="text-xs font-bold text-[#F0F0F5]">{dept.performanceScore}%</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#1A1A25] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                dept.performanceScore >= 90
                                  ? 'bg-[#22C55E]'
                                  : dept.performanceScore >= 80
                                    ? 'bg-[#FFB547]'
                                    : 'bg-[#FF4D6A]'
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Activité de la flotte</h3>
                      <p className="text-xs text-[#6B6B80] mt-1">Véhicules avec position GPS, triés par vitesse</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-[#00E5CC] hover:bg-[#1A1A25]"
                      onClick={() => navigate('/map')}
                    >
                      Carte
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-2">
                    {topMoving.map((vehicle: any) => {
                      const isMoving = (vehicle.currentSpeed || 0) > 2
                      return (
                        <div
                          key={vehicle.id}
                          className="flex items-center gap-3 rounded-[var(--tz-radius-sm)] border border-[#1F1F2E] p-3 hover:bg-[#1A1A25] cursor-pointer transition-colors"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-[#22C55E]' : 'bg-[#6B6B80]'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#F0F0F5] truncate">{vehicle.name}</p>
                            <p className="text-xs text-[#6B6B80]">{vehicle.plate}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold font-mono text-[#F0F0F5]">
                              {(vehicle.currentSpeed || 0).toFixed(0)}{' '}
                              <span className="text-xs font-normal text-[#6B6B80]">km/h</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-20">
                            <p className="text-xs text-[#44445A]">{formatTimeAgo(vehicle.lastCommunication)}</p>
                          </div>
                          <ChevronRight size={14} className="text-[#44445A]" />
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full text-sm border-[#1F1F2E] bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#1E1E2A]"
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Fournisseurs GPS</h3>
                  <p className="text-xs text-[#6B6B80] mt-1">Répartition par provider</p>
                </div>
                <div className="px-6 py-4">
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
                                  className={`h-3 w-3 rounded-full ${providerColors[name] || 'bg-[#6B6B80]'}`}
                                ></span>
                                <span className="font-medium text-[#F0F0F5]">{name}</span>
                              </div>
                              <span className="text-[#6B6B80] font-medium">{count as number}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-[#1A1A25]">
                              <div
                                className={`h-2 rounded-full ${providerColors[name] || 'bg-[#6B6B80]'} transition-all`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#1F1F2E] text-center">
                    <p className="text-xs text-[#6B6B80]">
                      Vitesse max: <span className="font-bold text-[#F0F0F5]">{stats.maxSpeed.toFixed(0)} km/h</span>
                      {' · '}
                      Moyenne: <span className="font-bold text-[#F0F0F5]">{stats.avgSpeed.toFixed(0)} km/h</span>
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
                <GripHorizontal size={16} className="text-[#6B6B80]" />
              </div>
              <div className="tz-card bg-[#12121A] border border-[#1F1F2E] rounded-[var(--tz-radius)]">
                <div className="px-6 py-4 border-b border-[#1F1F2E]">
                  <h3 className="font-syne text-base font-bold text-[#F0F0F5]">Mises à jour récentes</h3>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-2.5">
                    {recentlyUpdated.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <Clock size={12} className="text-[#6B6B80] flex-shrink-0" />
                        <span className="font-medium text-[#F0F0F5] truncate flex-1">{v.name}</span>
                        <span className="text-[#44445A] flex-shrink-0">{formatTimeAgo(v.lastCommunication)}</span>
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
  )
}
