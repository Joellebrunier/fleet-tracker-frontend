import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import {
  Building2, Users, Car, MapPin, Shield, Activity,
  FileText, Download, BarChart3, Bell, Clock,
  ChevronRight, Search, Calendar, TrendingUp,
  Truck, Fuel, AlertTriangle, CheckCircle2, Eye
} from 'lucide-react'

interface ClientVehicle {
  id: string
  name: string
  plate: string
  status: 'active' | 'idle' | 'offline'
  lastPosition: string
  lastUpdate: string
  speed: number
  fuelLevel: number
  mileage: number
  driver?: string
}

interface ClientReport {
  id: string
  title: string
  type: string
  period: string
  generatedAt: string
  status: 'ready' | 'generating'
}

interface ClientInvoice {
  id: string
  number: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
}

const MOCK_VEHICLES: ClientVehicle[] = [
  { id: '1', name: 'Renault Clio', plate: 'HJ-180-PW', status: 'active', lastPosition: 'Nice, Promenade des Anglais', lastUpdate: new Date(Date.now() - 120000).toISOString(), speed: 45, fuelLevel: 67, mileage: 45230, driver: 'Jean Dupont' },
  { id: '2', name: 'Peugeot 308', plate: 'FP-456-AB', status: 'active', lastPosition: 'Antibes, Route de Grasse', lastUpdate: new Date(Date.now() - 300000).toISOString(), speed: 72, fuelLevel: 45, mileage: 32100, driver: 'Marie Martin' },
  { id: '3', name: 'Citroën Berlingo', plate: 'GK-789-CD', status: 'idle', lastPosition: 'Cagnes-sur-Mer, Zone Industrielle', lastUpdate: new Date(Date.now() - 1800000).toISOString(), speed: 0, fuelLevel: 82, mileage: 28750 },
  { id: '4', name: 'Ford Transit', plate: 'DJ-321-MN', status: 'offline', lastPosition: 'Nice, Parking Arénas', lastUpdate: new Date(Date.now() - 86400000).toISOString(), speed: 0, fuelLevel: 23, mileage: 67400, driver: 'Pierre Durand' },
  { id: '5', name: 'Renault Kangoo', plate: 'EL-654-QR', status: 'active', lastPosition: 'Saint-Laurent-du-Var, Centre', lastUpdate: new Date(Date.now() - 60000).toISOString(), speed: 35, fuelLevel: 55, mileage: 38900, driver: 'Sophie Bernard' },
]

const MOCK_REPORTS: ClientReport[] = [
  { id: '1', title: 'Rapport kilométrique mensuel', type: 'Kilométrage', period: 'Avril 2026', generatedAt: '2026-05-01', status: 'ready' },
  { id: '2', title: 'Rapport de consommation', type: 'Carburant', period: 'Avril 2026', generatedAt: '2026-05-01', status: 'ready' },
  { id: '3', title: 'Rapport d\'activité conducteurs', type: 'Activité', period: 'Avril 2026', generatedAt: '2026-05-01', status: 'ready' },
  { id: '4', title: 'Rapport kilométrique mensuel', type: 'Kilométrage', period: 'Mai 2026', generatedAt: '', status: 'generating' },
]

const MOCK_INVOICES: ClientInvoice[] = [
  { id: '1', number: 'FAC-2026-042', date: '2026-05-01', amount: 149.00, status: 'pending' },
  { id: '2', number: 'FAC-2026-031', date: '2026-04-01', amount: 149.00, status: 'paid' },
  { id: '3', number: 'FAC-2026-019', date: '2026-03-01', amount: 149.00, status: 'paid' },
]

const STATUS_COLORS = {
  active: 'bg-green-500',
  idle: 'bg-amber-500',
  offline: 'bg-gray-400',
}

const STATUS_LABELS = {
  active: 'En route',
  idle: 'À l\'arrêt',
  offline: 'Hors ligne',
}

type PortalTab = 'overview' | 'vehicles' | 'reports' | 'invoices'

