import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Archive,
  RotateCcw,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react'

type ArchiveReason = 'vendu' | 'accident' | 'fin_leasing' | 'hors_service' | 'transfère'

interface ArchivedVehicle {
  id: string
  vehicleId: string
  plateNumber: string
  manufacturer: string
  model: string
  year: number
  serviceStartDate: string
  archiveDate: string
  reason: ArchiveReason
  totalKm: number
  totalCost: number
  lastKnownPosition?: {
    latitude: number
    longitude: number
    address: string
  }
  documents: {
    name: string
    type: string
  }[]
  costBreakdown: {
    fuel: number
    maintenance: number
    insurance: number
    leasing: number
    other: number
  }
}

const MOCK_ARCHIVED_VEHICLES: ArchivedVehicle[] = [
  {
    id: 'arch_001',
    vehicleId: 'veh_045',
    plateNumber: 'AA-123-BB',
    manufacturer: 'Renault',
    model: 'Master',
    year: 2016,
    serviceStartDate: '2016-03-15',
    archiveDate: '2025-11-20',
    reason: 'vendu',
    totalKm: 285400,
    totalCost: 78500,
    lastKnownPosition: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: 'Paris, France',
    },
    documents: [
      { name: 'Certificat_vente.pdf', type: 'Vente' },
      { name: 'Historique_maintenance.pdf', type: 'Maintenance' },
    ],
    costBreakdown: {
      fuel: 42300,
      maintenance: 18500,
      insurance: 12800,
      leasing: 0,
      other: 4900,
    },
  },
  {
    id: 'arch_002',
    vehicleId: 'veh_028',
    plateNumber: 'BC-456-CD',
    manufacturer: 'Ford',
    model: 'Transit',
    year: 2018,
    serviceStartDate: '2018-06-10',
    archiveDate: '2025-09-15',
    reason: 'accident',
    totalKm: 156200,
    totalCost: 52300,
    lastKnownPosition: {
      latitude: 48.8656,
      longitude: 2.2945,
      address: 'Boulogne-Billancourt, France',
    },
    documents: [
      { name: 'Rapport_sinistre.pdf', type: 'Sinistre' },
      { name: 'Devis_reparation.pdf', type: 'Devis' },
      { name: 'Declaration_assurance.pdf', type: 'Assurance' },
    ],
    costBreakdown: {
      fuel: 28700,
      maintenance: 8500,
      insurance: 11200,
      leasing: 0,
      other: 3900,
    },
  },
  {
    id: 'arch_003',
    vehicleId: 'veh_015',
    plateNumber: 'CD-789-DE',
    manufacturer: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2019,
    serviceStartDate: '2019-01-20',
    archiveDate: '2026-04-10',
    reason: 'fin_leasing',
    totalKm: 198700,
    totalCost: 89200,
    lastKnownPosition: {
      latitude: 48.9022,
      longitude: 2.2897,
      address: 'Neuilly-sur-Seine, France',
    },
    documents: [
      { name: 'Contrat_location.pdf', type: 'Leasing' },
      { name: 'Etat_retrait.pdf', type: 'Retrait' },
      { name: 'Facture_finale.pdf', type: 'Facturation' },
    ],
    costBreakdown: {
      fuel: 45600,
      maintenance: 12300,
      insurance: 14500,
      leasing: 15800,
      other: 1000,
    },
  },
  {
    id: 'arch_004',
    vehicleId: 'veh_032',
    plateNumber: 'DE-012-EF',
    manufacturer: 'Peugeot',
    model: 'Boxer',
    year: 2015,
    serviceStartDate: '2015-11-05',
    archiveDate: '2026-01-30',
    reason: 'hors_service',
    totalKm: 354600,
    totalCost: 61500,
    documents: [
      { name: 'Rapport_expertise.pdf', type: 'Expertise' },
      { name: 'Devis_reparation.pdf', type: 'Devis' },
    ],
    costBreakdown: {
      fuel: 38200,
      maintenance: 16800,
      insurance: 4500,
      leasing: 0,
      other: 2000,
    },
  },
  {
    id: 'arch_005',
    vehicleId: 'veh_041',
    plateNumber: 'EF-345-FG',
    manufacturer: 'Iveco',
    model: 'Daily',
    year: 2017,
    serviceStartDate: '2017-04-12',
    archiveDate: '2025-10-22',
    reason: 'transfère',
    totalKm: 247900,
    totalCost: 74200,
    lastKnownPosition: {
      latitude: 48.7753,
      longitude: 2.4699,
      address: 'Créteil, France',
    },
    documents: [
      { name: 'Contrat_transfer.pdf', type: 'Transfert' },
      { name: 'Rapport_final.pdf', type: 'Rapport' },
    ],
    costBreakdown: {
      fuel: 41600,
      maintenance: 15400,
      insurance: 11200,
      leasing: 0,
      other: 6000,
    },
  },
  {
    id: 'arch_006',
    vehicleId: 'veh_002',
    plateNumber: 'FG-678-GH',
    manufacturer: 'Volvo',
    model: 'FH',
    year: 2014,
    serviceStartDate: '2014-05-18',
    archiveDate: '2025-08-05',
    reason: 'vendu',
    totalKm: 512300,
    totalCost: 98700,
    lastKnownPosition: {
      latitude: 48.8234,
      longitude: 2.4028,
      address: 'Vincennes, France',
    },
    documents: [
      { name: 'Certificat_vente.pdf', type: 'Vente' },
      { name: 'Rapport_technique.pdf', type: 'Rapport' },
    ],
    costBreakdown: {
      fuel: 56400,
      maintenance: 28900,
      insurance: 9400,
      leasing: 0,
      other: 4000,
    },
  },
  {
    id: 'arch_007',
    vehicleId: 'veh_018',
    plateNumber: 'GH-901-IJ',
    manufacturer: 'Scania',
    model: 'P340',
    year: 2016,
    serviceStartDate: '2016-07-03',
    archiveDate: '2026-02-14',
    reason: 'hors_service',
    totalKm: 428500,
    totalCost: 82300,
    documents: [
      { name: 'Rapport_expertise.pdf', type: 'Expertise' },
    ],
    costBreakdown: {
      fuel: 48900,
      maintenance: 22400,
      insurance: 8500,
      leasing: 0,
      other: 2500,
    },
  },
  {
    id: 'arch_008',
    vehicleId: 'veh_054',
    plateNumber: 'IJ-234-KL',
    manufacturer: 'Renault',
    model: 'Master',
    year: 2020,
    serviceStartDate: '2020-02-08',
    archiveDate: '2025-12-10',
    reason: 'accident',
    totalKm: 89200,
    totalCost: 38500,
    lastKnownPosition: {
      latitude: 48.8945,
      longitude: 2.3456,
      address: 'La Défense, France',
    },
    documents: [
      { name: 'Rapport_sinistre.pdf', type: 'Sinistre' },
      { name: 'Devis_reparation.pdf', type: 'Devis' },
    ],
    costBreakdown: {
      fuel: 15200,
      maintenance: 6800,
      insurance: 12400,
      leasing: 0,
      other: 4100,
    },
  },
  {
    id: 'arch_009',
    vehicleId: 'veh_037',
    plateNumber: 'KL-567-MN',
    manufacturer: 'Citroën',
    model: 'Jumpy',
    year: 2018,
    serviceStartDate: '2018-09-20',
    archiveDate: '2026-03-25',
    reason: 'fin_leasing',
    totalKm: 167800,
    totalCost: 56400,
    lastKnownPosition: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: 'Paris, France',
    },
    documents: [
      { name: 'Contrat_location.pdf', type: 'Leasing' },
      { name: 'Etat_retrait.pdf', type: 'Retrait' },
    ],
    costBreakdown: {
      fuel: 29300,
      maintenance: 10200,
      insurance: 12500,
      leasing: 3400,
      other: 1000,
    },
  },
  {
    id: 'arch_010',
    vehicleId: 'veh_019',
    plateNumber: 'MN-890-OP',
    manufacturer: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2017,
    serviceStartDate: '2017-11-15',
    archiveDate: '2025-07-08',
    reason: 'vendu',
    totalKm: 278900,
    totalCost: 71200,
    lastKnownPosition: {
      latitude: 48.9566,
      longitude: 2.2945,
      address: 'Boulogne-Billancourt, France',
    },
    documents: [
      { name: 'Certificat_vente.pdf', type: 'Vente' },
      { name: 'Rapport_expertise.pdf', type: 'Expertise' },
    ],
    costBreakdown: {
      fuel: 39600,
      maintenance: 14500,
      insurance: 12100,
      leasing: 0,
      other: 5000,
    },
  },
  {
    id: 'arch_011',
    vehicleId: 'veh_026',
    plateNumber: 'OP-123-QR',
    manufacturer: 'Ford',
    model: 'Transit',
    year: 2019,
    serviceStartDate: '2019-03-10',
    archiveDate: '2026-04-01',
    reason: 'fin_leasing',
    totalKm: 145600,
    totalCost: 48900,
    lastKnownPosition: {
      latitude: 48.8234,
      longitude: 2.3928,
      address: 'Vincennes, France',
    },
    documents: [
      { name: 'Contrat_location.pdf', type: 'Leasing' },
    ],
    costBreakdown: {
      fuel: 26400,
      maintenance: 8900,
      insurance: 10300,
      leasing: 2300,
      other: 1000,
    },
  },
  {
    id: 'arch_012',
    vehicleId: 'veh_043',
    plateNumber: 'QR-456-ST',
    manufacturer: 'Peugeot',
    model: 'Boxer',
    year: 2021,
    serviceStartDate: '2021-01-22',
    archiveDate: '2026-05-05',
    reason: 'accident',
    totalKm: 67300,
    totalCost: 31200,
    documents: [
      { name: 'Rapport_sinistre.pdf', type: 'Sinistre' },
      { name: 'Declaration_assurance.pdf', type: 'Assurance' },
    ],
    costBreakdown: {
      fuel: 9200,
      maintenance: 3800,
      insurance: 14200,
      leasing: 0,
      other: 4000,
    },
  },
]

