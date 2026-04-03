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
import { Search, Layers, Navigation, Eye, ChevronRight, Satellite, Map as MapIcon, Wifi, WifiOff, HelpCircle, Wind, MapPin, AlertCircle, ChevronDown, CheckCircle2, X, Edit2, Trash2 } from 'lucide-react'
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
        className="absolute bottom-16 right-4 z-[1000] bg-[#12121A] shadow-md rounded-[12px] p-2 hover:bg-[#1A1A25] border border-[#1F1F2E]"
        title="Press ? for help"
      >
        <HelpCircle size={16} className="text-[#6B6B80]" />
      </button>

      {showHelp && (
        <div className="absolute bottom-28 right-4 z-[1000] bg-[#12121A] shadow-lg rounded-[12px] p-3 border border-[#1F1F2E] w-56 text-xs backdrop-blur">
          <p className="font-syne font-semibold mb-2 text-[#F0F0F5]">Raccourcis clavier</p>
          <div className="space-y-1.5 text-[#6B6B80]">
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

// Component to track zoom level changes
function MapEvents({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap()

  useEffect(() => {
    const handleZoom = () => {
      onZoomChange(map.getZoom())
    }

    map.on('zoom', handleZoom)
    return () => {
      map.off('zoom', handleZoom)
    }
  }, [map, onZoomChange])

  return null
}

type MapStyle = 'plan' | 'satellite' | 'relief' | 'sombre' | 'clair'

type DetailPanelTab = 'temps-reel' | 'historique'

export default function MapPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [mapStyle, setMapStyle] = useState<MapStyle>('plan')
  const [tileLayer, setTileLayer] = useState<'streets' | 'satellite' | 'terrain'>('streets')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTraffic, setShowTraffic] = useState(false)
  const [showHelpPopover, setShowHelpPopover] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [showManualGps, setShowManualGps] = useState(false)
  const [showProviderPanel, setShowProviderPanel] = useState(true)
  const [activeDetailTab, setActiveDetailTab] = useState<DetailPanelTab>('temps-reel')
  const [manualGpsForm, setManualGpsForm] = useState({ lat: '', lng: '', vehicleId: '', name: '' })
  const [manualMarkers, setManualMarkers] = useState<Array<{ lat: number; lng: number; name: string }>>([])
  const [providerStatus, setProviderStatus] = useState({
    flespi: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    echoes: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    keeptrace: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
    ubiwan: { status: 'connected' as 'connected' | 'failed', failoverActive: false },
  })
  const [isSubmittingGps, setIsSubmittingGps] = useState(false)
  const [currentZoom, setCurrentZoom] = useState(6)

  // Filter states
  const [sourceFilter, setSourceFilter] = useState<'TOUS' | 'ECHOES' | 'UBIWAN' | 'KEEPTRACE'>('TOUS')
  const [statutFilter, setStatutFilter] = useState<'TOUS' | 'LOCALISÉS' | 'NON LOC.'>('TOUS')
  const [groupeFilter, setGroupeFilter] = useState<string>('Tous')

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

  // Get unique groups from vehicles (with colors for display)
  const uniqueGroups = useMemo(() => {
    const groups = new Set<string>()
    vehicles.forEach((v: any) => {
      if (v.group) groups.add(v.group)
    })
    return Array.from(groups).sort()
  }, [vehicles])

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v: any) => {
        // Search filter
        const matchesSearch =
          v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Source filter (GPS provider)
        if (sourceFilter !== 'TOUS') {
          const provider = (v.gpsProvider || '').toUpperCase()
          if (provider !== sourceFilter) return false
        }

        // Statut filter (GPS localized or not)
        if (statutFilter === 'LOCALISÉS') {
          if (!v.currentLat || !v.currentLng) return false
        } else if (statutFilter === 'NON LOC.') {
          if (v.currentLat && v.currentLng) return false
        }

        // Groupe filter
        if (groupeFilter !== 'Tous') {
          if (v.group !== groupeFilter) return false
        }

        return true
      }),
    [vehicles, searchTerm, sourceFilter, statutFilter, groupeFilter]
  )

  const vehiclesWithGps = useMemo(
    () => vehicles.filter((v: any) => v.currentLat && v.currentLng),
    [vehicles]
  )

  // Simple clustering for low zoom levels (< 10)
  // Groups nearby vehicles and shows count badges instead of individual markers
  const clusteringEnabled = currentZoom < 10
  const displayedVehicles = useMemo(() => {
    if (!clusteringEnabled || vehiclesWithGps.length <= 20) {
      return vehiclesWithGps
    }

    // Simple grid-based clustering when too many vehicles at low zoom
    const gridSize = 0.5 // degrees
    const clusters = new Map<string, any[]>()

    vehiclesWithGps.forEach((v: any) => {
      const gridX = Math.floor(v.currentLat / gridSize) * gridSize
      const gridY = Math.floor(v.currentLng / gridSize) * gridSize
      const key = `${gridX},${gridY}`

      if (!clusters.has(key)) {
        clusters.set(key, [])
      }
      clusters.get(key)!.push(v)
    })

    // Return cluster representatives (first vehicle from each cluster)
    return Array.from(clusters.values()).map((cluster) => ({
      ...cluster[0],
      _clusterCount: cluster.length,
      _clusterVehicles: cluster,
    }))
  }, [vehiclesWithGps, clusteringEnabled])

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

  // Map style to tile layer mapping
  const getTileUrl = (style: MapStyle) => {
    switch (style) {
      case 'satellite':
        return MAPBOX_TILE_URL('satellite-streets-v12')
      case 'relief':
        return MAPBOX_TILE_URL('outdoors-v12')
      case 'sombre':
        return MAPBOX_TILE_URL('dark-v11')
      case 'clair':
        return MAPBOX_TILE_URL('light-v11')
      case 'plan':
      default:
        return MAPBOX_TILE_URL('streets-v12')
    }
  }

  const tileUrl = getTileUrl(mapStyle)

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
      <div className={`relative ${isFullscreen ? 'w-full' : 'flex-1'} rounded-lg border border-[#1F1F2E] overflow-hidden shadow-sm`}>
        {/* Map Style Selector */}
        <div className="absolute top-4 left-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-2 flex gap-1.5 backdrop-blur border border-[#1F1F2E]">
          {(
            [
              { id: 'plan', label: 'Plan' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'relief', label: 'Relief' },
              { id: 'sombre', label: 'Sombre' },
              { id: 'clair', label: 'Clair' },
            ] as const
          ).map((style) => (
            <button
              key={style.id}
              onClick={() => setMapStyle(style.id as MapStyle)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mapStyle === style.id
                  ? 'bg-[#00E5CC] text-[#0A0A0F] shadow-sm'
                  : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
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
          <MapEvents onZoomChange={setCurrentZoom} />

          {selectedVehicle?.currentLat && selectedVehicle?.currentLng && (
            <FlyToVehicle lat={selectedVehicle.currentLat} lng={selectedVehicle.currentLng} />
          )}

          {displayedVehicles.map((vehicle: any) => (
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
                <div className="min-w-48 p-1 bg-[#12121A] text-[#F0F0F5]">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-sm font-syne">{vehicle.name}</p>
                      <p className="text-xs text-[#6B6B80]">{vehicle.plate}</p>
                    </div>
                    {vehicle.gpsProviderFailover && (
                      <div title="Basculement fournisseur actif">
                        <AlertCircle size={14} className="text-[#FFB547]" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B6B80]">Vitesse:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit}</span>
                        {(vehicle.currentSpeed || 0) > 130 && (
                          <Badge className="bg-[#FF4D6A] text-white text-xs gap-1">
                            <AlertCircle size={10} />
                            EXCÈS
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B6B80]">Dernière com.:</span>
                      <span className="font-medium">{formatTimeAgo(vehicle.lastCommunication)}</span>
                    </div>
                    {vehicle.gpsProvider && (
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Fournisseur:</span>
                        <span className="font-medium text-xs">{vehicle.gpsProvider}</span>
                      </div>
                    )}
                    {vehicle._clusterCount && vehicle._clusterCount > 1 && (
                      <div className="mt-2 pt-2 border-t border-[#1F1F2E]">
                        <p className="text-[#6B6B80] font-medium">{vehicle._clusterCount} véhicules dans cette zone</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                    className="mt-2 w-full text-xs text-[#00E5CC] hover:text-[#00D4B8] font-medium"
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
                <div className="text-sm bg-[#12121A] text-[#F0F0F5]">
                  <p className="font-bold font-syne">{marker.name}</p>
                  <p className="text-xs text-[#6B6B80] font-mono">{marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Zoom level display */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
          <div className="bg-[#12121A]/95 rounded-[12px] shadow-md px-3 py-1.5 text-xs font-medium text-[#F0F0F5] border border-[#1F1F2E] backdrop-blur">
            Zoom: {currentZoom}
            {currentZoom < 10 && (
              <span className="ml-1 text-[#6B6B80] text-xs">(groupage actif)</span>
            )}
          </div>
        </div>

        {/* Map overlay controls */}
        <div className="absolute top-14 right-4 z-[1000] flex flex-col gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (tileLayer === 'streets') setTileLayer('satellite')
              else if (tileLayer === 'satellite') setTileLayer('terrain')
              else setTileLayer('streets')
            }}
            className="gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur"
          >
            {tileLayer === 'streets' ? <Satellite size={16} /> : tileLayer === 'satellite' ? <MapIcon size={16} /> : <Layers size={16} />}
            {tileLayer === 'streets' ? 'Satellite' : tileLayer === 'satellite' ? 'Terrain' : 'Plan'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowTraffic(!showTraffic)}
            className={`gap-2 shadow-md backdrop-blur border ${showTraffic ? 'bg-[#00E5CC] text-[#0A0A0F] border-[#00E5CC]' : 'bg-[#12121A]/95 border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]'}`}
          >
            <Wind size={16} />
            Trafic
          </Button>
          <Button
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur"
          >
            <Navigation size={16} />
            {isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowManualGps(!showManualGps)}
            className="gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur"
          >
            <MapPin size={16} />
            Saisie manuelle
          </Button>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2">
          {/* Provider failover indicator */}
          <div className="rounded-[12px] bg-[#12121A]/95 px-3 py-1.5 shadow-md text-xs font-medium flex items-center gap-1.5 border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur">
            <span className={`h-2 w-2 rounded-full inline-block ${providerStatus.flespi.status === 'connected' ? 'bg-[#00E5CC]' : 'bg-[#FF4D6A]'}`}></span>
            Fournisseur principal: Flespi
            {providerStatus.flespi.failoverActive && <AlertCircle size={12} className="text-[#FFB547]" />}
          </div>
        </div>

        {/* Fleet stats overlay - Vehicle count by status */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-3 text-xs font-medium border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur">
          <p className="font-syne font-semibold mb-1.5">Statut des véhicules</p>
          <div className="flex gap-4 text-[#6B6B80]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00E5CC] inline-block"></span>
              <span>En mouvement: <span className="font-bold text-[#F0F0F5]">{movingCount}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#44445A] inline-block"></span>
              <span>À l'arrêt: <span className="font-bold text-[#F0F0F5]">{stoppedCount}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#FF4D6A] inline-block"></span>
              <span>Hors ligne: <span className="font-bold text-[#F0F0F5]">{offlineCount}</span></span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#1F1F2E] flex gap-4 text-[#6B6B80]">
            <span>Vitesse moy.: <span className="font-bold text-[#F0F0F5]">{getFormattedSpeed(avgFleetSpeed, useImperialUnits).value} {getFormattedSpeed(avgFleetSpeed, useImperialUnits).unit}</span></span>
            <span>{vehiclesWithGps.length}/{vehicles.length} GPS actif</span>
            <div className={`flex items-center gap-1.5 ${isConnected ? 'text-[#00E5CC]' : 'text-[#6B6B80]'}`}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? 'Live' : 'Polling'}
            </div>
          </div>
        </div>

        {/* Speed Legend - Marker color meanings */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-3 text-xs border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur">
          <p className="font-syne font-semibold mb-2">Légende des couleurs</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E5CC] inline-block"></span>
              <span className="text-[#6B6B80]">En mouvement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#44445A] inline-block"></span>
              <span className="text-[#6B6B80]">À l'arrêt</span>
            </div>
            <div className="border-t border-[#1F1F2E] pt-1.5 mt-1.5">
              <p className="text-[#6B6B80] font-medium mb-1">Types de véhicules</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6] inline-block"></span>
                  <span className="text-[#6B6B80]">Voiture</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f97316] inline-block"></span>
                  <span className="text-[#6B6B80]">Camion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8b5cf6] inline-block"></span>
                  <span className="text-[#6B6B80]">Utilitaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ef4444] inline-block"></span>
                  <span className="text-[#6B6B80]">Moto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini-map overview */}
        {showMiniMap && (
          <div className="absolute bottom-4 left-56 z-[1000]">
            <Card className="w-40 shadow-lg bg-[#12121A] border-[#1F1F2E]">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#F0F0F5]">Vue d'ensemble</p>
                  <button
                    onClick={() => setShowMiniMap(false)}
                    className="text-[#6B6B80] hover:text-[#F0F0F5] text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs text-[#6B6B80] space-y-1">
                  <p className="font-medium text-[#F0F0F5]">{vehiclesWithGps.length} véhicules</p>
                  <p className="text-[#44445A]">Zone: Nice/Côte d'Azur</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Manual GPS entry form */}
        {showManualGps && (
          <div className="absolute top-20 right-4 z-[1000]">
            <Card className="w-72 shadow-lg bg-[#12121A] border-[#1F1F2E]">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-syne text-[#F0F0F5]">Saisie manuelle GPS</CardTitle>
                  <button
                    onClick={() => setShowManualGps(false)}
                    className="text-[#6B6B80] hover:text-[#F0F0F5]"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-[#6B6B80] block mb-1">Véhicule</label>
                  <select
                    value={manualGpsForm.vehicleId}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, vehicleId: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-[#1F1F2E] rounded-md focus:ring-2 focus:ring-[#00E5CC] focus:border-transparent bg-[#0A0A0F] text-[#F0F0F5]"
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id} className="bg-[#12121A] text-[#F0F0F5]">
                        {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#6B6B80] block mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="43.7"
                    value={manualGpsForm.lat}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lat: e.target.value })}
                    className="h-8 text-xs bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] focus:ring-[#00E5CC]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B80] block mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="3.87"
                    value={manualGpsForm.lng}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lng: e.target.value })}
                    className="h-8 text-xs bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] focus:ring-[#00E5CC]"
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
                  className="w-full text-xs h-8 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4B8] disabled:opacity-50"
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
            size="sm"
            className="bg-[#12121A]/95 border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] shadow backdrop-blur"
            onClick={() => setShowHelpPopover(!showHelpPopover)}
          >
            <HelpCircle size={16} />
          </Button>
        </div>

        {/* Vehicle Detail Panel */}
        {selectedVehicle && !isFullscreen && (
          <div className="absolute top-0 right-0 h-full w-80 bg-[#12121A] shadow-lg border-l border-[#1F1F2E] z-[999] flex flex-col overflow-hidden rounded-r-lg">
            {/* Header */}
            <div className="bg-[#12121A] p-4 border-b border-[#1F1F2E]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-syne font-bold text-[#F0F0F5]">{selectedVehicle.plate}</h2>
                  <Badge
                    className={`text-xs mt-1 ${selectedVehicle.currentSpeed > 2 ? 'bg-[#00E5CC] text-[#0A0A0F]' : 'bg-[#44445A] text-[#F0F0F5]'}`}
                  >
                    {selectedVehicle.currentSpeed > 2 ? 'EN MOUVEMENT' : 'À L\'ARRÊT'}
                  </Badge>
                </div>
                <button
                  onClick={() => selectVehicle(null)}
                  className="text-[#6B6B80] hover:text-[#F0F0F5] p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#1F1F2E] bg-[#0A0A0F]">
              <button
                onClick={() => setActiveDetailTab('temps-reel')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
                  activeDetailTab === 'temps-reel'
                    ? 'text-[#00E5CC] border-b-2 border-[#00E5CC] bg-[#12121A]'
                    : 'text-[#6B6B80] hover:text-[#F0F0F5]'
                }`}
              >
                TEMPS RÉEL
              </button>
              <button
                onClick={() => setActiveDetailTab('historique')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
                  activeDetailTab === 'historique'
                    ? 'text-[#00E5CC] border-b-2 border-[#00E5CC] bg-[#12121A]'
                    : 'text-[#6B6B80] hover:text-[#F0F0F5]'
                }`}
              >
                HISTORIQUE
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeDetailTab === 'temps-reel' ? (
                <div className="divide-y divide-[#1F1F2E]">
                  {/* IDENTITÉ section */}
                  <div className="p-4">
                    <h3 className="text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3">Identité</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Plaque</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">VIN</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.vin || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Statut API</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.apiStatus || 'Actif'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Flotte ID</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.fleetId || selectedVehicle.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* APPAREIL GPS section */}
                  <div className="p-4">
                    <h3 className="text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3">Appareil GPS</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Type</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.gpsDeviceType || 'Standard'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">ID Appareil</span>
                        <span className="font-medium text-[#F0F0F5] truncate">{selectedVehicle.gpsDeviceId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TÉLÉMÉTRIE section */}
                  <div className="p-4">
                    <h3 className="text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3">Télémétrie</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Vitesse</span>
                        <span className="font-medium text-[#F0F0F5]">
                          {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Odomètre</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.odometer || 'N/A'} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Carburant</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.fuelLevel || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* POSITION section */}
                  <div className="p-4">
                    <h3 className="text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3">Position</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Latitude</span>
                        <span className="font-mono text-[#F0F0F5]">{selectedVehicle.currentLat?.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Longitude</span>
                        <span className="font-mono text-[#F0F0F5]">{selectedVehicle.currentLng?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVITÉ section */}
                  <div className="p-4">
                    <h3 className="text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3">Activité</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Dernière com.</span>
                        <span className="font-medium text-[#F0F0F5]">{formatTimeAgo(selectedVehicle.lastCommunication)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Début trajet</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.tripStart || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B6B80]">Fin trajet</span>
                        <span className="font-medium text-[#F0F0F5]">{selectedVehicle.tripEnd || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs text-[#6B6B80]">
                  <p>Historique non disponible</p>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="border-t border-[#1F1F2E] p-4 flex gap-2 bg-[#0A0A0F]">
              <button
                onClick={() => navigate(`/vehicles/${selectedVehicle.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#00E5CC] text-[#0A0A0F] rounded text-xs font-medium hover:bg-[#00D4B8] transition-colors"
              >
                <Edit2 size={14} />
                Éditer
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#FF4D6A]/10 text-[#FF4D6A] rounded text-xs font-medium hover:bg-[#FF4D6A]/20 transition-colors border border-[#FF4D6A]/30"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      {!isFullscreen && (<div className="w-80 flex flex-col gap-4 overflow-hidden">
        {/* Search */}
        <Card className="bg-[#12121A] border-[#1F1F2E]">
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-[#6B6B80]" size={16} />
              <Input
                type="search"
                placeholder="Rechercher un véhicule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:ring-[#00E5CC]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle list with filters */}
        <Card className="flex-1 overflow-hidden flex flex-col bg-[#12121A] border-[#1F1F2E]">
          {/* Filter Controls */}
          <CardHeader className="pb-3 pt-4">
            {/* SOURCE filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-[#F0F0F5] mb-1.5">SOURCE</p>
              <div className="flex gap-1.5">
                {(['TOUS', 'ECHOES', 'UBIWAN', 'KEEPTRACE'] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      sourceFilter === source
                        ? 'bg-[#00E5CC] text-[#0A0A0F]'
                        : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUT filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-[#F0F0F5] mb-1.5">STATUT</p>
              <div className="flex gap-1.5">
                {(['TOUS', 'LOCALISÉS', 'NON LOC.'] as const).map((statut) => (
                  <button
                    key={statut}
                    onClick={() => setStatutFilter(statut)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      statutFilter === statut
                        ? 'bg-[#00E5CC] text-[#0A0A0F]'
                        : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'
                    }`}
                  >
                    {statut}
                  </button>
                ))}
              </div>
            </div>

            {/* GROUPE filter */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-[#F0F0F5] mb-1.5">GROUPE</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGroupeFilter('Tous')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    groupeFilter === 'Tous'
                      ? 'bg-[#00E5CC] text-[#0A0A0F]'
                      : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'
                  }`}
                >
                  Tous
                </button>
                {uniqueGroups.map((group) => (
                  <button
                    key={group}
                    onClick={() => setGroupeFilter(group)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      groupeFilter === group
                        ? 'bg-[#00E5CC] text-[#0A0A0F]'
                        : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'
                    }`}
                  >
                    <span className="text-sm">■</span>
                    {group}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          {/* Vehicle list header */}
          <div className="px-4 py-2 border-t border-[#1F1F2E] flex items-center justify-between text-xs font-semibold text-[#F0F0F5]">
            <span>VÉHICULE — {filteredVehicles.length} RÉSULTATS</span>
            <span>VITESSE</span>
          </div>

          {/* Vehicle list */}
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
                        ? 'border-[#00E5CC] bg-[#00E5CC]/10 shadow-sm'
                        : 'border-[#1F1F2E] hover:border-[#2A2A3D] hover:bg-[#1A1A25]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#F0F0F5] truncate">{vehicle.plate}</p>
                        <p className="text-xs text-[#6B6B80] truncate">{vehicle.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-[#F0F0F5]">
                          {hasGps ? `${getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value}` : '—'}
                        </p>
                        <p className="text-xs text-[#6B6B80]">{vehicle.gpsProvider || '—'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* GPS Provider Status Panel */}
        <Card className="bg-[#12121A] border-[#1F1F2E]">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowProviderPanel(!showProviderPanel)}>
              <CardTitle className="text-sm font-syne font-semibold text-[#F0F0F5]">Fournisseurs GPS</CardTitle>
              <ChevronDown
                size={16}
                className={`transition-transform text-[#6B6B80] ${showProviderPanel ? 'rotate-0' : '-rotate-90'}`}
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
                <div key={provider.key} className="flex items-center justify-between p-2 bg-[#1A1A25] rounded border border-[#1F1F2E]">
                  <span className="font-medium text-[#F0F0F5]">{provider.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {providerStatus[provider.key as keyof typeof providerStatus].status === 'connected' ? (
                        <>
                          <CheckCircle2 size={12} className="text-[#00E5CC]" />
                          <span className="text-[#6B6B80]">Connecté</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-[#FF4D6A]" />
                          <span className="text-[#6B6B80]">Erreur</span>
                        </>
                      )}
                    </div>
                    {providerStatus[provider.key as keyof typeof providerStatus].failoverActive && (
                      <Badge className="text-xs bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/30">
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
          <Card className="bg-[#12121A] border-[#1F1F2E]">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-syne font-semibold text-[#F0F0F5]">{selectedVehicle.name}</CardTitle>
                <Badge
                  className={`text-xs ${selectedVehicle.currentSpeed > 2 ? 'bg-[#00E5CC] text-[#0A0A0F]' : 'bg-[#44445A] text-[#F0F0F5]'}`}
                >
                  {selectedVehicle.currentSpeed > 2 ? 'En route' : 'Arrêté'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1A1A25] rounded p-2 border border-[#1F1F2E]">
                  <p className="text-[#6B6B80]">Vitesse</p>
                  <p className="font-bold text-lg text-[#F0F0F5]">{getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value}<span className="text-xs font-normal"> {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}</span></p>
                </div>
                <div className="bg-[#1A1A25] rounded p-2 border border-[#1F1F2E]">
                  <p className="text-[#6B6B80]">Cap</p>
                  <p className="font-bold text-lg text-[#F0F0F5]">{(selectedVehicle.currentHeading || 0).toFixed(0)}<span className="text-xs font-normal">°</span></p>
                </div>
              </div>
              <div className="text-xs text-[#6B6B80]">
                <p>Position: <span className="font-mono text-[#F0F0F5]">{selectedVehicle.currentLat?.toFixed(5)}, {selectedVehicle.currentLng?.toFixed(5)}</span></p>
                <p>Dernière com.: {formatTimeAgo(selectedVehicle.lastCommunication)}</p>
                {(selectedVehicle as any).gpsProvider && (
                  <p>Fournisseur: <span className="font-medium text-[#F0F0F5]">{(selectedVehicle as any).gpsProvider}</span></p>
                )}
              </div>
              <Button
                className="w-full gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4B8]"
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
