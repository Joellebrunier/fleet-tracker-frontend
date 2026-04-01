import { useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useVehicles } from '@/hooks/useVehicles'
import { useMapStore } from '@/stores/mapStore'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import { Search, Layers, Navigation, Eye, ChevronRight, Satellite, Map as MapIcon } from 'lucide-react'

// Fix default marker icons for Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Vehicle marker icon factory
function createVehicleIcon(speed: number, heading: number, isSelected: boolean) {
  const isMoving = speed > 2
  const color = isMoving ? '#22c55e' : '#6b7280' // green if moving, gray if stopped
  const borderColor = isSelected ? '#3b82f6' : '#ffffff'
  const size = isSelected ? 18 : 14
  const border = isSelected ? 4 : 2

  return L.divIcon({
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${border}px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${isMoving ? `transform: rotate(${heading}deg);` : ''}
    "></div>
    ${isMoving ? `<div style="
      position: absolute; top: -6px; left: 50%; transform: translateX(-50%) rotate(${heading}deg);
      width: 0; height: 0;
      border-left: 4px solid transparent; border-right: 4px solid transparent;
      border-bottom: 8px solid ${color};
    "></div>` : ''}`,
    className: 'vehicle-marker',
    iconSize: [size + border * 2, size + border * 2],
    iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
  })
}

// Component to fly the map to a selected vehicle
function FlyToVehicle({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15, { duration: 1 })
    }
  }, [lat, lng, map])
  return null
}

// Component to fit bounds to all vehicles
function FitBounds({ vehicles }: { vehicles: any[] }) {
  const map = useMap()
  const hasSetBounds = useRef(false)

  useEffect(() => {
    if (vehicles.length > 0 && !hasSetBounds.current) {
      const withGps = vehicles.filter((v) => v.currentLat && v.currentLng)
      if (withGps.length > 0) {
        const bounds = L.latLngBounds(withGps.map((v) => [v.currentLat, v.currentLng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
        hasSetBounds.current = true
      }
    }
  }, [vehicles, map])

  return null
}

export default function MapPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [tileLayer, setTileLayer] = useState<'streets' | 'satellite'>('streets')
  const {
    selectedVehicleId,
    selectVehicle,
    showGeofences,
    toggleGeofences,
  } = useMapStore()

  const { data: vehiclesData } = useVehicles({ limit: 500 })

  const vehicles = useMemo(() => vehiclesData?.data || [], [vehiclesData])

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v: any) =>
          v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [vehicles, searchTerm]
  )

  const vehiclesWithGps = useMemo(
    () => vehicles.filter((v: any) => v.currentLat && v.currentLng),
    [vehicles]
  )

  const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId)

  const movingCount = vehiclesWithGps.filter((v: any) => (v.currentSpeed || 0) > 2).length
  const stoppedCount = vehiclesWithGps.length - movingCount

  const tileUrl =
    tileLayer === 'satellite'
      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const tileAttribution =
    tileLayer === 'satellite'
      ? '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Map */}
      <div className="relative flex-1 rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <MapContainer
          center={[43.7, 3.87]}
          zoom={6}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} />

          <FitBounds vehicles={vehicles} />

          {selectedVehicle?.currentLat && selectedVehicle?.currentLng && (
            <FlyToVehicle lat={selectedVehicle.currentLat} lng={selectedVehicle.currentLng} />
          )}

          {vehiclesWithGps.map((vehicle: any) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.currentLat, vehicle.currentLng]}
              icon={createVehicleIcon(
                vehicle.currentSpeed || 0,
                vehicle.currentHeading || 0,
                vehicle.id === selectedVehicleId
              )}
              eventHandlers={{
                click: () => selectVehicle(vehicle.id),
              }}
            >
              <Popup>
                <div className="min-w-48 p-1">
                  <p className="font-bold text-sm">{vehicle.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{vehicle.plate}</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vitesse:</span>
                      <span className="font-medium">{(vehicle.currentSpeed || 0).toFixed(0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dernière com.:</span>
                      <span className="font-medium">{formatTimeAgo(vehicle.lastCommunication)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    className="mt-2 w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Voir détails →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map overlay controls */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTileLayer(tileLayer === 'streets' ? 'satellite' : 'streets')}
            className="gap-2 bg-white shadow-md"
          >
            {tileLayer === 'streets' ? <Satellite size={16} /> : <MapIcon size={16} />}
            {tileLayer === 'streets' ? 'Satellite' : 'Plan'}
          </Button>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block"></span>
            {movingCount} en mouvement
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block"></span>
            {stoppedCount} à l'arrêt
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium">
            {vehiclesWithGps.length} / {vehicles.length} GPS actif
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4 overflow-hidden">
        {/* Search */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <Input
                type="search"
                placeholder="Rechercher un véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle list */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Véhicules ({filteredVehicles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pb-4">
            <div className="space-y-1.5">
              {filteredVehicles.map((vehicle: any) => {
                const isMoving = (vehicle.currentSpeed || 0) > 2
                const hasGps = vehicle.currentLat && vehicle.currentLng
                return (
                  <button
                    key={vehicle.id}
                    onClick={() => selectVehicle(vehicle.id)}
                    className={`w-full rounded-lg border p-2.5 text-left transition-all ${
                      selectedVehicleId === vehicle.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          !hasGps ? 'bg-red-400' : isMoving ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{vehicle.name}</p>
                        <p className="text-xs text-gray-500 truncate">{vehicle.plate}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-700">
                          {hasGps ? `${(vehicle.currentSpeed || 0).toFixed(0)} km/h` : 'Hors ligne'}
                        </p>
                        <p className="text-xs text-gray-400">{formatTimeAgo(vehicle.lastCommunication)}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected vehicle details */}
        {selectedVehicle && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{selectedVehicle.name}</CardTitle>
                <Badge
                  variant={selectedVehicle.currentSpeed > 2 ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {selectedVehicle.currentSpeed > 2 ? 'En route' : 'Arrêté'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500">Vitesse</p>
                  <p className="font-bold text-lg">{(selectedVehicle.currentSpeed || 0).toFixed(0)}<span className="text-xs font-normal"> km/h</span></p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500">Cap</p>
                  <p className="font-bold text-lg">{(selectedVehicle.currentHeading || 0).toFixed(0)}<span className="text-xs font-normal">°</span></p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>Position: {selectedVehicle.currentLat?.toFixed(5)}, {selectedVehicle.currentLng?.toFixed(5)}</p>
                <p>Dernière com.: {formatTimeAgo(selectedVehicle.lastCommunication)}</p>
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                size="sm"
                onClick={() => navigate(`/vehicles/${selectedVehicle.id}`)}
              >
                <Eye size={14} />
                Voir les détails
                <ChevronRight size={14} />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
