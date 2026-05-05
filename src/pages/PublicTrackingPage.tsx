import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import L from 'leaflet'
import {
  MapPin,
  Clock,
  Gauge,
  Navigation,
  AlertTriangle,
  History,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { TOMTOM_TILE_URL, API_ROUTES } from '@/lib/constants'
import 'leaflet/dist/leaflet.css'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VehicleData {
  name: string
  licensePlate?: string
  latitude?: number
  longitude?: number
  heading?: number
  speed?: number
  lastCommunication?: string
  moving?: boolean
}

interface LinkMeta {
  recipientName?: string
  validUntil?: string
  historyDays?: number
}

interface HistoryPoint {
  latitude: number
  longitude: number
  dateTime: number
  speed?: number
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function createVehicleIcon(moving: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${moving ? '#22c55e' : '#6b7280'};
      border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function formatTime(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/* ------------------------------------------------------------------ */
/*  LeafletMap (raw, no react-leaflet to avoid Context.Consumer crash) */
/* ------------------------------------------------------------------ */

function LeafletMap({
  vehicle,
  historyPath,
  showHistory,
}: {
  vehicle: VehicleData
  historyPath: [number, number][]
  showHistory: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const polylineRef = useRef<L.Polyline | null>(null)

  // Initialize map with TomTom tiles
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [vehicle.latitude!, vehicle.longitude!],
      zoom: 15,
      zoomControl: false,
      attributionControl: true,
    })

    mapRef.current = map

    L.tileLayer(TOMTOM_TILE_URL(), {
      attribution: '&copy; TomTom',
    }).addTo(map)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update marker position
  useEffect(() => {
    const map = mapRef.current
    if (!map || !vehicle.latitude || !vehicle.longitude) return

    if (markerRef.current) {
      markerRef.current.setLatLng([vehicle.latitude, vehicle.longitude])
      markerRef.current.setIcon(createVehicleIcon(!!vehicle.moving))
    } else {
      markerRef.current = L.marker([vehicle.latitude, vehicle.longitude], {
        icon: createVehicleIcon(!!vehicle.moving),
      })
        .addTo(map)
        .bindPopup(
          `<b>${vehicle.name}</b>${vehicle.licensePlate ? `<br/>${vehicle.licensePlate}` : ''}`
        )
    }
  }, [vehicle.latitude, vehicle.longitude, vehicle.moving, vehicle.name, vehicle.licensePlate])

  // History polyline
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current)
      polylineRef.current = null
    }

    if (showHistory && historyPath.length > 1) {
      polylineRef.current = L.polyline(historyPath, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
      }).addTo(map)

      map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] })
    }
  }, [showHistory, historyPath])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ zIndex: 0 }}
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function PublicTrackingPage() {
  const { token } = useParams<{ token: string }>()
  const platform = detectPlatform()
  const [vehicle, setVehicle] = useState<VehicleData | null>(null)
  const [linkMeta, setLinkMeta] = useState<LinkMeta | null>(null)
  const [history, setHistory] = useState<HistoryPoint[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiBase = import.meta.env.VITE_API_URL || 'https://balanced-endurance-production-6438.up.railway.app'

  const fetchPosition = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${apiBase}${API_ROUTES.SHARED_TRACKING(token)}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Lien invalide')
      }
      const data = await res.json()
      setVehicle(data.data?.vehicle || data.vehicle)
      setLinkMeta(data.data?.link || data.link)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token, apiBase])

  const fetchHistory = useCallback(async () => {
    if (!token) return
    setHistoryLoading(true)
    try {
      const res = await fetch(`${apiBase}${API_ROUTES.SHARED_TRACKING_HISTORY(token)}`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.data || data.history || [])
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false)
    }
  }, [token, apiBase])

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchPosition()
    const interval = setInterval(fetchPosition, 30000)
    return () => clearInterval(interval)
  }, [fetchPosition])

  // Fetch history when toggled on
  useEffect(() => {
    if (showHistory && history.length === 0) fetchHistory()
  }, [showHistory, fetchHistory, history.length])

  const historyPath: [number, number][] = history.map((p) => [p.latitude, p.longitude])

  const expiresAt = linkMeta?.validUntil
    ? formatTime(linkMeta.validUntil)
    : null

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-gray-400">Chargement du suivi...</p>
        </div>
      </div>
    )
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Lien de suivi invalide</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  /* ---------- No position ---------- */
  if (!vehicle || !vehicle.latitude || !vehicle.longitude) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 p-4">
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 text-gray-500 mx-auto" />
          <h1 className="text-xl font-bold text-white">Position indisponible</h1>
          <p className="text-gray-400">
            Aucune position GPS disponible pour ce véhicule.
          </p>
        </div>
      </div>
    )
  }

  /* ---------- Main view ---------- */
  return (
    <div className="h-screen w-screen relative">
      {/* Map */}
      <LeafletMap
        vehicle={vehicle}
        historyPath={historyPath}
        showHistory={showHistory}
      />

      {/* Info overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4">
        <div className="mx-auto max-w-lg rounded-xl border border-gray-700 bg-gray-900/95 backdrop-blur-sm p-4 shadow-lg">
          {/* Vehicle name */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">{vehicle.name}</h2>
              {vehicle.licensePlate && (
                <span className="text-xs text-gray-400">{vehicle.licensePlate}</span>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                vehicle.moving
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-600 text-gray-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  vehicle.moving ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}
              />
              {vehicle.moving ? 'En mouvement' : 'À l\'arrêt'}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center mt-3">
            {vehicle.speed != null && (
              <div className="rounded-lg bg-gray-800 p-2">
                <Gauge className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                <p className="text-sm font-medium text-white">
                  {Math.round(vehicle.speed)} km/h
                </p>
              </div>
            )}
            {vehicle.heading != null && (
              <div className="rounded-lg bg-gray-800 p-2">
                <Navigation className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                <p className="text-sm font-medium text-white">{Math.round(vehicle.heading)}°</p>
              </div>
            )}
            {vehicle.lastCommunication && (
              <div className="rounded-lg bg-gray-800 p-2">
                <Clock className="h-4 w-4 mx-auto mb-1 text-gray-400" />
                <p className="text-xs font-medium text-white">
                  {formatTime(vehicle.lastCommunication)}
                </p>
              </div>
            )}
          </div>

          {/* Navigate to vehicle */}
          <div className="flex gap-2 mt-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${vehicle.latitude},${vehicle.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white hover:bg-gray-700 transition">
                <Navigation className="h-3.5 w-3.5" />
                Google Maps
              </button>
            </a>
            <a
              href={`https://waze.com/ul?ll=${vehicle.latitude},${vehicle.longitude}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <button className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white hover:bg-gray-700 transition">
                <ExternalLink className="h-3.5 w-3.5" />
                Waze
              </button>
            </a>
            {platform === 'ios' && (
              <a
                href={`https://maps.apple.com/?daddr=${vehicle.latitude},${vehicle.longitude}&dirflg=d`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <button className="w-full flex items-center justify-center gap-1.5 text-xs rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white hover:bg-gray-700 transition">
                  <MapPin className="h-3.5 w-3.5" />
                  Apple Maps
                </button>
              </a>
            )}
          </div>

          {/* History toggle + metadata */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              disabled={historyLoading}
              className="flex items-center gap-1.5 text-xs rounded-lg border border-gray-600 bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-700 transition disabled:opacity-50"
            >
              {historyLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <History className="h-3.5 w-3.5" />
              )}
              {showHistory
                ? 'Masquer l\'historique'
                : `Historique ${linkMeta?.historyDays || 7}j`}
            </button>
            <div className="text-xs text-gray-500 text-right space-y-0.5">
              {linkMeta?.recipientName && <p>{linkMeta.recipientName}</p>}
              {expiresAt && <p>Expire le {expiresAt}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="rounded-lg bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 border border-gray-700 shadow-sm">
          <span className="text-xs font-semibold text-blue-400 tracking-wider">
            FLEET TRACK
          </span>
        </div>
      </div>
    </div>
  )
}
