import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Search, Wifi, Zap, Clock } from 'lucide-react'
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

export default function DevicesPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch devices
  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: ['devices', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const response = await apiClient.get(
        `/api/organizations/${organizationId}/devices`
      )
      return response.data as Device[]
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appareils GPS</h1>
          <p className="mt-2 text-gray-600">Gérez vos trackers et appareils GPS</p>
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fournisseur</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Statut</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">SIM</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batterie</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Signal</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Véhicule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Dernière comm.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.imei}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.model}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.provider}</td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusColor(device.status)}>
                        {getStatusLabel(device.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{device.simNumber || '-'}</td>
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
                      {device.vehicleName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatTimeAgo(device.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
