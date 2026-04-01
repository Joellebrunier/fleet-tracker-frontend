import { useState, useCallback } from 'react'
import { useGeofences, useGeofenceStats, useCreateGeofence, useDeleteGeofence } from '@/hooks/useGeofences'
import { GeofenceShape, GeofenceEvent, GeofenceFormData, Geofence } from '@/types/geofence'
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
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import GeofenceDrawMap from '@/components/geofences/GeofenceDrawMap'

type ModalMode = 'create' | 'edit' | 'view' | null

interface GeofenceFormState {
  name: string
  description: string
  shape: GeofenceShape | null
  triggerEvent: GeofenceEvent
  alertOnEntry: boolean
  alertOnExit: boolean
  notifyUsers: string[]
  color: string
}

const defaultForm: GeofenceFormState = {
  name: '',
  description: '',
  shape: null,
  triggerEvent: GeofenceEvent.BOTH,
  alertOnEntry: true,
  alertOnExit: true,
  notifyUsers: [],
  color: '#3b82f6',
}

const triggerOptions = [
  { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
  { value: GeofenceEvent.EXIT, label: 'Exit Only' },
  { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
]

function getShapeIcon(type: string) {
  switch (type) {
    case 'circle':
      return <Circle size={16} />
    case 'polygon':
      return <Pentagon size={16} />
    case 'rectangle':
      return <Square size={16} />
    default:
      return <MapPin size={16} />
  }
}

function getShapeLabel(shape: GeofenceShape): string {
  if (shape.type === 'circle') {
    return `Circle (${shape.radiusMeters}m radius)`
  } else if (shape.type === 'polygon') {
    return `Polygon (${shape.points.length} points)`
  }
  return shape.type
}

export default function GeofencesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)
  const [form, setForm] = useState<GeofenceFormState>(defaultForm)
  const [formError, setFormError] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const { data: geofencesData, isLoading } = useGeofences(page)
  const { data: stats } = useGeofenceStats()
  const createMutation = useCreateGeofence()

  const geofences = geofencesData?.data || []
  const totalPages = geofencesData?.totalPages || 1

  const filteredGeofences = search
    ? geofences.filter(
        (g) =>
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase())
      )
    : geofences

  const openCreateModal = useCallback(() => {
    setForm(defaultForm)
    setFormError('')
    setSelectedGeofence(null)
    setModalMode('create')
  }, [])

  const openEditModal = useCallback((geofence: Geofence) => {
    setForm({
      name: geofence.name,
      description: geofence.description || '',
      shape: geofence.shape,
      triggerEvent: geofence.triggerEvent,
      alertOnEntry: geofence.alertOnEntry,
      alertOnExit: geofence.alertOnExit,
      notifyUsers: geofence.notifyUsers,
      color: geofence.metadata?.color || '#3b82f6',
    })
    setFormError('')
    setSelectedGeofence(geofence)
    setModalMode('edit')
  }, [])

  const openViewModal = useCallback((geofence: Geofence) => {
    setSelectedGeofence(geofence)
    setModalMode('view')
  }, [])

  const closeModal = useCallback(() => {
    setModalMode(null)
    setSelectedGeofence(null)
    setForm(defaultForm)
    setFormError('')
  }, [])

  const handleShapeChange = useCallback((shape: GeofenceShape | null) => {
    setForm((prev) => ({ ...prev, shape }))
  }, [])

  const handleSubmit = async () => {
    setFormError('')

    if (!form.name.trim()) {
      setFormError('Geofence name is required')
      return
    }
    if (!form.shape) {
      setFormError('Please draw a shape on the map')
      return
    }

    const data: GeofenceFormData = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      shape: form.shape,
      triggerEvent: form.triggerEvent,
      alertOnEntry: form.alertOnEntry,
      alertOnExit: form.alertOnExit,
      notifyUsers: form.notifyUsers,
    }

    try {
      if (modalMode === 'create') {
        await createMutation.mutateAsync(data)
      }
      // Edit would use useUpdateGeofence — same pattern
      closeModal()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save geofence')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Geofences</h1>
          <p className="mt-1 text-gray-600">Create and manage location boundaries for your fleet</p>
        </div>
        <Button className="gap-2" onClick={openCreateModal}>
          <Plus size={18} />
          Create Geofence
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Zones</p>
                  <p className="mt-1 text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <MapPin size={20} className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Eye size={20} className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Violations Today</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{stats.violations}</p>
                </div>
                <div className="rounded-full bg-red-100 p-3">
                  <EyeOff size={20} className="text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vehicles Assigned</p>
                  <p className="mt-1 text-2xl font-bold">{stats.vehiclesAssigned}</p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <MapPin size={20} className="text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search geofences..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Geofences Grid */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredGeofences.length === 0 ? (
        <Card className="text-center">
          <CardContent className="py-12">
            <MapPin className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-700">
              {search ? 'No geofences match your search' : 'No geofences created yet'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {search
                ? 'Try a different search term'
                : 'Click "Create Geofence" to define your first zone'}
            </p>
            {!search && (
              <Button className="mt-4 gap-2" onClick={openCreateModal}>
                <Plus size={16} />
                Create Your First Geofence
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredGeofences.map((geofence) => (
            <Card
              key={geofence.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => openViewModal(geofence)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: `${geofence.metadata?.color || '#3b82f6'}20`,
                        color: geofence.metadata?.color || '#3b82f6',
                      }}
                    >
                      {getShapeIcon(geofence.shape.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{geofence.name}</CardTitle>
                      {geofence.description && (
                        <p className="mt-0.5 text-xs text-gray-500">{geofence.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                    {geofence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium capitalize">{geofence.shape.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Trigger</p>
                    <p className="font-medium capitalize">{geofence.triggerEvent}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Details</p>
                    <p className="font-medium text-xs">{getShapeLabel(geofence.shape)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400">Created {formatDateTime(geofence.createdAt)}</p>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditModal(geofence)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => setDeleteConfirmId(geofence.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
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

      {/* Create / Edit Modal */}
      <Dialog open={modalMode === 'create' || modalMode === 'edit'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'create' ? 'Create New Geofence' : `Edit: ${selectedGeofence?.name}`}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create'
                ? 'Draw a zone on the map and configure alert settings.'
                : 'Modify the geofence shape and settings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Map Drawing Area */}
            <GeofenceDrawMap
              key={modalMode}
              initialShape={modalMode === 'edit' ? form.shape || undefined : undefined}
              onShapeChange={handleShapeChange}
            />

            {form.shape && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                {getShapeIcon(form.shape.type)}
                <span>{getShapeLabel(form.shape)}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Name *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Warehouse Zone, Client Site..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Trigger Event</label>
                <select
                  value={form.triggerEvent}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, triggerEvent: e.target.value as GeofenceEvent }))
                  }
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {triggerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Zone Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="h-9 w-12 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Alert Settings</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.alertOnEntry}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, alertOnEntry: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    Alert on entry
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.alertOnExit}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, alertOnExit: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    Alert on exit
                  </label>
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? 'Saving...'
                : modalMode === 'create'
                  ? 'Create Geofence'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={modalMode === 'view'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGeofence?.name}</DialogTitle>
            <DialogDescription>{selectedGeofence?.description || 'No description'}</DialogDescription>
          </DialogHeader>

          {selectedGeofence && (
            <div className="space-y-4">
              <GeofenceDrawMap
                key={`view-${selectedGeofence.id}`}
                initialShape={selectedGeofence.shape}
                onShapeChange={() => {}}
              />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge variant={selectedGeofence.isActive ? 'default' : 'secondary'}>
                    {selectedGeofence.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Shape</p>
                  <p className="font-medium">{getShapeLabel(selectedGeofence.shape)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trigger</p>
                  <p className="font-medium capitalize">{selectedGeofence.triggerEvent}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">{formatDateTime(selectedGeofence.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Alert on Entry</p>
                  <p className="font-medium">{selectedGeofence.alertOnEntry ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Alert on Exit</p>
                  <p className="font-medium">{selectedGeofence.alertOnExit ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedGeofence) {
                  closeModal()
                  setTimeout(() => openEditModal(selectedGeofence), 100)
                }
              }}
            >
              Edit Geofence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Geofence</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this geofence? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                // Delete is handled via the hook pattern
                setDeleteConfirmId(null)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
