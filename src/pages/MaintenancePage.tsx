import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Wrench, Calendar, Car, AlertTriangle, CheckCircle2,
  Clock, Search, Plus, ChevronRight, Filter,
  TrendingUp, DollarSign, Gauge, FileText, X
} from 'lucide-react'

type MaintenanceStatus = 'scheduled' | 'overdue' | 'in_progress' | 'completed'
type MaintenanceType = 'revision' | 'tires' | 'brakes' | 'oil' | 'battery' | 'inspection' | 'other'

interface MaintenanceRecord {
  id: string
  vehicleName: string
  vehiclePlate: string
  type: MaintenanceType
  description: string
  status: MaintenanceStatus
  scheduledDate: string
  completedDate?: string
  mileageAtService?: number
  nextMileage?: number
  cost?: number
  garage?: string
  notes?: string
}

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Planifié', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  overdue: { label: 'En retard', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  in_progress: { label: 'En cours', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  completed: { label: 'Terminé', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
}

const TYPE_CONFIG: Record<MaintenanceType, { label: string; emoji: string }> = {
  revision: { label: 'Révision', emoji: '🔧' },
  tires: { label: 'Pneumatiques', emoji: '🛞' },
  brakes: { label: 'Freins', emoji: '🛑' },
  oil: { label: 'Vidange', emoji: '🛢️' },
  battery: { label: 'Batterie', emoji: '🔋' },
  inspection: { label: 'Contrôle technique', emoji: '📋' },
  other: { label: 'Autre', emoji: '⚙️' },
}

const MOCK_RECORDS: MaintenanceRecord[] = [
  {
    id: '1',
    vehicleName: 'Renault Clio',
    vehiclePlate: 'HJ-180-PW',
    type: 'revision',
    description: 'Révision des 50 000 km',
    status: 'overdue',
    scheduledDate: '2026-04-28',
    nextMileage: 50000,
    garage: 'Garage Renault Nice',
    notes: 'Véhicule à 49 850 km actuellement',
  },
  {
    id: '2',
    vehicleName: 'Peugeot 308',
    vehiclePlate: 'FP-456-AB',
    type: 'tires',
    description: 'Changement pneus avant',
    status: 'scheduled',
    scheduledDate: '2026-05-10',
    cost: 320,
    garage: 'Euromaster Nice',
  },
  {
    id: '3',
    vehicleName: 'Citroën Berlingo',
    vehiclePlate: 'GK-789-CD',
    type: 'inspection',
    description: 'Contrôle technique périodique',
    status: 'scheduled',
    scheduledDate: '2026-05-15',
    garage: 'DEKRA Nice Est',
  },
  {
    id: '4',
    vehicleName: 'Ford Transit',
    vehiclePlate: 'DJ-321-MN',
    type: 'oil',
    description: 'Vidange + filtre à huile',
    status: 'in_progress',
    scheduledDate: '2026-05-05',
    garage: 'AutoService Pro',
    cost: 89,
  },
  {
    id: '5',
    vehicleName: 'Renault Kangoo',
    vehiclePlate: 'EL-654-QR',
    type: 'brakes',
    description: 'Remplacement plaquettes arrière',
    status: 'completed',
    scheduledDate: '2026-04-20',
    completedDate: '2026-04-22',
    mileageAtService: 38200,
    nextMileage: 58200,
    cost: 245,
    garage: 'Midas Nice Ouest',
  },
  {
    id: '6',
    vehicleName: 'Renault Clio',
    vehiclePlate: 'HJ-180-PW',
    type: 'battery',
    description: 'Remplacement batterie 12V',
    status: 'completed',
    scheduledDate: '2026-03-15',
    completedDate: '2026-03-15',
    mileageAtService: 48500,
    cost: 135,
    garage: 'Norauto Nice',
  },
  {
    id: '7',
    vehicleName: 'Peugeot 308',
    vehiclePlate: 'FP-456-AB',
    type: 'revision',
    description: 'Révision des 30 000 km',
    status: 'completed',
    scheduledDate: '2026-02-10',
    completedDate: '2026-02-12',
    mileageAtService: 30100,
    nextMileage: 50000,
    cost: 380,
    garage: 'Peugeot Nice Centre',
  },
]

