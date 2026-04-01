import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MAPBOX_TILE_URL } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Gauge,
  Clock,
  MapPin,
  Route,
  Navigation,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { formatDateTime, formatDuration, formatSpeed, getDistance } from '@/lib/utils'

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface GpsPosition {
  lat: number
  lng: number
  speed: number
  heading: number
  timestamp: string
}

interface ReplayStats {
  totalDistance: number
  totalDuration: number
  avgSpeed: number
  maxSpeed: number
  numStops: number
}

interface GpsReplayPlayerProps {
  vehicleId: string
  vehicleName: string
  onClose?: () => void
}

type PlaybackSpeed = 1 | 2 | 5 | 10

// Helper function to get polyline color based on speed (km/h)
const getSpeedColor = (speed: number): string => {
  if (speed < 50) return '#22c55e' // green
  if (speed < 90) return '#eab308' // yellow
  if (speed < 120) return '#f97316' // orange
  return '#ef4444' // red
}

// Helper function to calculate distance between two points (km)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Helper function to find index closest to a given time (in seconds offset from current)
const findIndexByTimeOffset = (positions: GpsPosition[], currentTime: Date, offsetSeconds: number): number => {
  const targetTime = currentTime.getTime() + offsetSeconds * 1000
  let closestIndex = 0
  let minDiff = Math.abs(new Date(positions[0].timestamp).getTime() - targetTime)

  for (let i = 1; i < positions.length; i++) {
    const posTime = new Date(positions[i].timestamp).getTime()
    const diff = Math.abs(posTime - targetTime)
    if (diff < minDiff) {
      minDiff = diff
      closestIndex = i
    }
  }

  return closestIndex
}

