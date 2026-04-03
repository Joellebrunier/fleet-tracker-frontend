import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useVehicleGroups } from '@/hooks/useVehicles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Download, Trash2, Edit2, FileDown, LayoutGrid, List } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import type { Vehicle } from '@/types/vehicle'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'

export default function VehiclesPage() {
  const navigate = useNavigate()
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [activeTab, setActiveTab] = useState<'vehicles' | 'groups'>('vehicles')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSource, setSelectedSource] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Modal and form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    plate: '',
    vin: '',
    type: 'voiture',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    notes: '',
    driverId: '',
  })

  const { data: vehiclesData, isLoading } = useVehicles({
    page,
    limit: 20,
    status: selectedStatus as any,
    search: searchTerm,
    type: selectedType || undefined,
    source: selectedSource || undefined,
  } as any)

  const { data: groupsData, isLoading: groupsLoading } = useVehicleGroups()

  // Mutation hooks
  const createVehicle = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle(editingVehicle?.id || '')
  const deleteVehicleMutation = useDeleteVehicle(deleteConfirmId || '')

  const allVehicles: Vehicle[] = vehiclesData?.data || []
  const groups = groupsData || []

  // Client-side filtering for type and source (backend may not support these params)
  const vehicles = allVehicles.filter((v) => {
    if (selectedType && v.type !== selectedType) return false
    if (selectedSource) {
      const source = ((v.metadata as any)?.source || '').toLowerCase()
      if (source !== selectedSource.toLowerCase()) return false
    }
    if (selectedGroup && (v.metadata as any)?.groupId !== selectedGroup) return false
    return true
  })
  const totalPages = vehiclesData?.totalPages || 1

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case VehicleStatus.ACTIVE:
        return 'default'
      case VehicleStatus.OFFLINE:
        return 'destructive'
      case VehicleStatus.IDLE:
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const toggleSelectVehicle = (vehicleId: string) => {
    const newSelection = new Set(selectedIds)
    if (newSelection.has(vehicleId)) {
      newSelection.delete(vehicleId)
    } else {
      newSelection.add(vehicleId)
    }
    setSelectedIds(newSelection)
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(vehicles.map(v => v.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const exportToCSV = () => {
    const headers = ['Nom', 'Plaque', 'Type', 'VIN', 'Statut', 'Vitesse', 'Dernière comm']
    const rows = vehicles.map(v => [
      v.name,
      v.plate,
      v.type || '-',
      v.vin || '-',
      v.status,
      formatSpeed(v.currentSpeed),
      formatTimeAgo(v.lastCommunication)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportConducteursCSV = async () => {
    try {
      const response = await apiClient.get(`/api/organizations/${organizationId}/conducteurs`, {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `conducteurs_${new Date().toISOString().split('T')[0]}.csv`)
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur lors de l\'export des conducteurs:', error)
    }
  }

  const openCreateModal = () => {
    setEditingVehicle(null)
    setFormData({ name: '', plate: '', vin: '', type: 'voiture', brand: '', model: '', year: new Date().getFullYear(), notes: '', driverId: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      name: vehicle.name || '',
      plate: vehicle.plate || '',
      vin: vehicle.vin || '',
      type: vehicle.type || 'car',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      notes: (vehicle.metadata as any)?.notes || '',
      driverId: (vehicle as any).driverId || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmitVehicle = async () => {
    if (!formData.name || !formData.plate) return
    const payload: any = {
      name: formData.name,
      registrationNumber: formData.plate,
      vin: formData.vin,
      type: formData.type,
      manufacturer: formData.brand,
      model: formData.model,
      year: formData.year || undefined,
      driverId: formData.driverId || undefined,
      features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
    }
    if (editingVehicle) {
      await updateVehicleMutation.mutateAsync(payload)
    } else {
      await createVehicle.mutateAsync(payload)
    }
    setIsModalOpen(false)
    setEditingVehicle(null)
  }

  const handleDeleteVehicle = async () => {
    if (!deleteConfirmId) return
    await deleteVehicleMutation.mutateAsync()
    setDeleteConfirmId(null)
    setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteConfirmId); return n })
  }

  return (
    <div className="space-y-6 bg-[#0A0A0F] min-h-screen p-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Catalogue Véhicules</h1>
          <p className="text-sm text-[#6B6B80] mt-1">Gestion de la flotte Matériel Tech+</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1F1F2E]">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'vehicles'
                ? 'border-[#00E5CC] text-[#00E5CC]'
                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
            }`}
          >
            VÉHICULES ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'groups'
                ? 'border-[#00E5CC] text-[#00E5CC]'
                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
            }`}
          >
            GROUPES ({groups.length})
          </button>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]" onClick={exportToCSV}>
          <FileDown size={16} />
          VÉHICULES CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]" onClick={exportConducteursCSV}>
          <FileDown size={16} />
          CONDUCTEURS CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          RÔLES
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          AUDIT
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">
          ATTRIBUTION
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#44445A]" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par nom ou immatriculation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10 bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Tous types</option>
          <option value="voiture">Voiture</option>
          <option value="camion">Camion</option>
          <option value="utilitaire">Véhicule utilitaire</option>
          <option value="engin">Engin de chantier</option>
          <option value="moto">Moto</option>
          <option value="bateau">Bateau</option>
          <option value="divers">Divers</option>
        </select>
        <select
          value={selectedGroup}
          onChange={(e) => {
            setSelectedGroup(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Filtrer par groupe</option>
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
        <select
          value={selectedSource}
          onChange={(e) => {
            setSelectedSource(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Toutes sources</option>
          <option value="echoes">ECHOES</option>
          <option value="ubiwan">UBIWAN</option>
          <option value="keeptrace">KEEPTRACE</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value)
            setPage(1)
          }}
          className="rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]"
        >
          <option value="">Tous statuts</option>
          <option value="active">ACTIF</option>
          <option value="offline">HORS LIGNE</option>
        </select>
        <div className="text-sm font-medium text-[#F0F0F5]">
          {vehicles.length} résultat{vehicles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Tracker Button and View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            className="gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} />
          </Button>
        </div>
        <Button className="gap-2 bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold" onClick={openCreateModal}>
          <Plus size={18} />
          AJOUTER UN TRACEUR
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'vehicles' && (
        <>
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className={`${viewMode === 'grid' ? 'h-48' : 'h-12'} bg-[#12121A]`} />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <Card className="bg-[#12121A] border-[#1F1F2E] text-center">
              <CardContent className="pt-12">
                <p className="text-[#F0F0F5]">Aucun véhicule trouvé</p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle
                          className="text-[#F0F0F5] cursor-pointer hover:text-[#00E5CC] transition-colors font-syne"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        >
                          {vehicle.name}
                        </CardTitle>
                        <p className="text-sm text-[#6B6B80] mt-1">{vehicle.plate || 'N/A'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(vehicle.id)}
                        onChange={() => toggleSelectVehicle(vehicle.id)}
                        className="rounded"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-[#6B6B80]">Type</p>
                        <p className="font-medium text-[#F0F0F5] font-mono">
                          {vehicle.type === 'voiture' && 'Voiture'}
                          {vehicle.type === 'camion' && 'Camion'}
                          {vehicle.type === 'utilitaire' && 'Utilitaire'}
                          {vehicle.type === 'engin' && 'Engin'}
                          {vehicle.type === 'moto' && 'Moto'}
                          {vehicle.type === 'bateau' && 'Bateau'}
                          {vehicle.type === 'divers' && 'Divers'}
                          {!['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type || '') && (vehicle.type || 'N/A')}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#6B6B80]">VIN</p>
                        <p className="font-medium text-[#F0F0F5] truncate font-mono">
                          {vehicle.vin ? vehicle.vin.substring(0, 8) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant={vehicle.status === 'active' ? 'default' : 'destructive'} className={vehicle.status === 'active' ? 'bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]' : 'bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]'}>
                        {vehicle.status === 'active' ? 'ACTIF' : 'HORS LIGNE'}
                      </Badge>
                      <span className="text-xs text-[#44445A]">{(vehicle.metadata as any)?.source || 'ECHOES'}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                        onClick={() => openEditModal(vehicle)}
                      >
                        <Edit2 size={14} />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]"
                        onClick={() => setDeleteConfirmId(vehicle.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-[#12121A] border-[#1F1F2E]">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1F1F2E] bg-[#0A0A0F]">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#F0F0F5] w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === vehicles.length && vehicles.length > 0}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">NOM</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">VIN</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">PLAQUE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">CATÉGORIE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">ÉTAT</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">DISPONIBILITÉ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">SOURCE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F2E]">
                    {vehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-[#1A1A25] transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-[#F0F0F5] w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(vehicle.id)}
                            onChange={() => toggleSelectVehicle(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-[#F0F0F5]">
                          <button
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            className="hover:text-[#00E5CC] hover:underline transition-colors"
                          >
                            {vehicle.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] font-mono">
                          {vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] font-mono">
                          {vehicle.plate || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-[#F0F0F5] capitalize">
                          {vehicle.type ? (
                            <>
                              {vehicle.type === 'voiture' && 'Voiture'}
                              {vehicle.type === 'camion' && 'Camion'}
                              {vehicle.type === 'utilitaire' && 'Véhicule utilitaire'}
                              {vehicle.type === 'engin' && 'Engin de chantier'}
                              {vehicle.type === 'moto' && 'Moto'}
                              {vehicle.type === 'bateau' && 'Bateau'}
                              {vehicle.type === 'divers' && 'Divers'}
                              {!['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type) && vehicle.type}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vehicle.status === 'active' ? (
                            <span className="text-[#00E5CC] font-semibold">ACTIF</span>
                          ) : (
                            <span className="text-[#6B6B80] font-semibold">HORS LIGNE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vehicle.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]">Disponible</span>
                          ) : vehicle.status === 'maintenance' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFB547] bg-opacity-20 text-[#FFB547]">En maintenance</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]">Indisponible</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="text-[#00E5CC] font-semibold">
                            {(vehicle.metadata as any)?.source || 'ECHOES'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(vehicle)
                              }}
                              title="Modifier"
                              className="text-[#F0F0F5] hover:text-[#00E5CC]"
                            >
                              <Edit2 size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmId(vehicle.id)
                              }}
                              title="Supprimer"
                              className="text-[#F0F0F5] hover:text-[#FF4D6A]"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#F0F0F5]">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <>
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 bg-[#12121A]" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Card className="bg-[#12121A] border-[#1F1F2E] text-center">
              <CardContent className="pt-12">
                <p className="text-[#F0F0F5]">Aucun groupe configuré</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((group) => (
                <Card key={group.id} className="bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all">
                  <CardHeader>
                    <CardTitle className="text-[#F0F0F5] font-syne">{group.name}</CardTitle>
                    <p className="text-sm text-[#6B6B80] mt-2">{group.description || 'Pas de description'}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#1A1A25] text-[#F0F0F5] border-[#1F1F2E]">
                        {group.vehicleCount || 0} véhicules
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]"
                      >
                        <Edit2 size={14} />
                        Éditer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Action Bar for Selection */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12121A] border border-[#1F1F2E] rounded-[12px] shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-[#F0F0F5]">
            {selectedIds.size} véhicules sélectionnés
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]"
          >
            <Download size={16} />
            Exporter
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Supprimer ' + selectedIds.size + ' véhicules ?')) {
                selectedIds.forEach(id => apiClient.delete(`/api/organizations/${organizationId}/vehicles/${id}`))
                setSelectedIds(new Set())
              }
            }}
            className="gap-2 bg-[#FF4D6A] hover:bg-[#E63D5C] text-white"
          >
            <Trash2 size={16} />
            Supprimer
          </Button>
        </div>
      )}

      {/* Create/Edit Vehicle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">{editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">{editingVehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à votre flotte'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Nom *</label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="Camion A1" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Immatriculation *</label>
                <Input value={formData.plate} onChange={(e) => setFormData(p => ({...p, plate: e.target.value}))} placeholder="AB-123-CD" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">VIN</label>
              <Input value={formData.vin} onChange={(e) => setFormData(p => ({...p, vin: e.target.value}))} placeholder="WDB1234567F123456" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Type</label>
                <select value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value}))} className="w-full rounded-[12px] border border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5] px-3 py-2 text-sm">
                  <option value="voiture">Voiture</option>
                  <option value="camion">Camion</option>
                  <option value="utilitaire">Véhicule utilitaire</option>
                  <option value="engin">Engin de chantier</option>
                  <option value="moto">Moto</option>
                  <option value="bateau">Bateau</option>
                  <option value="divers">Divers</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Année</label>
                <Input type="number" value={formData.year} onChange={(e) => setFormData(p => ({...p, year: parseInt(e.target.value) || 0}))} placeholder="2024" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Marque</label>
                <Input value={formData.brand} onChange={(e) => setFormData(p => ({...p, brand: e.target.value}))} placeholder="Renault" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Modèle</label>
                <Input value={formData.model} onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} placeholder="Master" className="bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Informations supplémentaires..." className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[12px] text-sm text-[#F0F0F5] bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] placeholder:text-[#44445A]" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">Annuler</Button>
            <Button onClick={handleSubmitVehicle} disabled={createVehicle.isPending || updateVehicleMutation.isPending} className="bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold">
              {(createVehicle.isPending || updateVehicleMutation.isPending) ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]">Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={deleteVehicleMutation.isPending} className="bg-[#FF4D6A] hover:bg-[#E63D5C]">
              {deleteVehicleMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
