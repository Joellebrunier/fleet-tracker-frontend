import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useVehicle, useVehicleHistory } from '@/hooks/useVehicles'
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
} from 'lucide-react'
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

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showReplay, setShowReplay] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [currentAddress, setCurrentAddress] = useState<string | null>(null)
  const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id || '')
  const { data: history } = useVehicleHistory(id || '')

  const positions = useMemo(() => {
    if (!history) return []
    const items = Array.isArray(history) ? history : history.data || history.positions || []
    return items.slice(0, 50)
  }, [history])

  // Reverse geocode current position when lat/lng changes
  useEffect(() => {
    if (vehicle?.currentLat && vehicle?.currentLng) {
      reverseGeocode(vehicle.currentLat, vehicle.currentLng)
        .then(address => setCurrentAddress(address || null))
        .catch(() => setCurrentAddress(null))
    }
  }, [vehicle?.currentLat, vehicle?.currentLng])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
            <Badge variant={isMoving ? 'default' : 'secondary'}>
              {isMoving ? 'En route' : hasGps ? 'Arrêté' : 'Hors ligne'}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">
            {vehicle.plate} · {provider} · IMEI: {vehicle.deviceImei || 'N/A'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setShowReplay(true)}>
            <Play size={16} />
            Replay GPS
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowExport(true)}>
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

      {/* Top row: Mini map + Current Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mini map */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Position actuelle</CardTitle>
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
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.5 - idx * 0.01,
                        weight: 1,
                      }}
                    />
                  ))}
                </MapContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-400">
                  <MapPin size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Aucune position GPS disponible</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Statut en temps réel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <Gauge size={20} className="mx-auto text-gray-400 mb-1" />
              <p className="text-3xl font-bold text-gray-900">
                {(vehicle.currentSpeed || 0).toFixed(0)}
              </p>
              <p className="text-xs text-gray-500">km/h</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Power size={14} className={((vehicle as any).ignition ? 'text-green-500' : 'text-gray-400')} />
                <span className="text-gray-600 flex-1">Contact</span>
                <span className={`font-medium text-xs ${(vehicle as any).ignition ? 'text-green-600' : 'text-gray-500'}`}>
                  {(vehicle as any).ignition ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Battery size={14} className="text-gray-400" />
                <span className="text-gray-600 flex-1">Batterie</span>
                <span className={`font-medium text-xs ${((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) < 11 ? 'text-red-600' : ((vehicle as any).batteryVoltage || meta.batteryVoltage || 0) < 12 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {((vehicle as any).batteryVoltage || meta.batteryVoltage || 0).toFixed(1)} V
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-gray-400" />
                <span className="text-gray-600 flex-1">Cap</span>
                <span className="font-medium">{(vehicle.currentHeading || 0).toFixed(0)}°</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span className="text-gray-600 flex-1">Position</span>
                <span className="font-mono text-xs">
                  {vehicle.currentLat?.toFixed(5)}, {vehicle.currentLng?.toFixed(5)}
                </span>
              </div>
              {currentAddress && (
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-gray-600 text-xs block">Adresse</span>
                    <span className="text-gray-900 text-xs leading-tight">{currentAddress}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-gray-400" />
                <span className="text-gray-600 flex-1">Dernière com.</span>
                <span className="font-medium text-xs">
                  {vehicle.lastCommunication ? formatTimeAgo(vehicle.lastCommunication) : 'Jamais'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-gray-400" />
                <span className="text-gray-600 flex-1">Provider</span>
                <Badge variant="outline" className="text-xs">{provider}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle info cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <Car size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Marque / Modèle</p>
            <p className="font-semibold text-gray-900 mt-0.5">
              {vehicle.brand || '—'} {vehicle.model || ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Navigation size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Plaque</p>
            <p className="font-semibold text-gray-900 mt-0.5">{vehicle.plate || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Cpu size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">IMEI</p>
            <p className="font-mono text-xs text-gray-900 mt-0.5">{vehicle.deviceImei || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Clock size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Créé le</p>
            <p className="font-semibold text-gray-900 mt-0.5 text-sm">
              {vehicle.createdAt ? formatDateTime(vehicle.createdAt) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Route size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Odomètre</p>
            <p className="font-semibold text-gray-900 mt-0.5">
              {((vehicle as any).odometer || vehicle.totalDistance || 0).toLocaleString('fr-FR')} km
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Zap size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">VIN</p>
            <p className="font-mono text-xs text-gray-900 mt-0.5">{(vehicle as any).vin || vehicle.vin || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Car size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Type</p>
            <p className="font-semibold text-gray-900 mt-0.5">
              {(vehicle as any).vehicleType || vehicle.type || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Engine Hours */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <Activity size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Heures moteur</p>
            <p className="font-semibold text-gray-900 mt-0.5 text-lg">
              {((vehicle as any).engineHours || 0).toLocaleString('fr-FR')} h
            </p>
          </CardContent>
        </Card>

        {/* Signal Strength */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <Signal size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Force du signal</p>
            <div className="mt-2 flex gap-0.5">
              {[...Array(5)].map((_, idx) => {
                const signalStrength = ((vehicle as any).signalStrength || 0)
                const filled = idx < Math.ceil((signalStrength / 100) * 5)
                return (
                  <div
                    key={idx}
                    className={`h-1.5 flex-1 rounded-sm ${
                      filled ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )
              })}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {((vehicle as any).signalStrength || 0).toFixed(0)}%
            </p>
          </CardContent>
        </Card>

        {/* GPS Accuracy */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <MapPin size={18} className="text-gray-400 mb-2" />
            <p className="text-xs text-gray-500">Précision GPS</p>
            <div className="mt-2">
              {(() => {
                const gpsAccuracy = ((vehicle as any).gpsAccuracy || 0)
                let color = 'text-green-600'
                let bgColor = 'bg-green-50'
                let label = 'Excellente'

                if (gpsAccuracy > 15) {
                  color = 'text-red-600'
                  bgColor = 'bg-red-50'
                  label = 'Mauvaise'
                } else if (gpsAccuracy > 5) {
                  color = 'text-yellow-600'
                  bgColor = 'bg-yellow-50'
                  label = 'Acceptable'
                }

                return (
                  <div className={`rounded px-2 py-1.5 ${bgColor}`}>
                    <p className={`font-medium text-sm ${color}`}>
                      {gpsAccuracy.toFixed(1)} m
                    </p>
                    <p className={`text-xs ${color}`}>{label}</p>
                  </div>
                )
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPS History */}
      {positions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historique GPS</CardTitle>
            <CardDescription className="text-xs">Dernières positions enregistrées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Vitesse</th>
                    <th className="pb-2 pr-4">Cap</th>
                    <th className="pb-2">Position</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {positions.slice(0, 15).map((pos: any, idx: number) => (
                    <tr key={idx} className="text-xs">
                      <td className="py-2 pr-4 text-gray-600">
                        {pos.createdAt ? formatDateTime(pos.createdAt) : formatDateTime(pos.timestamp)}
                      </td>
                      <td className="py-2 pr-4 font-medium">{(pos.speed || 0).toFixed(0)} km/h</td>
                      <td className="py-2 pr-4 text-gray-600">{(pos.heading || 0).toFixed(0)}°</td>
                      <td className="py-2 font-mono text-gray-500">
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
    </div>
  )
}