export default function ClientPortalPage() {
  const user = useAuthStore((s) => s.user)
  const [activeTab, setActiveTab] = useState<PortalTab>('overview')
  const [search, setSearch] = useState('')

  const activeVehicles = MOCK_VEHICLES.filter((v) => v.status === 'active').length
  const totalMileage = MOCK_VEHICLES.reduce((sum, v) => sum + v.mileage, 0)
  const avgFuel = Math.round(MOCK_VEHICLES.reduce((sum, v) => sum + v.fuelLevel, 0) / MOCK_VEHICLES.length)

  const tabs: { id: PortalTab; label: string; icon: typeof Building2 }[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'vehicles', label: 'Véhicules', icon: Car },
    { id: 'reports', label: 'Rapports', icon: FileText },
    { id: 'invoices', label: 'Facturation', icon: FileText },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-500" />
            Portail Client
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenue, {user?.firstName || 'Client'}. Voici l'état de votre flotte.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          <Shield className="h-3.5 w-3.5 mr-1" />
          Plan Pro — 5 véhicules
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                    <Car className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{MOCK_VEHICLES.length}</p>
                    <p className="text-xs text-gray-500">Véhicules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeVehicles}</p>
                    <p className="text-xs text-gray-500">En route</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(totalMileage / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-gray-500">km total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                    <Fuel className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{avgFuel}%</p>
                    <p className="text-xs text-gray-500">Carburant moy.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle quick list */}
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-semibold">État des véhicules</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('vehicles')}>
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {MOCK_VEHICLES.map((v) => (
                  <div key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLORS[v.status]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{v.name} <span className="text-gray-400 font-normal">({v.plate})</span></p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{v.lastPosition}
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{v.speed > 0 ? `${v.speed} km/h` : STATUS_LABELS[v.status]}</p>
                      <p className="flex items-center gap-1 justify-end">
                        <Fuel className="h-3 w-3" />{v.fuelLevel}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent alerts */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Alertes récentes
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <span className="flex-1">Excès de vitesse — Renault Clio (142 km/h)</span>
                  <span className="text-xs text-gray-500">Il y a 5 min</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <span className="flex-1">Niveau carburant bas — Ford Transit (23%)</span>
                  <span className="text-xs text-gray-500">Il y a 2h</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-950/20 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="flex-1">Maintenance terminée — Renault Kangoo</span>
                  <span className="text-xs text-gray-500">Hier</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vehicles tab */}
      {activeTab === 'vehicles' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un véhicule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_VEHICLES
              .filter((v) => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.plate.toLowerCase().includes(search.toLowerCase()))
              .map((v) => (
                <Card key={v.id} className="hover:shadow-md transition">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          v.status === 'active' ? 'bg-green-50 dark:bg-green-950/30' : 'bg-gray-50 dark:bg-gray-800'
                        }`}>
                          <Car className={`h-5 w-5 ${v.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{v.name}</h3>
                          <p className="text-xs text-gray-500 font-mono">{v.plate}</p>
                        </div>
                      </div>
                      <Badge className={`text-[10px] ${
                        v.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        v.status === 'idle' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {STATUS_LABELS[v.status]}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-500">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {v.lastPosition}
                      </p>
                      {v.driver && (
                        <p className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-gray-400" />
                          {v.driver}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                      <span>{v.speed > 0 ? `${v.speed} km/h` : '—'}</span>
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3 w-3" />{v.fuelLevel}%
                      </span>
                      <span>{v.mileage.toLocaleString('fr-FR')} km</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{MOCK_REPORTS.length} rapport(s) disponible(s)</p>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Générer un rapport
            </Button>
          </div>
          {MOCK_REPORTS.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{r.title}</h3>
                      <p className="text-xs text-gray-500">{r.period} — {r.type}</p>
                    </div>
                  </div>
                  {r.status === 'ready' ? (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 text-[10px]">
                      <Clock className="h-3 w-3 mr-1" />
                      En cours...
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Invoices tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {MOCK_INVOICES.map((inv) => (
            <Card key={inv.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      inv.status === 'paid' ? 'bg-green-50 dark:bg-green-950/30' :
                      inv.status === 'overdue' ? 'bg-red-50 dark:bg-red-950/30' :
                      'bg-amber-50 dark:bg-amber-950/30'
                    }`}>
                      <FileText className={`h-5 w-5 ${
                        inv.status === 'paid' ? 'text-green-500' :
                        inv.status === 'overdue' ? 'text-red-500' :
                        'text-amber-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{inv.number}</h3>
                      <p className="text-xs text-gray-500">{new Date(inv.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-sm font-bold">{inv.amount.toFixed(2)} €</p>
                    <Badge className={`text-[10px] ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {inv.status === 'paid' ? 'Payée' : inv.status === 'overdue' ? 'En retard' : 'En attente'}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
