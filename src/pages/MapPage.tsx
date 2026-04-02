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
import { useAuthStore } from '@/stores/authStore'
import { formatSpeed, formatTimeAgo } from '@/lib/utils'
import { Search, Layers, Navigation, Eye, ChevronRight, Satellite, Map as MapIcon, Wifi, WifiOff, HelpCircle, Wind, MapPin, AlertCircle, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useGpsWebSocket } from '@/hooks/useGpsWebSocket'
import { useQueryClient } from '@tanstack/react-query'
import { MAPBOX_TILE_URL, MAPBOX_TOKEN } from '@/lib/constants'

// Helper function to convert speed based on user preferences
function getFormattedSpeed(speedKmh: number, useImperial: boolean): { value: string; unit: string } {
  if (useImperial) {
    const mph = speedKmh * 0.621371
    return { value: mph.toFixed(0), unit: 'mph' }
  }
  return { value: speedKmh.toFixed(0), unit: 'km/h' }
}

// Fix default marker icons for Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Vehicle marker icon factory
function createVehicleIcon(speed: number, heading: number, isSelected: boolean, vehicleType?: string) {
  const isMoving = speed > 2

  // Determine color based on vehicle type if moving, gray if stopped
  let typeColor = '#22c55e' // default green
  if (vehicleType === 'car') typeColor = '#3b82f6'
  else if (vehicleType === 'truck') typeColor = '#f97316'
  else if (vehicleType === 'van') typeColor = '#8b5cf6'
  else if (vehicleType === 'motorcycle') typeColor = '#ef4444'

  const color = isMoving ? typeColor : '#6b7280' // use type color if moving, gray if stopped
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

// Component to handle keyboard shortcuts
function KeyboardShortcuts({ onShortcut }: { onShortcut: (action: string) => void }) {
  const map = useMap()
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f') {
        onShortcut('fullscreen')
      } else if (e.key.toLowerCase() === 't') {
        onShortcut('traffic')
      } else if (e.key.toLowerCase() === 's') {
        onShortcut('streets')
      } else if (e.key.toLowerCase() === 'a') {
        onShortcut('satellite')
      } else if (e.key.toLowerCase() === 'r') {
        onShortcut('terrain')
      } else if (e.key === '?') {
        setShowHelp(!showHelp)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onShortcut, showHelp])

  return (
    <div className="relative">
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="absolute bottom-16 right-4 z-[1000] bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 border border-gray-200"
        title="Press ? for help"
      >
        <HelpCircle size={16} className="text-gray-600" />
      </button>

      {showHelp && (
        <div className="absolute bottom-28 right-4 z-[1000] bg-white shadow-lg rounded-lg p-3 border border-gray-200 w-56 text-xs">
          <p className="font-semibold mb-2 text-gray-900">Raccourcis clavier</p>
          <div className="space-y-1.5 text-gray-600">
            <div className="flex justify-between">
              <span>F</span>
              <span>Basculer plein écran</span>
            </div>
            <div className="flex justify-between">
              <span>T</span>
              <span>Afficher trafic</span>
            </div>
            <div className="flex justify-between">
              <span>S</span>
              <span>Plan rue</span>
            </div>
            <div className="flex justify-between">
              <span>A</span>
              <span>Satellite</span>
            </div>
            <div className="flex justify-between">
              <span>R</span>
              <span>Terrain</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// TODO: Implement marker clustering - when zoom < 8 and vehicles are close together, show count badges
// This would require leaflet.markercluster or custom grouping logic
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
  const [tileLayer, setTileLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showHelpPopover, setShowHelpPopover] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showManualGps, setShowManualGps] = useState(false)
  const [showProviderPanel, setShowProviderPanel] = useState(true)
  const [manualGpsForm, setManualGpsForm] = useState({ lat: '', lng: '', vehicleId: '', name: '' })
  const [manualMarkers, setManualMarkers] = useState<Array<{ lat: number; lng: number; name: string }>>([])
  const [providerStatus, setProviderStatus] = useState({
    flespi: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    echoes: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    keeptrace: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    ubiwan: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
  })
  const [isSubmittingGps, setIsSubmittingGps] = useState(false)
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [useImperialUnits] = useState(() => {
    try {
      const prefs = localStorage.getItem('fleet-tracker_preferences')
      return prefs ? JSON.parse(prefs).units === 'imperial' : false
    } catch {
      return false
    }
  })
  const {
    selectedVehicleId,
    selectVehicle,
    showGeofences,
    toggleGeofences,
  } = useMapStore()

  const queryClient = useQueryClient()
  const { data: vehiclesData } = useVehicles({ limit: 500 })

  // Real-time WebSocket for GPS position updates
  const { isConnected } = useGpsWebSocket({
    enabled: true,
    onPositionUpdate: (update) => {
      // Invalidate vehicle queries to refresh positions
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

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
  const offlineCount = vehicles.length - vehiclesWithGps.length

  // Calculate average speed of moving vehicles
  const avgFleetSpeed = movingCount > 0
    ? vehiclesWithGps
        .filter((v: any) => (v.currentSpeed || 0) > 2)
        .reduce((sum: number, v: any) => sum + (v.currentSpeed || 0), 0) / movingCount
    : 0

  const tileUrl =
    tileLayer === 'satellite'
      ? MAPBOX_TILE_URL('satellite-streets-v12')
      : tileLayer === 'terrain'
        ? MAPBOX_TILE_URL('outdoors-v12')
        : MAPBOX_TILE_URL('streets-v12')

  const tileAttribution = '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

  const trafficUrl = `https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`

  const handleShortcut = (action: string) => {
    switch (action) {
      case 'fullscreen':
        setIsFullscreen(!isFullscreen)
        break
      case 'traffic':
        setShowTraffic(!showTraffic)
        break
      case 'streets':
        setTileLayer('streets')
        break
      case 'satellite':
        setTileLayer('satellite')
        break
      case 'terrain':
        setTileLayer('terrain')
        break
    }
  }

  return (
    <div className="flex h-[calc(100vh-80px)] gap-4">
      {/* Map */}
      <div className={`relative ${isFullscreen ? 'w-full' : 'flex-1'} rounded-lg border border-gray-200 overflow-hidden shadow-sm`}>
        <MapContainer
          center={[43.7, 3.87]}
          zoom={6}
          className="h-full w-full z-0"
          zoomControl={false}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} tileSize={512} zoomOffset={-1} />
          {showTraffic && <TileLayer url={trafficUrl} attribution={tileAttribution} opacity={0.5} />}

          <FitBounds vehicles={vehicles} />
          <KeyboardShortcuts onShortcut={handleShortcut} />

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
                vehicle.id === selectedVehicleId,
                vehicle.type
              )}
              eventHandlers={{
                click: () => selectVehicle(vehicle.id),
              }}
            >
              <Popup>
                <div className="min-w-48 p-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm">{vehicle.name}</p>
                      <p className="text-xs text-gray-500">{vehicle.plate}</p>
                    </div>
                    {vehicle.gpsProviderFailover && (
                      <div title="Basculement fournisseur actif">
                        <AlertCircle size={14} className="text-amber-500" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vitesse:</span>
                      <span className="font-medium">{getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Dernière com.:</span>
                      <span className="font-medium">{formatTimeAgo(vehicle.lastCommunication)}</span>
                    </div>
                    {vehicle.gpsProvider && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fournisseur:</span>
                        <span className="font-medium text-xs">{vehicle.gpsProvider}</span>
                      </div>
                    )}
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

          {/* Manual GPS markers */}
          {manualMarkers.map((marker, idx) => (
            <Marker
              key={`manual-${idx}`}
              position={[marker.lat, marker.lng]}
              icon={L.divIcon({
                html: `<div style="
                  width: 20px; height: 20px;
                  background: #f97316;
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>`,
                className: 'manual-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{marker.name}</p>
                  <p className="text-xs text-gray-500">{marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</p>
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
            onClick={() => {
              if (tileLayer === 'streets') setTileLayer('satellite')
              else if (tileLayer === 'satellite') setTileLayer('terrain')
              else setTileLayer('streets')
            }}
            className="gap-2 bg-white shadow-md"
          >
            {tileLayer === 'streets' ? <Satellite size={16} /> : tileLayer === 'satellite' ? <MapIcon size={16} /> : <Layers size={16} />}
            {tileLayer === 'streets' ? 'Satellite' : tileLayer === 'satellite' ? 'Terrain' : 'Plan'}
          </Button>
          <Button
            variant={showTraffic ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowTraffic(!showTraffic)}
            className="gap-2 bg-white shadow-md"
          >
            <Wind size={16} />
            Trafic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-2 bg-white shadow-md"
          >
            <Navigation size={16} />
            {isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowManualGps(!showManualGps)}
            className="gap-2 bg-white shadow-md"
          >
            <MapPin size={16} />
            Saisie manuelle
          </Button>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
          {/* Provider failover indicator */}
          <div className="rounded-lg bg-white px-3 py-1.5 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full inline-block ${providerStatus.flespi.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Fournisseur principal: Flespi
            {providerStatus.flespi.failoverActive && <AlertCircle size={12} className="text-amber-500" />}
          </div>
        </div>

        {/* Fleet stats overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2 max-w-xs">
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block"></span>
            {movingCount} en mouvement
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block"></span>
            {stoppedCount} à l'arrêt
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block"></span>
            {offlineCount} hors ligne
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium">
            Vitesse moyenne: {getFormattedSpeed(avgFleetSpeed, useImperialUnits).value} {getFormattedSpeed(avgFleetSpeed, useImperialUnits).unit}
          </div>
          <div className="rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium">
            {vehiclesWithGps.length} / {vehicles.length} GPS actif
          </div>
          <div className={`rounded-full px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5 ${
            isConnected ? 'bg-green-50 text-green-700' : 'bg-white text-gray-500'
          }`}>
            {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isConnected ? 'Live' : 'Polling'}
          </div>
        </div>

        {/* Mini-map overview */}
        {showMiniMap && (
          <div className="absolute bottom-4 left-56 z-[1000]">
            <Card className="w-40 shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-700">Vue d'ensemble</p>
                  <button
                    onClick={() => setShowMiniMap(false)}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-medium">{vehiclesWithGps.length} véhicules</p>
                  <p className="text-gray-500">Zone: Nice/Côte d'Azur</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual GPS entry form */}
        {showManualGps && (
          <div className="absolute top-20 right-4 z-[1000]">
            <Card className="w-72 shadow-lg">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Saisie manuelle GPS</CardTitle>
                  <button
                    onClick={() => setShowManualGps(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Véhicule</label>
                  <select
                    value={manualGpsForm.vehicleId}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, vehicleId: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="43.7"
                    value={manualGpsForm.lat}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lat: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="3.87"
                    value={manualGpsForm.lng}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lng: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!manualGpsForm.vehicleId || !manualGpsForm.lat || !manualGpsForm.lng || isSubmittingGps}
                  onClick={async () => {
                    if (manualGpsForm.vehicleId && manualGpsForm.lat && manualGpsForm.lng && organizationId) {
                      setIsSubmittingGps(true)
                      try {
                        const response = await fetch(
                          `/api/organizations/${organizationId}/vehicles/${manualGpsForm.vehicleId}/position`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              lat: parseFloat(manualGpsForm.lat),
                              lng: parseFloat(manualGpsForm.lng),
                              timestamp: new Date().toISOString(),
                              source: 'manual',
                            }),
                          }
                        )
                        if (response.ok) {
                          setManualGpsForm({ lat: '', lng: '', vehicleId: '', name: '' })
                          queryClient.invalidateQueries({ queryKey: ['vehicles'] })
                        }
                      } catch (error) {
                        console.error('Erreur lors de la soumission GPS:', error)
                      } finally {
                        setIsSubmittingGps(false)
                      }
                    }
                  }}
                  className="w-full text-xs h-8"
                >
                  {isSubmittingGps ? 'Envoi...' : 'Envoyer'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help button bottom right */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/90 shadow"
            onClick={() => setShowHelpPopover(!showHelpPopover)}
          >
            <HelpCircle size={16} />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      {!isFullscreen && (<div className="w-80 flex flex-col gap-4 overflow-hidden">
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
                          {hasGps ? `${getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value} ${getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit}` : 'Hors ligne'}
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

        {/* GPS Provider Status Panel */}
        <Card>
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowProviderPanel(!showProviderPanel)}>
              <CardTitle className="text-sm font-semibold">Fournisseurs GPS</CardTitle>
              <ChevronDown
                size={16}
                className={`transition-transform ${showProviderPanel ? 'rotate-0' : '-rotate-90'}`}
              />
            </div>
          </CardHeader>
          {showProviderPanel && (
            <CardContent className="space-y-2 text-xs pb-4">
              {[
                { key: 'flespi', label: 'Flespi' },
                { key: 'echoes', label: 'Echoes' },
                { key: 'keeptrace', label: 'KeepTrace' },
                { key: 'ubiwan', label: 'Ubiwan' },
              ].map((provider) => (
                <div key={provider.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{provider.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {providerStatus[provider.key as keyof typeof providerStatus].status === 'connected' ? (
                        <>
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="text-gray-600">Connecté</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-red-500" />
                          <span className="text-gray-600">Erreur</span>
                        </>
                      )}
                    </div>
                    {providerStatus[provider.key as keyof typeof providerStatus].failoverActive && (
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                        Secours
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
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
                  <p className="font-bold text-lg">{getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value}<span className="text-xs font-normal"> {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}</span></p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-500">Cap</p>
                  <p className="font-bold text-lg">{(selectedVehicle.currentHeading || 0).toFixed(0)}<span className="text-xs font-normal">°</span></p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>Position: {selectedVehicle.currentLat?.toFixed(5)}, {selectedVehicle.currentLng?.toFixed(5)}</p>
                <p>Dernière com.: {formatTimeAgo(selectedVehicle.lastCommunication)}</p>
                {(selectedVehicle as any).gpsProvider && (
                  <p>Fournisseur: <span className="font-medium text-gray-700">{(selectedVehicle as any).gpsProvider}</span></p>
                )}
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
      )}
    </div>
  )
}
