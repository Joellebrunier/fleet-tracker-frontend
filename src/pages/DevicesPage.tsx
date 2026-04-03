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
    if (!level) return 'bg-[#1A1A25]'
    if (level > 50) return 'bg-[#00E5CC]'
    if (level > 20) return 'bg-[#FFB547]'
    return 'bg-[#FF4D6A]'
  }

  const getBatteryTextColor = (level?: number): string => {
    if (!level) return 'text-[#6B6B80]'
    if (level > 50) return 'text-[#00E5CC]'
    if (level > 20) return 'text-[#FFB547]'
    return 'text-[#FF4D6A]'
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
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Appareils GPS</h1>
          <p className="mt-2 text-[#6B6B80]">Gérez vos trackers et appareils GPS</p>
        </div>
        <div className="flex gap-2">
          {selectedDeviceIds.size > 0 && (
            <Button
              onClick={() => setBulkAssignDialog(true)}
              className="flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              <Layers size={16} />
              Attribution en masse ({selectedDeviceIds.size})
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setImportDialog(true)}
            className="flex items-center gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
          >
            <Upload size={16} />
            Importateur
          </Button>
          <Button
            variant="outline"
            onClick={handleExportDevices}
            className="flex items-center gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
          >
            <Download size={16} />
            Exportateur CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-[#6B6B80]" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par IMEI ou modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 bg-[#1A1A25]" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)">
          <CardContent className="pt-6">
            <p className="text-[#FF4D6A]">Erreur de chargement des appareils</p>
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Card className="text-center bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-12">
            <p className="text-[#6B6B80]">
              {searchTerm
                ? 'Aucun appareil ne correspond à votre recherche'
                : 'Aucun appareil trouvé. Connectez vos trackers GPS pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F1F2E]">
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0}
                      onChange={(e) => selectAllDevices(e.target.checked)}
                      className="w-4 h-4 rounded border-[#1F1F2E] bg-[#0A0A0F] cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">IMEI</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Modèle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">SIM / Opérateur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Firmware</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Batterie</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Signal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Inventaire</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Véhicule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Dernière pos.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F2E]">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-[#1A1A25] transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedDeviceIds.has(device.id)}
                        onChange={() => toggleDeviceSelection(device.id)}
                        className="w-4 h-4 rounded border-[#1F1F2E] bg-[#0A0A0F] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#F0F0F5] font-mono">{device.imei}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">{device.model}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">
                      <div className="space-y-0.5">
                        {device.simNumber && <div className="font-mono">{device.simNumber}</div>}
                        {device.operator && <div className="text-xs">{device.operator}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">
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
                        <div className="h-6 w-12 bg-[#1A1A25] rounded overflow-hidden">
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
                                ? 'bg-[#00E5CC]'
                                : 'bg-[#1A1A25]'
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
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">
                      {device.vehicleName ? (
                        <Badge variant="secondary" className="bg-[rgba(0,229,204,0.12)] text-[#00E5CC]">{device.vehicleName}</Badge>
                      ) : (
                        <span className="text-[#44445A]">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">
                      {formatTimeAgo(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openEditDialog(device)}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]"
                          title="Modifier détails SIM"
                        >
                          <Wifi size={16} />
                        </button>
                        <button
                          onClick={() => openHistoryDialog(device)}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]"
                          title="Historique remplacements"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => openAssignmentDialog(device)}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]"
                          title="Assigner à un véhicule"
                        >
                          <LinkIcon size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'locate')}
                          className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]"
                          title="Localiser"
                        >
                          <Locate size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'restart')}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]"
                          title="Redémarrer"
                        >
                          <RotateCw size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'diagnostic')}
                          className="p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]"
                          title="Diagnostic"
                        >
                          <AlertCircle size={16} />
                        </button>
                        {device.provider === 'Echoes' && (
                          <>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_sync')}
                              className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]"
                              title="Synchroniser Echoes"
                            >
                              <Wifi size={16} />
                            </button>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_update')}
                              className="p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]"
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
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Détails de la carte SIM</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Modifier les informations SIM et l'inventaire de l'appareil
            </DialogDescription>
          </DialogHeader>

          {editingDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">IMEI</label>
                <Input
                  disabled
                  value={editingDevice.imei}
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#6B6B80] rounded-[8px]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Numéro SIM</label>
                <Input
                  value={editingDevice.simNumber || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, simNumber: e.target.value })}
                  placeholder="898210..."
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Opérateur</label>
                <Input
                  value={editingDevice.operator || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, operator: e.target.value })}
                  placeholder="Orange, SFR, Bouygues..."
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Plan de données</label>
                <Input
                  value={editingDevice.dataPlan || ''}
                  onChange={(e) => setEditingDevice({ ...editingDevice, dataPlan: e.target.value })}
                  placeholder="10 GB/mois, Illimité..."
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">Statut inventaire</label>
                <select
                  value={editingDevice.inventoryStatus || 'Assigné'}
                  onChange={(e) => setEditingDevice({ ...editingDevice, inventoryStatus: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]"
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
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveDevice}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
        <DialogContent className="max-w-2xl bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">
              Historique des remplacements - {selectedDevice?.imei}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Historique d'assignation de cet appareil à différents véhicules
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {selectedDeviceHistory.length === 0 ? (
              <p className="text-[#6B6B80] text-sm">Aucun historique disponible</p>
            ) : (
              selectedDeviceHistory.map((history) => (
                <div key={history.id} className="border border-[#1F1F2E] rounded-lg p-4 bg-[#0A0A0F]">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-[#F0F0F5]">{history.vehicleName}</p>
                      <p className="text-sm text-[#6B6B80]">
                        Assigné: {new Date(history.assignedDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Badge variant={history.status === 'current' ? 'default' : 'secondary'}>
                      {history.status === 'current' ? 'Actuel' : 'Précédent'}
                    </Badge>
                  </div>
                  {history.removedDate && (
                    <p className="text-sm text-[#6B6B80]">
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
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialog} onOpenChange={setAssignmentDialog}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Assigner un véhicule</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Sélectionnez un véhicule pour assigner le tracker IMEI:{' '}
              <strong className="text-[#00E5CC]">{selectedDevice?.imei}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <p className="text-[#6B6B80] text-sm">
                Aucun véhicule disponible. Créez d'abord un véhicule.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 border border-[#1F1F2E] rounded-lg hover:bg-[#1A1A25] cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={vehicle.id}
                      checked={selectedVehicleId === vehicle.id}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                    />
                    <div>
                      <p className="font-medium text-[#F0F0F5]">{vehicle.name}</p>
                      <p className="text-sm text-[#6B6B80]">{vehicle.licensePlate}</p>
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
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignVehicle}
              disabled={!selectedVehicleId}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assignment Dialog */}
      <Dialog open={bulkAssignDialog} onOpenChange={setBulkAssignDialog}>
        <DialogContent className="bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Attribution en masse</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Assigner {selectedDeviceIds.size} appareil(s) à un véhicule
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">Sélectionner un véhicule</label>
              <select
                value={bulkAssignVehicleId}
                onChange={(e) => setBulkAssignVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]"
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
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={!bulkAssignVehicleId}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              Assigner à {selectedDeviceIds.size} appareil(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Importer des appareils</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Téléchargez un fichier CSV avec le format: IMEI, Modèle, Fournisseur, Numéro SIM, Opérateur, Plan données
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-[#1F1F2E] rounded-lg p-8 text-center hover:border-[#2A2A3D] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[#6B6B80] hover:text-[#F0F0F5]"
              >
                <Upload className="mx-auto mb-2" size={32} />
                <p className="font-medium">Cliquez pour sélectionner un fichier CSV</p>
                <p className="text-sm text-[#6B6B80] mt-1">ou glissez-déposez</p>
              </button>
            </div>

            {importFile && (
              <div className="bg-[#1A1A25] p-4 rounded-lg border border-[#1F1F2E]">
                <p className="text-sm font-medium text-[#F0F0F5]">
                  Fichier sélectionné: {importFile.name}
                </p>
              </div>
            )}

            {parsedData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#F0F0F5]">
                  Aperçu ({parsedData.length} appareils)
                </p>
                <div className="border border-[#1F1F2E] rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0A0A0F] border-b border-[#1F1F2E]">
                      <tr>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">IMEI</th>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">Modèle</th>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">Fournisseur</th>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">SIM</th>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">Opérateur</th>
                        <th className="px-4 py-2 text-left text-[#6B6B80]">Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F2E]">
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#1A1A25]">
                          <td className="px-4 py-2 text-[#F0F0F5] font-mono">{row.imei}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.model}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.provider}</td>
                          <td className="px-4 py-2 text-[#6B6B80] font-mono text-xs">{row.simNumber}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.operator}</td>
                          <td className="px-4 py-2 text-[#6B6B80] text-xs">{row.dataPlan}</td>
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
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportDevices}
              disabled={parsedData.length === 0}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
