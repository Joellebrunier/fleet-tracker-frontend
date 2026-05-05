import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Mail, Phone, Shield, Car, Award, LogOut } from 'lucide-react'

export default function DriverAppProfile() {
  const { user, logout } = useAuthStore()

  return (
    <div className="p-4 space-y-4">
      {/* Avatar & name */}
      <div className="text-center pt-4">
        <div className="h-20 w-20 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
          <User className="h-10 w-10 text-blue-500" />
        </div>
        <h1 className="text-lg font-bold">{user?.firstName} {user?.lastName}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Info cards */}
      <Card>
        <CardContent className="p-0 divide-y divide-gray-100 dark:divide-gray-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm">{user?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Téléphone</p>
              <p className="text-sm">{user?.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Shield className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Rôle</p>
              <p className="text-sm">{user?.role || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <Car className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Véhicule assigné</p>
              <p className="text-sm">Renault Clio (HJ-180-PW)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Statistiques
          </h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xl font-bold">82</p>
              <p className="text-[10px] text-gray-500">Éco-score</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xl font-bold">47</p>
              <p className="text-[10px] text-gray-500">Trajets ce mois</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xl font-bold">1 842</p>
              <p className="text-[10px] text-gray-500">km ce mois</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-xl font-bold">6.1</p>
              <p className="text-[10px] text-gray-500">L/100km moy.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button variant="outline" className="w-full text-red-500 border-red-200 hover:bg-red-50" onClick={logout}>
        <LogOut className="h-4 w-4 mr-2" />
        Se déconnecter
      </Button>
    </div>
  )
}
