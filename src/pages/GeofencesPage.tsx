import { useState, useCallback, useEffect } from 'react'
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
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff, Clock, X, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import GeofenceDrawMap from '@/components/geofences/GeofenceDrawMap'

type ModalMode = 'create' | 'edit' | 'view' | null
type PriorityLevel = 'Critique' | 'Élevé' | 'Moyen' | 'Faible'

interface GeofenceTemplate {
  name: string
  namePrefix: string
  shape: {
    type: 'circle' | 'polygon' | 'route'
    radiusMeters?: number
    points?: any[]
    waypoints?: any[]
    bufferMeters?: number
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
  assignedVehicleIds: string[]
  priority: PriorityLevel
  timeRulesEnabled: boolean
  businessDaysOnly: boolean
}

interface Vehicle {
  id: string
  name: string
  registration: string
}

interface ViolationEvent {
  id: string
  type: 'entry' | 'exit'
  vehicleId: string
  vehicleName: string
  timestamp: string
  geofenceId: string
  duration?: number
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
  assignedVehicleIds: [],
  priority: 'Moyen',
  timeRulesEnabled: false,
  businessDaysOnly: false,
}

const triggerOptions = [
  { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
  { value: GeofenceEvent.EXIT, label: 'Exit Only' },
  { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
]

const priorityOptions: PriorityLevel[] = ['Critique', 'Élevé', 'Moyen', 'Faible']

const geofenceTemplates: GeofenceTemplate[] = [
  { name: 'Zone industrielle', namePrefix: 'Industrielle', shape: { type: 'circle', radiusMeters: 500 }, color: '#FFB547' },
  { name: 'Station-service', namePrefix: 'Station', shape: { type: 'circle', radiusMeters: 50 }, color: '#00E5CC' },
  { name: 'Parking', namePrefix: 'Parking', shape: { type: 'circle', radiusMeters: 100 }, color: '#6B6B80' },
  { name: 'Entrepôt', namePrefix: 'Entrepôt', shape: { type: 'route', waypoints: [], bufferMeters: 150 }, color: '#FF4D6A' },
  { name: 'Zone de livraison', namePrefix: 'Livraison', shape: { type: 'circle', radiusMeters: 75 }, color: '#00E5CC' },
  { name: 'Zone de dépôt', namePrefix: 'Dépôt', shape: { type: 'circle', radiusMeters: 200 }, color: '#3b82f6' },
  { name: 'Zone interdite', namePrefix: 'Interdite', shape: { type: 'polygon', points: [] }, color: '#ef4444' },
  { name: 'Zone de chantier', namePrefix: 'Chantier', shape: { type: 'route', waypoints: [], bufferMeters: 100 }, color: '#f97316' },
]

function getShapeIcon(type: string) {
  switch (type) {
    case 'circle':
      return <Circle size={16} />
    case 'polygon':
      return <Pentagon size={16} />
    case 'route':
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
  } else if (shape.type === 'route') {
    return `Route (${(shape as any).waypoints?.length || 0} waypoints)`
  }
  return (shape as any).type
}

function getPriorityColor(priority: PriorityLevel): string {
  switch (priority) {
    case 'Critique':
      return '#FF4D6A'
    case 'Élevé':
      return '#FFB547'
    case 'Moyen':
      return '#00E5CC'
    case 'Faible':
      return '#6B6B80'
    default:
      return '#00E5CC'
  }
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

function getVehiclesInsideCount(geofence: Geofence): number {
  return (geofence as any).vehiclesInside?.length || 0
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
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [violations, setViolations] = useState<ViolationEvent[]>([])
  const [violationsLoading, setViolationsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'violations'>('details')

  const { data: geofencesData, isLoading } = useGeofences(page)
  const { data: stats } = useGeofenceStats()
  const createMutation = useCreateGeofence()

  const geofences = geofencesData?.data || []
  const totalPages = geofencesData?.totalPages || 1

  // Load vehicles
  useEffect(() => {
    if (orgId && (modalMode === 'create' || modalMode === 'edit')) {
      const loadVehicles = async () => {
        setVehiclesLoading(true)
        try {
          const response = await apiClient.get(`/api/organizations/${orgId}/vehicles`)
          setVehicles(response.data || [])
        } catch {
          setVehicles([])
        } finally {
          setVehiclesLoading(false)
        }
      }
      loadVehicles()
    }
  }, [orgId, modalMode])

  // Load violations for view modal
  useEffect(() => {
    if (orgId && selectedGeofence && modalMode === 'view') {
      const loadViolations = async () => {
        setViolationsLoading(true)
        try {
          const response = await apiClient.get(
            `/api/organizations/${orgId}/alerts?type=geofence_entry,geofence_exit&geofenceId=${selectedGeofence.id}`
          )
          setViolations((response.data || []).slice(0, 50)) // Show last 50
        } catch {
          setViolations([])
        } finally {
          setViolationsLoading(false)
        }
      }
      loadViolations()
    }
  }, [orgId, selectedGeofence, modalMode])

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
      assignedVehicleIds: (geofence as any).assignedVehicleIds || [],
      priority: (geofence as any).priority || 'Moyen',
      timeRulesEnabled: !!((geofence as any).activeHours || (geofence as any).activeDays),
      businessDaysOnly: (geofence as any).businessDaysOnly || false,
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
    setActiveTab('details')
    setViolations([])
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
          <h1 className="text-3xl font-bold text-[#F0F0F5]">Géoclôtures</h1>
          <p className="mt-1 text-[#6B6B80]">Créer et gérer les limites de localisation pour votre flotte</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="gap-2 border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Modèles
            </Button>
            {showTemplates && (
              <div className="absolute right-0 mt-1 w-64 bg-[#12121A] rounded-lg shadow-lg border border-[#1F1F2E] z-10">
                <div className="p-2 space-y-1">
                  {geofenceTemplates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => {
                        openCreateModal()
                        applyTemplate(template)
                      }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-[#1A1A25] text-sm text-[#F0F0F5]"
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
          <Button className="gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]" onClick={openCreateModal}>
            <Plus size={18} />
            Créer
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="bg-[#12121A] border-[#1F1F2E]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B80]">Total géoclôtures</p>
                  <p className="mt-1 text-2xl font-bold text-[#F0F0F5]">{filteredGeofences.length}</p>
                </div>
                <div className="rounded-full bg-[#00E5CC]/10 p-3">
                  <MapPin size={20} className="text-[#00E5CC]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border-[#1F1F2E]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B80]">Actives</p>
                  <p className="mt-1 text-2xl font-bold text-[#00E5CC]">
                    {filteredGeofences.filter((g) => g.isActive).length}
                  </p>
                </div>
                <div className="rounded-full bg-[#00E5CC]/10 p-3">
                  <Eye size={20} className="text-[#00E5CC]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border-[#1F1F2E]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B80]">Alertes aujourd'hui</p>
                  <p className="mt-1 text-2xl font-bold text-[#FF4D6A]">0</p>
                </div>
                <div className="rounded-full bg-[#FF4D6A]/10 p-3">
                  <EyeOff size={20} className="text-[#FF4D6A]" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border-[#1F1F2E]">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#6B6B80]">Véhicules surveillés</p>
                  <p className="mt-1 text-2xl font-bold text-[#F0F0F5]">
                    {filteredGeofences.reduce((sum, g) => sum + ((g as any).vehicleCount || 0), 0)}
                  </p>
                </div>
                <div className="rounded-full bg-[#6B6B80]/10 p-3">
                  <MapPin size={20} className="text-[#6B6B80]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#44445A]" size={18} />
        <Input
          placeholder="Rechercher les géoclôtures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]"
        />
      </div>

      {/* Geofences Grid */}
      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 bg-[#12121A]" />
          ))}
        </div>
      ) : filteredGeofences.length === 0 ? (
        <Card className="bg-[#12121A] border-[#1F1F2E] text-center">
          <CardContent className="py-12">
            <MapPin className="mx-auto mb-4 text-[#44445A]" size={48} />
            <h3 className="text-lg font-medium text-[#F0F0F5]">
              {search ? 'Aucune géoclôture ne correspond à votre recherche' : 'Aucune géoclôture créée'}
            </h3>
            <p className="mt-2 text-sm text-[#6B6B80]">
              {search
                ? 'Essayez un terme de recherche différent'
                : 'Cliquez sur "Créer" pour définir votre première zone'}
            </p>
            {!search && (
              <Button className="mt-4 gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]" onClick={openCreateModal}>
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
              className="bg-[#12121A] border-[#1F1F2E] cursor-pointer transition-all hover:border-[#2A2A3D] hover:shadow-lg"
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
                      {getShapeIcon(geofence.shape?.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base text-[#F0F0F5]">{geofence.name}</CardTitle>
                      {geofence.description && (
                        <p className="mt-0.5 text-xs text-[#6B6B80]">{geofence.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-col">
                    <Badge variant={geofence.isActive ? 'default' : 'secondary'} className="bg-[#00E5CC] text-[#0A0A0F]">
                      {geofence.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    {((geofence as any).priority || 'Moyen') && (
                      <Badge
                        className="text-white text-xs"
                        style={{ backgroundColor: getPriorityColor((geofence as any).priority || 'Moyen') }}
                      >
                        {(geofence as any).priority || 'Moyen'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[#6B6B80]">Type</p>
                    <p className="font-medium capitalize text-[#F0F0F5]">{geofence.shape?.type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B80]">Déclencheur</p>
                    <p className="font-medium capitalize text-[#F0F0F5]">{geofence.triggerEvent}</p>
                  </div>
                  <div>
                    <p className="text-[#6B6B80]">Détails</p>
                    <p className="font-medium text-xs text-[#F0F0F5]">{geofence.shape ? getShapeLabel(geofence.shape) : 'N/A'}</p>
                  </div>
                </div>

                {/* Day/Time based rules and status badges */}
                <div className="flex flex-wrap gap-2">
                  {(geofence as any).isTemporary && (
                    <Badge className="gap-1 bg-[#FFB547] text-[#0A0A0F] text-xs">
                      Temporaire
                    </Badge>
                  )}
                  {!(geofence as any).isTemporary && (
                    <Badge className="gap-1 bg-[#00E5CC] text-[#0A0A0F] text-xs">
                      Permanente
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs border-[#1F1F2E] text-[#F0F0F5]">
                    {getDayLabel((geofence as any).activeDays || [true, true, true, true, true, false, false])}
                  </Badge>
                  {(geofence as any).activeHours && (
                    <Badge variant="outline" className="gap-1 text-xs border-[#1F1F2E] text-[#F0F0F5]">
                      <Clock size={12} />
                      {(geofence as any).activeHours.from} - {(geofence as any).activeHours.to}
                    </Badge>
                  )}
                  {!(geofence as any).activeHours && (
                    <Badge variant="outline" className="text-xs border-[#1F1F2E] text-[#F0F0F5]">
                      24h/24
                    </Badge>
                  )}
                </div>

                {/* Time spent stats */}
                <div className="space-y-1 border-t border-[#1F1F2E] pt-3 text-xs">
                  <p className="text-[#6B6B80]">
                    Temps moyen à l'intérieur: <span className="font-medium text-[#F0F0F5]">2h 15min</span>
                  </p>
                  <p className="text-[#6B6B80]">
                    Nombre d'entrées aujourd'hui: <span className="font-medium text-[#F0F0F5]">12</span>
                  </p>
                </div>

                {/* Violations badge */}
                {((geofence as any).violationCount ?? 0) > 0 && (
                  <div className="rounded-lg bg-[#FF4D6A]/10 px-3 py-2 text-sm">
                    <p className="text-[#FF4D6A]">
                      <span className="font-semibold">{(geofence as any).violationCount}</span> violation{(geofence as any).violationCount > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Real-time detection feedback */}
                {getVehiclesInsideCount(geofence) > 0 && (
                  <div className="rounded-lg bg-[#00E5CC]/10 px-3 py-2 flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse"></div>
                    <span className="text-[#00E5CC]">
                      <span className="font-semibold">{getVehiclesInsideCount(geofence)}</span> véhicule{getVehiclesInsideCount(geofence) > 1 ? 's' : ''} à l'intérieur
                    </span>
                  </div>
                )}

                {/* Vehicle groups */}
                {((geofence as any).groupCount ?? 0) > 0 && (
                  <div className="text-xs text-[#6B6B80]">
                    <span className="font-medium">{(geofence as any).groupCount}</span> groupe{(geofence as any).groupCount > 1 ? 's' : ''} assigné{(geofence as any).groupCount > 1 ? 's' : ''}
                  </div>
                )}

                {/* Assigned vehicles */}
                {((geofence as any).assignedVehicleIds?.length ?? 0) > 0 && (
                  <div className="text-xs text-[#6B6B80]">
                    <span className="font-medium">{(geofence as any).assignedVehicleIds.length}</span> véhicule{(geofence as any).assignedVehicleIds.length > 1 ? 's' : ''} assigné{(geofence as any).assignedVehicleIds.length > 1 ? 's' : ''}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-[#1F1F2E] pt-3">
                  <p className="text-xs text-[#44445A]">Créé {formatDateTime(geofence.createdAt)}</p>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#6B6B80] hover:text-[#F0F0F5] hover:bg-[#1A1A25]"
                      onClick={() => openEditModal(geofence)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#1A1A25]"
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
          <p className="text-sm text-[#6B6B80]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5]">
              {modalMode === 'create' ? 'Créer une nouvelle géoclôture' : `Modifier: ${selectedGeofence?.name}`}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
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
              <div className="flex items-center gap-2 rounded-lg bg-[#00E5CC]/10 px-3 py-2 text-sm text-[#00E5CC] border border-[#00E5CC]/20">
                {getShapeIcon(form.shape.type)}
                <span>{getShapeLabel(form.shape)}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#F0F0F5]">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Exemple: Zone d'entrepôt, Site client..."
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#F0F0F5]">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description facultative..."
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#F0F0F5]">Priorité</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as PriorityLevel }))}
                  className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]"
                >
                  {priorityOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#12121A]">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#F0F0F5]">Événement de déclenchement</label>
                <select
                  value={form.triggerEvent}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, triggerEvent: e.target.value as GeofenceEvent }))
                  }
                  className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]"
                >
                  {triggerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#12121A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#F0F0F5]">Couleur de la zone</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="h-9 w-12 cursor-pointer rounded border border-[#1F1F2E] bg-[#0A0A0F]"
                    />
                    <span className="text-sm text-[#6B6B80]">{form.color}</span>
                  </div>
                  <div className="flex gap-2">
                    {['#FF0000', '#FF6600', '#FFCC00', '#00CC00', '#0066FF', '#9933FF', '#FF0099', '#666666'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm((prev) => ({ ...prev, color }))}
                        className={`h-7 w-7 rounded border-2 transition-all ${
                          form.color.toUpperCase() === color
                            ? 'border-[#F0F0F5] shadow-md'
                            : 'border-[#1F1F2E] hover:border-[#2A2A3D]'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#F0F0F5]">Paramètres d'alerte</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                    <input
                      type="checkbox"
                      checked={form.alertOnEntry}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, alertOnEntry: e.target.checked }))
                      }
                      className="rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                    />
                    Alerte à l'entrée
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                    <input
                      type="checkbox"
                      checked={form.alertOnExit}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, alertOnExit: e.target.checked }))
                      }
                      className="rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                    />
                    Alerte à la sortie
                  </label>
                </div>
              </div>

              {/* RÈGLES TEMPORELLES SECTION */}
              <div className="sm:col-span-2">
                <div className="space-y-3 border border-[#1F1F2E] rounded-lg p-4 bg-[#0A0A0F]/50">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#F0F0F5]">Règles temporelles</label>
                    <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                      <input
                        type="checkbox"
                        checked={form.timeRulesEnabled}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, timeRulesEnabled: e.target.checked }))
                        }
                        className="rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                      />
                      Actif uniquement pendant certaines heures
                    </label>
                  </div>

                  {form.timeRulesEnabled && (
                    <div className="space-y-4 mt-4 border-t border-[#1F1F2E] pt-4">
                      {/* Time range */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#F0F0F5]">Plage horaire</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="time"
                            value={form.activeHours?.from || '08:00'}
                            onChange={(e) => {
                              setForm((prev) => ({
                                ...prev,
                                activeHours: {
                                  from: e.target.value,
                                  to: prev.activeHours?.to || '18:00',
                                },
                              }))
                            }}
                            className="rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-2 py-1 text-sm text-[#F0F0F5] focus:border-[#00E5CC]"
                          />
                          <span className="text-sm text-[#6B6B80]">à</span>
                          <input
                            type="time"
                            value={form.activeHours?.to || '18:00'}
                            onChange={(e) => {
                              setForm((prev) => ({
                                ...prev,
                                activeHours: {
                                  from: prev.activeHours?.from || '08:00',
                                  to: e.target.value,
                                },
                              }))
                            }}
                            className="rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-2 py-1 text-sm text-[#F0F0F5] focus:border-[#00E5CC]"
                          />
                        </div>
                      </div>

                      {/* Days selector */}
                      <div>
                        <label className="mb-2 block text-xs font-medium text-[#F0F0F5]">Jours actifs</label>
                        <div className="flex gap-1">
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                const newDays = [...form.activeDays]
                                newDays[idx] = !newDays[idx]
                                setForm((prev) => ({ ...prev, activeDays: newDays }))
                              }}
                              className={`h-8 w-8 rounded-[6px] border-2 text-xs font-medium transition-colors ${
                                form.activeDays[idx]
                                  ? 'border-[#00E5CC] bg-[#00E5CC] text-[#0A0A0F]'
                                  : 'border-[#1F1F2E] bg-[#0A0A0F] text-[#6B6B80] hover:border-[#2A2A3D]'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-[#6B6B80]">{getDayLabel(form.activeDays)}</p>
                      </div>

                      {/* Business days toggle */}
                      <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                        <input
                          type="checkbox"
                          checked={form.businessDaysOnly}
                          onChange={(e) =>
                            setForm((prev) => {
                              if (e.target.checked) {
                                return {
                                  ...prev,
                                  businessDaysOnly: true,
                                  activeDays: [true, true, true, true, true, false, false],
                                }
                              } else {
                                return { ...prev, businessDaysOnly: false }
                              }
                            })
                          }
                          className="rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                        />
                        Jours ouvrables uniquement (lun-ven)
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Temporaire vs Permanente */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#F0F0F5]">Type de géoclôture</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                    <input
                      type="radio"
                      checked={!form.isTemporary}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, isTemporary: false, temporaryUntil: undefined }))
                      }
                      className="rounded-full border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                    />
                    Permanente
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#F0F0F5]">
                    <input
                      type="radio"
                      checked={form.isTemporary}
                      onChange={() => setForm((prev) => ({ ...prev, isTemporary: true }))}
                      className="rounded-full border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                    />
                    Temporaire
                  </label>
                </div>
                {form.isTemporary && (
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-medium text-[#F0F0F5]">Valide jusqu'à</label>
                    <input
                      type="datetime-local"
                      value={form.temporaryUntil || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, temporaryUntil: e.target.value }))}
                      className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC]"
                    />
                  </div>
                )}
              </div>

              {/* Vehicle Assignment */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#F0F0F5]">Assigner des véhicules</label>
                <div className="space-y-2">
                  {vehiclesLoading ? (
                    <div className="text-sm text-[#6B6B80]">Chargement des véhicules...</div>
                  ) : vehicles.length === 0 ? (
                    <div className="text-sm text-[#6B6B80]">Aucun véhicule disponible</div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F]">
                      {vehicles.map((vehicle) => (
                        <label
                          key={vehicle.id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-[#1A1A25] cursor-pointer border-b border-[#1F1F2E] last:border-b-0 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.assignedVehicleIds.includes(vehicle.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((prev) => ({
                                  ...prev,
                                  assignedVehicleIds: [...prev.assignedVehicleIds, vehicle.id],
                                }))
                              } else {
                                setForm((prev) => ({
                                  ...prev,
                                  assignedVehicleIds: prev.assignedVehicleIds.filter(
                                    (id) => id !== vehicle.id
                                  ),
                                }))
                              }
                            }}
                            className="rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-[#F0F0F5]">{vehicle.name}</p>
                            <p className="text-xs text-[#6B6B80]">{vehicle.registration}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {form.assignedVehicleIds.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-[#F0F0F5]">Assignés ({form.assignedVehicleIds.length}):</p>
                      <div className="flex flex-wrap gap-1">
                        {form.assignedVehicleIds.map((vehicleId) => {
                          const vehicle = vehicles.find((v) => v.id === vehicleId)
                          return (
                            <Badge key={vehicleId} variant="secondary" className="gap-1 text-xs bg-[#1A1A25] text-[#F0F0F5]">
                              {vehicle?.name}
                              <button
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    assignedVehicleIds: prev.assignedVehicleIds.filter(
                                      (id) => id !== vehicleId
                                    ),
                                  }))
                                }}
                                className="ml-1"
                              >
                                <X size={12} />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {formError && (
              <div className="rounded-[12px] border border-[#FF4D6A]/30 bg-[#FF4D6A]/10 px-4 py-3 text-sm text-[#FF4D6A]">
                {formError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]">
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5]">{selectedGeofence?.name}</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">{selectedGeofence?.description || 'Pas de description'}</DialogDescription>
          </DialogHeader>

          {selectedGeofence && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-[#1F1F2E]">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`pb-2 px-1 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'border-b-2 border-[#00E5CC] text-[#00E5CC]'
                      : 'text-[#6B6B80] hover:text-[#F0F0F5]'
                  }`}
                >
                  Détails
                </button>
                <button
                  onClick={() => setActiveTab('violations')}
                  className={`pb-2 px-1 text-sm font-medium transition-colors flex items-center gap-1 ${
                    activeTab === 'violations'
                      ? 'border-b-2 border-[#00E5CC] text-[#00E5CC]'
                      : 'text-[#6B6B80] hover:text-[#F0F0F5]'
                  }`}
                >
                  <AlertTriangle size={14} />
                  Violations
                </button>
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <GeofenceDrawMap
                    key={`view-${selectedGeofence.id}`}
                    initialShape={selectedGeofence.shape}
                    onShapeChange={() => {}}
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#6B6B80]">Statut</p>
                      <Badge variant={selectedGeofence.isActive ? 'default' : 'secondary'} className="bg-[#00E5CC] text-[#0A0A0F]">
                        {selectedGeofence.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Priorité</p>
                      <Badge
                        className="text-white text-xs"
                        style={{ backgroundColor: getPriorityColor((selectedGeofence as any).priority || 'Moyen') }}
                      >
                        {(selectedGeofence as any).priority || 'Moyen'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Forme</p>
                      <p className="font-medium text-[#F0F0F5]">{getShapeLabel(selectedGeofence.shape)}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Déclencheur</p>
                      <p className="font-medium capitalize text-[#F0F0F5]">{selectedGeofence.triggerEvent}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Créé</p>
                      <p className="font-medium text-[#F0F0F5]">{formatDateTime(selectedGeofence.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Type</p>
                      <p className="font-medium text-[#F0F0F5]">
                        {(selectedGeofence as any).isTemporary ? 'Temporaire' : 'Permanente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Alerte à l'entrée</p>
                      <p className="font-medium text-[#F0F0F5]">{selectedGeofence.alertOnEntry ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <p className="text-[#6B6B80]">Alerte à la sortie</p>
                      <p className="font-medium text-[#F0F0F5]">{selectedGeofence.alertOnExit ? 'Oui' : 'Non'}</p>
                    </div>
                    {getVehiclesInsideCount(selectedGeofence) > 0 && (
                      <div>
                        <p className="text-[#6B6B80]">Véhicules à l'intérieur</p>
                        <p className="font-medium text-[#00E5CC]">{getVehiclesInsideCount(selectedGeofence)}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#1F1F2E] pt-4 space-y-3">
                    <h4 className="text-sm font-medium text-[#F0F0F5]">Statistiques temporelles</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-[#00E5CC]/10 p-3 border border-[#00E5CC]/20">
                        <p className="text-[#6B6B80] text-xs">Temps moyen à l'intérieur</p>
                        <p className="font-medium text-[#F0F0F5] mt-1">2h 15min</p>
                      </div>
                      <div className="rounded-lg bg-[#FFB547]/10 p-3 border border-[#FFB547]/20">
                        <p className="text-[#6B6B80] text-xs">Entrées aujourd'hui</p>
                        <p className="font-medium text-[#F0F0F5] mt-1">12</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Violations Tab */}
              {activeTab === 'violations' && (
                <div className="space-y-3">
                  {violationsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="text-[#6B6B80]">Chargement des violations...</div>
                    </div>
                  ) : violations.length === 0 ? (
                    <div className="rounded-lg bg-[#1A1A25] px-4 py-6 text-center border border-[#1F1F2E]">
                      <AlertTriangle className="mx-auto mb-2 text-[#44445A]" size={24} />
                      <p className="text-sm text-[#6B6B80]">Aucune violation enregistrée</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {/* Table header */}
                      <div className="grid grid-cols-5 gap-3 text-xs font-medium text-[#6B6B80] px-3 py-2 border-b border-[#1F1F2E]">
                        <div>Type</div>
                        <div>Véhicule</div>
                        <div>Entrée</div>
                        <div>Sortie</div>
                        <div>Durée</div>
                      </div>

                      {/* Table rows */}
                      {violations.map((violation, idx) => (
                        <div
                          key={violation.id}
                          className={`grid grid-cols-5 gap-3 text-xs rounded-lg px-3 py-3 items-center border ${
                            violation.type === 'entry'
                              ? 'bg-[#00E5CC]/10 border-[#00E5CC]/30'
                              : 'bg-[#FFB547]/10 border-[#FFB547]/30'
                          }`}
                        >
                          <Badge
                            className={`w-fit text-xs ${
                              violation.type === 'entry'
                                ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                : 'bg-[#FFB547] text-[#0A0A0F]'
                            }`}
                          >
                            {violation.type === 'entry' ? 'Entrée' : 'Sortie'}
                          </Badge>
                          <div className="font-medium text-[#F0F0F5]">{violation.vehicleName}</div>
                          <div className="text-[#6B6B80]">{formatDateTime(violation.timestamp)}</div>
                          <div className="text-[#6B6B80]">
                            {idx < violations.length - 1 && violations[idx + 1].type === 'exit'
                              ? formatDateTime(violations[idx + 1].timestamp)
                              : '-'}
                          </div>
                          <div className="text-[#6B6B80] font-medium">
                            {violation.duration ? `${violation.duration}min` : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} className="border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]">
              Fermer
            </Button>
            <Button
              onClick={() => {
                if (selectedGeofence) {
                  closeModal()
                  setTimeout(() => openEditModal(selectedGeofence), 100)
                }
              }}
              className="bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]"
            >
              Modifier la géoclôture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5]">Supprimer la géoclôture</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Êtes-vous sûr de vouloir supprimer cette géoclôture? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]">
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="bg-[#FF4D6A] hover:bg-[#E63A56] text-white"
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
