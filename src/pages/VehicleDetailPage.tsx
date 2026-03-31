import { useParams } from 'react-router-dom'
import { useVehicle, useVehicleStats, useVehicleHistory } from '@/hooks/useVehicles'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSpeed, formatDistance, formatDateTime } from '@/lib/utils'

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id || '')
  const { data: stats, isLoading: statsLoading } = useVehicleStats(id || '')
  const { data: history, isLoading: historyLoading } = useVehicleHistory(id || '')

  if (vehicleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <Card className="text-center">
        <CardContent className="pt-12">
          <p className="text-gray-500">Vehicle not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{vehicle.name}</h1>
          <p className="mt-2 text-gray-600">{vehicle.registrationNumber}</p>
        </div>
        <Badge variant="default" className="text-base">
          {vehicle.status}
        </Badge>
      </div>

      {/* Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-600">VIN</p>
                <p className="mt-1 font-mono text-sm text-gray-900">{vehicle.vin}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Registration</p>
                <p className="mt-1 text-sm text-gray-900">{vehicle.registrationNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Type</p>
                <p className="mt-1 text-sm text-gray-900 capitalize">{vehicle.type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Manufacturer</p>
                <p className="mt-1 text-sm text-gray-900">
                  {vehicle.manufacturer || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Model</p>
                <p className="mt-1 text-sm text-gray-900">{vehicle.model || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Year</p>
                <p className="mt-1 text-sm text-gray-900">{vehicle.year || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Speed</p>
              <p className="text-2xl font-bold text-gray-900">{formatSpeed(vehicle.speed)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Odometer</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatDistance(vehicle.odometer)}
              </p>
            </div>
            {vehicle.fuelLevel !== undefined && (
              <div>
                <p className="text-sm text-gray-600">Fuel Level</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 rounded-full bg-gray-200 h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${vehicle.fuelLevel}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-gray-900">{vehicle.fuelLevel}%</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Engine Status</p>
              <p className="mt-1 font-semibold">
                {vehicle.engineStatus === 'running' ? (
                  <span className="text-green-600">Running</span>
                ) : (
                  <span className="text-gray-600">Stopped</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Today's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Total Distance</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatDistance(stats.totalDistance)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Average Speed</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatSpeed(stats.averageSpeed)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Max Speed</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatSpeed(stats.maxSpeed)}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Idle Time</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {(stats.idleTime / 3600).toFixed(1)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      {history && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.positions?.slice(0, 5).map((pos: any, idx: number) => (
                <div key={idx} className="flex justify-between border-b border-gray-200 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatSpeed(pos.speed)} at {pos.heading}°
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateTime(pos.timestamp)}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
