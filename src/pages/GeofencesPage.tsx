import { useState } from 'react'
import { useGeofences, useGeofenceStats } from '@/hooks/useGeofences'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MapPin, Plus } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function GeofencesPage() {
  const [page, setPage] = useState(1)
  const { data: geofencesData, isLoading } = useGeofences(page)
  const { data: stats } = useGeofenceStats()

  const geofences = geofencesData?.data || []
  const totalPages = geofencesData?.totalPages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geofences</h1>
          <p className="mt-2 text-gray-600">Create and manage location boundaries</p>
        </div>
        <Button className="gap-2">
          <Plus size={18} />
          Create Geofence
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Active</p>
              <p className="mt-2 text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Violations</p>
              <p className="mt-2 text-2xl font-bold text-red-600">{stats.violations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Vehicles</p>
              <p className="mt-2 text-2xl font-bold">{stats.vehiclesAssigned}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Geofences list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : geofences.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12">
            <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-500">No geofences created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {geofences.map((geofence) => (
            <Card key={geofence.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{geofence.name}</CardTitle>
                    {geofence.description && (
                      <p className="mt-1 text-sm text-gray-600">{geofence.description}</p>
                    )}
                  </div>
                  <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                    {geofence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{geofence.shape.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event:</span>
                    <span className="font-medium capitalize">{geofence.triggerEvent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Notify Users:</span>
                    <span className="font-medium">{geofence.notifyUsers.length}</span>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs text-gray-500">{formatDateTime(geofence.createdAt)}</p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Edit Geofence
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
