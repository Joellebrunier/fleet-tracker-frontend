import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVehicles } from '@/hooks/useVehicles'
import { useAlertStats } from '@/hooks/useAlerts'
import { useGeofenceStats } from '@/hooks/useGeofences'
import { Truck, AlertCircle, MapPin, TrendingUp } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'

export default function DashboardPage() {
  const { data: vehiclesData, isLoading: vehiclesLoading } = useVehicles({ limit: 100 })
  const { data: alertStats, isLoading: alertsLoading } = useAlertStats()
  const { data: geofenceStats, isLoading: geofencesLoading } = useGeofenceStats()

  const vehicles = vehiclesData?.data || []
  const activeVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE).length
  const offlineVehicles = vehicles.filter((v) => v.status === VehicleStatus.OFFLINE).length

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtitle,
    color = 'fleet-tracker',
  }: {
    title: string
    value: string | number
    icon: any
    subtitle?: string
    color?: string
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center space-x-4">
          <div className={`rounded-lg bg-${color}-100 p-3`}>
            <Icon className={`text-${color}-600`} size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's your fleet overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {vehiclesLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Vehicles"
              value={vehicles.length}
              icon={Truck}
              subtitle={`${activeVehicles} active`}
            />
            <StatCard
              title="Active Vehicles"
              value={activeVehicles}
              icon={Truck}
              subtitle={`${offlineVehicles} offline`}
              color="green"
            />
            <StatCard
              title="Critical Alerts"
              value={alertsLoading ? '-' : alertStats?.critical || 0}
              icon={AlertCircle}
              color="red"
            />
            <StatCard
              title="Geofences"
              value={geofencesLoading ? '-' : geofenceStats?.active || 0}
              icon={MapPin}
              subtitle="Active"
              color="blue"
            />
          </>
        )}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent vehicles */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
            <CardDescription>Your vehicles at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            {vehiclesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.slice(0, 5).map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.name}</p>
                      <p className="text-sm text-gray-500">{vehicle.plate}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{(vehicle.currentSpeed || 0).toFixed(0)} km/h</p>
                        <p className="text-xs text-gray-500">
                          {vehicle.currentLat?.toFixed(4)}, {vehicle.currentLng?.toFixed(4)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          vehicle.status === VehicleStatus.ACTIVE
                            ? 'default'
                            : vehicle.status === VehicleStatus.OFFLINE
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full">
              View All Vehicles
            </Button>
          </CardContent>
        </Card>

        {/* Alerts summary */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Summary</CardTitle>
            <CardDescription>Unresolved alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Critical</span>
                  <span className="font-bold text-red-600">{alertStats?.critical || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High</span>
                  <span className="font-bold text-orange-600">{alertStats?.high || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium</span>
                  <span className="font-bold text-yellow-600">{alertStats?.medium || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low</span>
                  <span className="font-bold text-blue-600">{alertStats?.low || 0}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>{alertStats?.unacknowledged || 0}</span>
                  </div>
                </div>
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full">
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
