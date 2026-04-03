import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Folder, FolderPlus, ChevronDown, ChevronRight, Palette, Hash, Plus, Search, Edit2, Trash2, X } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface VehicleGroup {
  id: string
  name: string
  description?: string
  organizationId: string
  color?: string
  icon?: string
  parentGroupId?: string
  vehicleCount: number
  createdAt: Date
  updatedAt: Date
}

interface Vehicle {
  id: string
  name: string
  vin: string
  licensePlate: string
  vehicleGroupId?: string
}

interface VehicleGroupFormData {
  name: string
  description: string
  color: string
  parentGroupId?: string
}

const COLOR_OPTIONS = [
  { value: 'bg-red-100 text-red-800 border-red-300', label: 'Red' },
  { value: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Orange' },
  { value: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Amber' },
  { value: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Yellow' },
  { value: 'bg-lime-100 text-lime-800 border-lime-300', label: 'Lime' },
  { value: 'bg-green-100 text-green-800 border-green-300', label: 'Green' },
  { value: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Emerald' },
  { value: 'bg-teal-100 text-teal-800 border-teal-300', label: 'Teal' },
  { value: 'bg-cyan-100 text-cyan-800 border-cyan-300', label: 'Cyan' },
  { value: 'bg-sky-100 text-sky-800 border-sky-300', label: 'Sky' },
  { value: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Blue' },
  { value: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Indigo' },
  { value: 'bg-violet-100 text-violet-800 border-violet-300', label: 'Violet' },
  { value: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Purple' },
  { value: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', label: 'Fuchsia' },
  { value: 'bg-pink-100 text-pink-800 border-pink-300', label: 'Pink' },
  { value: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Rose' },
  { value: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Slate' },
]

// Dark theme color options for display
const DARK_COLOR_OPTIONS = [
  { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Red' },
  { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Orange' },
  { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Amber' },
  { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Yellow' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Lime' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Green' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Emerald' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Teal' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Cyan' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Sky' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Blue' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Indigo' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Violet' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Purple' },
  { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Fuchsia' },
  { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Pink' },
  { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Rose' },
  { value: 'bg-[rgba(107,107,128,0.12)] text-[#6B6B80]', label: 'Slate' },
]

export default function VehicleGroupsPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<VehicleGroup | null>(null)
  const [formData, setFormData] = useState<VehicleGroupFormData>({
    name: '',
    description: '',
    color: DARK_COLOR_OPTIONS[10].value,
  })
  const [selectedVehicleColor, setSelectedVehicleColor] = useState(DARK_COLOR_OPTIONS[10].value)

  // Fetch vehicle groups
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['vehicleGroups', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const response = await apiClient.get(
        `/api/organizations/${organizationId}/vehicle-groups`
      )
      return response.data as VehicleGroup[]
    },
    enabled: !!organizationId,
  })

  // Fetch vehicles for a specific group
  const { data: groupVehicles = {} } = useQuery({
    queryKey: ['groupVehicles', organizationId, expandedGroups],
    queryFn: async () => {
      if (!organizationId || expandedGroups.size === 0) return {}

      const vehicles: Record<string, Vehicle[]> = {}
      for (const groupId of expandedGroups) {
        try {
          const response = await apiClient.get(
            `/api/organizations/${organizationId}/vehicle-groups/${groupId}/vehicles`
          )
          vehicles[groupId] = response.data
        } catch {
          vehicles[groupId] = []
        }
      }
      return vehicles
    },
    enabled: !!organizationId && expandedGroups.size > 0,
  })

  // Create/Update group mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: VehicleGroupFormData) => {
      if (editingGroup) {
        return await apiClient.put(
          `/api/organizations/${organizationId}/vehicle-groups/${editingGroup.id}`,
          data
        )
      }
      return await apiClient.post(
        `/api/organizations/${organizationId}/vehicle-groups`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vehicleGroups', organizationId],
      })
      handleCloseModal()
    },
  })

  // Delete group mutation
  const deleteMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiClient.delete(
        `/api/organizations/${organizationId}/vehicle-groups/${groupId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['vehicleGroups', organizationId],
      })
    },
  })

  const handleOpenModal = (group?: VehicleGroup) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color || DARK_COLOR_OPTIONS[10].value,
        parentGroupId: group.parentGroupId,
      })
      setSelectedVehicleColor(
        group.color || DARK_COLOR_OPTIONS[10].value
      )
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
    setFormData({
      name: '',
      description: '',
      color: DARK_COLOR_OPTIONS[10].value,
    })
    setSelectedVehicleColor(DARK_COLOR_OPTIONS[10].value)
  }

  const handleFormChange = useCallback(
    (field: keyof VehicleGroupFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleColorSelect = (colorValue: string) => {
    setFormData((prev) => ({ ...prev, color: colorValue }))
    setSelectedVehicleColor(colorValue)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return
    }

    await upsertMutation.mutateAsync({
      ...formData,
      description: formData.description.trim(),
    })
  }

  const handleDelete = async (groupId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
      await deleteMutation.mutateAsync(groupId)
    }
  }

  const toggleExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description &&
        group.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Only show root groups (no parent) in main view
    return matchesSearch && !group.parentGroupId
  })

  // Get child groups for a parent
  const getChildGroups = (parentId: string): VehicleGroup[] => {
    return groups.filter((g) => g.parentGroupId === parentId)
  }

  return (
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Groupes de véhicules</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">
            Organisez les véhicules de votre flotte en groupes et gérez les attributions
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
        >
          <FolderPlus className="h-4 w-4" />
          Nouveau groupe
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B80]" />
        <Input
          placeholder="Rechercher des groupes..."
          className="pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Groups List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 bg-[#1A1A25]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full bg-[#1A1A25]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)">
          <CardContent className="pt-6">
            <p className="text-[#FF4D6A]">Failed to load vehicle groups</p>
          </CardContent>
        </Card>
      ) : filteredGroups.length === 0 ? (
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="mb-4 h-12 w-12 text-[#44445A]" />
            <p className="text-[#6B6B80]">
              {searchQuery
                ? 'Aucun groupe ne correspond à votre recherche'
                : 'Aucun groupe de véhicules. Créez-en un pour organiser votre flotte.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id)
            const childGroups = getChildGroups(group.id)
            const vehicles = groupVehicles[group.id] || []

            return (
              <div key={group.id} className="space-y-2">
                <Card className="overflow-hidden transition-shadow hover:shadow-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Expand/Collapse Button */}
                        {(childGroups.length > 0 || group.vehicleCount > 0) && (
                          <button
                            onClick={() => toggleExpanded(group.id)}
                            className="mt-1 p-0 text-[#6B6B80] hover:text-[#F0F0F5] flex-shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                        )}

                        {/* Group Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="h-5 w-5 text-[#44445A] flex-shrink-0" />
                            <CardTitle className="truncate font-syne text-[#F0F0F5]">
                              {group.name}
                            </CardTitle>
                          </div>
                          {group.description && (
                            <p className="text-sm text-[#6B6B80] line-clamp-2">
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Color Badge */}
                      {group.color && (
                        <div className="flex-shrink-0">
                          <div
                            className={`h-8 w-8 rounded-full border-2 border-[#1F1F2E] ${DARK_COLOR_OPTIONS[10].value}`}
                          />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-[#6B6B80] mb-4">
                      <div className="flex items-center gap-1">
                        <Hash className="h-4 w-4" />
                        <span>{group.vehicleCount} véhicule{group.vehicleCount !== 1 ? 's' : ''}</span>
                      </div>
                      {childGroups.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Folder className="h-4 w-4" />
                          <span>{childGroups.length} sous-groupe{childGroups.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <div className="text-xs text-[#44445A]">
                        Créé le {new Date(group.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(group)}
                        className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#1A1A25] border border-[#1F1F2E] text-[#FF4D6A] hover:bg-[#2A2A3D]"
                        onClick={() => handleDelete(group.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="ml-4 space-y-3 border-l-2 border-[#1F1F2E] pl-4">
                    {/* Child Groups */}
                    {childGroups.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[#6B6B80] uppercase">
                          Sous-groupes
                        </h4>
                        {childGroups.map((childGroup) => (
                          <Card key={childGroup.id} className="bg-[#0A0A0F] border border-[#1F1F2E] rounded-[12px]">
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Folder className="h-4 w-4 text-[#44445A] flex-shrink-0" />
                                  <div className="min-w-0">
                                    <CardTitle className="text-sm truncate font-syne text-[#F0F0F5]">
                                      {childGroup.name}
                                    </CardTitle>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="flex-shrink-0 bg-[rgba(0,229,204,0.12)] text-[#00E5CC]">
                                  {childGroup.vehicleCount}
                                </Badge>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Vehicles in Group */}
                    {group.vehicleCount > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-[#6B6B80] uppercase">
                          Véhicules
                        </h4>
                        {vehicles.length > 0 ? (
                          <div className="space-y-2">
                            {vehicles.map((vehicle) => (
                              <Card
                                key={vehicle.id}
                                className="bg-[#0A0A0F] border border-[#1F1F2E] rounded-[12px] overflow-hidden"
                              >
                                <CardContent className="pt-3">
                                  <div className="space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-[#F0F0F5] truncate">
                                          {vehicle.name}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-xs text-[#6B6B80] space-y-0.5">
                                      <div>
                                        <span className="font-semibold">VIN:</span>{' '}
                                        {vehicle.vin}
                                      </div>
                                      <div>
                                        <span className="font-semibold">Immatriculation:</span>{' '}
                                        {vehicle.licensePlate}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-[#44445A] italic">
                            Aucun véhicule assigné pour le moment
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">
              {editingGroup ? 'Modifier le groupe de véhicules' : 'Créer un nouveau groupe de véhicules'}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              {editingGroup
                ? 'Mettez à jour les informations et paramètres du groupe'
                : 'Créez un nouveau groupe de véhicules pour organiser votre flotte'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Nom du groupe
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ex: Flotte de livraison, Véhicules de service"
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  handleFormChange('description', e.target.value)
                }
                placeholder="Description optionnelle pour ce groupe"
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Couleur
              </label>
              <p className="text-xs text-[#6B6B80] mb-3">
                Choisissez une couleur pour distinguer visuellement ce groupe
              </p>
              <div className="grid grid-cols-6 gap-2">
                {DARK_COLOR_OPTIONS.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorSelect(color.value)}
                    className={`h-8 rounded border-2 transition-transform ${
                      selectedVehicleColor === color.value
                        ? 'ring-2 ring-[#00E5CC] scale-110 border-[#00E5CC]'
                        : 'border-[#1F1F2E]'
                    } ${color.value}`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {groups.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">
                  Groupe parent (Optionnel)
                </label>
                <select
                  value={formData.parentGroupId || ''}
                  onChange={(e) =>
                    handleFormChange('parentGroupId', e.target.value)
                  }
                  className="w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]"
                >
                  <option value="">Aucun (Groupe racine)</option>
                  {groups
                    .filter((g) => g.id !== editingGroup?.id)
                    .map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={upsertMutation.isPending}
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              {upsertMutation.isPending
                ? 'Enregistrement...'
                : editingGroup
                  ? 'Mettre à jour le groupe'
                  : 'Créer le groupe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
