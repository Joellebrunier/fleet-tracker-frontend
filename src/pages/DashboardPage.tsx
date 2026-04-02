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
    Flespi: 'bg-purple-500',
    Echoes: 'bg-blue-500',
    KeepTrace: 'bg-emerald-500',
    Ubiwan: 'bg-orange-500',
    Autre: 'bg-gray-400',
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
    <div className="space-y-6">
      {/* Header with Widget Configuration */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-600">
            Vue d'ensemble de votre flotte — {stats.total} véhicules, {stats.withGps} avec GPS actif
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWidgetConfig(!showWidgetConfig)}
          className="gap-2"
        >
          <Settings size={16} />
          <span>Personnaliser</span>
        </Button>
      </div>

      {/* Widget Configuration Panel */}
      {showWidgetConfig && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Personnaliser les widgets</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Gérez la visibilité, la taille et l'ordre des widgets de votre tableau de bord
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetWidgetConfig}
                className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                <RotateCcw size={14} />
                <span>Réinitialiser</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {widgetOrder.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  {/* Visibility Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={widgetConfig[id].visible}
                      onChange={() => toggleWidgetVisibility(id)}
                      className="w-4 h-4 rounded cursor-pointer"
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
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['compact', 'normal', 'expanded'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => setWidgetSize(id, size)}
                        title={size === 'compact' ? 'Compact' : size === 'normal' ? 'Normal' : 'Large'}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          widgetConfig[id].size === size
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:text-gray-900'
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
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Monter"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => moveWidgetDown(id)}
                      disabled={widgetOrder.indexOf(id) === widgetOrder.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Descendre"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards - Always visible */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total véhicules</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.withGps} GPS actif</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-3">
                <Truck className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">En mouvement</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.moving}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.stopped} à l'arrêt</p>
              </div>
              <div className="rounded-xl bg-green-50 p-3">
                <Navigation className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Actifs récents</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.recentlyActive}</p>
                <p className="text-xs text-gray-500 mt-1">dernières 10 min</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <Activity className="text-amber-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hors ligne</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.noGps}</p>
                <p className="text-xs text-gray-500 mt-1">sans position GPS</p>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <WifiOff className="text-red-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Km du jour</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">1,247</p>
                <p className="text-xs text-gray-500 mt-1">distance totale</p>
              </div>
              <div className="rounded-xl bg-indigo-50 p-3">
                <Route className="text-indigo-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Activité horaire (24h)</CardTitle>
                  <CardDescription className="text-xs">Véhicules en mouvement vs arrêtés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorMoving" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorStopped" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="hour" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
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
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorStopped)"
                        name="Arrêtés"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">État de la flotte</CardTitle>
                  <CardDescription className="text-xs">Distribution par statut véhicule</CardDescription>
                </CardHeader>
                <CardContent>
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
                      <Tooltip formatter={(value: any) => `${value} véhicules`} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Distribution des alertes</CardTitle>
                  <CardDescription className="text-xs">Nombre d'alertes par type (dernières 24h)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={alertDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="type" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        formatter={(value: any) => [`${value} alertes`, 'Nombre']}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Actions rapides</CardTitle>
                  <CardDescription className="text-xs">Accès direct aux fonctionnalités</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row"
                      onClick={() => navigate('/map')}
                    >
                      <MapPin size={16} />
                      <span className="text-xs">Voir Carte</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row"
                      onClick={() => navigate('/reports')}
                    >
                      <FileText size={16} />
                      <span className="text-xs">Rapport</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row"
                      onClick={() => navigate('/geofences')}
                    >
                      <Zap size={16} />
                      <span className="text-xs">Géobarrière</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center justify-start gap-3 h-auto py-2.5 flex-row"
                      onClick={() => navigate('/alerts/new')}
                    >
                      <Plus size={16} />
                      <span className="text-xs">Alerte</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Fil d'activité récente</CardTitle>
                      <CardDescription className="text-xs">Alertes et changements de statut</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => navigate('/alerts')}
                    >
                      Voir tous
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {alertsList.length > 0 ? (
                    <div className="space-y-3">
                      {alertsList.map((alert: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <AlertCircle
                            size={16}
                            className={
                              alert.severity === 'critical'
                                ? 'text-red-500 flex-shrink-0 mt-0.5'
                                : 'text-orange-500 flex-shrink-0 mt-0.5'
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                              <Badge
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className="flex-shrink-0 text-xs"
                              >
                                {alert.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatTimeAgo(alert.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <AlertCircle size={24} className="text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Aucune alerte récente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Résumé des statuts</CardTitle>
                  <CardDescription className="text-xs">Dernières mises à jour véhicule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentlyUpdated.slice(0, 8).map((v: any) => {
                      const isMoving = (v.currentSpeed || 0) > 2
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/vehicles/${v.id}`)}
                        >
                          <span
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-green-500' : 'bg-yellow-500'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
                            <p className="text-xs text-gray-500">
                              {isMoving ? 'En mouvement' : 'Arrêté'} · {formatTimeAgo(v.lastCommunication)}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                            {(v.currentSpeed || 0).toFixed(0)}
                            <span className="text-gray-500 font-normal"> km/h</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
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
              <GripHorizontal size={16} className="text-gray-400" />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribution des vitesses</CardTitle>
                <CardDescription className="text-xs">Nombre de véhicules par plage de vitesse</CardDescription>
              </CardHeader>
              <CardContent>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="range" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => [`${value} véhicules`, 'Nombre']}
                    />
                    <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
              <GripHorizontal size={16} className="text-gray-400" />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Comparaison hebdomadaire</CardTitle>
                <CardDescription className="text-xs">Cette semaine vs semaine dernière</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Km parcourus', current: 12450, previous: 11200 },
                      { name: 'Alertes', current: 23, previous: 31 },
                      { name: 'Heures actives', current: 856, previous: 790 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="current" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Cette semaine" />
                    <Bar dataKey="previous" fill="#9ca3af" radius={[8, 8, 0, 0]} name="Semaine dernière" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
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
              <GripHorizontal size={16} className="text-gray-400" />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Zones d'activité (Carte thermique)</CardTitle>
                <CardDescription className="text-xs">Densité de véhicules autour de Nice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-gray-600">Élevé</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                      <span className="text-gray-600">Moyen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="text-gray-600">Faible</span>
                    </div>
                  </div>
                  <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
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
              </CardContent>
            </Card>
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
              <GripHorizontal size={16} className="text-gray-400" />
            </div>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Départements</CardTitle>
                    <CardDescription className="text-xs">Statut et performance par département</CardDescription>
                  </div>
                  <Dialog open={showNewDeptDialog} onOpenChange={setShowNewDeptDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus size={14} />
                        Nouveau
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajouter un département</DialogTitle>
                        <DialogDescription>Entrez le nom du nouveau département</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nom du département"
                          value={newDeptName}
                          onChange={(e) => setNewDeptName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyDown={(e) => e.key === 'Enter' && addDepartment()}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setShowNewDeptDialog(false)}>
                            Annuler
                          </Button>
                          <Button onClick={addDepartment}>Ajouter</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-blue-50 p-2">
                            <Building2 size={16} className="text-blue-600" />
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
                          <p className="text-2xl font-bold text-gray-900">{dept.vehicleCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chauffeurs actifs</p>
                          <p className="text-2xl font-bold text-gray-900">{dept.driverCount}</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium text-gray-600">Performance</p>
                            <p className="text-xs font-bold text-gray-900">{dept.performanceScore}%</p>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                dept.performanceScore >= 90
                                  ? 'bg-green-500'
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
              </CardContent>
            </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Activité de la flotte</CardTitle>
                      <CardDescription className="text-xs">Véhicules avec position GPS, triés par vitesse</CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() => navigate('/map')}
                    >
                      Carte
                      <ChevronRight size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topMoving.map((vehicle: any) => {
                      const isMoving = (vehicle.currentSpeed || 0) > 2
                      return (
                        <div
                          key={vehicle.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                              isMoving ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{vehicle.name}</p>
                            <p className="text-xs text-gray-500">{vehicle.plate}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-gray-900">
                              {(vehicle.currentSpeed || 0).toFixed(0)}{' '}
                              <span className="text-xs font-normal text-gray-500">km/h</span>
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 min-w-20">
                            <p className="text-xs text-gray-400">{formatTimeAgo(vehicle.lastCommunication)}</p>
                          </div>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4 w-full text-sm"
                    onClick={() => navigate('/vehicles')}
                  >
                    Voir tous les véhicules
                  </Button>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fournisseurs GPS</CardTitle>
                  <CardDescription className="text-xs">Répartition par provider</CardDescription>
                </CardHeader>
                <CardContent>
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
                                  className={`h-3 w-3 rounded-full ${providerColors[name] || 'bg-gray-400'}`}
                                ></span>
                                <span className="font-medium text-gray-700">{name}</span>
                              </div>
                              <span className="text-gray-500 font-medium">{count as number}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-100">
                              <div
                                className={`h-2 rounded-full ${providerColors[name] || 'bg-gray-400'} transition-all`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500">
                      Vitesse max: <span className="font-bold text-gray-700">{stats.maxSpeed.toFixed(0)} km/h</span>
                      {' · '}
                      Moyenne: <span className="font-bold text-gray-700">{stats.avgSpeed.toFixed(0)} km/h</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
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
                <GripHorizontal size={16} className="text-gray-400" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mises à jour récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2.5">
                    {recentlyUpdated.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-2 text-xs">
                        <Clock size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate flex-1">{v.name}</span>
                        <span className="text-gray-400 flex-shrink-0">{formatTimeAgo(v.lastCommunication)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
