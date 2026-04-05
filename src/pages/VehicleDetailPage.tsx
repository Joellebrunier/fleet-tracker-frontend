import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useVehicle, useVehicleHistory } from '@/hooks/useVehicles'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatSpeed, formatDateTime, formatTimeAgo } from '@/lib/utils'
import {
  ArrowLeft,
  Gauge,
  Navigation,
  MapPin,
  Clock,
  Cpu,
  Car,
  Compass,
  Play,
  Download,
  Power,
  Battery,
  Route,
  Zap,
  Signal,
  Activity,
  Camera,
  Plus,
  X,
  Repeat2,
  AlertCircle,
  Trash2,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { GpsReplayPlayer } from '@/components/vehicles/GpsReplayPlayer'
import { GpsDataExport } from '@/components/vehicles/GpsDataExport'
import { reverseGeocode } from '@/lib/geocoding'
import { MAPBOX_TILE_URL } from '@/lib/constants'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface TripAddress {
  houseNumber?: string
  road?: string
  postcode?: string
  city?: string
  state?: string
  country?: string
  countryCode?: string
}

interface Trip {
  id?: string
  startTime: Date
  endTime: Date
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  startAddress?: string
  endAddress?: string
  startAddressObj?: TripAddress
  endAddressObj?: TripAddress
  startMileage?: number
  endMileage?: number
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
  points: Array<{ lat: number; lng: number; timestamp: Date; speed: number }>
}

interface GpsPoint {
  lat: number
  lng: number
  timestamp: Date
  speed: number
  heading?: number
}

interface VehiclePhoto {
  id: string
  data: string // base64 data URL
  name: string
  uploadedAt: Date
}

interface MaintenanceInfo {
  nextDate?: Date
  nextKm?: number
  lastDate?: Date
  lastKm?: number
  type: string
  isOverdue: boolean
}

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [showReplay, setShowReplay] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const [vehicleNotes, setVehicleNotes] = useState('')
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string }>>([])
  const [showAddField, setShowAddField] = useState(false)
  const [newFieldForm, setNewFieldForm] = useState({ key: '', value: '' })
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'gps' | 'trips'>('gps')
  const [trips, setTrips] = useState<Trip[]>([])
  const [tripsLoading, setTripsLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState<string>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0])
  const [replayingTrip, setReplayingTrip] = useState<Trip | null>(null)
  const [photos, setPhotos] = useState<VehiclePhoto[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [maintenanceInfo, setMaintenanceInfo] = useState<MaintenanceInfo>({
    type: 'Service',
    isOverdue: false,
  })

  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id || '')
  const { data: history } = useVehicleHistory(id || '')

  const positions = useMemo(() => {
    if (!history) return []
    const items = Array.isArray(history) ? history : history.data || history.positions || []
    return items.slice(0, 50)
  }, [history])

  // Initialize vehicle notes and custom fields from vehicle data
  useEffect(() => {
    if (vehicle) {
      setVehicleNotes((vehicle as any).notes || '')
      if ((vehicle as any).customFields) {
        const fieldsArray = Array.isArray((vehicle as any).customFields)
          ? (vehicle as any).customFields
          : Object.entries((vehicle as any).customFields).map(([key, value]) => ({ key, value: String(value) }))
        setCustomFields(fieldsArray)
      }

      // Load maintenance info from vehicle metadata
      const meta = (vehicle as any).metadata || {}
      if (meta.nextMaintenanceDate || meta.nextMaintenanceKm) {
        const nextDate = meta.nextMaintenanceDate ? new Date(meta.nextMaintenanceDate) : undefined
        const isOverdue = nextDate && nextDate < new Date()
        setMaintenanceInfo({
          nextDate,
          nextKm: meta.nextMaintenanceKm,
          lastDate: meta.lastMaintenanceDate ? new Date(meta.lastMaintenanceDate) : undefined,
          lastKm: meta.lastMaintenanceKm,
          type: meta.maintenanceType || 'Service',
          isOverdue: isOverdue || false,
        })
      }

      // Load photos if stored in metadata
      if (meta.photos && Array.isArray(meta.photos)) {
        setPhotos(meta.photos)
      }
    }
  }, [vehicle])

  // Reverse geocode current position when lat/lng changes
  useEffect(() => {
    if (vehicle?.currentLat && vehicle?.currentLng) {
      reverseGeocode(vehicle.currentLat, vehicle.currentLng)
        .then(address => setCurrentAddress(address || null))
        .catch(() => setCurrentAddress(null))
    }
  }, [vehicle?.currentLat, vehicle?.currentLng])

  // Fetch trips when date range changes
  useEffect(() => {
    if (!id || !organizationId) return

    // Validate date range
    if (new Date(dateTo) < new Date(dateFrom)) {
      setExportError('La date de fin doit être après la date de début')
      return
    }

    setExportError(null)

    const fetchTrips = async () => {
      try {
        setTripsLoading(true)
        const dateFromISO = new Date(dateFrom).toISOString()
        const dateToISO = new Date(new Date(dateTo).getTime() + 24 * 60 * 60 * 1000).toISOString()

        // Try real trips API first
        let realTrips: Trip[] = []
        try {
          const tripsResp = await apiClient.get(
            `/api/organizations/${organizationId}/trips?vehicleId=${id}&startDate=${encodeURIComponent(dateFromISO)}&endDate=${encodeURIComponent(dateToISO)}&limit=200`
          )
          const tripsData = (tripsResp.data as any)?.data || (tripsResp.data as any) || []
          const items = Array.isArray(tripsData) ? tripsData : tripsData.data || []

          if (items.length > 0) {
            realTrips = items.map((t: any) => {
              const formatAddr = (addr: TripAddress | undefined) =>
                addr ? [addr.houseNumber, addr.road, addr.postcode, addr.city].filter(Boolean).join(' ') : undefined
              const durationSec = t.duration || Math.round((new Date(t.endDateTime).getTime() - new Date(t.startDateTime).getTime()) / 1000)
              const distanceM = t.distance || 0
              return {
                id: t.id,
                startTime: new Date(t.startDateTime),
                endTime: new Date(t.endDateTime),
                startLat: t.startLat,
                startLng: t.startLng,
                endLat: t.endLat,
                endLng: t.endLng,
                startAddress: formatAddr(t.startAddress),
                endAddress: formatAddr(t.endAddress),
                startAddressObj: t.startAddress,
                endAddressObj: t.endAddress,
                startMileage: t.startMileage,
                endMileage: t.endMileage,
                distance: distanceM / 1000, // convert to km
                duration: durationSec,
                averageSpeed: durationSec > 0 ? Math.round((distanceM / 1000) / (durationSec / 3600)) : 0,
                maxSpeed: 0,
                points: [],
              } as Trip
            })
          }
        } catch (_) {
          // Trips API not available, fall back to GPS parsing
        }

        if (realTrips.length > 0) {
          setTrips(realTrips)
        } else {
          // Fallback: parse trips from GPS positions
          const response = await fetch(
            `/api/organizations/${organizationId}/gps-history?vehicleId=${id}&dateFrom=${encodeURIComponent(dateFromISO)}&dateTo=${encodeURIComponent(dateToISO)}`
          )
          if (!response.ok) throw new Error('Failed to fetch GPS history')
          const data = await response.json()
          const positions = Array.isArray(data) ? data : data.data || data.positions || []
          const parsedTrips = parseTripsFromPositions(positions)
          setTrips(parsedTrips)
        }
      } catch (error) {
        console.error('Error fetching trips:', error)
        setTrips([])
      } finally {
        setTripsLoading(false)
      }
    }

    fetchTrips()
  }, [id, organizationId, dateFrom, dateTo])

  // Parse trips from GPS positions
  const parseTripsFromPositions = (positions: any[]): Trip[] => {
    if (!Array.isArray(positions) || positions.length === 0) return []

    const sortedPositions = [...positions].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.timestamp).getTime()
      const timeB = new Date(b.createdAt || b.timestamp).getTime()
      return timeA - timeB
    })

    const trips: Trip[] = []
    let currentTrip: Partial<Trip> | null = null
    const SPEED_THRESHOLD = 2 // km/h
    const TIME_GAP_THRESHOLD = 5 * 60 * 1000 // 5 minutes

    for (let i = 0; i < sortedPositions.length; i++) {
      const pos = sortedPositions[i]
      const posTime = new Date(pos.createdAt || pos.timestamp)
      const speed = pos.speed || 0

      // Start a new trip if vehicle is moving
      if (!currentTrip && speed > SPEED_THRESHOLD) {
        currentTrip = {
          startTime: posTime,
          startLat: pos.lat,
          startLng: pos.lng,
          points: [{ lat: pos.lat, lng: pos.lng, timestamp: posTime, speed }],
          distance: 0,
          duration: 0,
          averageSpeed: 0,
          maxSpeed: speed,
        }
      } else if (currentTrip) {
        // Add point to current trip
        const prevPos = sortedPositions[i - 1]
        const prevTime = new Date(prevPos.createdAt || prevPos.timestamp)
        const timeDiff = (posTime.getTime() - prevTime.getTime()) / 1000 / 3600 // hours
        const distance = calculateDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng)

        currentTrip.points!.push({ lat: pos.lat, lng: pos.lng, timestamp: posTime, speed })
        currentTrip.distance! += distance
        currentTrip.maxSpeed = Math.max(currentTrip.maxSpeed || 0, speed)

        // Check if trip ended (vehicle stopped or time gap)
        if (i === sortedPositions.length - 1) {
          // End of data
          finalizeTripIfValid(currentTrip, posTime)
          trips.push(currentTrip as Trip)
          currentTrip = null
        } else {
          const nextPos = sortedPositions[i + 1]
          const nextTime = new Date(nextPos.createdAt || nextPos.timestamp)
          const nextSpeed = nextPos.speed || 0
          const timeGap = nextTime.getTime() - posTime.getTime()

          if (nextSpeed <= SPEED_THRESHOLD || timeGap > TIME_GAP_THRESHOLD) {
            // Trip ended
            finalizeTripIfValid(currentTrip, posTime)
            trips.push(currentTrip as Trip)
            currentTrip = null
          }
        }
      }
    }

    return trips
  }

  const finalizeTripIfValid = (trip: Partial<Trip>, endTime: Date) => {
    trip.endTime = endTime
    trip.endLat = trip.points?.[trip.points.length - 1]?.lat || 0
    trip.endLng = trip.points?.[trip.points.length - 1]?.lng || 0
    trip.duration = Math.round((endTime.getTime() - trip.startTime!.getTime()) / 1000) // seconds

    if (trip.points && trip.points.length > 0) {
      const totalSpeed = trip.points.reduce((sum, p) => sum + p.speed, 0)
      trip.averageSpeed = Math.round((totalSpeed / trip.points.length) * 10) / 10
    }
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // Export functions
  const generateGpsPoints = (): GpsPoint[] => {
    if (!trips || trips.length === 0) return []
    const points: GpsPoint[] = []
    trips.forEach(trip => {
      if (trip.points) {
        points.push(...trip.points)
      }
    })
    return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  const exportToCSV = () => {
    const points = generateGpsPoints()
    if (points.length === 0) {
      setExportError('Aucun point GPS à exporter')
      return
    }

    const headers = ['Date', 'Heure', 'Latitude', 'Longitude', 'Vitesse', 'Cap', 'Adresse']
    const rows = points.map(p => {
      const dt = new Date(p.timestamp)
      const date = dt.toLocaleDateString('fr-FR')
      const time = dt.toLocaleTimeString('fr-FR')
      return [
        date,
        time,
        p.lat.toFixed(6),
        p.lng.toFixed(6),
        (p.speed || 0).toFixed(1),
        (p.heading || 0).toFixed(1),
        'GPS Track',
      ]
    })

    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    downloadFile(csv, `${vehicle?.name || 'vehicle'}_gps_export.csv`, 'text/csv')
    setExportMenuOpen(false)
  }

  const exportToKML = () => {
    const points = generateGpsPoints()
    if (points.length === 0) {
      setExportError('Aucun point GPS à exporter')
      return
    }

    const placemarks = points
      .filter((p, idx) => idx % Math.ceil(points.length / 50) === 0 || idx === points.length - 1) // Sample for readability
      .map((p, idx) => `
    <Placemark>
      <name>Point ${idx + 1}</name>
      <Point>
        <coordinates>${p.lng},${p.lat},0</coordinates>
      </Point>
    </Placemark>`)
      .join('\n')

    const linestring = points
      .map(p => `${p.lng},${p.lat},0`)
      .join('\n      ')

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${vehicle?.name || 'Vehicle'} GPS Route</name>
    <Placemark>
      <name>Route</name>
      <LineString>
        <coordinates>
      ${linestring}
        </coordinates>
      </LineString>
    </Placemark>
    ${placemarks}
  </Document>
</kml>`

    downloadFile(kml, `${vehicle?.name || 'vehicle'}_gps_export.kml`, 'application/vnd.google-earth.kml+xml')
    setExportMenuOpen(false)
  }

  const exportToGPX = () => {
    const points = generateGpsPoints()
    if (points.length === 0) {
      setExportError('Aucun point GPS à exporter')
      return
    }

    const trkpts = points
      .map(p => `
    <trkpt lat="${p.lat}" lon="${p.lng}">
      <ele>0</ele>
      <time>${p.timestamp.toISOString()}</time>
      <speed>${(p.speed || 0).toFixed(1)}</speed>
    </trkpt>`)
      .join('\n')

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vehicle GPS Export"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.topografix.com/GPX/1/1"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${vehicle?.name || 'Vehicle'} GPS Track</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${vehicle?.name || 'Vehicle'}</name>
    <trkseg>
      ${trkpts}
    </trkseg>
  </trk>
</gpx>`

    downloadFile(gpx, `${vehicle?.name || 'vehicle'}_gps_export.gpx`, 'application/gpx+xml')
    setExportMenuOpen(false)
  }

  const exportToXLSX = () => {
    const points = generateGpsPoints()
    if (points.length === 0) {
      setExportError('Aucun point GPS à exporter')
      return
    }

    const headers = ['Date', 'Heure', 'Latitude', 'Longitude', 'Vitesse', 'Cap', 'Adresse']
    const rows = points.map(p => {
      const dt = new Date(p.timestamp)
      const date = dt.toLocaleDateString('fr-FR')
      const time = dt.toLocaleTimeString('fr-FR')
      return [
        date,
        time,
        p.lat.toFixed(6),
        p.lng.toFixed(6),
        (p.speed || 0).toFixed(1),
        (p.heading || 0).toFixed(1),
        'GPS Track',
      ]
    })

    // Excel FR compatible CSV with semicolon separator
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    downloadFile(csv, `${vehicle?.name || 'vehicle'}_gps_export.csv`, 'text/csv;charset=utf-8')
    setExportMenuOpen(false)
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPhoto: VehiclePhoto = {
            id: Date.now().toString(),
            data: event.target.result as string,
            name: file.name,
            uploadedAt: new Date(),
          }
          setPhotos([...photos, newPhoto])
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const deletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId))
  }

  const saveNotes = async () => {
    if (!id) return
    try {
      setNotesLoading(true)
      await apiClient.patch(`/vehicles/${id}`, {
        notes: vehicleNotes,
      })
      // Success notification would go here
    } catch (error) {
      console.error('Error saving notes:', error)
    } finally {
      setNotesLoading(false)
    }
  }

  if (vehicleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Véhicule introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/vehicles')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  const isMoving = (vehicle.currentSpeed || 0) > 2
  const hasGps = vehicle.currentLat && vehicle.currentLng
  const meta = (vehicle as any).metadata || {}

  // Detect provider
  let provider = 'Inconnu'
  if (meta.flespiChannelId) provider = 'Flespi'
  else if (meta.echoesUid) provider = 'Echoes'
  else if (meta.keeptraceId) provider = 'KeepTrace'
  else if (meta.ubiwanId) provider = 'Ubiwan'

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-900"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-sans text-2xl font-bold text-gray-900">{vehicle.name}</h1>
            <Badge variant={isMoving ? 'default' : 'secondary'}>
              {isMoving ? 'En route' : hasGps ? 'Arrêté' : 'Hors ligne'}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {vehicle.plate} · {provider} · IMEI: {vehicle.deviceImei || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
            onClick={() => setShowReplay(true)}
          >
            <Play size={16} />
            Replay GPS
          </Button>
          <Button
            className="gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
            onClick={() => setShowExport(true)}
          >
            <Download size={16} />
            Exporter
          </Button>
        </div>
      </div>

      {/* GPS Replay Modal */}
      {showReplay && (
        <GpsReplayPlayer
          vehicleId={id!}
          vehicleName={vehicle.name}
          onClose={() => setShowReplay(false)}
        />
      )}

      {/* GPS Export Modal */}
      <GpsDataExport
        vehicleId={id!}
        vehicleName={vehicle.name}
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('gps')}
          className={`font-sans px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'gps'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          GPS
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`font-sans px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'trips'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Trajets
        </button>
      </div>

      {/* Top row: Mini map + Current Status */}
      {activeTab === 'gps' && (
      <div>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Mini map */}
          <Card
            className="lg:col-span-2 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm"
            title="Affiche la position GPS actuelle et l historique récent du véhicule"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-sans text-base text-gray-900">Position actuelle</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {hasGps ? (
                <div className="h-72">
                  <MapContainer
                    center={[vehicle.currentLat!, vehicle.currentLng!]}
                    zoom={14}
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <TileLayer
                      url={MAPBOX_TILE_URL('streets-v12')}
                      tileSize={512}
                      zoomOffset={-1}
                    />
                    <Marker position={[vehicle.currentLat!, vehicle.currentLng!]}>
                      <Popup>
                        <strong>{vehicle.name}</strong>
                        <br />
                        {(vehicle.currentSpeed || 0).toFixed(0)} km/h
                      </Popup>
                    </Marker>

                    {/* GPS history trail */}
                    {positions.map((pos: any, idx: number) => (
                      <CircleMarker
                        key={idx}
                        center={[pos.lat, pos.lng]}
                        radius={3}
                        pathOptions={{
                          color: '#4361EE',
                          fillColor: '#4361EE',
                          fillOpacity: 0.5 - idx * 0.01,
                          weight: 1,
                        }}
                      />
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center bg-gray-100">
                  <div className="text-center text-[#9CA3AF]">
                    <MapPin size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Aucune position GPS disponible</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans text-base text-gray-900" title="Informations en temps réel du véhicule">Statut en temps réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl bg-gray-100 p-4 text-center border border-gray-200">
                <Gauge size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="font-mono font-bold text-3xl text-blue-600">
                  {(vehicle.currentSpeed || 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500">km/h</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Power size={14} className={((vehicle as any).ignition ? 'text-blue-600' : 'text-[#9CA3AF]')} />
                  <span className="text-gray-500 flex-1">Contact</span>
                  <span className={`font-medium text-xs ${(vehicle as any).ignition ? 'text-blue-600' : 'text-[#9CA3AF]'}`}>
                    {(vehicle as any).ignition ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Niveau de batterie du dispositif GPS"><Battery size={14} className={(() => {
                    const batteryLevel = (vehicle as any).batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : (((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) * 100 / 14))
                    if (batteryLevel > 50) return 'text-blue-600'
                    if (batteryLevel > 20) return 'text-amber-500'
                    return 'text-red-500'
                  })()} /></span>
                  <span className="text-gray-500 flex-1">Batterie</span>
                  <span className={`font-medium text-xs ${(() => {
                    const batteryLevel = (vehicle as any).batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : (((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) * 100 / 14))
                    if (batteryLevel > 50) return 'text-blue-600'
                    if (batteryLevel > 20) return 'text-amber-500'
                    return 'text-red-500'
                  })()}`}>
                    {(() => {
                      const batteryLevel = (vehicle as any).batteryLevel || meta.batteryLevel
                      const batteryVoltage = (vehicle as any).batteryVoltage || meta.batteryVoltage || 0
                      if (batteryLevel !== undefined) return `${batteryLevel.toFixed(0)}%`
                      return `${batteryVoltage.toFixed(1)} V`
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Compass size={14} className="text-gray-500" />
                  <span className="text-gray-500 flex-1">Cap</span>
                  <span className="font-mono text-gray-900">{(vehicle.currentHeading || 0).toFixed(0)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-500" />
                  <span className="text-gray-500 flex-1">Position</span>
                  <span className="font-mono text-xs text-blue-600">
                    {vehicle.currentLat?.toFixed(5)}, {vehicle.currentLng?.toFixed(5)}
                  </span>
                </div>
                {currentAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-gray-500 text-xs block">Adresse</span>
                      <span className="text-gray-900 text-xs leading-tight">{currentAddress}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span title="Heure de la dernière communication du véhicule"><Clock size={14} className="text-gray-500" /></span>
                  <span className="text-gray-500 flex-1">Dernière com.</span>
                  <span className="font-medium text-xs text-gray-900">
                    {vehicle.lastCommunication ? formatTimeAgo(vehicle.lastCommunication) : 'Jamais'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="IMEI du dispositif GPS"><Cpu size={14} className="text-gray-500" /></span>
                  <span className="text-gray-500 flex-1">IMEI</span>
                  <span className="font-mono text-xs text-blue-600">
                    {(vehicle as any).metadata?.imei || (vehicle as any).imei || (vehicle as any).deviceId || vehicle.deviceImei || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Force du signal GPS"><Signal size={14} className={((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || 0) > 75 ? 'text-blue-600' : ((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || 0) > 40 ? 'text-amber-500' : 'text-red-500'} /></span>
                  <span className="text-gray-500 flex-1">Signal GPS</span>
                  <span className="font-medium text-xs text-gray-900">
                    {(vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality ? `${((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Heures moteur accumulées"><Activity size={14} className="text-gray-500" /></span>
                  <span className="text-gray-500 flex-1">Heures moteur</span>
                  <span className="font-medium text-xs text-gray-900">
                    {(vehicle as any).metadata?.engineHours || (vehicle as any).engineHours ? `${((vehicle as any).metadata?.engineHours || (vehicle as any).engineHours).toFixed(0)} h` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="État du contact du moteur"><Power size={14} className={((vehicle as any).metadata?.ignition ? 'text-blue-600' : 'text-[#9CA3AF]')} /></span>
                  <span className="text-gray-500 flex-1">Contact</span>
                  <span className={`font-medium text-xs ${(vehicle as any).metadata?.ignition ? 'text-blue-600' : 'text-[#9CA3AF]'}`}>
                    {(vehicle as any).metadata?.ignition ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Fournisseur de service GPS"><Cpu size={14} className="text-gray-500" /></span>
                  <span className="text-gray-500 flex-1">Provider</span>
                  <Badge variant="outline" className="text-xs bg-gray-100 border-gray-200 text-blue-600">{provider}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle info cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Marque et modèle du véhicule">
            <CardContent className="pt-5 pb-4">
              <Car size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Marque / Modèle</p>
              <p className="font-sans font-semibold text-gray-900 mt-0.5">
                {vehicle.brand || '—'} {vehicle.model || ''}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Plaque dimmatriculation du véhicule">
            <CardContent className="pt-5 pb-4">
              <Navigation size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Plaque</p>
              <p className="font-sans font-semibold text-gray-900 mt-0.5">{vehicle.plate || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Identifiant unique du dispositif GPS">
            <CardContent className="pt-5 pb-4">
              <Cpu size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">IMEI</p>
              <p className="font-mono text-xs text-blue-600 mt-0.5">{vehicle.deviceImei || (vehicle as any).metadata?.imei || (vehicle as any).imei || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Date de création du véhicule dans le système">
            <CardContent className="pt-5 pb-4">
              <Clock size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Créé le</p>
              <p className="font-sans font-semibold text-gray-900 mt-0.5 text-sm">
                {vehicle.createdAt ? formatDateTime(vehicle.createdAt) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Distance totale parcourue ou kilométrage">
            <CardContent className="pt-5 pb-4">
              <Route size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Odomètre</p>
              <p className="font-sans font-semibold text-gray-900 mt-0.5">
                {Math.round(((vehicle as any).odometer || 0) / 1000).toLocaleString('fr-FR')} km
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Numéro didentification du véhicule">
            <CardContent className="pt-5 pb-4">
              <Zap size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">VIN</p>
              <p className="font-mono text-xs text-blue-600 mt-0.5">{(vehicle as any).vin || vehicle.vin || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Classification du type de véhicule">
            <CardContent className="pt-5 pb-4">
              <Car size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Type</p>
              <p className="font-sans font-semibold text-gray-900 mt-0.5">
                {(vehicle as any).vehicleType || vehicle.type || '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Telemetry cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Engine Hours */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Nombre total dheures moteur du véhicule">
            <CardContent className="pt-5 pb-4">
              <Activity size={18} className="text-gray-500 mb-2" />
              <p className="text-xs text-gray-500">Heures moteur</p>
              <p className="font-mono font-semibold text-gray-900 mt-0.5 text-lg">
                {((vehicle as any).metadata?.engineHours || (vehicle as any).engineHours || 0).toLocaleString('fr-FR')} h
              </p>
            </CardContent>
          </Card>

          {/* Battery Level Display */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Niveau de batterie du dispositif GPS">
            <CardContent className="pt-5 pb-4">
              <Battery
                size={18}
                className={`mb-2 ${(() => {
                  const batteryLevel = (vehicle as any).metadata?.batteryLevel || (vehicle as any).batteryLevel
                  const batteryVoltage = (vehicle as any).metadata?.batteryVoltage || (vehicle as any).batteryVoltage || 0
                  let level = batteryLevel !== undefined ? batteryLevel : (batteryVoltage > 0 ? (batteryVoltage * 100 / 14) : 0)
                  if (level > 50) return 'text-blue-600'
                  if (level > 20) return 'text-amber-500'
                  return 'text-red-500'
                })()}`}
              />
              <p className="text-xs text-gray-500">Niveau batterie</p>
              <div className="mt-2 flex gap-0.5 mb-2">
                {[...Array(5)].map((_, idx) => {
                  const batteryLevel = (vehicle as any).metadata?.batteryLevel || (vehicle as any).batteryLevel
                  const batteryVoltage = (vehicle as any).metadata?.batteryVoltage || (vehicle as any).batteryVoltage || 0
                  let level = batteryLevel !== undefined ? batteryLevel : (batteryVoltage > 0 ? (batteryVoltage * 100 / 14) : 0)
                  const filled = idx < Math.ceil((level / 100) * 5)
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-sm ${
                        filled ? 'bg-blue-600' : 'bg-gray-50'
                      }`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-gray-500">
                {(() => {
                  const batteryLevel = (vehicle as any).metadata?.batteryLevel || (vehicle as any).batteryLevel
                  const batteryVoltage = (vehicle as any).metadata?.batteryVoltage || (vehicle as any).batteryVoltage || 0
                  if (batteryLevel !== undefined) return `${batteryLevel.toFixed(0)}%`
                  if (batteryVoltage > 0) return `${batteryVoltage.toFixed(1)} V`
                  return 'N/A'
                })()}
              </p>
            </CardContent>
          </Card>

          {/* Signal Strength & GPS Accuracy */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm" title="Force du signal GPS et précision">
            <CardContent className="pt-5 pb-4">
              <Signal
                size={18}
                className={(() => {
                  const signalStrength = (vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || (vehicle as any).signalStrength || 0
                  if (signalStrength > 75) return 'text-blue-600'
                  if (signalStrength > 40) return 'text-amber-500'
                  return 'text-red-500'
                })()}
                style={{marginBottom: '8px'}}
              />
              <p className="text-xs text-gray-500 mb-1">Signal GPS</p>
              <div className="mt-1 flex gap-0.5 mb-2">
                {[...Array(5)].map((_, idx) => {
                  const signalStrength = (vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || (vehicle as any).signalStrength || 0
                  const filled = idx < Math.ceil((signalStrength / 100) * 5)
                  return (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-sm ${
                        filled ? 'bg-blue-600' : 'bg-gray-50'
                      }`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {(vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality ? `${((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-xs text-gray-500 mb-1">Précision GPS</p>
              <div className="mt-1">
                {(() => {
                  const gpsAccuracy = ((vehicle as any).gpsAccuracy || 0)
                  let color = 'text-blue-600'
                  let bgColor = 'bg-gray-100'
                  let label = 'Excellente'

                  if (gpsAccuracy > 15) {
                    color = 'text-red-500'
                    bgColor = 'bg-gray-100'
                    label = 'Mauvaise'
                  } else if (gpsAccuracy > 5) {
                    color = 'text-amber-500'
                    bgColor = 'bg-gray-100'
                    label = 'Acceptable'
                  }

                  return (
                    <div className={`rounded-lg px-2 py-1 ${bgColor} border border-gray-200`}>
                      <p className={`font-medium text-xs ${color}`}>
                        {gpsAccuracy.toFixed(1)} m - {label}
                      </p>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Reminders */}
        {maintenanceInfo.nextDate && (
          <Card className={`bg-white border ${maintenanceInfo.isOverdue ? 'border-red-500' : 'border-gray-200'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="font-sans text-base text-gray-900">Maintenance</CardTitle>
                {maintenanceInfo.isOverdue && (
                  <Badge variant="destructive" className="bg-red-500 text-white gap-1">
                    <AlertTriangle size={12} />
                    En retard
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="font-medium text-gray-900">{maintenanceInfo.type}</p>
                </div>
                <div className={`rounded-lg p-3 border ${maintenanceInfo.isOverdue ? 'bg-[#1A0A0A] border-red-500' : 'bg-gray-100 border-gray-200'}`}>
                  <p className="text-xs text-gray-500 mb-1">Prochaine date</p>
                  <p className={`font-mono text-sm ${maintenanceInfo.isOverdue ? 'text-red-500' : 'text-blue-600'}`}>
                    {maintenanceInfo.nextDate?.toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {maintenanceInfo.nextKm && (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Prochain kilométrage</p>
                    <p className="font-mono text-blue-600">{maintenanceInfo.nextKm.toLocaleString('fr-FR')} km</p>
                  </div>
                )}
                {maintenanceInfo.lastDate && (
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Dernière date</p>
                    <p className="font-mono text-gray-500">{maintenanceInfo.lastDate?.toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* GPS History */}
        {positions.length > 0 && (
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans text-base text-gray-900" title="Dernières positions enregistrées du véhicule">Historique GPS</CardTitle>
              <CardDescription className="text-xs text-gray-500">Dernières positions enregistrées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Vitesse</th>
                      <th className="pb-2 pr-4">Cap</th>
                      <th className="pb-2">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {positions.slice(0, 15).map((pos: any, idx: number) => (
                      <tr key={idx} className="text-xs text-gray-900">
                        <td className="py-2 pr-4 text-gray-500">
                          {pos.createdAt ? formatDateTime(pos.createdAt) : formatDateTime(pos.timestamp)}
                        </td>
                        <td className="py-2 pr-4 font-mono font-semibold">{(pos.speed || 0).toFixed(0)} km/h</td>
                        <td className="py-2 pr-4 text-gray-500">{(pos.heading || 0).toFixed(0)}°</td>
                        <td className="py-2 font-mono text-blue-600">
                          {pos.lat?.toFixed(5)}, {pos.lng?.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Photos */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base text-gray-900" title="Galerie de photos du véhicule">Images du véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            {photos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-[#E5E7EB] transition">
                <Camera size={32} className="mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-500 mb-4">Aucune image. Glissez-déposez ou cliquez pour ajouter.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-input"
                />
                <Button
                  className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
                  size="sm"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <Plus size={14} className="mr-1" />
                  Ajouter une image
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={14} />
                      </button>
                      <p className="text-xs text-gray-500 p-2 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-input-add"
                />
                <Button
                  className="gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
                  size="sm"
                  onClick={() => document.getElementById('photo-input-add')?.click()}
                >
                  <Plus size={14} />
                  Ajouter une image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Notes */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="font-sans text-base text-gray-900" title="Notes et annotations sur ce véhicule">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Ajouter des notes et informations sur ce véhicule..."
              value={vehicleNotes}
              onChange={(e) => setVehicleNotes(e.target.value)}
              className="min-h-24 text-sm bg-gray-100 border border-gray-200 text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
            />
            <Button
              className="bg-blue-600 text-white hover:bg-[#3B82F6]"
              size="sm"
              onClick={saveNotes}
              disabled={notesLoading}
            >
              {notesLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="font-sans text-base text-gray-900" title="Champs supplémentaires personnalisés pour ce véhicule">Champs personnalisés</CardTitle>
            <Button
              className="gap-2 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
              size="sm"
              onClick={() => setShowAddField(!showAddField)}
            >
              <Plus size={14} />
              Ajouter un champ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddField && (
              <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-100">
                <input
                  type="text"
                  placeholder="Nom du champ"
                  value={newFieldForm.key}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, key: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
                />
                <input
                  type="text"
                  placeholder="Valeur"
                  value={newFieldForm.value}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, value: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-white text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 text-white hover:bg-[#3B82F6]"
                    onClick={() => {
                      if (newFieldForm.key && newFieldForm.value) {
                        setCustomFields([...customFields, { key: newFieldForm.key, value: newFieldForm.value }])
                        setNewFieldForm({ key: '', value: '' })
                        setShowAddField(false)
                      }
                    }}
                  >
                    Ajouter
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100 hover:border-[#E5E7EB]"
                    onClick={() => setShowAddField(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {customFields.length > 0 ? (
                customFields.map((field, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-2.5 flex items-center justify-between text-sm bg-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">{field.key}</p>
                      <p className="text-xs text-gray-500">{field.value}</p>
                    </div>
                    <button
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      className="text-gray-500 hover:text-gray-900"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">Aucun champ personnalisé</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {/* Date Range Selector with Export */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans text-base text-gray-900">Filtre et export des trajets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exportError && (
                <div className="flex items-center gap-2 bg-[#1A0A0A] border border-red-500 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-gray-900">{exportError}</p>
                </div>
              )}
              <div className="flex gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    À partir du
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-900 focus:border-blue-600"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Jusqu'au
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-100 text-gray-900 focus:border-blue-600"
                  />
                </div>
                <div className="relative">
                  <Button
                    className="gap-2 bg-blue-600 text-white hover:bg-[#3B82F6]"
                    onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  >
                    <Download size={14} />
                    Exporter
                    <ChevronDown size={14} />
                  </Button>
                  {exportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={exportToCSV}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                      >
                        CSV
                      </button>
                      <button
                        onClick={exportToKML}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                      >
                        KML (Google Earth)
                      </button>
                      <button
                        onClick={exportToGPX}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100 border-b border-gray-200"
                      >
                        GPX
                      </button>
                      <button
                        onClick={exportToXLSX}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-100"
                      >
                        Excel (FR)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trips List */}
          <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="font-sans text-base text-gray-900">Trajets ({trips.length})</CardTitle>
              <CardDescription className="text-gray-500">
                {tripsLoading ? 'Chargement...' : `${trips.length} trajet(s) trouvé(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tripsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                  <Skeleton className="h-20" />
                </div>
              ) : trips.length === 0 ? (
                <div className="text-center py-8">
                  <Route size={32} className="mx-auto text-gray-500 mb-2" />
                  <p className="text-gray-500">Aucun trajet trouvé pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-100 hover:border-[#E5E7EB] transition">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Départ</p>
                          <p className="font-sans font-medium text-sm text-gray-900">
                            {trip.startAddress || `${trip.startLat.toFixed(4)}, ${trip.startLng.toFixed(4)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(trip.startTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Arrivée</p>
                          <p className="font-sans font-medium text-sm text-gray-900">
                            {trip.endAddress || `${trip.endLat.toFixed(4)}, ${trip.endLng.toFixed(4)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateTime(trip.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm">
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500 mb-1">Durée</p>
                          <p className="font-mono font-semibold text-blue-600">{formatDuration(trip.duration)}</p>
                        </div>
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500 mb-1">Distance</p>
                          <p className="font-mono font-semibold text-blue-600">{trip.distance.toFixed(1)} km</p>
                        </div>
                        <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                          <p className="text-xs text-gray-500 mb-1">Vitesse moy.</p>
                          <p className="font-mono font-semibold text-blue-600">{trip.averageSpeed.toFixed(0)} km/h</p>
                        </div>
                        {trip.maxSpeed > 0 ? (
                          <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Vitesse max</p>
                            <p className="font-mono font-semibold text-blue-600">{trip.maxSpeed.toFixed(0)} km/h</p>
                          </div>
                        ) : trip.startMileage ? (
                          <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Compteur</p>
                            <p className="font-mono font-semibold text-blue-600">{Math.round((trip.endMileage || 0) / 1000).toLocaleString('fr-FR')} km</p>
                          </div>
                        ) : (
                          <div className="bg-gray-100 border border-gray-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-500 mb-1">Vitesse max</p>
                            <p className="font-mono font-semibold text-blue-600">—</p>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full gap-2 bg-blue-600 text-white hover:bg-[#3B82F6]"
                        size="sm"
                        onClick={() => setReplayingTrip(trip)}
                      >
                        <Play size={14} />
                        Rejouer ce trajet
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trip Replay */}
          {replayingTrip && (
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <CardHeader className="pb-3 flex items-center justify-between">
                <CardTitle className="font-sans text-base text-gray-900">Affichage du trajet</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => setReplayingTrip(null)}
                >
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden mb-4 border border-gray-200">
                  <MapContainer
                    center={[replayingTrip.startLat, replayingTrip.startLng]}
                    zoom={14}
                    className="h-full w-full"
                    zoomControl={false}
                  >
                    <TileLayer
                      url={MAPBOX_TILE_URL('streets-v12')}
                      tileSize={512}
                      zoomOffset={-1}
                    />

                    {/* Start marker */}
                    <Marker position={[replayingTrip.startLat, replayingTrip.startLng]}>
                      <Popup>
                        <strong>Départ</strong>
                        <br />
                        {formatDateTime(replayingTrip.startTime)}
                      </Popup>
                    </Marker>

                    {/* End marker */}
                    <Marker position={[replayingTrip.endLat, replayingTrip.endLng]}>
                      <Popup>
                        <strong>Arrivée</strong>
                        <br />
                        {formatDateTime(replayingTrip.endTime)}
                      </Popup>
                    </Marker>

                    {/* Trip path */}
                    {replayingTrip.points && replayingTrip.points.map((pt, idx) => (
                      <CircleMarker
                        key={idx}
                        center={[pt.lat, pt.lng]}
                        radius={2}
                        pathOptions={{
                          color: '#4361EE',
                          fillColor: '#4361EE',
                          fillOpacity: 0.6 - (idx / replayingTrip.points!.length) * 0.5,
                          weight: 1,
                        }}
                      />
                    ))}
                  </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="font-mono font-semibold text-gray-900">{formatDuration(replayingTrip.duration)}</p>
                  </div>
                  <div className="bg-gray-100 border border-gray-200 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-mono font-semibold text-gray-900">{replayingTrip.distance.toFixed(1)} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
