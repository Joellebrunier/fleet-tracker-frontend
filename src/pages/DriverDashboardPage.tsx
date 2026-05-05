import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Car,
  Gauge,
  MapPin,
  Clock,
  TrendingUp,
  Fuel,
  AlertTriangle,
  Navigation,
  Activity,
  Calendar,
  Route,
  Timer,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DriverStats {
  totalTrips: number
  totalDistance: number
  totalDuration: number
  avgSpeed: number
  maxSpeed: number
  ecoScore: number
  harshBrakingCount: number
  harshAccelerationCount: number
  idleTime: number
}

interface AssignedVehicle {
  id: string
  name: string
  licensePlate: string
  status: 'active' | 'idle' | 'offline'
  latitude?: number
  longitude?: number
  speed?: number
  lastCommunication?: string
  fuelLevel?: number
}

interface RecentTrip {
  id: string
  startTime: string
  endTime: string
  startAddress: string
  endAddress: string
  distance: number
  duration: number
  maxSpeed: number
  avgSpeed: number
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_STATS: DriverStats = {
  totalTrips: 47,
  totalDistance: 1842,
  totalDuration: 5400,
  avgSpeed: 42,
  maxSpeed: 118,
  ecoScore: 82,
  harshBrakingCount: 3,
  harshAccelerationCount: 5,
  idleTime: 320,
}

const MOCK_VEHICLE: AssignedVehicle = {
  id: 'v1',
  name: 'Renault Clio',
  licensePlate: 'HJ-180-PW',
  status: 'active',
  latitude: 43.7102,
  longitude: 7.2620,
  speed: 45,
  lastCommunication: new Date().toISOString(),
  fuelLevel: 67,
}

const MOCK_TRIPS: RecentTrip[] = [
  {
    id: 't1',
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    startAddress: 'Nice, Promenade des Anglais',
    endAddress: 'Antibes, Place de Gaulle',
    distance: 28.4,
    duration: 42,
    maxSpeed: 95,
    avgSpeed: 41,
  },
  {
    id: 't2',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 + 5400000).toISOString(),
    startAddress: 'Cannes, La Croisette',
    endAddress: 'Nice, Aéroport',
    distance: 35.1,
    duration: 55,
    maxSpeed: 110,
    avgSpeed: 38,
  },
  {
    id: 't3',
    startTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    startAddress: 'Monaco, Port Hercule',
    endAddress: 'Nice, Vieux Port',
    distance: 18.7,
    duration: 35,
    maxSpeed: 85,
    avgSpeed: 32,
  },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color = 'blue',
}: {
  icon: any
  label: string
  value: string | number
  unit?: string
  color?: string
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500',
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold">
            {value}
            {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DriverDashboardPage() {
  const { user } = useAuthStore()
  const [stats] = useState<DriverStats>(MOCK_STATS)
  const [vehicle] = useState<AssignedVehicle | null>(MOCK_VEHICLE)
  const [trips] = useState<RecentTrip[]>(MOCK_TRIPS)

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    idle: 'bg-amber-500',
    offline: 'bg-gray-500',
  }
  const statusLabels: Record<string, string> = {
    active: 'En mouvement',
    idle: 'Au ralenti',
    offline: 'Hors ligne',
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-blue-500" />
          Tableau de bord conducteur
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Bonjour {user?.firstName || 'Conducteur'}, voici votre résumé
        </p>
      </div>

      {/* Current vehicle */}
      {vehicle && (
        <Card className="border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Car className="h-4 w-4" />
              Véhicule assigné
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                <p className="text-sm text-gray-500">{vehicle.licensePlate}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 justify-end">
                  <span className={`h-2 w-2 rounded-full ${statusColors[vehicle.status]}`} />
                  <span className="text-sm">{statusLabels[vehicle.status]}</span>
                </div>
                {vehicle.speed != null && (
                  <p className="text-sm text-gray-500">
                    <Gauge className="h-3 w-3 inline mr-1" />
                    {vehicle.speed} km/h
                  </p>
                )}
                {vehicle.fuelLevel != null && (
                  <p className="text-sm text-gray-500">
                    <Fuel className="h-3 w-3 inline mr-1" />
                    {vehicle.fuelLevel}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Route} label="Trajets ce mois" value={stats.totalTrips} color="blue" />
        <StatCard
          icon={Navigation}
          label="Distance totale"
          value={stats.totalDistance}
          unit="km"
          color="green"
        />
        <StatCard icon={Gauge} label="Vitesse moyenne" value={stats.avgSpeed} unit="km/h" color="purple" />
        <StatCard
          icon={TrendingUp}
          label="Éco-score"
          value={stats.ecoScore}
          unit="/100"
          color={stats.ecoScore >= 70 ? 'green' : 'amber'}
        />
      </div>

      {/* Driving behavior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.harshBrakingCount}</p>
            <p className="text-xs text-gray-500">Freinages brusques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.harshAccelerationCount}</p>
            <p className="text-xs text-gray-500">Accélérations brusques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Timer className="h-5 w-5 text-gray-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.idleTime}</p>
            <p className="text-xs text-gray-500 mt-0.5">min au ralenti</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent trips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Derniers trajets
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {trips.map((trip) => (
              <div key={trip.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="truncate">{trip.startAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="truncate">{trip.endAddress}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span>{trip.distance} km</span>
                      <span>{trip.duration} min</span>
                      <span>Moy. {trip.avgSpeed} km/h</span>
                      <span>Max {trip.maxSpeed} km/h</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-gray-500">{formatDateTime(trip.startTime)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