const REASON_LABELS: Record<ArchiveReason, string> = {
  vendu: 'Vendu',
  accident: 'Accidenté',
  fin_leasing: 'Fin de leasing',
  hors_service: 'Hors service',
  transfère: 'Transféré',
}

const REASON_COLORS: Record<ArchiveReason, string> = {
  vendu: 'bg-blue-50 text-blue-700 border-blue-200',
  accident: 'bg-red-50 text-red-700 border-red-200',
  fin_leasing: 'bg-orange-50 text-orange-700 border-orange-200',
  hors_service: 'bg-gray-50 text-gray-700 border-gray-200',
  transfère: 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function VehicleArchivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterReason, setFilterReason] = useState<ArchiveReason | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<ArchivedVehicle | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null)

  // Filter vehicles
  const filteredVehicles = MOCK_ARCHIVED_VEHICLES.filter((vehicle) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      vehicle.plateNumber.toLowerCase().includes(searchLower) ||
      vehicle.manufacturer.toLowerCase().includes(searchLower) ||
      vehicle.model.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    if (filterReason !== 'all' && vehicle.reason !== filterReason) return false

    if (dateFrom && new Date(vehicle.archiveDate) < new Date(dateFrom)) return false
    if (dateTo && new Date(vehicle.archiveDate) > new Date(dateTo)) return false

    return true
  })

  // Stats
  const stats = {
    total: MOCK_ARCHIVED_VEHICLES.length,
    sold: MOCK_ARCHIVED_VEHICLES.filter((v) => v.reason === 'vendu').length,
    accident: MOCK_ARCHIVED_VEHICLES.filter((v) => v.reason === 'accident').length,
    endLease: MOCK_ARCHIVED_VEHICLES.filter((v) => v.reason === 'fin_leasing').length,
  }

  const handleExport = () => {
    const csv = [
      ['Immatriculation', 'Marque', 'Modèle', 'Année', 'Date archivage', 'Raison', 'KM', 'Coût'].join(
        ','
      ),
      ...filteredVehicles.map((v) =>
        [
          v.plateNumber,
          v.manufacturer,
          v.model,
          v.year,
          v.archiveDate,
          REASON_LABELS[v.reason],
          v.totalKm,
          v.totalCost,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `archive_flotte_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Archive className="h-5 w-5 text-gray-500" />
          Véhicules archivés
        </h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="h-4 w-4" />
          Exporter
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total archivés</p>
                <p className="text-2xl font-bold text-gray-700">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">Tous les véhicules</p>
              </div>
              <Archive className="h-8 w-8 text-gray-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vendus</p>
                <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
                <p className="text-xs text-gray-500 mt-1">Véhicules vendus</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Accidentés</p>
                <p className="text-2xl font-bold text-red-600">{stats.accident}</p>
                <p className="text-xs text-gray-500 mt-1">Sinistres</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-100" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fin leasing</p>
                <p className="text-2xl font-bold text-orange-600">{stats.endLease}</p>
                <p className="text-xs text-gray-500 mt-1">Contrats terminés</p>
              </div>
              <CheckCircle className="h-8 w-8 text-orange-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par immatriculation, marque ou modèle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Raison archivage</label>
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value as ArchiveReason | 'all')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Toutes les raisons</option>
                {Object.entries(REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date de - </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date à</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Véhicule</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Immatriculation</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date mise en service</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date archivage</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Raison</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">KM total</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Coût total</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Aucun véhicule archivé ne correspond à vos critères
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="font-medium text-blue-600 hover:text-blue-700"
                        >
                          {vehicle.manufacturer} {vehicle.model}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{vehicle.plateNumber}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(vehicle.serviceStartDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(vehicle.archiveDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${REASON_COLORS[vehicle.reason]}`}
                        >
                          {REASON_LABELS[vehicle.reason]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {vehicle.totalKm.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700">
                        {vehicle.totalCost.toLocaleString('fr-FR')}€
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Détails
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-start justify-between border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold">
                  {selectedVehicle.manufacturer} {selectedVehicle.model}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedVehicle.plateNumber}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedVehicle(null)
                  setRestoreConfirmId(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Année</p>
                  <p className="text-lg font-semibold text-gray-700">{selectedVehicle.year}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Mise en service
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {new Date(selectedVehicle.serviceStartDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    KM total
                  </p>
                  <p className="text-lg font-semibold text-gray-700">
                    {selectedVehicle.totalKm.toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    Coût total
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {selectedVehicle.totalCost.toLocaleString('fr-FR')}€
                  </p>
                </div>
              </div>

              {/* Archive Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Informations archivage
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-amber-700 font-medium">Raison archivage</p>
                    <p className="text-amber-600">{REASON_LABELS[selectedVehicle.reason]}</p>
                  </div>
                  <div>
                    <p className="text-amber-700 font-medium">Date archivage</p>
                    <p className="text-amber-600">
                      {new Date(selectedVehicle.archiveDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Détail des coûts</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Carburant</span>
                    <span className="font-medium text-gray-700">
                      {selectedVehicle.costBreakdown.fuel.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Maintenance</span>
                    <span className="font-medium text-gray-700">
                      {selectedVehicle.costBreakdown.maintenance.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Assurance</span>
                    <span className="font-medium text-gray-700">
                      {selectedVehicle.costBreakdown.insurance.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                  {selectedVehicle.costBreakdown.leasing > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Leasing</span>
                      <span className="font-medium text-gray-700">
                        {selectedVehicle.costBreakdown.leasing.toLocaleString('fr-FR')}€
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Autres</span>
                    <span className="font-medium text-gray-700">
                      {selectedVehicle.costBreakdown.other.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-200 pt-2 mt-2">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="font-bold text-gray-900">
                      {selectedVehicle.totalCost.toLocaleString('fr-FR')}€
                    </span>
                  </div>
                </div>
              </div>

              {/* Last Known Position */}
              {selectedVehicle.lastKnownPosition && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Dernière position connue
                  </h4>
                  <p className="text-sm text-blue-600">
                    {selectedVehicle.lastKnownPosition.address}
                  </p>
                </div>
              )}

              {/* Documents */}
              {selectedVehicle.documents.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents associés
                  </h4>
                  <div className="space-y-2">
                    {selectedVehicle.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">{doc.name}</span>
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {doc.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restore Button */}
              {!restoreConfirmId && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setRestoreConfirmId(selectedVehicle.id)}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restaurer ce véhicule
                  </button>
                </div>
              )}

              {/* Restore Confirmation */}
              {restoreConfirmId === selectedVehicle.id && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-blue-900">
                    Êtes-vous sûr de vouloir restaurer ce véhicule dans votre flotte active?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // In a real app, this would restore the vehicle
                        console.log(`Restoring vehicle ${selectedVehicle.id}`)
                        setSelectedVehicle(null)
                        setRestoreConfirmId(null)
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => setRestoreConfirmId(null)}
                      className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
