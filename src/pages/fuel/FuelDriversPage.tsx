import { useState, useMemo } from 'react'
import { ArrowUpDown, Search, TrendingUp, TrendingDown, Users } from 'lucide-react'

interface Driver {
  id: string
  name: string
  vehicle: string
  licensePlate: string
  avgConsumption: number
  totalDistance: number
  totalCost: number
  ecoScore: number
  trend: number
}

const MOCK_DRIVERS: Driver[] = [
  { id: '1', name: 'Jean Dupont', vehicle: 'Renault Master', licensePlate: 'AB-123-CD', avgConsumption: 12.5, totalDistance: 5440, totalCost: 1224, ecoScore: 45, trend: 2.3 },
  { id: '2', name: 'Marie Bernard', vehicle: 'Peugeot Expert', licensePlate: 'EF-456-GH', avgConsumption: 7.2, totalDistance: 4920, totalCost: 936, ecoScore: 78, trend: -1.2 },
  { id: '3', name: 'Pierre Laurent', vehicle: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', avgConsumption: 9.8, totalDistance: 5306, totalCost: 873, ecoScore: 62, trend: 0.8 },
  { id: '4', name: 'Sophie Moreau', vehicle: 'Renault Clio', licensePlate: 'HJ-180-PW', avgConsumption: 6.1, totalDistance: 5082, totalCost: 558, ecoScore: 85, trend: -2.1 },
  { id: '5', name: 'Luc Fournier', vehicle: 'Peugeot 308', licensePlate: 'FP-456-AB', avgConsumption: 8.9, totalDistance: 5086, totalCost: 531, ecoScore: 71, trend: 1.5 },
  { id: '6', name: 'Anne Lefebvre', vehicle: 'Dacia Duster', licensePlate: 'MN-012-OP', avgConsumption: 11.2, totalDistance: 4920, totalCost: 738, ecoScore: 52, trend: 3.1 },
  { id: '7', name: 'Michel Petit', vehicle: 'Ford Transit', licensePlate: 'QR-345-ST', avgConsumption: 13.8, totalDistance: 5210, totalCost: 1089, ecoScore: 38, trend: 4.2 },
  { id: '8', name: 'Claire Durand', vehicle: 'Volkswagen Caddy', licensePlate: 'UV-678-WX', avgConsumption: 7.6, totalDistance: 4750, totalCost: 612, ecoScore: 82, trend: -0.6 },
  { id: '9', name: 'Thomas Blanc', vehicle: 'Mercedes Sprinter', licensePlate: 'YZ-901-AB', avgConsumption: 10.4, totalDistance: 5500, totalCost: 1156, ecoScore: 58, trend: 1.9 },
  { id: '10', name: 'Isabelle Rousseau', vehicle: 'BMW 320d', licensePlate: 'CD-234-EF', avgConsumption: 5.9, totalDistance: 4680, totalCost: 468, ecoScore: 88, trend: -1.8 },
]

type SortKey = 'name' | 'avgConsumption' | 'totalDistance' | 'totalCost' | 'ecoScore'

const getEcoScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-700'
  if (score >= 60) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export default function FuelDriversPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('avgConsumption')
  const [sortDesc, setSortDesc] = useState(true)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d')

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc(!sortDesc)
    else {
      setSortBy(key)
      setSortDesc(true)
    }
  }

  const filtered = useMemo(() => {
    return MOCK_DRIVERS
      .filter((d) =>
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const mul = sortDesc ? -1 : 1
        return mul * (a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0)
      })
  }, [searchQuery, sortBy, sortDesc])

  const stats = useMemo(() => {
    const total = MOCK_DRIVERS.length
    const avgConsumption = (MOCK_DRIVERS.reduce((sum, d) => sum + d.avgConsumption, 0) / total).toFixed(2)
    const bestDriver = MOCK_DRIVERS.reduce((best, d) => (d.ecoScore > best.ecoScore ? d : best))
    const worstDriver = MOCK_DRIVERS.reduce((worst, d) => (d.ecoScore < worst.ecoScore ? d : worst))

    return { total, avgConsumption, bestDriver, worstDriver }
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header and period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Consommation par conducteur</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '12m'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '90d' ? '90 jours' : '12 mois'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-500">Nombre de conducteurs</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold">{stats.avgConsumption}</p>
          <p className="text-xs text-gray-500">Consommation moyenne (L/100km)</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-5 rounded-full bg-green-500" />
          </div>
          <p className="text-sm font-bold truncate">{stats.bestDriver.name}</p>
          <p className="text-xs text-gray-500">Meilleur conducteur</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-5 rounded-full bg-red-500" />
          </div>
          <p className="text-sm font-bold truncate">{stats.worstDriver.name}</p>
          <p className="text-xs text-gray-500">Pire conducteur</p>
        </div>
      </div>

      {/* Search input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un conducteur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort('name')}>
                    Conducteur <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Véhicule assigné</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('avgConsumption')}>
                    Consommation moy <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('totalDistance')}>
                    Distance totale <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('totalCost')}>
                    Coût total <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('ecoScore')}>
                    Score éco <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Tendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium">{driver.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{driver.vehicle}</p>
                      <p className="text-xs text-gray-500">{driver.licensePlate}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{driver.avgConsumption.toFixed(1)} L/100km</td>
                  <td className="px-4 py-3 text-right text-gray-500">{driver.totalDistance.toLocaleString('fr-FR')} km</td>
                  <td className="px-4 py-3 text-right font-medium">{driver.totalCost} €</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEcoScoreColor(driver.ecoScore)}`}>
                      {driver.ecoScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs ${driver.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {driver.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(driver.trend).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
