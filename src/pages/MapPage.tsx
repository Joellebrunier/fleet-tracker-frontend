import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet'
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
import { Search, Layers, Navigation, Eye, ChevronRight, Satellite, Map as MapIcon, Wifi, WifiOff, HelpCircle, Wind, MapPin, AlertCircle, ChevronDown, CheckCircle2, X, Edit2, Trash2, Maximize, Minimize, AlertTriangle, Clock, MapPinOff, Maximize2 } from 'lucide-react'
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
        className="absolute bottom-16 right-4 z-[1000] bg-white shadow-lg rounded-xl p-2 hover:bg-gray-50 border border-gray-200"
        title="Press ? for help"
      >
        <HelpCircle size={16} className="text-gray-500" />
      </button>

      {showHelp && (
        <div className="absolute bottom-28 right-4 z-[1000] bg-white shadow-lg rounded-xl p-3 border border-gray-200 w-56 text-xs backdrop-blur">
          <p className="font-sans font-semibold mb-2 text-gray-900">Raccourcis clavier</p>
          <div className="space-y-1.5 text-gray-500">
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

// Mini-map overview component with lower zoom
function MiniMapOverview({ vehicles }: { vehicles: any[] }) {
  const map = useMap()

  return (
    <div className="absolute bottom-32 left-56 z-[1000] w-56 h-56 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white pointer-events-none">
      <MapContainer
        center={map.getCenter()}
        zoom={map.getZoom() - 4}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        dragging={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        scrollWheelZoom={false}
        touchZoom={false}
        className="pointer-events-none"
      >
        <TileLayer url={MAPBOX_TILE_URL('dark-v11')} attribution="" tileSize={512} zoomOffset={-1} />
        {vehicles.map((v: any) => v.currentLat && v.currentLng && (
          <Marker
            key={`minimap-${v.id}`}
            position={[v.currentLat, v.currentLng]}
            icon={L.divIcon({
              html: `<div style="width: 6px; height: 6px; background: #4361EE; border-radius: 50%; box-shadow: 0 0 4px rgba(67,97,238,0.6);"></div>`,
              className: 'mini-marker',
              iconSize: [6, 6],
              iconAnchor: [3, 3],
            })}
          />
        ))}
      </MapContainer>
    </div>
  )
}

// Event markers component
function EventMarkers({ alerts }: { alerts: AlertEvent[] }) {
  const iconMap = {
    speed: '#EF4444',
    geofence: '#F59E0B',
    idle: '#4361EE',
  }

  return (
    <>
      {alerts.map(alert => (
        alert.lat && alert.lng && (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={L.divIcon({
              html: `<div style="
                width: 20px; height: 20px;
                background: ${iconMap[alert.type]};
                border: 2px solid white;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; font-weight: bold;
                box-shadow: 0 0 8px rgba(0,0,0,0.4);
              ">!</div>`,
              className: 'alert-marker',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="text-xs bg-white text-gray-900">
                <p className="font-bold font-sans">{alert.type.toUpperCase()}</p>
                <p className="text-gray-500">{alert.message}</p>
              </div>
            </Popup>
          </Marker>
        )
      ))}
    </>
  )
}

// Vehicle trail polyline component with breadcrumb dots
function VehicleTrail({ trail }: { trail: VehicleTrail }) {
  if (!trail || trail.length < 2) return null
  const coordinates = trail.map(t => [t.lat, t.lng] as [number, number])
  return (
    <>
      {/* Main trail line */}
      <Polyline
        positions={coordinates}
        color="#4361EE"
        weight={2}
        opacity={0.6}
        dashArray="5,5"
      />
      {/* Breadcrumb dots for recent positions */}
      {trail.map((point, idx) => (
        <CircleMarker
          key={`trail-${idx}`}
          center={[point.lat, point.lng]}
          radius={3}
          fillColor="#4361EE"
          color="#4361EE"
          weight={1}
          opacity={0.4 + (idx / trail.length) * 0.6}
          fillOpacity={0.4 + (idx / trail.length) * 0.6}
        />
      ))}
    </>
  )
}

// Event markers with icon types
function EventMarkersComponent({ alerts }: { alerts: AlertEvent[] }) {
  return (
    <>
      {alerts.map(alert => {
        if (!alert.lat || !alert.lng) return null

        // Create SVG icons for different event types
        let icon = ''
        let color = '#EF4444'

        if (alert.type === 'speed') {
          // Warning triangle for speed alerts
          icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 18H2z"/></svg>`
          color = '#EF4444'
        } else if (alert.type === 'geofence') {
          // Shield for geofence events
          icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
          color = '#F59E0B'
        } else if (alert.type === 'idle') {
          // Clock for idle events
          icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
          color = '#4361EE'
        }

        return (
          <Marker
            key={alert.id}
            position={[alert.lat, alert.lng]}
            icon={L.divIcon({
              html: `<div style="
                width: 28px; height: 28px;
                background: ${color};
                border: 2px solid white;
                border-radius: 4px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              ">${icon}</div>`,
              className: 'event-marker',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
          >
            <Popup>
              <div className="text-xs bg-white text-gray-900 p-2">
                <p className="font-bold font-sans">{alert.type.toUpperCase()}</p>
                <p className="text-gray-500">{alert.message}</p>
                <p className="text-[#9CA3AF] text-xs mt-1">{new Date(alert.timestamp).toLocaleTimeString('fr-FR')}</p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

type MapStyle = 'plan' | 'satellite' | 'relief' | 'sombre' | 'clair'

type DetailPanelTab = 'temps-reel' | 'historique'

type VehicleStop = { lat: number; lng: number; duration: number; timestamp: string }

type VehicleTrail = Array<{ lat: number; lng: number; timestamp: string }>

type AlertEvent = { id: string; type: 'speed' | 'geofence' | 'idle'; lat: number; lng: number; timestamp: string; message: string; vehicleId: string }

// Helper: Calculate idle duration
function calculateIdleDuration(lastSpeed: number, lastSpeedUpdate?: string): { duration: number; durationStr: string } {
  if (!lastSpeed || lastSpeed > 2) return { duration: 0, durationStr: '' }
  if (!lastSpeedUpdate) return { duration: 0, durationStr: '' }
  const now = new Date()
  const lastUpdate = new Date(lastSpeedUpdate)
  const diffMs = now.getTime() - lastUpdate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const mins = diffMins % 60
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  return { duration: diffMins, durationStr }
}

// Helper: Get current timezone
function getCurrentTimezone(): { offset: string; name: string } {
  const now = new Date()
  const offset = -now.getTimezoneOffset() / 60
  const sign = offset >= 0 ? '+' : ''
  const offsetStr = `UTC${sign}${offset.toFixed(0)}`

  // Get timezone name from locale (fallback to UTC offset)
  const tzName = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
  })
    .formatToParts(now)
    .find(part => part.type === 'timeZoneName')?.value || 'UTC'

  return { offset: offsetStr, name: tzName }
}

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

  // New feature states
  const [vehicleTrails, setVehicleTrails] = useState<Record<string, VehicleTrail>>({})
  const [vehicleStops, setVehicleStops] = useState<Record<string, VehicleStop[]>>({})
  const [activeAlerts, setActiveAlerts] = useState<AlertEvent[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fleet-tracker_recent_searches')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [showMiniMapToggle, setShowMiniMapToggle] = useState(true)
  const [isActualFullscreen, setIsActualFullscreen] = useState(false)
  const [showRecentSearches, setShowRecentSearches] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Handle fullscreen via Fullscreen API
  const handleActualFullscreen = useCallback(async () => {
    if (!mapContainerRef.current) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        setIsActualFullscreen(false)
      } else {
        await mapContainerRef.current.requestFullscreen()
        setIsActualFullscreen(true)
      }
    } catch (error) {
      console.error('Erreur fullscreen:', error)
      // Fallback to UI fullscreen
      setIsFullscreen(!isFullscreen)
    }
  }, [isFullscreen])

  // Save recent search to localStorage
  const addRecentSearch = useCallback((search: string) => {
    if (!search.trim()) return
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('fleet-tracker_recent_searches', JSON.stringify(updated))
  }, [recentSearches])

  // Handle search with recent searches
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setShowRecentSearches(value.length === 0)
  }, [])

  const handleRecentSearchSelect = useCallback((search: string) => {
    setSearchTerm(search)
    addRecentSearch(search)
    setShowRecentSearches(false)
  }, [addRecentSearch])

  const handleSearchSubmit = useCallback(() => {
    if (searchTerm.trim()) {
      addRecentSearch(searchTerm)
      setShowRecentSearches(false)
    }
  }, [searchTerm, addRecentSearch])

  // Simulate vehicle trails (in production, fetch from API)
  useEffect(() => {
    if (selectedVehicle?.id) {
      // Generate mock trail for demo
      const trail: VehicleTrail = Array.from({ length: 10 }, (_, i) => ({
        lat: selectedVehicle.currentLat + (Math.random() - 0.5) * 0.05,
        lng: selectedVehicle.currentLng + (Math.random() - 0.5) * 0.05,
        timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
      }))
      setVehicleTrails(prev => ({ ...prev, [selectedVehicle.id]: trail }))

      // Generate mock stops for demo
      const stops: VehicleStop[] = Array.from({ length: 3 }, (_, i) => ({
        lat: selectedVehicle.currentLat + (Math.random() - 0.5) * 0.1,
        lng: selectedVehicle.currentLng + (Math.random() - 0.5) * 0.1,
        duration: (i + 1) * 15,
        timestamp: new Date(Date.now() - (3 - i) * 120000).toISOString(),
      }))
      setVehicleStops(prev => ({ ...prev, [selectedVehicle.id]: stops }))
    }
  }, [selectedVehicle?.id])

  // Generate mock alert events
  useEffect(() => {
    const alerts: AlertEvent[] = []
    filteredVehicles.forEach((v: any) => {
      if ((v.currentSpeed || 0) > 130) {
        alerts.push({
          id: `speed-${v.id}`,
          type: 'speed',
          lat: v.currentLat,
          lng: v.currentLng,
          timestamp: new Date().toISOString(),
          message: `Vitesse excessive: ${getFormattedSpeed(v.currentSpeed || 0, useImperialUnits).value} ${getFormattedSpeed(v.currentSpeed || 0, useImperialUnits).unit}`,
          vehicleId: v.id,
        })
      }
    })
    setActiveAlerts(alerts)
  }, [filteredVehicles, useImperialUnits])

  const handleShortcut = (action: string) => {
    switch (action) {
      case 'fullscreen':
        handleActualFullscreen()
        break
      case 'traffic':
        setShowTraffic(!showTraffic)
        break
      case 'streets':
        setMapStyle('plan')
        break
      case 'satellite':
        setMapStyle('satellite')
        break
      case 'terrain':
        setMapStyle('relief')
        break
    }
  }

  return (
    <div ref={mapContainerRef} className={`flex h-full bg-[#F5F7FA] gap-4 ${isActualFullscreen ? 'fixed inset-0 z-[10000] w-screen h-screen' : ''}`}>
      {/* Map */}
      <div className={`relative ${isFullscreen ? 'w-full' : 'flex-1'} rounded-lg border border-gray-200 overflow-hidden shadow-sm`}>
        {/* Map Style Selector */}
        <div className="absolute top-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-2 flex gap-1.5 backdrop-blur border border-gray-200">
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
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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

          {/* Vehicle trails and breadcrumbs for selected vehicle */}
          {selectedVehicle?.id && vehicleTrails[selectedVehicle.id] && (
            <VehicleTrail trail={vehicleTrails[selectedVehicle.id]} />
          )}

          {/* Event markers */}
          <EventMarkersComponent alerts={activeAlerts} />

          {displayedVehicles.map((vehicle: any) => {
            const idleInfo = calculateIdleDuration(vehicle.currentSpeed || 0, vehicle.lastCommunication)
            return (
              <div key={vehicle.id}>
                <Marker
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
                    <div className="min-w-48 p-1 bg-white text-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm font-sans">{vehicle.name}</p>
                          <p className="text-xs text-gray-500">{vehicle.plate}</p>
                        </div>
                        {vehicle.gpsProviderFailover && (
                          <div title="Basculement fournisseur actif">
                            <AlertCircle size={14} className="text-amber-500" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Vitesse:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit}</span>
                            {(vehicle.currentSpeed || 0) > 130 && (
                              <Badge className="bg-red-500 text-white text-xs gap-1">
                                <AlertCircle size={10} />
                                EXCÈS
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(vehicle.currentSpeed || 0) <= 2 && idleInfo.durationStr && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">À l'arrêt depuis:</span>
                            <span className="font-medium text-blue-600">{idleInfo.durationStr}</span>
                          </div>
                        )}
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
                        {vehicle._clusterCount && vehicle._clusterCount > 1 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-gray-500 font-medium">{vehicle._clusterCount} véhicules dans cette zone</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        className="mt-2 w-full text-xs text-blue-600 hover:text-[#3B82F6] font-medium"
                      >
                        Voir détails →
                      </button>
                    </div>
                  </Popup>
                </Marker>

                {/* Display stop markers for stopped vehicles */}
                {(vehicle.currentSpeed || 0) <= 2 && (
                  <CircleMarker
                    center={[vehicle.currentLat, vehicle.currentLng]}
                    radius={6}
                    fillColor="#EF4444"
                    color="#EF4444"
                    weight={2}
                    opacity={0.6}
                    fillOpacity={0.3}
                  />
                )}
              </div>
            )
          })}

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
                <div className="text-sm bg-white text-gray-900">
                  <p className="font-bold font-sans">{marker.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Zoom level display */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
          <div className="bg-white rounded-xl shadow-lg px-3 py-1.5 text-xs font-medium text-gray-900 border border-gray-200 backdrop-blur">
            Zoom: {currentZoom}
            {currentZoom < 10 && (
              <span className="ml-1 text-gray-500 text-xs">(groupage actif)</span>
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
            className="gap-2 bg-white shadow-lg border border-gray-200 text-gray-900 hover:bg-gray-50 backdrop-blur rounded-xl transition-colors"
          >
            {tileLayer === 'streets' ? <Satellite size={16} /> : tileLayer === 'satellite' ? <MapIcon size={16} /> : <Layers size={16} />}
            {tileLayer === 'streets' ? 'Satellite' : tileLayer === 'satellite' ? 'Terrain' : 'Plan'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowTraffic(!showTraffic)}
            className={`gap-2 shadow-lg backdrop-blur border rounded-xl ${showTraffic ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'}`}
          >
            <Wind size={16} />
            Trafic
          </Button>
          <Button
            size="sm"
            onClick={handleActualFullscreen}
            className="gap-2 bg-white shadow-lg border border-gray-200 text-gray-900 hover:bg-gray-50 backdrop-blur rounded-xl transition-colors"
            title="Appuyez sur F pour un raccourci"
          >
            <Maximize2 size={16} />
            {isActualFullscreen ? 'Quitter plein écran' : 'Plein écran'}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowManualGps(!showManualGps)}
            className="gap-2 bg-white shadow-lg border border-gray-200 text-gray-900 hover:bg-gray-50 backdrop-blur rounded-xl transition-colors"
          >
            <MapPin size={16} />
            Saisie manuelle
          </Button>
        </div>

        {/* Stats overlay with timezone */}
        <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2">
          {/* Provider failover indicator */}
          <div className="rounded-xl bg-white px-3 py-1.5 shadow-lg text-xs font-medium flex items-center gap-1.5 border border-gray-200 text-gray-900 backdrop-blur">
            <span className={`h-2 w-2 rounded-full inline-block ${providerStatus.flespi.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Fournisseur principal: Flespi
            {providerStatus.flespi.failoverActive && <AlertCircle size={12} className="text-amber-500" />}
          </div>
          {/* Timezone display */}
          <div className="rounded-xl bg-white px-3 py-1.5 shadow-lg text-xs font-medium flex items-center gap-1.5 border border-gray-200 text-gray-900 backdrop-blur">
            <Clock size={12} className="text-blue-600" />
            {getCurrentTimezone().offset} ({getCurrentTimezone().name})
          </div>
        </div>

        {/* Fleet stats overlay - Vehicle count by status */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-3 text-xs font-medium border border-gray-200 text-gray-900 backdrop-blur">
          <p className="font-sans font-semibold mb-1.5">Statut des véhicules</p>
          <div className="flex gap-4 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 inline-block"></span>
              <span>En mouvement: <span className="font-bold text-gray-900">{movingCount}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#9CA3AF] inline-block"></span>
              <span>À l'arrêt: <span className="font-bold text-gray-900">{stoppedCount}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block"></span>
              <span>Hors ligne: <span className="font-bold text-gray-900">{offlineCount}</span></span>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex gap-4 text-gray-500">
            <span>Vitesse moy.: <span className="font-bold text-gray-900">{getFormattedSpeed(avgFleetSpeed, useImperialUnits).value} {getFormattedSpeed(avgFleetSpeed, useImperialUnits).unit}</span></span>
            <span>{vehiclesWithGps.length}/{vehicles.length} GPS actif</span>
            <div className={`flex items-center gap-1.5 ${isConnected ? 'text-blue-600' : 'text-gray-500'}`}>
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isConnected ? 'Live' : 'Polling'}
            </div>
          </div>
        </div>

        {/* Speed Legend - Marker color meanings */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-xl shadow-lg p-3 text-xs border border-gray-200 text-gray-900 backdrop-blur">
          <p className="font-sans font-semibold mb-2">Légende des couleurs</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 inline-block"></span>
              <span className="text-gray-500">En mouvement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#9CA3AF] inline-block"></span>
              <span className="text-gray-500">À l'arrêt</span>
            </div>
            <div className="border-t border-gray-200 pt-1.5 mt-1.5">
              <p className="text-gray-500 font-medium mb-1">Types de véhicules</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3b82f6] inline-block"></span>
                  <span className="text-gray-500">Voiture</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f97316] inline-block"></span>
                  <span className="text-gray-500">Camion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#8b5cf6] inline-block"></span>
                  <span className="text-gray-500">Utilitaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#ef4444] inline-block"></span>
                  <span className="text-gray-500">Moto</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mini-map overview in bottom-right corner */}
        {showMiniMap && (
          <div className="absolute bottom-4 right-80 z-[1000]">
            <Card className="shadow-lg bg-white border border-gray-200 rounded-xl">
              <div className="relative w-56 h-40 rounded overflow-hidden">
                <MapContainer
                  center={[43.7, 3.87]}
                  zoom={5}
                  className="h-full w-full z-0"
                  zoomControl={false}
                  dragging={false}
                  doubleClickZoom={false}
                  boxZoom={false}
                  keyboard={false}
                  scrollWheelZoom={false}
                  touchZoom={false}
                >
                  <TileLayer url={MAPBOX_TILE_URL('dark-v11')} attribution="" tileSize={512} zoomOffset={-1} />
                  {vehiclesWithGps.map((v: any) => (
                    <CircleMarker
                      key={`minimap-${v.id}`}
                      center={[v.currentLat, v.currentLng]}
                      radius={3}
                      fillColor="#4361EE"
                      color="#4361EE"
                      weight={1}
                      opacity={0.8}
                      fillOpacity={0.7}
                    />
                  ))}
                </MapContainer>
                {/* Mini-map label */}
                <div className="absolute top-2 left-2 z-[1001] bg-white rounded-lg px-2 py-1 text-xs font-medium text-gray-900 border border-gray-200 shadow-sm">
                  {vehiclesWithGps.length} véhicules
                </div>
                <button
                  onClick={() => setShowMiniMap(false)}
                  className="absolute top-2 right-2 z-[1001] text-gray-500 hover:text-gray-900 bg-white rounded w-6 h-6 flex items-center justify-center shadow-sm"
                >
                  ×
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Manual GPS entry form */}
        {showManualGps && (
          <div className="absolute top-20 right-4 z-[1000]">
            <Card className="w-72 shadow-lg bg-white border border-gray-200 rounded-xl">
              <CardHeader className="pb-2 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-sans text-gray-900">Saisie manuelle GPS</CardTitle>
                  <button
                    onClick={() => setShowManualGps(false)}
                    className="text-gray-500 hover:text-gray-900"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Véhicule</label>
                  <select
                    value={manualGpsForm.vehicleId}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, vehicleId: e.target.value })}
                    className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Sélectionner un véhicule</option>
                    {vehicles.map((v: any) => (
                      <option key={v.id} value={v.id} className="bg-white text-gray-900">
                        {v.name} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Latitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="43.7"
                    value={manualGpsForm.lat}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lat: e.target.value })}
                    className="h-8 text-xs bg-white border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Longitude</label>
                  <Input
                    type="number"
                    step="0.00001"
                    placeholder="3.87"
                    value={manualGpsForm.lng}
                    onChange={(e) => setManualGpsForm({ ...manualGpsForm, lng: e.target.value })}
                    className="h-8 text-xs bg-white border border-gray-200 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
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
                  className="w-full text-xs h-8 bg-blue-600 text-white hover:bg-[#3B82F6] disabled:opacity-50"
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
            className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 shadow-lg backdrop-blur rounded-xl"
            onClick={() => setShowHelpPopover(!showHelpPopover)}
          >
            <HelpCircle size={16} />
          </Button>
        </div>

        {/* Vehicle Detail Panel */}
        {selectedVehicle && !isFullscreen && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 z-[999] flex flex-col overflow-hidden rounded-l-xl">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-sans font-bold text-gray-900">{selectedVehicle.plate}</h2>
                  <Badge
                    className={`text-xs mt-1 ${selectedVehicle.currentSpeed > 2 ? 'bg-blue-600 text-white' : 'bg-[#9CA3AF] text-gray-900'}`}
                  >
                    {selectedVehicle.currentSpeed > 2 ? 'EN MOUVEMENT' : 'À L\'ARRÊT'}
                  </Badge>
                </div>
                <button
                  onClick={() => selectVehicle(null)}
                  className="text-gray-500 hover:text-gray-900 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => setActiveDetailTab('temps-reel')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
                  activeDetailTab === 'temps-reel'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                TEMPS RÉEL
              </button>
              <button
                onClick={() => setActiveDetailTab('historique')}
                className={`flex-1 px-4 py-2 text-xs font-medium transition-all ${
                  activeDetailTab === 'historique'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                HISTORIQUE
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeDetailTab === 'temps-reel' ? (
                <div className="divide-y divide-gray-200">
                  {/* IDENTITÉ section */}
                  <div className="p-4">
                    <h3 className="text-xs font-sans font-bold text-gray-900 uppercase tracking-wide mb-3">Identité</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plaque</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.plate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">VIN</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.vin || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Statut API</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.apiStatus || 'Actif'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Flotte ID</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.fleetId || selectedVehicle.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* APPAREIL GPS section */}
                  <div className="p-4">
                    <h3 className="text-xs font-sans font-bold text-gray-900 uppercase tracking-wide mb-3">Appareil GPS</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.gpsDeviceType || 'Standard'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">ID Appareil</span>
                        <span className="font-medium text-gray-900 truncate">{selectedVehicle.gpsDeviceId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TÉLÉMÉTRIE section */}
                  <div className="p-4">
                    <h3 className="text-xs font-sans font-bold text-gray-900 uppercase tracking-wide mb-3">Télémétrie</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vitesse</span>
                        <span className="font-medium text-gray-900">
                          {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}
                        </span>
                      </div>
                      {(selectedVehicle.currentSpeed || 0) <= 2 && calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr && (
                        <div className="flex justify-between text-blue-600 font-medium">
                          <span className="text-gray-500">À l'arrêt depuis</span>
                          <span>{calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Odomètre</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.odometer || 'N/A'} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Carburant</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.fuelLevel || 'N/A'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* POSITION section */}
                  <div className="p-4">
                    <h3 className="text-xs font-sans font-bold text-gray-900 uppercase tracking-wide mb-3">Position</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Latitude</span>
                        <span className="font-mono text-gray-900">{selectedVehicle.currentLat?.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Longitude</span>
                        <span className="font-mono text-gray-900">{selectedVehicle.currentLng?.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* ACTIVITÉ section */}
                  <div className="p-4">
                    <h3 className="text-xs font-sans font-bold text-gray-900 uppercase tracking-wide mb-3">Activité</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dernière com.</span>
                        <span className="font-medium text-gray-900">{formatTimeAgo(selectedVehicle.lastCommunication)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Début trajet</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.tripStart || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fin trajet</span>
                        <span className="font-medium text-gray-900">{selectedVehicle.tripEnd || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-xs text-gray-500">
                  <p>Historique non disponible</p>
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="border-t border-gray-200 p-4 flex gap-2 bg-white">
              <button
                onClick={() => navigate(`/vehicles/${selectedVehicle.id}`)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-[#3B82F6] transition-colors"
              >
                <Edit2 size={14} />
                Éditer
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 rounded text-xs font-medium hover:bg-red-500/20 transition-colors border border-red-500/30"
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
        {/* Search with recent searches dropdown */}
        <Card className="bg-white rounded-xl border border-gray-200 shadow-lg">
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={16} />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Rechercher un véhicule..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                onFocus={() => setShowRecentSearches(searchTerm.length === 0 && recentSearches.length > 0)}
                className="pl-9 h-10 bg-white border border-gray-200 text-gray-900 placeholder-[#9CA3AF] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg"
              />

              {/* Recent searches dropdown */}
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] overflow-hidden">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200">
                    Recherches récentes
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRecentSearchSelect(search)}
                        className="w-full text-left px-3 py-2 text-xs text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <Clock size={12} className="text-gray-500" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle list with filters */}
        <Card className="flex-1 overflow-hidden flex flex-col bg-white rounded-xl border border-gray-200 shadow-lg">
          {/* Filter Controls */}
          <CardHeader className="pb-3 pt-4">
            {/* SOURCE filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-900 mb-1.5">SOURCE</p>
              <div className="flex gap-1.5">
                {(['TOUS', 'ECHOES', 'UBIWAN', 'KEEPTRACE'] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setSourceFilter(source)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      sourceFilter === source
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* STATUT filter */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-900 mb-1.5">STATUT</p>
              <div className="flex gap-1.5">
                {(['TOUS', 'LOCALISÉS', 'NON LOC.'] as const).map((statut) => (
                  <button
                    key={statut}
                    onClick={() => setStatutFilter(statut)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      statutFilter === statut
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {statut}
                  </button>
                ))}
              </div>
            </div>

            {/* GROUPE filter */}
            <div className="mb-2">
              <p className="text-xs font-semibold text-gray-900 mb-1.5">GROUPE</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGroupeFilter('Tous')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    groupeFilter === 'Tous'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
          <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between text-xs font-semibold text-gray-900">
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
                    className={`w-full rounded-lg border-l-4 border-b border-r border-t p-2.5 text-left transition-all bg-white ${
                      selectedVehicleId === vehicle.id
                        ? 'border-l-blue-600 border-gray-200 bg-blue-50 shadow-sm'
                        : 'border-l-transparent border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{vehicle.plate}</p>
                        <p className="text-xs text-gray-500 truncate">{vehicle.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-medium text-gray-900">
                          {hasGps ? `${getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value}` : '—'}
                        </p>
                        <p className="text-xs text-gray-500">{vehicle.gpsProvider || '—'}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* GPS Provider Status Panel */}
        <Card className="bg-white rounded-xl border border-gray-200 shadow-lg">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowProviderPanel(!showProviderPanel)}>
              <CardTitle className="text-sm font-sans font-semibold text-gray-900">Fournisseurs GPS</CardTitle>
              <ChevronDown
                size={16}
                className={`transition-transform text-gray-500 ${showProviderPanel ? 'rotate-0' : '-rotate-90'}`}
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
                <div key={provider.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-900">{provider.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {providerStatus[provider.key as keyof typeof providerStatus].status === 'connected' ? (
                        <>
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span className="text-gray-500">Connecté</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} className="text-red-500" />
                          <span className="text-gray-500">Erreur</span>
                        </>
                      )}
                    </div>
                    {providerStatus[provider.key as keyof typeof providerStatus].failoverActive && (
                      <Badge className="text-xs bg-amber-500/20 text-amber-500 border-amber-500/30">
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
          <Card className="bg-white rounded-xl border border-gray-200 shadow-lg">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-sans font-semibold text-gray-900">{selectedVehicle.name}</CardTitle>
                <Badge
                  className={`text-xs ${selectedVehicle.currentSpeed > 2 ? 'bg-blue-600 text-white' : 'bg-[#9CA3AF] text-gray-900'}`}
                >
                  {selectedVehicle.currentSpeed > 2 ? 'En route' : 'Arrêté'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm pb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 rounded-lg p-2 border border-gray-200">
                  <p className="text-gray-500">Vitesse</p>
                  <p className="font-bold text-lg text-gray-900">{getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value}<span className="text-xs font-normal"> {getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}</span></p>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 border border-gray-200">
                  <p className="text-gray-500">Cap</p>
                  <p className="font-bold text-lg text-gray-900">{(selectedVehicle.currentHeading || 0).toFixed(0)}<span className="text-xs font-normal">°</span></p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                <p>Position: <span className="font-mono text-gray-900">{selectedVehicle.currentLat?.toFixed(5)}, {selectedVehicle.currentLng?.toFixed(5)}</span></p>
                <p>Dernière com.: {formatTimeAgo(selectedVehicle.lastCommunication)}</p>
                {(selectedVehicle as any).gpsProvider && (
                  <p>Fournisseur: <span className="font-medium text-gray-900">{(selectedVehicle as any).gpsProvider}</span></p>
                )}
              </div>
              <Button
                className="w-full gap-2 bg-blue-600 text-white hover:bg-[#3B82F6]"
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
