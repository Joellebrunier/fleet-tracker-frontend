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
    if (!level) return 'bg-gray-200'
    if (level > 50) return 'bg-green-500'
    if (level > 20) return 'bg-yellow-500'
    return 'bg-red-500'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appareils GPS</h1>
          <p className="mt-2 text-gray-600">Gérez vos trackers et appareils GPS</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialog(true)}
            className="flex items-center gap-2"
          >
            <Upload size={16} />
            Importateur
          </Button>
          <Button
            variant="outline"
            onClick={handleExportDevices}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Exportateur CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <Input
              type="search"
              placeholder="Rechercher par IMEI ou modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Erreur de chargement des appareils</p>
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Card className="text-center">
          <CardContent className="pt-12">
            <p className="text-gray-500">
              {searchTerm
                ? 'Aucun appareil ne correspond à votre recherche'
                : 'Aucun appareil trouvé. Connectez vos trackers GPS pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">IMEI</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Modèle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Firmware</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batterie</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Signal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Véhicule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dernière pos.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.imei}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {device.firmwareVersion || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(device.status)}>
                        {getStatusLabel(device.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-16 bg-gray-200 rounded overflow-hidden">
                          <div
                            className={`h-full ${getBatteryColor(device.batteryLevel)}`}
                            style={{ width: `${device.batteryLevel || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">
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
                                ? 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {device.vehicleName ? (
                        <Badge variant="secondary">{device.vehicleName}</Badge>
                      ) : (
                        <span className="text-gray-400">Non assigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTimeAgo(device.lastSeen)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => openAssignmentDialog(device)}
                          className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                          title="Assigner à un véhicule"
                        >
                          <LinkIcon size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'locate')}
                          className="p-1.5 hover:bg-green-100 rounded text-green-600"
                          title="Localiser"
                        >
                          <Locate size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'restart')}
                          className="p-1.5 hover:bg-amber-100 rounded text-amber-600"
                          title="Redémarrer"
                        >
                          <RotateCw size={16} />
                        </button>
                        <button
                          onClick={() => sendDeviceCommand(device.id, 'diagnostic')}
                          className="p-1.5 hover:bg-purple-100 rounded text-purple-600"
                          title="Diagnostic"
                        >
                          <AlertCircle size={16} />
                        </button>
                        {device.provider === 'Echoes' && (
                          <>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_sync')}
                              className="p-1.5 hover:bg-indigo-100 rounded text-indigo-600"
                              title="Synchroniser Echoes"
                            >
                              <Wifi size={16} />
                            </button>
                            <button
                              onClick={() => sendDeviceCommand(device.id, 'echoes_update')}
                              className="p-1.5 hover:bg-teal-100 rounded text-teal-600"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner un véhicule</DialogTitle>
            <DialogDescription>
              Sélectionnez un véhicule pour assigner le tracker IMEI:{' '}
              <strong>{selectedDevice?.imei}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {vehicles.length === 0 ? (
              <p className="text-gray-600 text-sm">
                Aucun véhicule disponible. Créez d'abord un véhicule.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <label
                    key={vehicle.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
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
                      <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
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
            >
              Annuler
            </Button>
            <Button
              onClick={handleAssignVehicle}
              disabled={!selectedVehicleId}
            >
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importer des appareils</DialogTitle>
            <DialogDescription>
              Téléchargez un fichier CSV avec le format: IMEI, Modèle, Fournisseur, Numéro SIM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-600 hover:text-gray-900"
              >
                <Upload className="mx-auto mb-2" size={32} />
                <p className="font-medium">Cliquez pour sélectionner un fichier CSV</p>
                <p className="text-sm text-gray-500 mt-1">ou glissez-déposez</p>
              </button>
            </div>

            {importFile && (
              <div className="bg-gray-50 p-4 rounded-lg">
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
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 text-left">IMEI</th>
                        <th className="px-4 py-2 text-left">Modèle</th>
                        <th className="px-4 py-2 text-left">Fournisseur</th>
                        <th className="px-4 py-2 text-left">Numéro SIM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {parsedData.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2">{row.imei}</td>
                          <td className="px-4 py-2">{row.model}</td>
                          <td className="px-4 py-2">{row.provider}</td>
                          <td className="px-4 py-2">{row.simNumber}</td>
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
            >
              Annuler
            </Button>
            <Button
              onClick={handleImportDevices}
              disabled={parsedData.length === 0}
            >
              Importer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
