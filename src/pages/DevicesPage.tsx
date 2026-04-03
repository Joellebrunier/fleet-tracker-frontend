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
import { Search, Wifi, Zap, Clock, Locate, RotateCw, AlertCircle, Link as LinkIcon, Download, Upload } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'

interface Device {
  id: string
  imei: string
  model: string
  provider: string
  status: 'online' | 'offline' | 'faulty'
  simNumber?: string
  batteryLevel?: number
  signalStrength?: number
  firmwareVersion?: string
  lastSeen?: string
  vehicleId?: string
  vehicleName?: string
}

interface Vehicle {
  id: string
  name: string
  licensePlate: string
}

export default function DevicesPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [searchTerm, setSearchTerm] = useState('')
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [importDialog, setImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<Array<{imei: string; model: string; provider: string; simNumber: string}>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch devices
  const { data: devices = [], isLoading, error } = useQuery({
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

  const getBatteryColor = (level?: number): string => {
    if (!level) return 'bg-[#1A1A25]'
    if (level > 50) return 'bg-[#00E5CC]'
    if (level > 20) return 'bg-[#FFB547]'
    return 'bg-[#FF4D6A]'
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

  const handleAssignVehicle = async () => {
    if (!selectedDevice || !selectedVehicleId) return
    try {
      await apiClient.put(`/api/devices/${selectedDevice.id}`, {
        vehicleId: selectedVehicleId,
      })
      setAssignmentDialog(false)
      setSelectedDevice(null)
      // In a real app, would invalidate query cache here
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error)
    }
  }

  const sendDeviceCommand = async (deviceId: string, command: string) => {
    try {
      await apiClient.post(`/api/devices/${deviceId}/command`, {
        command,
      })
      // Show success notification
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
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      const data = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length >= 4) {
          data.push({
            imei: values[0] || '',
            model: values[1] || '',
            provider: values[2] || '',
            simNumber: values[3] || ''
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
          simNumber: device.simNumber
        })
      }

      setImportDialog(false)
      setImportFile(null)
      setParsedData([])
      // Refresh devices list
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error)
    }
  }

  const handleExportDevices = () => {
    if (devices.length === 0) return

    const headers = ['IMEI', 'Modèle', 'Fournisseur', 'Numéro SIM', 'Statut', 'Batterie', 'Signal']
    const rows = devices.map(d => [
      d.imei,
      d.model,
      d.provider,
      d.simNumber || '',
      getStatusLabel(d.status),
      d.batteryLevel || 0,
      d.signalStrength || 0
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

  return (
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Appareils GPS</h1>
          <p className="mt-2 text-[#6B6B80]">Gérez vos trackers et appareils GPS</p>
        </div>
        <div className="flex gap-2">
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">IMEI</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Modèle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Firmware</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Batterie</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Signal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Véhicule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Dernière pos.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F2E]">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-[#1A1A25] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-[#F0F0F5] font-mono">{device.imei}</td>
                    <td className="px-6 py-4 text-sm text-[#6B6B80]">{device.model}</td>
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
                        <div className="h-6 w-16 bg-[#1A1A25] rounded overflow-hidden">
                          <div
                            className={`h-full ${getBatteryColor(device.batteryLevel)}`}
                            style={{ width: `${device.batteryLevel || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-[#6B6B80] w-8 font-mono">
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

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">Importer des appareils</DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Téléchargez un fichier CSV avec le format: IMEI, Modèle, Fournisseur, Numéro SIM
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
                        <th className="px-4 py-2 text-left text-[#6B6B80]">Numéro SIM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1F1F2E]">
                      {parsedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#1A1A25]">
                          <td className="px-4 py-2 text-[#F0F0F5] font-mono">{row.imei}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.model}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.provider}</td>
                          <td className="px-4 py-2 text-[#6B6B80]">{row.simNumber}</td>
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
