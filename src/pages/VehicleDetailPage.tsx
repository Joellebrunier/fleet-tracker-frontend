import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useVehicle, useVehicleHistory } from '@/hooks/useVehicles'
import { useAuthStore } from '@/stores/authStore'
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
  distance: number
  duration: number
  averageSpeed: number
  maxSpeed: number
  points: Array<{ lat: number; lng: number; timestamp: Date; speed: number }>
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

    const fetchTrips = async () => {
      try {
        setTripsLoading(true)
        const dateFromISO = new Date(dateFrom).toISOString()
        const dateToISO = new Date(new Date(dateTo).getTime() + 24 * 60 * 60 * 1000).toISOString()

        const response = await fetch(
          `/api/organizations/${organizationId}/gps-history?vehicleId=${id}&dateFrom=${encodeURIComponent(dateFromISO)}&dateTo=${encodeURIComponent(dateToISO)}`
        )

        if (!response.ok) throw new Error('Failed to fetch GPS history')

        const data = await response.json()
        const positions = Array.isArray(data) ? data : data.data || data.positions || []

        // Parse trips from GPS positions
        const parsedTrips = parseTripsFromPositions(positions)
        setTrips(parsedTrips)
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
        <p className="text-[#6B6B80]">Véhicule introuvable</p>
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
    <div className="bg-[#0A0A0F] min-h-screen space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#6B6B80] hover:text-[#F0F0F5]"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-syne text-2xl font-bold text-[#F0F0F5]">{vehicle.name}</h1>
            <Badge variant={isMoving ? 'default' : 'secondary'}>
              {isMoving ? 'En route' : hasGps ? 'Arrêté' : 'Hors ligne'}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-[#6B6B80]">
            {vehicle.plate} · {provider} · IMEI: {vehicle.deviceImei || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className="gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
            onClick={() => setShowReplay(true)}
          >
            <Play size={16} />
            Replay GPS
          </Button>
          <Button
            className="gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
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
      <div className="flex gap-2 border-b border-[#1F1F2E]">
        <button
          onClick={() => setActiveTab('gps')}
          className={`font-syne px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'gps'
              ? 'border-[#00E5CC] text-[#00E5CC]'
              : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
          }`}
        >
          GPS
        </button>
        <button
          onClick={() => setActiveTab('trips')}
          className={`font-syne px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'trips'
              ? 'border-[#00E5CC] text-[#00E5CC]'
              : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'
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
            className="lg:col-span-2 overflow-hidden bg-[#12121A] border border-[#1F1F2E]"
            title="Affiche la position GPS actuelle et l historique récent du véhicule"
          >
            <CardHeader className="pb-2">
              <CardTitle className="font-syne text-base text-[#F0F0F5]">Position actuelle</CardTitle>
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
                          color: '#00E5CC',
                          fillColor: '#00E5CC',
                          fillOpacity: 0.5 - idx * 0.01,
                          weight: 1,
                        }}
                      />
                    ))}
                  </MapContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center bg-[#1A1A25]">
                  <div className="text-center text-[#44445A]">
                    <MapPin size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Aucune position GPS disponible</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card className="bg-[#12121A] border border-[#1F1F2E]">
            <CardHeader className="pb-3">
              <CardTitle className="font-syne text-base text-[#F0F0F5]" title="Informations en temps réel du véhicule">Statut en temps réel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[12px] bg-[#1A1A25] p-4 text-center border border-[#1F1F2E]">
                <Gauge size={20} className="mx-auto text-[#6B6B80] mb-1" />
                <p className="font-mono font-bold text-3xl text-[#00E5CC]">
                  {(vehicle.currentSpeed || 0).toFixed(0)}
                </p>
                <p className="text-xs text-[#6B6B80]">km/h</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Power size={14} className={((vehicle as any).ignition ? 'text-[#00E5CC]' : 'text-[#44445A]')} />
                  <span className="text-[#6B6B80] flex-1">Contact</span>
                  <span className={`font-medium text-xs ${(vehicle as any).ignition ? 'text-[#00E5CC]' : 'text-[#44445A]'}`}>
                    {(vehicle as any).ignition ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Niveau de batterie du dispositif GPS"><Battery size={14} className={(() => {
                    const batteryLevel = (vehicle as any).batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : (((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) * 100 / 14))
                    if (batteryLevel > 50) return 'text-[#00E5CC]'
                    if (batteryLevel > 20) return 'text-[#FFB547]'
                    return 'text-[#FF4D6A]'
                  })()} /></span>
                  <span className="text-[#6B6B80] flex-1">Batterie</span>
                  <span className={`font-medium text-xs ${(() => {
                    const batteryLevel = (vehicle as any).batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : (((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) * 100 / 14))
                    if (batteryLevel > 50) return 'text-[#00E5CC]'
                    if (batteryLevel > 20) return 'text-[#FFB547]'
                    return 'text-[#FF4D6A]'
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
                  <Compass size={14} className="text-[#6B6B80]" />
                  <span className="text-[#6B6B80] flex-1">Cap</span>
                  <span className="font-mono text-[#F0F0F5]">{(vehicle.currentHeading || 0).toFixed(0)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-[#6B6B80]" />
                  <span className="text-[#6B6B80] flex-1">Position</span>
                  <span className="font-mono text-xs text-[#00E5CC]">
                    {vehicle.currentLat?.toFixed(5)}, {vehicle.currentLng?.toFixed(5)}
                  </span>
                </div>
                {currentAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-[#6B6B80] mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[#6B6B80] text-xs block">Adresse</span>
                      <span className="text-[#F0F0F5] text-xs leading-tight">{currentAddress}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span title="Heure de la dernière communication du véhicule"><Clock size={14} className="text-[#6B6B80]" /></span>
                  <span className="text-[#6B6B80] flex-1">Dernière com.</span>
                  <span className="font-medium text-xs text-[#F0F0F5]">
                    {vehicle.lastCommunication ? formatTimeAgo(vehicle.lastCommunication) : 'Jamais'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="IMEI du dispositif GPS"><Cpu size={14} className="text-[#6B6B80]" /></span>
                  <span className="text-[#6B6B80] flex-1">IMEI</span>
                  <span className="font-mono text-xs text-[#00E5CC]">
                    {(vehicle as any).metadata?.imei || (vehicle as any).imei || (vehicle as any).deviceId || vehicle.deviceImei || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Force du signal GPS"><Signal size={14} className={((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || 0) > 75 ? 'text-[#00E5CC]' : ((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || 0) > 40 ? 'text-[#FFB547]' : 'text-[#FF4D6A]'} /></span>
                  <span className="text-[#6B6B80] flex-1">Signal GPS</span>
                  <span className="font-medium text-xs text-[#F0F0F5]">
                    {(vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality ? `${((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality).toFixed(0)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Heures moteur accumulées"><Activity size={14} className="text-[#6B6B80]" /></span>
                  <span className="text-[#6B6B80] flex-1">Heures moteur</span>
                  <span className="font-medium text-xs text-[#F0F0F5]">
                    {(vehicle as any).metadata?.engineHours || (vehicle as any).engineHours ? `${((vehicle as any).metadata?.engineHours || (vehicle as any).engineHours).toFixed(0)} h` : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="État du contact du moteur"><Power size={14} className={((vehicle as any).metadata?.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]')} /></span>
                  <span className="text-[#6B6B80] flex-1">Contact</span>
                  <span className={`font-medium text-xs ${(vehicle as any).metadata?.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]'}`}>
                    {(vehicle as any).metadata?.ignition ? 'ON' : 'OFF'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span title="Fournisseur de service GPS"><Cpu size={14} className="text-[#6B6B80]" /></span>
                  <span className="text-[#6B6B80] flex-1">Provider</span>
                  <Badge variant="outline" className="text-xs bg-[#1A1A25] border-[#1F1F2E] text-[#00E5CC]">{provider}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle info cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Marque et modèle du véhicule">
            <CardContent className="pt-5 pb-4">
              <Car size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Marque / Modèle</p>
              <p className="font-syne font-semibold text-[#F0F0F5] mt-0.5">
                {vehicle.brand || '—'} {vehicle.model || ''}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Plaque dimmatriculation du véhicule">
            <CardContent className="pt-5 pb-4">
              <Navigation size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Plaque</p>
              <p className="font-syne font-semibold text-[#F0F0F5] mt-0.5">{vehicle.plate || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Identifiant unique du dispositif GPS">
            <CardContent className="pt-5 pb-4">
              <Cpu size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">IMEI</p>
              <p className="font-mono text-xs text-[#00E5CC] mt-0.5">{vehicle.deviceImei || (vehicle as any).metadata?.imei || (vehicle as any).imei || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Date de création du véhicule dans le système">
            <CardContent className="pt-5 pb-4">
              <Clock size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Créé le</p>
              <p className="font-syne font-semibold text-[#F0F0F5] mt-0.5 text-sm">
                {vehicle.createdAt ? formatDateTime(vehicle.createdAt) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Distance totale parcourue ou kilométrage">
            <CardContent className="pt-5 pb-4">
              <Route size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Odomètre</p>
              <p className="font-syne font-semibold text-[#F0F0F5] mt-0.5">
                {((vehicle as any).odometer || vehicle.totalDistance || 0).toLocaleString('fr-FR')} km
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Numéro didentification du véhicule">
            <CardContent className="pt-5 pb-4">
              <Zap size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">VIN</p>
              <p className="font-mono text-xs text-[#00E5CC] mt-0.5">{(vehicle as any).vin || vehicle.vin || '—'}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Classification du type de véhicule">
            <CardContent className="pt-5 pb-4">
              <Car size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Type</p>
              <p className="font-syne font-semibold text-[#F0F0F5] mt-0.5">
                {(vehicle as any).vehicleType || vehicle.type || '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Telemetry cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Engine Hours */}
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Nombre total dheures moteur du véhicule">
            <CardContent className="pt-5 pb-4">
              <Activity size={18} className="text-[#6B6B80] mb-2" />
              <p className="text-xs text-[#6B6B80]">Heures moteur</p>
              <p className="font-mono font-semibold text-[#F0F0F5] mt-0.5 text-lg">
                {((vehicle as any).metadata?.engineHours || (vehicle as any).engineHours || 0).toLocaleString('fr-FR')} h
              </p>
            </CardContent>
          </Card>

          {/* Battery Level Display */}
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Niveau de batterie du dispositif GPS">
            <CardContent className="pt-5 pb-4">
              <Battery
                size={18}
                className={`mb-2 ${(() => {
                  const batteryLevel = (vehicle as any).metadata?.batteryLevel || (vehicle as any).batteryLevel
                  const batteryVoltage = (vehicle as any).metadata?.batteryVoltage || (vehicle as any).batteryVoltage || 0
                  let level = batteryLevel !== undefined ? batteryLevel : (batteryVoltage > 0 ? (batteryVoltage * 100 / 14) : 0)
                  if (level > 50) return 'text-[#00E5CC]'
                  if (level > 20) return 'text-[#FFB547]'
                  return 'text-[#FF4D6A]'
                })()}`}
              />
              <p className="text-xs text-[#6B6B80]">Niveau batterie</p>
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
                        filled ? 'bg-[#00E5CC]' : 'bg-[#1F1F2E]'
                      }`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-[#6B6B80]">
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
          <Card className="bg-[#12121A] border border-[#1F1F2E]" title="Force du signal GPS et précision">
            <CardContent className="pt-5 pb-4">
              <Signal
                size={18}
                className={(() => {
                  const signalStrength = (vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || (vehicle as any).signalStrength || 0
                  if (signalStrength > 75) return 'text-[#00E5CC]'
                  if (signalStrength > 40) return 'text-[#FFB547]'
                  return 'text-[#FF4D6A]'
                })()}
                style={{marginBottom: '8px'}}
              />
              <p className="text-xs text-[#6B6B80] mb-1">Signal GPS</p>
              <div className="mt-1 flex gap-0.5 mb-2">
                {[...Array(5)].map((_, idx) => {
                  const signalStrength = (vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality || (vehicle as any).signalStrength || 0
                  const filled = idx < Math.ceil((signalStrength / 100) * 5)
                  return (
                    <div
                      key={idx}
                      className={`h-1.5 flex-1 rounded-sm ${
                        filled ? 'bg-[#00E5CC]' : 'bg-[#1F1F2E]'
                      }`}
                    />
                  )
                })}
              </div>
              <p className="text-xs text-[#6B6B80] mb-3">
                {(vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality ? `${((vehicle as any).metadata?.signalStrength || (vehicle as any).metadata?.gpsQuality).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-xs text-[#6B6B80] mb-1">Précision GPS</p>
              <div className="mt-1">
                {(() => {
                  const gpsAccuracy = ((vehicle as any).gpsAccuracy || 0)
                  let color = 'text-[#00E5CC]'
                  let bgColor = 'bg-[#1A1A25]'
                  let label = 'Excellente'

                  if (gpsAccuracy > 15) {
                    color = 'text-[#FF4D6A]'
                    bgColor = 'bg-[#1A1A25]'
                    label = 'Mauvaise'
                  } else if (gpsAccuracy > 5) {
                    color = 'text-[#FFB547]'
                    bgColor = 'bg-[#1A1A25]'
                    label = 'Acceptable'
                  }

                  return (
                    <div className={`rounded-[8px] px-2 py-1 ${bgColor} border border-[#1F1F2E]`}>
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

        {/* GPS History */}
        {positions.length > 0 && (
          <Card className="bg-[#12121A] border border-[#1F1F2E]">
            <CardHeader className="pb-3">
              <CardTitle className="font-syne text-base text-[#F0F0F5]" title="Dernières positions enregistrées du véhicule">Historique GPS</CardTitle>
              <CardDescription className="text-xs text-[#6B6B80]">Dernières positions enregistrées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F1F2E] text-left text-xs text-[#6B6B80]">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Vitesse</th>
                      <th className="pb-2 pr-4">Cap</th>
                      <th className="pb-2">Position</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F2E]">
                    {positions.slice(0, 15).map((pos: any, idx: number) => (
                      <tr key={idx} className="text-xs text-[#F0F0F5]">
                        <td className="py-2 pr-4 text-[#6B6B80]">
                          {pos.createdAt ? formatDateTime(pos.createdAt) : formatDateTime(pos.timestamp)}
                        </td>
                        <td className="py-2 pr-4 font-mono font-semibold">{(pos.speed || 0).toFixed(0)} km/h</td>
                        <td className="py-2 pr-4 text-[#6B6B80]">{(pos.heading || 0).toFixed(0)}°</td>
                        <td className="py-2 font-mono text-[#00E5CC]">
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

        {/* Vehicle Notes */}
        <Card className="bg-[#12121A] border border-[#1F1F2E]">
          <CardHeader className="pb-3">
            <CardTitle className="font-syne text-base text-[#F0F0F5]" title="Notes et annotations sur ce véhicule">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Ajouter des notes et informations sur ce véhicule..."
              value={vehicleNotes}
              onChange={(e) => setVehicleNotes(e.target.value)}
              className="min-h-24 text-sm bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A]"
            />
            <Button
              className="bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
              size="sm"
              onClick={() => {
                alert('Notes enregistrées')
              }}
            >
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        <Card className="bg-[#12121A] border border-[#1F1F2E]">
          <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle className="font-syne text-base text-[#F0F0F5]" title="Champs supplémentaires personnalisés pour ce véhicule">Champs personnalisés</CardTitle>
            <Button
              className="gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
              size="sm"
              onClick={() => setShowAddField(!showAddField)}
            >
              <Plus size={14} />
              Ajouter un champ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddField && (
              <div className="border border-[#1F1F2E] rounded-lg p-3 space-y-2 bg-[#1A1A25]">
                <input
                  type="text"
                  placeholder="Nom du champ"
                  value={newFieldForm.key}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, key: e.target.value })}
                  className="w-full px-2 py-1.5 border border-[#1F1F2E] rounded text-sm bg-[#12121A] text-[#F0F0F5] placeholder-[#44445A]"
                />
                <input
                  type="text"
                  placeholder="Valeur"
                  value={newFieldForm.value}
                  onChange={(e) => setNewFieldForm({ ...newFieldForm, value: e.target.value })}
                  className="w-full px-2 py-1.5 border border-[#1F1F2E] rounded text-sm bg-[#12121A] text-[#F0F0F5] placeholder-[#44445A]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]"
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
                    className="flex-1 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
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
                  <div key={idx} className="border border-[#1F1F2E] rounded-lg p-2.5 flex items-center justify-between text-sm bg-[#1A1A25]">
                    <div>
                      <p className="font-medium text-[#F0F0F5]">{field.key}</p>
                      <p className="text-xs text-[#6B6B80]">{field.value}</p>
                    </div>
                    <button
                      onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}
                      className="text-[#6B6B80] hover:text-[#F0F0F5]"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#6B6B80]">Aucun champ personnalisé</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Photos */}
        <Card className="bg-[#12121A] border border-[#1F1F2E]">
          <CardHeader className="pb-3">
            <CardTitle className="font-syne text-base text-[#F0F0F5]" title="Galerie de photos du véhicule">Images du véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-[#1F1F2E] rounded-lg p-8 text-center hover:border-[#2A2A3D] transition">
              <Camera size={32} className="mx-auto text-[#6B6B80] mb-2" />
              <p className="text-sm text-[#6B6B80] mb-4">Aucune image. Glissez-déposez ou cliquez pour ajouter.</p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedPhoto(e.target.files[0].name)
                  }
                }}
                className="hidden"
                id="photo-input"
              />
              <Button
                className="bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]"
                size="sm"
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                Sélectionner une image
              </Button>
              {selectedPhoto && (
                <p className="text-xs text-[#6B6B80] mt-3">
                  Fichier sélectionné: <span className="font-medium text-[#F0F0F5]">{selectedPhoto}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <Card className="bg-[#12121A] border border-[#1F1F2E]">
            <CardHeader className="pb-3">
              <CardTitle className="font-syne text-base text-[#F0F0F5]">Filtre par date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#F0F0F5] mb-1">
                    À partir du
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm bg-[#1A1A25] text-[#F0F0F5]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[#F0F0F5] mb-1">
                    Jusqu'au
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm bg-[#1A1A25] text-[#F0F0F5]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trips List */}
          <Card className="bg-[#12121A] border border-[#1F1F2E]">
            <CardHeader className="pb-3">
              <CardTitle className="font-syne text-base text-[#F0F0F5]">Trajets ({trips.length})</CardTitle>
              <CardDescription className="text-[#6B6B80]">
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
                  <Route size={32} className="mx-auto text-[#6B6B80] mb-2" />
                  <p className="text-[#6B6B80]">Aucun trajet trouvé pour cette période</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip, idx) => (
                    <div key={idx} className="border border-[#1F1F2E] rounded-[12px] p-4 hover:bg-[#1A1A25] hover:border-[#2A2A3D] transition">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-[#6B6B80] mb-1">Départ</p>
                          <p className="font-syne font-medium text-sm text-[#F0F0F5]">
                            {trip.startAddress || `${trip.startLat.toFixed(4)}, ${trip.startLng.toFixed(4)}`}
                          </p>
                          <p className="text-xs text-[#6B6B80]">
                            {formatDateTime(trip.startTime)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6B6B80] mb-1">Arrivée</p>
                          <p className="font-syne font-medium text-sm text-[#F0F0F5]">
                            {trip.endAddress || `${trip.endLat.toFixed(4)}, ${trip.endLng.toFixed(4)}`}
                          </p>
                          <p className="text-xs text-[#6B6B80]">
                            {formatDateTime(trip.endTime)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm">
                        <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center">
                          <p className="text-xs text-[#6B6B80] mb-1">Durée</p>
                          <p className="font-mono font-semibold text-[#00E5CC]">{formatDuration(trip.duration)}</p>
                        </div>
                        <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center">
                          <p className="text-xs text-[#6B6B80] mb-1">Distance</p>
                          <p className="font-mono font-semibold text-[#00E5CC]">{trip.distance.toFixed(1)} km</p>
                        </div>
                        <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center">
                          <p className="text-xs text-[#6B6B80] mb-1">Vitesse moy.</p>
                          <p className="font-mono font-semibold text-[#00E5CC]">{trip.averageSpeed.toFixed(0)} km/h</p>
                        </div>
                        <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center">
                          <p className="text-xs text-[#6B6B80] mb-1">Vitesse max</p>
                          <p className="font-mono font-semibold text-[#00E5CC]">{trip.maxSpeed.toFixed(0)} km/h</p>
                        </div>
                      </div>

                      <Button
                        className="w-full gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]"
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
            <Card className="bg-[#12121A] border border-[#1F1F2E]">
              <CardHeader className="pb-3 flex items-center justify-between">
                <CardTitle className="font-syne text-base text-[#F0F0F5]">Affichage du trajet</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[#6B6B80] hover:text-[#F0F0F5]"
                  onClick={() => setReplayingTrip(null)}
                >
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden mb-4 border border-[#1F1F2E]">
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
                          color: '#00E5CC',
                          fillColor: '#00E5CC',
                          fillOpacity: 0.6 - (idx / replayingTrip.points!.length) * 0.5,
                          weight: 1,
                        }}
                      />
                    ))}
                  </MapContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2">
                    <p className="text-xs text-[#6B6B80]">Durée</p>
                    <p className="font-mono font-semibold text-[#F0F0F5]">{formatDuration(replayingTrip.duration)}</p>
                  </div>
                  <div className="bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2">
                    <p className="text-xs text-[#6B6B80]">Distance</p>
                    <p className="font-mono font-semibold text-[#F0F0F5]">{replayingTrip.distance.toFixed(1)} km</p>
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
