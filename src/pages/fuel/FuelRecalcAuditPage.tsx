import { useState, useMemo } from 'react'
import { Search, Download, Filter, ArrowRight } from 'lucide-react'

interface AuditEntry {
  id: string
  date: string
  user: string
  vehicle: string
  licensePlate: string
  period: string
  oldConsumption: number
  newConsumption: number
  difference: number
  reason: string
  status: 'validé' | 'en_attente' | 'rejeté'
}

const MOCK_AUDIT_ENTRIES: AuditEntry[] = [
  {
    id: 'AUD-001',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    user: 'Alice Dupont',
    vehicle: 'Renault Master',
    licensePlate: 'AB-123-CD',
    period: 'Mai 2026',
    oldConsumption: 12.5,
    newConsumption: 12.8,
    difference: 0.3,
    reason: 'Correction données capteur',
    status: 'validé',
  },
  {
    id: 'AUD-002',
    date: new Date(Date.now() - 3600000 * 12).toISOString(),
    user: 'Marc Leclerc',
    vehicle: 'Peugeot Expert',
    licensePlate: 'EF-456-GH',
    period: 'Avril 2026',
    oldConsumption: 7.2,
    newConsumption: 7.5,
    difference: 0.3,
    reason: 'Anomalie carburant détectée',
    status: 'validé',
  },
  {
    id: 'AUD-003',
    date: new Date(Date.now() - 86400000).toISOString(),
    user: 'Sophie Martin',
    vehicle: 'Citroën Jumpy',
    licensePlate: 'IJ-789-KL',
    period: 'Mars 2026',
    oldConsumption: 9.8,
    newConsumption: 9.6,
    difference: -0.2,
    reason: 'Réévaluation après maintenance',
    status: 'en_attente',
  },
  {
    id: 'AUD-004',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    user: 'Pierre Fontaine',
    vehicle: 'Renault Clio',
    licensePlate: 'HJ-180-PW',
    period: 'Mai 2026',
    oldConsumption: 6.1,
    newConsumption: 6.3,
    difference: 0.2,
    reason: 'Recalcul période complète',
    status: 'validé',
  },
  {
    id: 'AUD-005',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    user: 'Jean Rousseau',
    vehicle: 'Peugeot 308',
    licensePlate: 'FP-456-AB',
    period: 'Février 2026',
    oldConsumption: 5.8,
    newConsumption: 6.2,
    difference: 0.4,
    reason: 'Erreur données initiales',
    status: 'rejeté',
  },
  {
    id: 'AUD-006',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    user: 'Marie Bernard',
    vehicle: 'Dacia Duster',
    licensePlate: 'MN-012-OP',
    period: 'Avril 2026',
    oldConsumption: 8.3,
    newConsumption: 8.1,
    difference: -0.2,
    reason: 'Optimisation moteur détectée',
    status: 'validé',
  },
  {
    id: 'AUD-007',
    date: new Date(Date.now() - 86400000 * 5).toISOString(),
    user: 'Luc Devaud',
    vehicle: 'Ford Transit',
    licensePlate: 'QR-345-ST',
    period: 'Mars 2026',
    oldConsumption: 13.8,
    newConsumption: 13.5,
    difference: -0.3,
    reason: 'Correction suite maintenance',
    status: 'validé',
  },
  {
    id: 'AUD-008',
    date: new Date(Date.now() - 86400000 * 6).toISOString(),
    user: 'Anne Leroy',
    vehicle: 'Volkswagen Caddy',
    licensePlate: 'UV-678-WX',
    period: 'Mai 2026',
    oldConsumption: 7.6,
    newConsumption: 7.7,
    difference: 0.1,
    reason: 'Mise à jour données climatiques',
    status: 'en_attente',
  },
  {
    id: 'AUD-009',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    user: 'Thomas Girard',
    vehicle: 'Mercedes Sprinter',
    licensePlate: 'YZ-901-AB',
    period: 'Janvier 2026',
    oldConsumption: 10.4,
    newConsumption: 10.6,
    difference: 0.2,
    reason: 'Recalibrage écart de vitesse',
    status: 'validé',
  },
  {
    id: 'AUD-010',
    date: new Date(Date.now() - 86400000 * 8).toISOString(),
    user: 'Claire Moulton',
    vehicle: 'BMW 320d',
    licensePlate: 'CD-234-EF',
    period: 'Février 2026',
    oldConsumption: 5.9,
    newConsumption: 5.8,
    difference: -0.1,
    reason: 'Harmonisation formule',
    status: 'validé',
  },
  {
    id: 'AUD-011',
    date: new Date(Date.now() - 86400000 * 9).toISOString(),
    user: 'Nicolas Simon',
    vehicle: 'Renault Master',
    licensePlate: 'AB-123-CD',
    period: 'Janvier 2026',
    oldConsumption: 12.3,
    newConsumption: 12.6,
    difference: 0.3,
    reason: 'Erreur saisie manuelle',
    status: 'rejeté',
  },
  {
    id: 'AUD-012',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    user: 'Sandrine Collet',
    vehicle: 'Peugeot Expert',
    licensePlate: 'EF-456-GH',
    period: 'Décembre 2025',
    oldConsumption: 7.4,
    newConsumption: 7.2,
    difference: -0.2,
    reason: 'Recalcul automatisé périodique',
    status: 'validé',
  },
  {
    id: 'AUD-013',
    date: new Date(Date.now() - 86400000 * 11).toISOString(),
    user: 'David Monteux',
    vehicle: 'Citroën Jumpy',
    licensePlate: 'IJ-789-KL',
    period: 'Novembre 2025',
    oldConsumption: 10.1,
    newConsumption: 9.9,
    difference: -0.2,
    reason: 'Optimisation après audit',
    status: 'validé',
  },
  {
    id: 'AUD-014',
    date: new Date(Date.now() - 86400000 * 12).toISOString(),
    user: 'Isabelle Doyle',
    vehicle: 'Renault Clio',
    licensePlate: 'HJ-180-PW',
    period: 'Octobre 2025',
    oldConsumption: 6.2,
    newConsumption: 6.0,
    difference: -0.2,
    reason: 'Révision trimestrale',
    status: 'en_attente',
  },
  {
    id: 'AUD-015',
    date: new Date(Date.now() - 86400000 * 13).toISOString(),
    user: 'François Legrand',
    vehicle: 'Peugeot 308',
    licensePlate: 'FP-456-AB',
    period: 'Décembre 2025',
    oldConsumption: 5.9,
    newConsumption: 5.7,
    difference: -0.2,
    reason: 'Correction données capteur',
    status: 'validé',
  },
]

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'validé':
      return 'bg-green-100 text-green-700'
    case 'en_attente':
      return 'bg-yellow-100 text-yellow-700'
    case 'rejeté':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function FuelRecalcAuditPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return MOCK_AUDIT_ENTRIES.filter((entry) => {
      if (searchQuery && !entry.user.toLowerCase().includes(searchQuery.toLowerCase()) && !entry.vehicle.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (vehicleFilter !== 'all' && entry.licensePlate !== vehicleFilter) return false
      if (statusFilter !== 'all' && entry.status !== statusFilter) return false

      if (dateFilter !== 'all') {
        const entryDate = new Date(entry.date)
        const now = new Date()
        if (dateFilter === '7d' && entryDate.getTime() < now.getTime() - 86400000 * 7) return false
        if (dateFilter === '30d' && entryDate.getTime() < now.getTime() - 86400000 * 30) return false
      }

      return true
    })
  }, [searchQuery, vehicleFilter, statusFilter, dateFilter])

  const vehicles = [...new Set(MOCK_AUDIT_ENTRIES.map((e) => e.licensePlate))]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Journal d'audit des recalculs</h2>
        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exporter le journal
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Utilisateur, véhicule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Véhicule</label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les véhicules</option>
              {vehicles.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="validé">Validé</option>
              <option value="en_attente">En attente</option>
              <option value="rejeté">Rejeté</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les dates</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Utilisateur</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Véhicule</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Période</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Ancien</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Nouveau</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Écart</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Motif</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(entry.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{entry.user}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{entry.vehicle}</p>
                      <p className="text-xs text-gray-500">{entry.licensePlate}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{entry.period}</td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{entry.oldConsumption}</td>
                  <td className="px-6 py-4 text-center font-medium text-gray-900">{entry.newConsumption}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${entry.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {entry.difference > 0 ? '+' : ''}{entry.difference.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900 text-xs">{entry.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(entry.status)}`}>
                      {entry.status === 'validé' ? 'Validé' : entry.status === 'en_attente' ? 'En attente' : 'Rejeté'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition">
                      Détail <ArrowRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        {filtered.length} entrée{filtered.length !== 1 ? 's' : ''} affichée{filtered.length !== 1 ? 's' : ''} sur {MOCK_AUDIT_ENTRIES.length} total
      </p>
    </div>
  )
}
