import { useState, useRef } from 'react'
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Search, Wifi, Zap, Clock, Locate, RotateCw, AlertCircle, Link as LinkIcon, Download, Upload, Battery, History, Layers } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'

interface Device {
  id: string
  imei: string
  model: string
  provider: string
  status: 'online' | 'offline' | 'faulty'
  simNumber?: string
  operator?: string
  dataPlan?: string
  batteryLevel?: number
  signalStrength?: number
  firmwareVersion?: string
  lastSeen?: string
  vehicleId?: string
  vehicleName?: string
  inventoryStatus?: 'En stock' | 'Assigné' | 'En réparation' | 'Retiré'
}

interface Vehicle {
  id: string
  name: string
  licensePlate: string
}

interface DeviceHistory {
  id: string
  deviceId: string
  vehicleId: string
  vehicleName: string
  assignedDate: string
  removedDate?: string
  status: 'current' | 'previous'
}

export default function DevicesPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [searchTerm, setSearchTerm] = useState('')
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [importDialog, setImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Array<{imei: string; model: string; provider: string; simNumber: string; operator?: string; dataPlan?: string}>>([])
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [editDialog, setEditDialog] = useState(false)
  const [historyDialog, setHistoryDialog] = useState(false)
  const [selectedDeviceHistory, setSelectedDeviceHistory] = useState<DeviceHistory[]>([])
  const [bulkAssignDialog, setBulkAssignDialog] = useState(false)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set())
  const [bulkAssignVehicleId, setBulkAssignVehicleId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch devices
  const { data: devices = [], isLoading, error, refetch } = useQuery({
    queryKey: ['devices', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      try {
        const response = await apiClient.get(
          `/api/organizations/${organizationId}/devices`
        )
        const raw = response.data
        if (Array.isArray(raw)) return raw as Device[]
        if (raw && Array.isArray(raw.data)) return raw.data as Device[]
        if (raw && Array.isArray(raw.devices)) return raw.devices as Device[]
        return [] as Device[]
      } catch { return [] as Device[] }
    },
    enabled: !!organizationId,
    retry: false,
  })

  // Fetch vehicles for assignment
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      try {
        const response = await apiClient.get(
          `/api/organizations/${organizationId}/vehicles`
        )
        const raw = response.data
        if (Array.isArray(raw)) return raw as Vehicle[]
        if (raw && Array.isArray(raw.data)) return raw.data as Vehicle[]
        if (raw && Array.isArray(raw.vehicles)) return raw.vehicles as Vehicle[]
        return [] as Vehicle[]
      } catch { return [] as Vehicle[] }
    },
    enabled: !!organizationId,
  })

  const getStatusColor = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'online':
        return 'default'
      case 'offline':
        return 'destructive'
      case 'faulty':
        return 'secondary'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'online':
        return 'En ligne'
      case 'offline':
        return 'Hors ligne'
      case 'faulty':
        return 'Défaillant'
      default:
        return status
    }
  }

  const getInventoryStatusColor = (status?: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'En stock':
        return 'default'
      case 'Assigné':
        return 'secondary'
      case 'En réparation':
        return 'outline'
      case 'Retiré':
        return 'destructive'
      default:
        return 'default'
    }
  }

  const getBatteryColor = (level?: number): string => {
    if (!level) return 'bg-gray-100'
    if (level > 50) return 'bg-blue-600'
    if (level > 20) return 'bg-amber-500'
    return 'bg-red-500'
  }

  const getBatteryTextColor = (level?: number): string => {
    if (!level) return 'text-gray-500'
    if (level > 50) return 'text-blue-600'
    if (level > 20) return 'text-amber-500'
    return 'text-red-500'
  }

  const getSignalBars = (strength?: number): number => {
    if (!strength) return 0
    if (strength >= 75) return 4
    if (strength >= 50) return 3
    if (strength >= 25) return 2
    return 1
  }

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    return matchesSearch
  })

  const openAssignmentDialog = (device: Device) => {
    setSelectedDevice(device)
    setSelectedVehicleId(device.vehicleId || '')
    setAssignmentDialog(true)
  }

  const openEditDialog = (device: Device) => {
    setEditingDevice(device)
    setEditDialog(true)
  }

  const openHistoryDialog = (device: Device) => {
    setSelectedDevice(device)
    // Mock history data based on device ID
    const mockHistory: DeviceHistory[] = [
      {
        id: '1',
        deviceId: device.id,
        vehicleId: 'vh-001',
        vehicleName: 'Renault Master 1',
        assignedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        removedDate: undefined,
        status: 'current',
      },
      {
        id: '2',
        deviceId: device.id,
        vehicleId: 'vh-002',
        vehicleName: 'Peugeot Boxer 2',
        assignedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        removedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'previous',
      },
      {
        id: '3',
        deviceId: device.id,
        vehicleId: 'vh-003',
        vehicleName: 'Mercedes Sprinter 3',
        assignedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        removedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'previous',
      },
    ]
    setSelectedDeviceHistory(mockHistory)
    setHistoryDialog(true)
  }

  const handleAssignVehicle = async () => {
    if (!selectedDevice || !selectedVehicleId) return
    try {
      await apiClient.put(`/api/devices/${selectedDevice.id}`, {
        vehicleId: selectedVehicleId,
      })
      setAssignmentDialog(false)
      setSelectedDevice(null)
      refetch()
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
    }
  }

  const handleSaveDevice = async () => {
    if (!editingDevice) return
    try {
      await apiClient.put(`/api/devices/${editingDevice.id}`, {
        simNumber: editingDevice.simNumber,
        operator: editingDevice.operator,
        dataPlan: editingDevice.dataPlan,
        inventoryStatus: editingDevice.inventoryStatus,
      })
      setEditDialog(false)
      setEditingDevice(null)
      refetch()
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  const handleBulkAssign = async () => {
    if (selectedDeviceIds.size === 0 || !bulkAssignVehicleId) return
    try {
      for (const deviceId of selectedDeviceIds) {
        await apiClient.put(`/api/devices/${deviceId}`, {
          vehicleId: bulkAssignVehicleId,
        })
      }
      setBulkAssignDialog(false)
      setSelectedDeviceIds(new Set())
      setBulkAssignVehicleId('')
      refetch()
    } catch (error) {
      console.error('Erreur lors de l\'attribution en masse:', error)
    }
  }

  const sendDeviceCommand = async (deviceId: string, command: string) => {
    try {
      await apiClient.post(`/api/devices/${deviceId}/command`, {
        command,
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error)
    }
  }

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      parseCSV(file)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      const data = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length >= 4) {
          data.push({
            imei: values[0] || '',
            model: values[1] || '',
            provider: values[2] || '',
            simNumber: values[3] || '',
            operator: values[4] || '',
            dataPlan: values[5] || '',
          })
        }
      }
      setParsedData(data)
    }
    reader.readAsText(file)
  }

  const handleImportDevices = async () => {
    try {
      if (parsedData.length === 0) return

      for (const device of parsedData) {
        await apiClient.post(`/api/organizations/${organizationId}/devices`, {
          imei: device.imei,
          model: device.model,
          provider: device.provider,
          simNumber: device.simNumber,
          operator: device.operator,
          dataPlan: device.dataPlan,
        })
      }

      setImportDialog(false)
      setImportFile(null)
      setParsedData([])
      refetch()
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error)
    }
  }

  const handleExportDevices = () => {
    if (devices.length === 0) return

    const headers = ['IMEI', 'Modèle', 'Fournisseur', 'Numéro SIM', 'Opérateur', 'Plan données', 'Statut', 'Batterie', 'Signal', 'Inventaire']
    const rows = devices.map(d => [
      d.imei,
      d.model,
      d.provider,
      d.simNumber || '',
      d.operator || '',
      d.dataPlan || '',
      getStatusLabel(d.status),
      d.batteryLevel || 0,
      d.signalStrength || 0,
      d.inventoryStatus || 'Assigné',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `appareils-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const toggleDeviceSelection = (deviceId: string) => {
    const newSelection = new Set(selectedDeviceIds)
    if (newSelection.has(deviceId)) {
      newSelection.delete(deviceId)
    } else {
      newSelection.add(deviceId)
    }
    setSelectedDeviceIds(newSelection)
  }

  const selectAllDevices = (select: boolean) => {
    if (select) {
      setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)))
    } else {
      setSelectedDeviceIds(new Set())
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-sans">Appareils GPS</h1>
          <p className="mt-2 text-gray-500">Gérez vos trackers et appareils GPS</p>
        </div>
        <div className="flex gap-2">
          {selectedDeviceIds.size > 0 && (
            <Button
              onClick={() => setBulkAssignDialog(true)}
              className="flex items-center gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              <Layers size={16} />
              Attribution en masse ({selectedDeviceIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setImportDialog(true)}
            className="flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
          >
            <Upload size={16} />
            Importateur
          </Button>
          <Button
            variant="outline"
            onClick={handleExportDevices}
            className="flex items-center gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
          >
            <Download size={16} />
            Exportateur CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par IMEI ou modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500 bg-rgba(255, 77, 106, 0.1)">
          <CardContent className="pt-6">
            <p className="text-red-500">Erreur de chargement des appareils</p>
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Card className="text-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardContent className="pt-12">
            <p className="text-gray-500">
              {searchTerm
                ? 'Aucun appareil ne correspond à votre recherche'
                : 'Aucun appareil trouvé. Connectez vos trackers GPS pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0}
                      onChange={(e) => selectAllDevices(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-200 bg-white cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">IMEI</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Modèle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">SIM / Opérateur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Firmware</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Batterie</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Signal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Inventaire</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Véhicule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Dernière pos.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDeviceIds.has(device.id)}
                        onChange={() => toggleDeviceSelection(device.id)}
                        className="w-4 h-4 rounded border-gray-200 bg-white cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 font-mono">{device.imei}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{device.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="space-y-0.5">
                        {device.simNumber && <div className="font-mono">{device.simNumber}</div>}
                        {device.operator && <div className="text-xs">{device.operator}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.firmwareVersion || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(device.status)}>
                        {getStatusLabel(device.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Battery className={`h-4 w-4 ${getBatteryTextColor(device.batteryLevel)}`} />
                        <div className="h-6 w-12 bg-gray-100 rounded overflow-hidden">
                          <div
                            className={`h-full ${getBatteryColor(device.batteryLevel)}`}
                            style={{ width: `${device.batteryLevel || 0}%` }}
                          />
                        </div>
                        <span className={`text-xs font-mono ${getBatteryTextColor(device.batteryLevel)}`}>
                          {device.batteryLevel || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-3 w-1 rounded-sm ${
                              i < getSignalBars(device.signalStrength)
                                ? 'bg-blue-600'
                                : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={getInventoryStatusColor(device.inventoryStatus)}>
                        {device.inventoryStatus || 'Assigné'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {device.vehicleName ? (
                        <Badge variant="secondary" className="bg-[rgba(0,229,204,0.12)] text-blue-600">{device.vehicleName}</Badge>
                      ) : (
                        <span className="text-[#9CA3AF]">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatTimeAgo(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openEditDialog(device)}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-blue-600"
                          title="Modifier détails SIM"
                        >
                          <Wifi size={16} />
                        </button>
                        <button
                          onClick={() => openHistoryDialog(device)}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-amber-500"
                          title="Historique remplacements"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => openAssignmentDialog(device)}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-blue-600"
                          title="Assigner à un véhicule"
                        >
                          <LinkIcon size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'locate')}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-blue-600"
                          title="Localiser"
                        >
                          <Locate size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'restart')}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-amber-500"
                          title="Redémarrer"
                        >
                          <RotateCw size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'diagnostic')}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-amber-500"
                          title="Diagnostic"
                        >
                          <AlertCircle size={16} />
                        </button>
                        {device.provider === 'Echoes' && (
                          <>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_sync')}
                              className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-blue-600"
                              title="Synchroniser Echoes"
                            >
                              <Wifi size={16} />
                            </button>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_update')}
                              className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-blue-600"
                              title="Mettre à jour Echoes"
                            >
                              <Zap size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Edit Device Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">Détails de la carte SIM</DialogTitle>
            <DialogDescription className="text-gray-500">
              Modifier les informations SIM et l'inventaire de l'appareil
            </DialogDescription>
          </DialogHeader>

          {editingDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">IMEI</label>
                <Input
                  disabled
                  value={editingDevice.imei}
                  className="bg-white border-gray-200 text-gray-500 rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Numéro SIM</label>
                <Input
                  value={editingDevice.simNumber || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, simNumber: e.target.value })}
                  placeholder="898210..."
                  className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Opérateur</label>
                <Input
                  value={editingDevice.operator || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, operator: e.target.value })}
                  placeholder="Orange, SFR, Bouygues..."
                  className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Plan de données</label>
                <Input
                  value={editingDevice.dataPlan || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, dataPlan: e.target.value })}
                  placeholder="10 GB/mois, Illimité..."
                  className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Statut inventaire</label>
                <select
                  value={editingDevice.inventoryStatus || 'Assigné'}
                  onChange={(e) => setEditingDevice({ ...editingDevice, inventoryStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="En stock">En stock</option>
                  <option value="Assigné">Assigné</option>
                  <option value="En réparation">En réparation</option>
                  <option value="Retiré">Retiré</option>
                </select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialog(false)}
              className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveDevice}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">
              Historique des remplacements - {selectedDevice?.imei}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Historique d'assignation de cet appareil à différents véhicules
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {selectedDeviceHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun historique disponible</p>
            ) : (
              selectedDeviceHistory.map((history) => (
                <div key={history.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{history.vehicleName}</p>
                      <p className="text-sm text-gray-500">
                        Assigné: {new Date(history.assignedDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={history.status === 'current' ? 'default' : 'secondary'}>
                      {history.status === 'current' ? 'Actuel' : 'Précédent'}
                    </Badge>
                  </div>
                  {history.removedDate && (
                    <p className="text-sm text-gray-500">
                      Retiré: {new Date(history.removedDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setHistoryDialog(false)}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
        <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">Assigner un véhicule</DialogTitle>
            <DialogDescription className="text-gray-500">
              Sélectionnez un véhicule pour assigner le tracker IMEI:{' '}
              <strong className="text-blue-600">{selectedDevice?.imei}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Aucun véhicule disponible. Créez d'abord un véhicule.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.id}
                      checked={selectedVehicleId === vehicle.id}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.name}</p>
                      <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignmentDialog(false)}
              className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignVehicle}
              disabled={!selectedVehicleId}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignDialog} onOpenChange={setBulkAssignDialog}>
        <DialogContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">Attribution en masse</DialogTitle>
            <DialogDescription className="text-gray-500">
              Assigner {selectedDeviceIds.size} appareil(s) à un véhicule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Sélectionner un véhicule</label>
              <select
                value={bulkAssignVehicleId}
                onChange={(e) => setBulkAssignVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">-- Sélectionner un véhicule --</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.licensePlate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkAssignDialog(false)}
              className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!bulkAssignVehicleId}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              Assigner à {selectedDeviceIds.size} appareil(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">Importer des appareils</DialogTitle>
            <DialogDescription className="text-gray-500">
              Téléchargez un fichier CSV avec le format: IMEI, Modèle, Fournisseur, Numéro SIM, Opérateur, Plan données
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#E5E7EB] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-500 hover:text-gray-900"
              >
                <Upload className="mx-auto mb-2" size={32} />
                <p className="font-medium">Cliquez pour sélectionner un fichier CSV</p>
                <p className="text-sm text-gray-500 mt-1">ou glissez-déposez</p>
              </button>
            </div>

            {importFile && (
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900">
                  Fichier sélectionné: {importFile.name}
                </p>
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  Aperçu ({parsedData.length} appareils)
                </p>
                <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-500">IMEI</th>
                        <th className="px-4 py-2 text-left text-gray-500">Modèle</th>
                        <th className="px-4 py-2 text-left text-gray-500">Fournisseur</th>
                        <th className="px-4 py-2 text-left text-gray-500">SIM</th>
                        <th className="px-4 py-2 text-left text-gray-500">Opérateur</th>
                        <th className="px-4 py-2 text-left text-gray-500">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-100">
                          <td className="px-4 py-2 text-gray-900 font-mono">{row.imei}</td>
                          <td className="px-4 py-2 text-gray-500">{row.model}</td>
                          <td className="px-4 py-2 text-gray-500">{row.provider}</td>
                          <td className="px-4 py-2 text-gray-500 font-mono text-xs">{row.simNumber}</td>
                          <td className="px-4 py-2 text-gray-500">{row.operator}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{row.dataPlan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportDialog(false)
                setImportFile(null)
                setParsedData([])
              }}
              className="bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200"
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportDevices}
              disabled={parsedData.length === 0}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
