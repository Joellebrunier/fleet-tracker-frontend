import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from '@/hooks/useVehicles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, Plus, Download, Trash2, Edit2, FileDown } from 'lucide-react'
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
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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
  })

  // Mutation hooks
  const createVehicle = useCreateVehicle()
  const updateVehicleMutation = useUpdateVehicle(editingVehicle?.id || '')
  const deleteVehicleMutation = useDeleteVehicle(deleteConfirmId || '')

  const vehicles: Vehicle[] = vehiclesData?.data || []
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogue Véhicules</h1>
          <p className="text-sm text-gray-600 mt-1">Gestion de la flotte Matériel Tech+</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'vehicles'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            VÉHICULES ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
              activeTab === 'groups'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            GROUPES (0)
          </button>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-2 text-gray-900" onClick={exportToCSV}>
          <FileDown size={16} />
          VÉHICULES CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-gray-900">
          <FileDown size={16} />
          CONDUCTEURS CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-gray-900">
          RÔLES
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-gray-900">
          AUDIT
        </Button>
        <Button variant="outline" size="sm" className="gap-2 text-gray-900">
          ATTRIBUTION
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par nom ou immatriculation..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10 text-gray-900"
            />
          </div>
        </div>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
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
          value={selectedSource}
          onChange={(e) => {
            setSelectedSource(e.target.value)
            setPage(1)
          }}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
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
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
        >
          <option value="">Tous statuts</option>
          <option value="active">ACTIF</option>
          <option value="offline">HORS LIGNE</option>
        </select>
        <div className="text-sm font-medium text-gray-900">
          {vehicles.length} résultat{vehicles.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Tracker Button */}
      <div className="flex justify-end">
        <Button className="gap-2 bg-gray-900 hover:bg-gray-800 text-white" onClick={openCreateModal}>
          <Plus size={18} />
          AJOUTER UN TRACEUR
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'vehicles' && (
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : vehicles.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-12">
                <p className="text-gray-900">Aucun véhicule trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-900 text-white">
                      <th className="px-4 py-3 text-left text-sm font-semibold w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === vehicles.length && vehicles.length > 0}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          className="rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">NOM</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">VIN</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">PLAQUE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">CATÉGORIE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">ÉTAT</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">DISPONIBILITÉ</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">SOURCE</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vehicles.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(vehicle.id)}
                            onChange={() => toggleSelectVehicle(vehicle.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {vehicle.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {vehicle.plate || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 capitalize">
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
                            <span className="text-green-600 font-semibold">ACTIF</span>
                          ) : (
                            <span className="text-gray-500 font-semibold">HORS LIGNE</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {vehicle.status === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Disponible</span>
                          ) : vehicle.status === 'maintenance' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">En maintenance</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Indisponible</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="text-blue-600 font-semibold">
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
                              className="text-gray-900 hover:text-gray-700"
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
                              className="text-gray-900 hover:text-red-600"
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
              <p className="text-sm text-gray-900">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="text-gray-900"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="text-gray-900"
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
        <Card className="text-center">
          <CardContent className="pt-12">
            <p className="text-gray-900">Aucun groupe configuré</p>
          </CardContent>
        </Card>
      )}

      {/* Floating Action Bar for Selection */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-900">
            {selectedIds.size} véhicules sélectionnés
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="gap-2 text-gray-900"
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
            className="gap-2 text-white"
          >
            <Trash2 size={16} />
            Supprimer
          </Button>
        </div>
      )}

      {/* Create/Edit Vehicle Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule'}</DialogTitle>
            <DialogDescription className="text-gray-600">{editingVehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à votre flotte'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Nom *</label>
                <Input value={formData.name} onChange={(e) => setFormData(p => ({...p, name: e.target.value}))} placeholder="Camion A1" className="text-gray-900" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Immatriculation *</label>
                <Input value={formData.plate} onChange={(e) => setFormData(p => ({...p, plate: e.target.value}))} placeholder="AB-123-CD" className="text-gray-900" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">VIN</label>
              <Input value={formData.vin} onChange={(e) => setFormData(p => ({...p, vin: e.target.value}))} placeholder="WDB1234567F123456" className="text-gray-900" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Type</label>
                <select value={formData.type} onChange={(e) => setFormData(p => ({...p, type: e.target.value}))} className="w-full rounded-md border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm">
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
                <label className="text-sm font-medium text-gray-900">Année</label>
                <Input type="number" value={formData.year} onChange={(e) => setFormData(p => ({...p, year: parseInt(e.target.value) || 0}))} placeholder="2024" className="text-gray-900" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Marque</label>
                <Input value={formData.brand} onChange={(e) => setFormData(p => ({...p, brand: e.target.value}))} placeholder="Renault" className="text-gray-900" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Modèle</label>
                <Input value={formData.model} onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} placeholder="Master" className="text-gray-900" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))} placeholder="Informations supplémentaires..." className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="text-gray-900">Annuler</Button>
            <Button onClick={handleSubmitVehicle} disabled={createVehicle.isPending || updateVehicleMutation.isPending}>
              {(createVehicle.isPending || updateVehicleMutation.isPending) ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirmer la suppression</DialogTitle>
            <DialogDescription className="text-gray-600">Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="text-gray-900">Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteVehicle} disabled={deleteVehicleMutation.isPending}>
              {deleteVehicleMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
