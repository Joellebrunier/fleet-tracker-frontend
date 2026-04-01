import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGeofences, useGeofenceStats, useCreateGeofence } from '@/hooks/useGeofences'
import { GeofenceShape, GeofenceEvent, GeofenceFormData, Geofence } from '@/types/geofence'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
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
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import GeofenceDrawMap from '@/components/geofences/GeofenceDrawMap'

type ModalMode = 'create' | 'edit' | 'view' | null

interface GeofenceTemplate {
  name: string
  namePrefix: string
  shape: {
    type: 'circle' | 'polygon' | 'rectangle'
    radiusMeters?: number
  }
  color: string
}

interface GeofenceFormState {
  name: string
  description: string
  shape: GeofenceShape | null
  triggerEvent: GeofenceEvent
  alertOnEntry: boolean
  alertOnExit: boolean
  notifyUsers: string[]
  color: string
  activeDays: boolean[]
  activeHours: { from: string; to: string } | null
  isTemporary: boolean
  temporaryUntil?: string
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
  activeDays: [true, true, true, true, true, false, false],
  activeHours: null,
  isTemporary: false,
  temporaryUntil: undefined,
}

const triggerOptions = [
  { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
  { value: GeofenceEvent.EXIT, label: 'Exit Only' },
  { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
]

const geofenceTemplates: GeofenceTemplate[] = [
  { name: 'Zone de dépôt', namePrefix: 'Dépôt', shape: { type: 'circle', radiusMeters: 200 }, color: '#3b82f6' },
  { name: 'Zone de livraison', namePrefix: 'Livraison', shape: { type: 'circle', radiusMeters: 500 }, color: '#10b981' },
  { name: 'Zone interdite', namePrefix: 'Interdite', shape: { type: 'polygon' }, color: '#ef4444' },
  { name: 'Zone de chantier', namePrefix: 'Chantier', shape: { type: 'rectangle' }, color: '#f97316' },
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

function getDayLabel(activeDays: boolean[]): string {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const indices = activeDays.map((d, i) => (d ? days[i] : null)).filter(Boolean)

  if (indices.length === 0) return 'Aucun jour'
  if (indices.length === 7) return 'Tous les jours'
  if (indices.length === 5 && activeDays[0] && activeDays[1] && activeDays[2] && activeDays[3] && activeDays[4]) {
    return 'Jours ouvrables'
  }
  if (indices.length === 2 && activeDays[5] && activeDays[6]) {
    return 'Week-end'
  }

  return indices.join('/')
}

export default function GeofencesPage() {
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null)
  const [form, setForm] = useState<GeofenceFormState>(defaultForm)
  const [formError, setFormError] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

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
    setShowTemplates(false)
    setModalMode('create')
  }, [])

  const applyTemplate = useCallback((template: GeofenceTemplate) => {
    setForm((prev) => ({
      ...prev,
      name: `${template.namePrefix} - `,
      color: template.color,
    }))
    setShowTemplates(false)
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
      activeDays: (geofence as any).activeDays || [true, true, true, true, true, false, false],
      activeHours: (geofence as any).activeHours || null,
      isTemporary: (geofence as any).isTemporary || false,
      temporaryUntil: (geofence as any).temporaryUntil,
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
          <h1 className="text-3xl font-bold text-gray-900">Géoclôtures</h1>
          <p className="mt-1 text-gray-600">Créer et gérer les limites de localisation pour votre flotte</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Modèles
            </Button>
            {showTemplates && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="p-2 space-y-1">
                  {geofenceTemplates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        openCreateModal()
                        applyTemplate(template)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: template.color }}
                        />
                        <span className="font-medium">{template.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Button className="gap-2" onClick={openCreateModal}>
            <Plus size={18} />
            Créer
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total géoclôtures</p>
                  <p className="mt-1 text-2xl font-bold">{filteredGeofences.length}</p>
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
                  <p className="text-sm text-gray-600">Actives</p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {filteredGeofences.filter((g) => g.isActive).length}
                  </p>
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
                  <p className="text-sm text-gray-600">Alertes aujourd'hui</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">0</p>
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
                  <p className="text-sm text-gray-600">Véhicules surveillés</p>
                  <p className="mt-1 text-2xl font-bold">
                    {filteredGeofences.reduce((sum, g) => sum + ((g as any).vehicleCount || 0), 0)}
                  </p>
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
          placeholder="Rechercher les géoclôtures..."
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
              {search ? 'Aucune géoclôture ne correspond à votre recherche' : 'Aucune géoclôture créée'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {search
                ? 'Essayez un terme de recherche différent'
                : 'Cliquez sur "Créer" pour définir votre première zone'}
            </p>
            {!search && (
              <Button className="mt-4 gap-2" onClick={openCreateModal}>
                <Plus size={16} />
                Créer votre première géoclôture
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
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: `${geofence.metadata?.color || '#3b82f6'}20`,
                        color: geofence.metadata?.color || '#3b82f6',
                      }}
                    >
                      {getShapeIcon(geofence.shape.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{geofence.name}</CardTitle>
                      {geofence.description && (
                        <p className="mt-0.5 text-xs text-gray-500">{geofence.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={geofence.isActive ? 'default' : 'secondary'}>
                    {geofence.isActive ? 'Actif' : 'Inactif'}
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
                    <p className="text-gray-500">Déclencheur</p>
                    <p className="font-medium capitalize">{geofence.triggerEvent}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Détails</p>
                    <p className="font-medium text-xs">{getShapeLabel(geofence.shape)}</p>
                  </div>
                </div>

                {/* Day/Time based rules and status badges */}
                <div className="flex flex-wrap gap-2">
                  {(geofence as any).isTemporary && (
                    <Badge className="gap-1 bg-orange-500 text-white text-xs">
                      Temporaire
                    </Badge>
                  )}
                  {!(geofence as any).isTemporary && (
                    <Badge className="gap-1 bg-blue-500 text-white text-xs">
                      Permanente
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {getDayLabel((geofence as any).activeDays || [true, true, true, true, true, false, false])}
                  </Badge>
                  {(geofence as any).activeHours && (
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Clock size={12} />
                      {(geofence as any).activeHours.from} - {(geofence as any).activeHours.to}
                    </Badge>
                  )}
                  {!(geofence as any).activeHours && (
                    <Badge variant="outline" className="text-xs">
                      24h/24
                    </Badge>
                  )}
                </div>

                {/* Violations badge */}
                {((geofence as any).violationCount ?? 0) > 0 && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm">
                    <p className="text-red-700">
                      <span className="font-semibold">{(geofence as any).violationCount}</span> violation{(geofence as any).violationCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Vehicle groups */}
                {((geofence as any).groupCount ?? 0) > 0 && (
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">{(geofence as any).groupCount}</span> groupe{(geofence as any).groupCount > 1 ? 's' : ''} assigné{(geofence as any).groupCount > 1 ? 's' : ''}
                  </div>
                )}

                {/* Time spent stats */}
                {((geofence as any).avgTimeInside || (geofence as any).lastEntry) && (
                  <div className="space-y-1 border-t border-gray-100 pt-3 text-xs">
                    {(geofence as any).avgTimeInside && (
                      <p className="text-gray-600">
                        Temps moyen: <span className="font-medium">{(geofence as any).avgTimeInside}</span>
                      </p>
                    )}
                    {(geofence as any).lastEntry && (
                      <p className="text-gray-600">
                        Dernière entrée: <span className="font-medium">{(geofence as any).lastEntry}</span>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400">Créé {formatDateTime(geofence.createdAt)}</p>
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
              {modalMode === 'create' ? 'Créer une nouvelle géoclôture' : `Modifier: ${selectedGeofence?.name}`}
            </DialogTitle>
            <DialogDescription>
              {modalMode === 'create'
                ? 'Dessinez une zone sur la carte et configurez les paramètres d\'alerte.'
                : 'Modifiez la forme de la géoclôture et les paramètres.'}
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Exemple: Zone d'entrepôt, Site client..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description facultative..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Événement de déclenchement</label>
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Couleur de la zone</label>
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
                <label className="mb-2 block text-sm font-medium text-gray-700">Paramètres d'alerte</label>
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
                    Alerte à l'entrée
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
                    Alerte à la sortie
                  </label>
                </div>
              </div>

              {/* Jours actifs */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Jours actifs</label>
                <div className="flex gap-2">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const newDays = [...form.activeDays]
                        newDays[idx] = !newDays[idx]
                        setForm((prev) => ({ ...prev, activeDays: newDays }))
                      }}
                      className={`h-9 w-9 rounded-md border-2 text-xs font-medium transition-colors ${
                        form.activeDays[idx]
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">{getDayLabel(form.activeDays)}</p>
              </div>

              {/* Heures actives */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Heures actives</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!form.activeHours}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm((prev) => ({
                            ...prev,
                            activeHours: { from: '08:00', to: '18:00' },
                          }))
                        } else {
                          setForm((prev) => ({ ...prev, activeHours: null }))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    Configurer une plage horaire
                  </label>
                </div>
                {form.activeHours && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="time"
                      value={form.activeHours.from}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          activeHours: {
                            ...(prev.activeHours || { from: '', to: '' }),
                            from: e.target.value,
                          },
                        }))
                      }}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-600">à</span>
                    <input
                      type="time"
                      value={form.activeHours.to}
                      onChange={(e) => {
                        setForm((prev) => ({
                          ...prev,
                          activeHours: {
                            ...(prev.activeHours || { from: '', to: '' }),
                            to: e.target.value,
                          },
                        }))
                      }}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Temporaire vs Permanente */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-gray-700">Type de géoclôture</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={!form.isTemporary}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, isTemporary: false, temporaryUntil: undefined }))
                      }
                      className="rounded-full border-gray-300"
                    />
                    Permanente
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={form.isTemporary}
                      onChange={() => setForm((prev) => ({ ...prev, isTemporary: true }))}
                      className="rounded-full border-gray-300"
                    />
                    Temporaire
                  </label>
                </div>
                {form.isTemporary && (
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Valide jusqu'à</label>
                    <input
                      type="datetime-local"
                      value={form.temporaryUntil || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, temporaryUntil: e.target.value }))}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                )}
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
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? 'Enregistrement...'
                : modalMode === 'create'
                  ? 'Créer une géoclôture'
                  : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={modalMode === 'view'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedGeofence?.name}</DialogTitle>
            <DialogDescription>{selectedGeofence?.description || 'Pas de description'}</DialogDescription>
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
                  <p className="text-gray-500">Statut</p>
                  <Badge variant={selectedGeofence.isActive ? 'default' : 'secondary'}>
                    {selectedGeofence.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Forme</p>
                  <p className="font-medium">{getShapeLabel(selectedGeofence.shape)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Déclencheur</p>
                  <p className="font-medium capitalize">{selectedGeofence.triggerEvent}</p>
                </div>
                <div>
                  <p className="text-gray-500">Créé</p>
                  <p className="font-medium">{formatDateTime(selectedGeofence.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Alerte à l'entrée</p>
                  <p className="font-medium">{selectedGeofence.alertOnEntry ? 'Oui' : 'Non'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Alerte à la sortie</p>
                  <p className="font-medium">{selectedGeofence.alertOnExit ? 'Oui' : 'Non'}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                if (selectedGeofence) {
                  closeModal()
                  setTimeout(() => openEditModal(selectedGeofence), 100)
                }
              }}
            >
              Modifier la géoclôture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Supprimer la géoclôture</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette géoclôture? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteConfirmId) {
                  try {
                    await apiClient.delete(API_ROUTES.GEOFENCE_DETAIL(orgId, deleteConfirmId))
                    queryClient.invalidateQueries({ queryKey: ['geofences'] })
                  } catch {
                    // Silently handle
                  }
                }
                setDeleteConfirmId(null)
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