export default function MaintenancePage() {
  const [records] = useState(MOCK_RECORDS)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<MaintenanceStatus | 'all'>('all')
  const [filterType, setFilterType] = useState<MaintenanceType | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const filtered = records.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (filterType !== 'all' && r.type !== filterType) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.vehicleName.toLowerCase().includes(q) ||
        r.vehiclePlate.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.garage?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const selected = selectedId ? records.find((r) => r.id === selectedId) : null

  // Stats
  const overdue = records.filter((r) => r.status === 'overdue').length
  const scheduled = records.filter((r) => r.status === 'scheduled').length
  const inProgress = records.filter((r) => r.status === 'in_progress').length
  const totalCostThisYear = records
    .filter((r) => r.status === 'completed' && r.cost)
    .reduce((sum, r) => sum + (r.cost || 0), 0)

  // Detail panel
  if (selected) {
    const sc = STATUS_CONFIG[selected.status]
    const tc = TYPE_CONFIG[selected.type]
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
            <ChevronRight className="h-4 w-4 rotate-180" />
            Retour
          </Button>
          <h1 className="text-lg font-bold">Détail de l'intervention</h1>
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{tc.emoji}</span>
                  <h2 className="text-lg font-semibold">{selected.description}</h2>
                </div>
                <p className="text-sm text-gray-500">{tc.label}</p>
              </div>
              <Badge className={`${sc.bg} ${sc.color}`}>{sc.label}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Véhicule</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Car className="h-3.5 w-3.5 text-gray-400" />
                    {selected.vehicleName} ({selected.vehiclePlate})
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Date prévue</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {new Date(selected.scheduledDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selected.completedDate && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Date réalisée</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      {new Date(selected.completedDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {selected.garage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Garage</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5 text-gray-400" />
                      {selected.garage}
                    </p>
                  </div>
                )}
                {selected.cost !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Coût</p>
                    <p className="text-sm font-bold flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                      {selected.cost.toFixed(2)} €
                    </p>
                  </div>
                )}
                {selected.mileageAtService && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Kilométrage lors de l'intervention</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5 text-gray-400" />
                      {selected.mileageAtService.toLocaleString('fr-FR')} km
                    </p>
                  </div>
                )}
                {selected.nextMileage && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Prochaine intervention à</p>
                    <p className="text-sm font-medium text-blue-600">
                      {selected.nextMileage.toLocaleString('fr-FR')} km
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selected.notes && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-500" />
            Maintenance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Suivi et planification de l'entretien de vos véhicules</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Planifier une intervention
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-600">{overdue}</p>
            <p className="text-xs text-gray-500">En retard</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-600">{scheduled}</p>
            <p className="text-xs text-gray-500">Planifié(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-amber-600">{inProgress}</p>
            <p className="text-xs text-gray-500">En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-600">{totalCostThisYear.toFixed(0)} €</p>
            <p className="text-xs text-gray-500">Coût total</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher véhicule, garage..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="all">Tous les types</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Records list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Wrench className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Aucune intervention trouvée</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((r) => {
            const sc = STATUS_CONFIG[r.status]
            const tc = TYPE_CONFIG[r.type]
            return (
              <Card
                key={r.id}
                className={`transition hover:shadow-md cursor-pointer ${
                  r.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''
                }`}
                onClick={() => setSelectedId(r.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl flex-shrink-0">{tc.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold truncate">{r.description}</h3>
                        <Badge className={`text-[10px] ${sc.bg} ${sc.color}`}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" />
                          {r.vehicleName} ({r.vehiclePlate})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.scheduledDate).toLocaleDateString('fr-FR')}
                        </span>
                        {r.garage && (
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {r.garage}
                          </span>
                        )}
                        {r.cost !== undefined && (
                          <span className="font-medium">{r.cost} €</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create dialog (simplified) */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Planifier une intervention</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Véhicule</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                  <option value="">Sélectionner un véhicule</option>
                  <option>Renault Clio (HJ-180-PW)</option>
                  <option>Peugeot 308 (FP-456-AB)</option>
                  <option>Citroën Berlingo (GK-789-CD)</option>
                  <option>Ford Transit (DJ-321-MN)</option>
                  <option>Renault Kangoo (EL-654-QR)</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Type d'intervention</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.emoji} {v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input placeholder="Ex: Révision des 50 000 km" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Date prévue</label>
                  <Input type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Garage</label>
                  <Input placeholder="Nom du garage" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Coût estimé (€)</label>
                <Input type="number" step="0.01" placeholder="0.00" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  placeholder="Remarques..."
                  rows={2}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                  Annuler
                </Button>
                <Button className="flex-1" onClick={() => setShowCreate(false)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Planifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
