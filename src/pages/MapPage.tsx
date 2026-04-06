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
import { TOMTOM_TILE_URL, TOMTOM_TRAFFIC_FLOW_URL } from '@/lib/constants'

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
        className="absolute bottom-16 right-4 z-[400] bg-white shadow-lg rounded-xl p-2 hover:bg-gray-50 border border-gray-200"
        title="Press ? for help"
      >
        <HelpCircle size={16} className="text-gray-500" />
      </button>

      {showHelp && (
        <div className="absolute bottom-28 right-4 z-[400] bg-white shadow-lg rounded-xl p-3 border border-gray-200 w-56 text-xs backdrop-blur">
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
    <div className="absolute bottom-32 left-56 z-[400] w-56 h-56 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white pointer-events-none">
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
        <TileLayer url={TOMTOM_TILE_URL('dark')} attribution="&copy; TomTom" />
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
        return TOMTOM_TILE_URL('satellite')
      case 'relief':
        return TOMTOM_TILE_URL('hybrid')
      case 'sombre':
        return TOMTOM_TILE_URL('dark')
      case 'clair':
        return TOMTOM_TILE_URL('basic')
      case 'plan':
      default:
        return TOMTOM_TILE_URL('basic')
    }
  }

  const tileUrl = getTileUrl(mapStyle)

  const tileAttribution = '&copy; <a href="https://www.tomtom.com/">TomTom</a>'

  const trafficUrl = TOMTOM_TRAFFIC_FLOW_URL

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
    <div ref={mapContainerRef} className={`flex h-full bg-white ${isActualFullscreen ? 'fixed inset-0 z-[10000] w-screen h-screen' : ''}`}>

      {/* ═══ LEFT SIDEBAR ═══ */}
      {!isFullscreen && (
        <div className="w-[310px] flex flex-col overflow-hidden bg-white border-r border-gray-200 shrink-0">
          {/* Action buttons bar */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-200">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4361EE] text-white rounded text-xs font-semibold hover:bg-[#3B52D3] transition-colors">
              <span className="text-sm">+</span> VÉHICULE
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              PARTAGE
            </button>
            <div className="flex-1" />
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Exporter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Paramètres">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </button>
          </div>

          {/* Map style selector row */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
            {([
              { id: 'plan', label: 'Plan' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'relief', label: 'Relief' },
              { id: 'sombre', label: 'Sombre' },
              { id: 'clair', label: 'Clair' },
            ] as const).map((style) => (
              <button
                key={style.id}
                onClick={() => setMapStyle(style.id as MapStyle)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  mapStyle === style.id
                    ? 'bg-[#4361EE] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-white hover:text-gray-700'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Nom, plaque, VIN, ville..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit()}
                onFocus={() => setShowRecentSearches(searchTerm.length === 0 && recentSearches.length > 0)}
                className="pl-9 h-9 bg-white border border-gray-300 text-gray-900 text-xs placeholder-gray-400 focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] rounded"
              />
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded shadow-xl z-[100] overflow-hidden">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">Recherches récentes</div>
                  {recentSearches.map((search, idx) => (
                    <button key={idx} onClick={() => handleRecentSearchSelect(search)} className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2">
                      <Clock size={11} className="text-gray-300" />{search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SOURCE filter */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">SOURCE</p>
            <div className="flex flex-wrap gap-1">
              {(['TOUS', 'ECHOES', 'UBIWAN', 'KEEPTRACE'] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    sourceFilter === source
                      ? 'bg-[#4361EE] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          {/* STATUT filter */}
          <div className="px-3 pt-2 pb-2.5 border-b border-gray-200">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">STATUT</p>
            <div className="flex gap-1">
              {(['TOUS', 'LOCALISÉS', 'NON LOC.'] as const).map((statut) => (
                <button
                  key={statut}
                  onClick={() => setStatutFilter(statut)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                    statutFilter === statut
                      ? 'bg-[#4361EE] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {statut}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle list header */}
          <div className="px-3 py-2 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50">
            <span>VÉHICULE — {filteredVehicles.length} RÉSULTATS</span>
            <span>VITESSE</span>
          </div>

          {/* Vehicle list */}
          <div className="flex-1 overflow-y-auto">
            {filteredVehicles.map((vehicle: any) => {
              const isMoving = (vehicle.currentSpeed || 0) > 2
              const hasGps = vehicle.currentLat && vehicle.currentLng
              const isSelected = selectedVehicleId === vehicle.id
              return (
                <button
                  key={vehicle.id}
                  onClick={() => selectVehicle(vehicle.id)}
                  className={`w-full px-3 py-2.5 text-left transition-all border-b border-gray-100 ${
                    isSelected
                      ? 'bg-blue-50 border-l-3 border-l-[#4361EE]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-[13px] ${isSelected ? 'text-[#4361EE]' : 'text-gray-900'}`}>{vehicle.plate || vehicle.name}</p>
                      <p className="text-[11px] text-gray-400 truncate uppercase">{vehicle.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[11px] font-medium text-gray-500 uppercase">{vehicle.gpsProvider || '—'}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ CENTER MAP ═══ */}
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          center={[43.7, 3.87]}
          zoom={6}
          className="h-full w-full z-0"
          zoomControl={true}
        >
          <TileLayer url={tileUrl} attribution={tileAttribution} />
          {showTraffic && <TileLayer url={trafficUrl} attribution="" opacity={0.6} />}

          <FitBounds vehicles={vehicles} />
          <KeyboardShortcuts onShortcut={handleShortcut} />
          <MapEvents onZoomChange={setCurrentZoom} />

          {selectedVehicle?.currentLat && selectedVehicle?.currentLng && (
            <FlyToVehicle lat={selectedVehicle.currentLat} lng={selectedVehicle.currentLng} />
          )}

          {selectedVehicle?.id && vehicleTrails[selectedVehicle.id] && (
            <VehicleTrail trail={vehicleTrails[selectedVehicle.id]} />
          )}

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
                  eventHandlers={{ click: () => selectVehicle(vehicle.id) }}
                >
                  <Popup>
                    <div className="min-w-48 p-1 bg-white text-gray-900">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-sm font-sans">{vehicle.plate || vehicle.name}</p>
                          <p className="text-xs text-gray-500">{vehicle.name}</p>
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vitesse:</span>
                          <span className="font-medium">{getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value} {getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fournisseur:</span>
                          <span className="font-medium">{vehicle.gpsProvider || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Dernière com.:</span>
                          <span className="font-medium">{formatTimeAgo(vehicle.lastCommunication)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                        className="mt-2 w-full text-xs text-[#4361EE] hover:text-[#3B52D3] font-medium"
                      >
                        Voir détails →
                      </button>
                    </div>
                  </Popup>
                </Marker>
                {(vehicle.currentSpeed || 0) <= 2 && (
                  <CircleMarker center={[vehicle.currentLat, vehicle.currentLng]} radius={6} fillColor="#6b7280" color="#6b7280" weight={1} opacity={0.4} fillOpacity={0.2} />
                )}
              </div>
            )
          })}

          {manualMarkers.map((marker, idx) => (
            <Marker key={`manual-${idx}`} position={[marker.lat, marker.lng]}
              icon={L.divIcon({ html: `<div style="width:16px;height:16px;background:#f97316;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`, className: 'manual-marker', iconSize: [16, 16], iconAnchor: [8, 8] })}>
              <Popup><div className="text-sm"><p className="font-bold">{marker.name}</p><p className="text-xs text-gray-500 font-mono">{marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}</p></div></Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ═══ RIGHT DETAIL PANEL ═══ */}
      {selectedVehicle && !isFullscreen && (
        <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0">
          {/* Header with vehicle name */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">{selectedVehicle.plate || selectedVehicle.name}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/vehicles/${selectedVehicle.id}`)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors" title="Éditer">
                  <Edit2 size={14} />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Supprimer">
                  <Trash2 size={14} />
                </button>
                <span className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase ${selectedVehicle.currentSpeed > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedVehicle.currentSpeed > 2 ? 'EN ROUTE' : "À L'ARRÊT"}
                </span>
                <button onClick={() => selectVehicle(null)} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveDetailTab('temps-reel')}
              className={`flex items-center gap-1.5 flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${
                activeDetailTab === 'temps-reel'
                  ? 'text-[#4361EE] border-[#4361EE]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Wifi size={12} />
              TEMPS RÉEL
            </button>
            <button
              onClick={() => setActiveDetailTab('historique')}
              className={`flex items-center gap-1.5 flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${
                activeDetailTab === 'historique'
                  ? 'text-[#4361EE] border-[#4361EE]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <Clock size={12} />
              HISTORIQUE
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeDetailTab === 'temps-reel' ? (
              <div className="divide-y divide-gray-100">
                {/* IDENTITÉ */}
                <div className="px-4 py-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">IDENTITÉ</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-gray-500">Plaque</span><span className="font-medium text-gray-900">{selectedVehicle.plate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">VIN</span><span className="font-medium text-gray-900 text-[12px] font-mono">{selectedVehicle.vin || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Statut API</span><span className="font-medium text-gray-900 uppercase text-[12px]">{selectedVehicle.apiStatus || 'ENABLED'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Flotte ID</span><span className="font-medium text-gray-900">{selectedVehicle.fleetId || '—'}</span></div>
                  </div>
                </div>

                {/* APPAREIL GPS */}
                <div className="px-4 py-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">APPAREIL GPS</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium text-gray-900">{selectedVehicle.gpsDeviceType || 'Standard'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">ID Appareil</span><span className="font-medium text-gray-900 font-mono text-[12px]">{selectedVehicle.gpsDeviceId || 'N/A'}</span></div>
                  </div>
                </div>

                {/* TÉLÉMÉTRIE */}
                <div className="px-4 py-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">TÉLÉMÉTRIE</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vitesse</span>
                      <span className={`font-medium ${(selectedVehicle.currentSpeed || 0) > 2 ? 'text-green-600' : 'text-red-500'}`}>
                        {(selectedVehicle.currentSpeed || 0) > 0
                          ? `${getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value} ${getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between"><span className="text-gray-500">Odomètre</span><span className="font-medium text-gray-900">{selectedVehicle.odometer ? `${Math.round(selectedVehicle.odometer / 1000)} km` : 'N/A'}</span></div>
                    {(selectedVehicle.currentSpeed || 0) <= 2 && calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr && (
                      <div className="flex justify-between"><span className="text-gray-500">À l'arrêt depuis</span><span className="font-medium text-amber-600">{calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr}</span></div>
                    )}
                  </div>
                </div>

                {/* POSITION */}
                <div className="px-4 py-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">POSITION</h3>
                  <div className="space-y-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-gray-500">Latitude</span><span className="font-mono text-gray-900 text-[12px]">{selectedVehicle.currentLat?.toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Longitude</span><span className="font-mono text-gray-900 text-[12px]">{selectedVehicle.currentLng?.toFixed(6)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Dernière com.</span><span className="font-medium text-gray-900">{formatTimeAgo(selectedVehicle.lastCommunication)}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-sm text-gray-400 text-center py-12">
                <Clock size={32} className="mx-auto text-gray-200 mb-2" />
                Historique non disponible
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => navigate(`/vehicles/${selectedVehicle.id}`)}
              className="w-full text-center px-4 py-2 text-[#4361EE] border border-[#4361EE] rounded text-xs font-semibold hover:bg-[#4361EE] hover:text-white transition-colors"
            >
              RAFRAÎCHIR
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
