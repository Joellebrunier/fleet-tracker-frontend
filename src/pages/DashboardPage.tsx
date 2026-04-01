import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVehicles } from '@/hooks/useVehicles'
import { useAlerts } from '@/hooks/useAlerts'
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
} from 'lucide-react'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: vehiclesData, isLoading } = useVehicles({ limit: 500 })
  const { data: alertsData } = useAlerts({ limit: 5, status: 'unacknowledged' })

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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="mt-1 text-sm text-gray-600">
          Vue d'ensemble de votre flotte — {stats.total} véhicules, {stats.withGps} avec GPS actif
        </p>
      </div>

      {/* KPI Cards */}
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

      {/* Fleet Activity Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hourly Activity Chart */}
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
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorStopped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
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

        {/* Fleet Utilization Pie Chart */}
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

      {/* Alert Distribution & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alert Distribution Bar Chart */}
        <Card className="lg:col-span-2">
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

        {/* Quick Actions */}
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

      {/* Activity Feed & Alerts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity Feed */}
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

        {/* Status Summary */}
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

      {/* Speed Distribution Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Distribution des vitesses</CardTitle>
          <CardDescription className="text-xs">Nombre de véhicules par plage de vitesse</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { range: '0-30 km/h', count: 45 },
              { range: '30-60 km/h', count: 82 },
              { range: '60-90 km/h', count: 63 },
              { range: '90-120 km/h', count: 28 },
              { range: '>120 km/h', count: 5 }
            ]}>
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

      {/* Comparison and Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Comparison Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Comparaison hebdomadaire</CardTitle>
            <CardDescription className="text-xs">Cette semaine vs semaine dernière</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Km parcourus', current: 12450, previous: 11200 },
                { name: 'Alertes', current: 23, previous: 31 },
                { name: 'Heures actives', current: 856, previous: 790 }
              ]}>
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

        {/* Activity Zones Placeholder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Zones d'activité</CardTitle>
            <CardDescription className="text-xs">Cartographie de la densité de passage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 rounded-lg bg-gray-100 p-3">
                <MapPin size={24} className="text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">Carte thermique</p>
              <p className="text-xs text-gray-500 mt-2">
                Les cartes thermiques sont disponibles sur la page Carte principale. Utilisez le bouton 'Zones d'activité' pour afficher la densité de passage.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fleet activity - top moving vehicles */}
        <Card className="lg:col-span-2">
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

        {/* Provider breakdown */}
        <div className="space-y-6">
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

          {/* Recently updated */}
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
    </div>
  )
}