// Map view controller component
const MapViewController = ({
  positions,
  currentPosition,
}: {
  positions: GpsPosition[]
  currentPosition: GpsPosition | null
}) => {
  const map = useMap()

  useEffect(() => {
    if (positions.length === 0) return

    // Calculate bounds from all positions
    const bounds = L.latLngBounds(
      positions.map((p) => [p.lat, p.lng] as [number, number])
    )

    // Fit map to bounds with padding
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [positions, map])

  return null
}

// Main component
export const GpsReplayPlayer: React.FC<GpsReplayPlayerProps> = ({
  vehicleId,
  vehicleName,
  onClose,
}) => {
  const orgId = useAuthStore((s) => s.user?.organizationId) || ''
  const [positions, setPositions] = useState<GpsPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [stats, setStats] = useState<ReplayStats>({
    totalDistance: 0,
    totalDuration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    numStops: 0,
  })

  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(Date.now())

  // Fetch GPS history
  useEffect(() => {
    const fetchGpsHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!orgId) {
          setError('Organization ID not found')
          return
        }

        const endpoint = API_ROUTES.GPS_PLAYBACK(orgId, vehicleId)
        const response = await apiClient.get<GpsPosition[]>(endpoint)

        const data = response.data as GpsPosition[]
        if (!data || data.length === 0) {
          setError('No GPS history available for this vehicle')
          return
        }

        setPositions(data)
        calculateStats(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch GPS history'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchGpsHistory()
  }, [vehicleId, orgId])

  // Calculate statistics
  const calculateStats = (data: GpsPosition[]) => {
    if (data.length === 0) return

    let totalDistance = 0
    let maxSpeed = 0
    let speedSum = 0
    let stopCount = 0
    let consecutiveStops = 0

    for (let i = 0; i < data.length; i++) {
      const current = data[i]
      maxSpeed = Math.max(maxSpeed, current.speed)
      speedSum += current.speed

      // Distance calculation
      if (i > 0) {
        const prev = data[i - 1]
        totalDistance += calculateDistance(prev.lat, prev.lng, current.lat, current.lng)
      }

      // Stop detection (speed = 0 for > 30 seconds)
      if (current.speed === 0) {
        consecutiveStops++
        if (consecutiveStops === 1 && i > 0) {
          // Check if previous point also had speed 0
          if (data[i - 1].speed !== 0) {
            stopCount++
          }
        }
      } else {
        consecutiveStops = 0
      }
    }

    const startTime = new Date(data[0].timestamp).getTime()
    const endTime = new Date(data[data.length - 1].timestamp).getTime()
    const totalDuration = (endTime - startTime) / 1000 // in seconds
    const avgSpeed = data.length > 0 ? speedSum / data.length : 0

    setStats({
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalDuration: Math.round(totalDuration),
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      maxSpeed: Math.round(maxSpeed * 10) / 10,
      numStops: stopCount,
    })
  }

  // Handle date preset buttons
  const handleDatePreset = useCallback((preset: 'today' | 'yesterday' | '7days' | '30days') => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (preset) {
      case 'today':
        start = startOfDay(now)
        end = now
        break
      case 'yesterday':
        const yesterday = subDays(now, 1)
        start = startOfDay(yesterday)
        end = endOfDay(yesterday)
        break
      case '7days':
        start = subDays(now, 7)
        end = now
        break
      case '30days':
        start = subDays(now, 30)
        end = now
        break
    }

    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }, [])

  // Find stops (speed = 0 for > 30 seconds)
  const stops = useMemo(() => {
    const stopMarkers: GpsPosition[] = []
    let consecutiveZeroCount = 0
    let lastZeroIndex = -1

    for (let i = 0; i < positions.length; i++) {
      if (positions[i].speed === 0) {
        consecutiveZeroCount++
        lastZeroIndex = i
      } else {
        if (consecutiveZeroCount > 1) {
          // More than 1 point with speed 0 indicates a stop
          stopMarkers.push(positions[lastZeroIndex])
        }
        consecutiveZeroCount = 0
      }
    }

    // Handle case where route ends with a stop
    if (consecutiveZeroCount > 1) {
      stopMarkers.push(positions[lastZeroIndex])
    }

    return stopMarkers
  }, [positions])

  // Create colored polyline segments
  const polylineSegments = useMemo(() => {
    const segments: Array<{ positions: [number, number][]; color: string }> = []

    for (let i = 0; i < positions.length - 1; i++) {
      const current = positions[i]
      const next = positions[i + 1]
      const color = getSpeedColor(current.speed)

      const segment = {
        positions: [
          [current.lat, current.lng],
          [next.lat, next.lng],
        ] as [number, number][],
        color,
      }

      segments.push(segment)
    }

    return segments
  }, [positions])

  // Detect harsh braking events (speed change > 30 km/h)
  const brakingEvents = useMemo(() => {
    const events: Array<{ position: GpsPosition; index: number }> = []

    for (let i = 1; i < positions.length; i++) {
      const current = positions[i]
      const prev = positions[i - 1]
      const speedDelta = Math.abs(current.speed - prev.speed)

      if (speedDelta > 30) {
        events.push({ position: current, index: i })
      }
    }

    return events
  }, [positions])

  // Current position
  const currentPosition = useMemo(() => {
    if (positions.length === 0) return null
    return positions[currentIndex]
  }, [positions, currentIndex])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || positions.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const animate = () => {
      const now = Date.now()
      const deltaTime = (now - lastTimeRef.current) / 1000 // Convert to seconds
      lastTimeRef.current = now

      // Calculate how many positions to advance based on playback speed and time
      const positionsPerSecond = 1 // Adjust based on your data frequency
      const advance = Math.max(1, Math.floor(deltaTime * positionsPerSecond * playbackSpeed))

      setCurrentIndex((prev) => {
        const newIndex = prev + advance
        if (newIndex >= positions.length) {
          setIsPlaying(false)
          return positions.length - 1
        }
        return newIndex
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    lastTimeRef.current = Date.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, positions.length, playbackSpeed])

  // Stop animation on unmount
  useEffect(() => {
    return () => {
      setIsPlaying(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading GPS history...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-2">Error Loading GPS History</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">No GPS History</h3>
                <p className="text-sm text-muted-foreground">
                  No GPS history available for {vehicleName}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full h-full max-w-6xl max-h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{vehicleName} - GPS History Replay</h2>
            <p className="text-sm text-muted-foreground">
              {positions[0].timestamp} to {positions[positions.length - 1].timestamp}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
          {/* Map */}
          <div className="flex-1 rounded-lg overflow-hidden border">
            <MapContainer
              center={[positions[0].lat, positions[0].lng]}
              zoom={13}
              style={{ width: '100%', height: '100%' }}
              className="z-0"
            >
              <TileLayer
                url={MAPBOX_TILE_URL('streets-v12')}
                attribution='&copy; Mapbox &copy; OpenStreetMap'
                tileSize={512}
                zoomOffset={-1}
              />

              <MapViewController positions={positions} currentPosition={currentPosition} />

              {/* Route polyline segments (color-coded by speed) */}
              {polylineSegments.map((segment, idx) => (
                <Polyline
                  key={`route-${idx}`}
                  positions={segment.positions}
                  color={segment.color}
                  weight={3}
                  opacity={0.7}
                />
              ))}

              {/* Stop markers */}
              {stops.map((stop, idx) => (
                <CircleMarker
                  key={`stop-${idx}`}
                  center={[stop.lat, stop.lng]}
                  radius={6}
                  fillColor="#ef4444"
                  fillOpacity={0.8}
                  color="#dc2626"
                  weight={2}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Arrêt</p>
                      <p>{formatDateTime(new Date(stop.timestamp))}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Harsh braking markers (yellow triangles) */}
              {brakingEvents.map((event, idx) => (
                <Marker
                  key={`braking-${idx}`}
                  position={[event.position.lat, event.position.lng]}
                  icon={L.divIcon({
                    html: `<div style="
                      width: 0; height: 0;
                      border-left: 8px solid transparent; border-right: 8px solid transparent;
                      border-bottom: 14px solid #eab308;
                      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                    "></div>`,
                    className: 'braking-marker',
                    iconSize: [16, 14],
                    iconAnchor: [8, 14],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Freinage brusque</p>
                      <p className="text-xs text-gray-600">{formatDateTime(new Date(event.position.timestamp))}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Current position marker */}
              {currentPosition && (
                <Marker
                  position={[currentPosition.lat, currentPosition.lng]}
                  icon={L.divIcon({
                    html: `
                      <div style="
                        width: 24px;
                        height: 24px;
                        background: white;
                        border: 3px solid #3b82f6;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        transform: translate(-12px, -12px);
                      "></div>
                    `,
                    className: '',
                    iconSize: [24, 24],
                  })}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">Current Position</p>
                      <p>
                        {currentPosition.lat.toFixed(5)}, {currentPosition.lng.toFixed(5)}
                      </p>
                      <p>Speed: {formatSpeed(currentPosition.speed)}</p>
                      <p>{formatDateTime(new Date(currentPosition.timestamp))}</p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Start marker */}
              <Marker position={[positions[0].lat, positions[0].lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">Start</p>
                    <p>{formatDateTime(new Date(positions[0].timestamp))}</p>
                  </div>
                </Popup>
              </Marker>

              {/* End marker */}
              <Marker position={[positions[positions.length - 1].lat, positions[positions.length - 1].lng]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">End</p>
                    <p>{formatDateTime(new Date(positions[positions.length - 1].timestamp))}</p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-sm font-semibold">{stats.totalDistance.toFixed(2)} km</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">{formatDuration(stats.totalDuration)}</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Avg Speed</p>
                <p className="text-sm font-semibold">{formatSpeed(stats.avgSpeed)}</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Max Speed</p>
                <p className="text-sm font-semibold">{formatSpeed(stats.maxSpeed)}</p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stops</p>
                <p className="text-sm font-semibold">{stats.numStops}</p>
              </div>
            </div>
          </div>

          {/* Current position info */}
          {currentPosition && (
            <div className="bg-secondary rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Latitude</p>
                <p className="text-sm font-mono">{currentPosition.lat.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Longitude</p>
                <p className="text-sm font-mono">{currentPosition.lng.toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-sm font-semibold">{formatSpeed(currentPosition.speed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heading</p>
                <p className="text-sm font-semibold">{Math.round(currentPosition.heading)}°</p>
              </div>
              <div className="md:col-span-4">
                <p className="text-xs text-muted-foreground">Timestamp</p>
                <p className="text-sm font-mono">{formatDateTime(new Date(currentPosition.timestamp))}</p>
              </div>
            </div>
          )}

          {/* Progress slider */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {positions.length}
              </span>
              <input
                type="range"
                min="0"
                max={positions.length - 1}
                value={currentIndex}
                onChange={(e) => {
                  setCurrentIndex(parseInt(e.target.value, 10))
                  setIsPlaying(false)
                }}
                className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                {formatDateTime(new Date(currentPosition?.timestamp || positions[0].timestamp))}
              </span>
            </div>
          </div>

          {/* Date filter section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Date Filter:</span>
              <div className="flex gap-1 flex-wrap">
                <Button
                  variant={startDate === format(new Date(), 'yyyy-MM-dd') && endDate === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDatePreset('today')}
                  className="text-xs h-7 px-2"
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset('yesterday')}
                  className="text-xs h-7 px-2"
                >
                  Hier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset('7days')}
                  className="text-xs h-7 px-2"
                >
                  7 derniers jours
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset('30days')}
                  className="text-xs h-7 px-2"
                >
                  30 derniers jours
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded bg-background"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded bg-background"
                />
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(0)}
                disabled={currentIndex === 0}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentPosition) {
                    const newIndex = findIndexByTimeOffset(positions, new Date(currentPosition.timestamp), -300)
                    setCurrentIndex(Math.max(0, newIndex))
                  }
                }}
                disabled={currentIndex === 0}
                title="Go back 5 minutes"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="text-xs">-5 min</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-6"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentPosition) {
                    const newIndex = findIndexByTimeOffset(positions, new Date(currentPosition.timestamp), 300)
                    setCurrentIndex(Math.min(positions.length - 1, newIndex))
                  }
                }}
                disabled={currentIndex === positions.length - 1}
                title="Go forward 5 minutes"
              >
                <span className="text-xs">+5 min</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex(positions.length - 1)}
                disabled={currentIndex === positions.length - 1}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              {([1, 2, 5, 10] as const).map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlaybackSpeed(speed)}
                  className="w-12"
                >
                  {speed}x
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
