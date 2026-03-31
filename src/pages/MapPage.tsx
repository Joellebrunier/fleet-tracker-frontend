import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useVehicles } from '@/hooks/useVehicles'
import { useMapStore } from '@/stores/mapStore'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import { MAP_DEFAULTS } from '@/lib/constants'
import { Map, Search, Layers } from 'lucide-react'

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const {
    selectedVehicleId,
    selectVehicle,
    mapStyle,
    setMapStyle,
    showGeofences,
    toggleGeofences,
  } = useMapStore()
  const { data: vehiclesData } = useVehicles({ limit: 100 })

  const vehicles = vehiclesData?.data || []
  const filteredVehicles = vehicles.filter(
    (v: any) =>
      v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Initialize map (simplified - requires mapbox-gl setup)
  useEffect(() => {
    if (mapContainer.current && !map) {
      // Map initialization would go here
      // For now, this is a placeholder
    }
  }, [map])

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  return (
    <div className="h-full space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Map area */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm lg:h-[calc(100vh-200px)]">
          <div
            ref={mapContainer}
            className="h-96 w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center lg:h-full"
          >
            <div className="text-center">
              <Map className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">Map view (Mapbox integration required)</p>
              <p className="text-sm text-gray-400 mt-2">
                Configure MAPBOX_TOKEN in environment variables
              </p>
            </div>
          </div>

          {/* Map controls */}
          <div className="absolute top-4 right-4 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setMapStyle(
                  mapStyle === MAP_DEFAULTS.MAP_STYLE
                    ? MAP_DEFAULTS.SATELLITE_STYLE
                    : MAP_DEFAULTS.MAP_STYLE
                )
              }
              className="gap-2"
            >
              <Layers size={16} />
              Style
            </Button>
            <Button
              variant={showGeofences ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleGeofences(!showGeofences)}
            >
              Geofences
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full space-y-4 lg:w-80">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <Input
                  type="search"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Vehicle list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vehicles ({filteredVehicles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {filteredVehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => selectVehicle(vehicle.id)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-colors ${
                      selectedVehicleId === vehicle.id
                        ? 'border-fleet-tracker-500 bg-fleet-tracker-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.name}</p>
                        <p className="text-xs text-gray-500">{vehicle.plate}</p>
                      </div>
                      <Badge variant="secondary">{vehicle.status}</Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                      <span>{formatSpeed(vehicle.currentSpeed)}</span>
                      <span>{formatTimeAgo(vehicle.lastCommunication)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected vehicle details */}
          {selectedVehicle && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{selectedVehicle.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Speed:</span>
                  <span className="font-medium">{formatSpeed(selectedVehicle.currentSpeed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default">{selectedVehicle.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="font-medium text-xs">
                    {selectedVehicle.currentLat?.toFixed(4)}, {selectedVehicle.currentLng?.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium">{formatTimeAgo(selectedVehicle.lastCommunication)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <Button variant="outline" className="w-full" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
