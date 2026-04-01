import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVehicles } from '@/hooks/useVehicles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Plus, Grid2X2, List, MapPin, Clock, Download, Trash2 } from 'lucide-react'
import { VehicleStatus } from '@/types/vehicle'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import type { Vehicle } from '@/types/vehicle'

export default function VehiclesPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: vehiclesData, isLoading } = useVehicles({
    page,
    limit: 20,
    status: selectedStatus as any,
    search: searchTerm,
    groupId: selectedGroup || undefined,
  })

  const vehicles = vehiclesData?.data || []
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Véhicules</h1>
          <p className="mt-2 text-gray-600">Gérez et surveillez votre flotte</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size === 0 && (
            <Button variant="outline" className="gap-2" onClick={exportToCSV}>
              <Download size={18} />
              Exporter
            </Button>
          )}
          <Button className="gap-2">
            <Plus size={18} />
            Ajouter un véhicule
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
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
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value)
                setPage(1)
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="">Tous les groupes</option>
              <option value="group1">Groupe 1</option>
              <option value="group2">Groupe 2</option>
              <option value="group3">Groupe 3</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="offline">Hors ligne</option>
              <option value="idle">En veille</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="flex gap-2 border-l border-gray-200 pl-4">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={18} />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid2X2 size={18} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12">
            <p className="text-gray-500">Aucun véhicule trouvé</p>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === vehicles.length && vehicles.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Immatriculation
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">VIN</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Vitesse</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Dernière MAJ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
                    <td
                      className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {vehicle.name}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {vehicle.plate}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '-'}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 capitalize cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {vehicle.type}
                    </td>
                    <td
                      className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {formatSpeed(vehicle.currentSpeed)}
                    </td>
                    <td
                      className="px-6 py-4 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-gray-600 cursor-pointer"
                      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    >
                      {formatTimeAgo(vehicle.lastCommunication)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/map?vehicleId=${vehicle.id}`)
                          }}
                          title="Localiser sur la carte"
                        >
                          <MapPin size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/vehicles/${vehicle.id}?replay=true`)
                          }}
                          title="Afficher l'historique"
                        >
                          <Clock size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/vehicles/${vehicle.id}`)}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500">{vehicle.plate}</p>
                    {vehicle.vin && (
                      <p className="text-xs text-gray-400 mt-1">
                        VIN: {vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{vehicle.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vitesse:</span>
                      <span className="font-medium">{formatSpeed(vehicle.currentSpeed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Position:</span>
                      <span className="font-medium text-xs">
                        {vehicle.currentLat?.toFixed(4)}, {vehicle.currentLng?.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(vehicle.lastCommunication)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/map?vehicleId=${vehicle.id}`)
                        }}
                        title="Localiser sur la carte"
                      >
                        <MapPin size={16} className="mr-2" />
                        <span className="text-xs">Carte</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/vehicles/${vehicle.id}?replay=true`)
                        }}
                        title="Afficher l'historique"
                      >
                        <Clock size={16} className="mr-2" />
                        <span className="text-xs">Historique</span>
                      </Button>
                    </div>
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
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
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
            className="gap-2"
          >
            <Download size={16} />
            Exporter
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="gap-2 text-red-600"
          >
            <Trash2 size={16} />
            Supprimer
          </Button>
        </div>
      )}
    </div>
  )
}
