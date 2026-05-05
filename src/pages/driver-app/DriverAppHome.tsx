import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Fuel, MapPin, Clock, Gauge, AlertTriangle, ChevronRight } from 'lucide-react'

export default function DriverAppHome() {
  const { user } = useAuthStore()

  return (
    <div className="p-4 space-y-4">
      {/* Greeting */}
      <div className="pt-2">
        <h1 className="text-xl font-bold">
          Bonjour {user?.firstName || 'Conducteur'} 👋
        </h1>
        <p className="text-sm text-gray-500">Votre résumé du jour</p>
      </div>

      {/* Current vehicle */}
      <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Renault Clio</h3>
                <p className="text-sm text-gray-500">HJ-180-PW</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-600">Actif</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="text-center">
              <Gauge className="h-4 w-4 mx-auto text-gray-400 mb-0.5" />
              <p className="text-sm font-medium">45 230</p>
              <p className="text-[10px] text-gray-500">km</p>
            </div>
            <div className="text-center">
              <Fuel className="h-4 w-4 mx-auto text-gray-400 mb-0.5" />
              <p className="text-sm font-medium">67%</p>
              <p className="text-[10px] text-gray-500">Carburant</p>
            </div>
            <div className="text-center">
              <Clock className="h-4 w-4 mx-auto text-gray-400 mb-0.5" />
              <p className="text-sm font-medium">2h30</p>
              <p className="text-[10px] text-gray-500">Conduite</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/driver-app/declare">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Fuel className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-sm font-medium">Déclarer un plein</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/driver-app/stations">
          <Card className="hover:shadow-md transition cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-sm font-medium">Trouver une station</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Today's stats */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Aujourd'hui</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Car className="h-3.5 w-3.5" /> Trajets
              </span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Distance
              </span>
              <span className="text-sm font-medium">87 km</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Temps de conduite
              </span>
              <span className="text-sm font-medium">2h 30min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Gauge className="h-3.5 w-3.5" /> Vitesse moyenne
              </span>
              <span className="text-sm font-medium">35 km/h</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent alerts */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertes
            </h3>
            <span className="text-xs text-gray-500">Voir tout</span>
          </div>
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Aucune alerte active</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
