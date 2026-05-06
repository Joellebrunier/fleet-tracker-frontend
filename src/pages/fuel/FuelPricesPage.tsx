import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Fuel,
  MapPin,
  TrendingDown,
  TrendingUp,
  Search,
  Download,
  RefreshCw,
  Eye,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FuelType = 'gazole' | 'sp95' | 'sp98' | 'e85'

interface FuelStation {
  id: string
  name: string
  city: string
  address: string
  distance: number // km
  lastUpdate: string
  prices: Record<FuelType, number>
}

interface PriceVariation {
  fuelType: FuelType
  label: string
  change7d: number // percentage
  currentPrice: number
}

interface KpiData {
  prixMoyenGazole: number
  prixMoyenSp95: number
  variation7d: number
  economiePotentielle: number
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_STATIONS: FuelStation[] = [
  {
    id: '1',
    name: 'Total Nice Arenas',
    city: 'Nice',
    address: '123 Promenade des Anglais',
    distance: 0.5,
    lastUpdate: new Date(Date.now() - 3600000).toISOString(),
    prices: { gazole: 1.729, sp95: 1.849, sp98: 1.919, e85: 0.799 },
  },
  {
    id: '2',
    name: 'BP Antibes',
    city: 'Antibes',
    address: '45 Rue d\'Antibes',
    distance: 8.2,
    lastUpdate: new Date(Date.now() - 7200000).toISOString(),
    prices: { gazole: 1.749, sp95: 1.859, sp98: 1.929, e85: 0.789 },
  },
  {
    id: '3',
    name: 'Shell Cannes',
    city: 'Cannes',
    address: '67 Boulevard de la Croisette',
    distance: 12.1,
    lastUpdate: new Date(Date.now() - 1800000).toISOString(),
    prices: { gazole: 1.769, sp95: 1.879, sp98: 1.949, e85: 0.819 },
  },
  {
    id: '4',
    name: 'Esso Mougins',
    city: 'Mougins',
    address: '89 Route de Grasse',
    distance: 15.4,
    lastUpdate: new Date(Date.now() - 5400000).toISOString(),
    prices: { gazole: 1.759, sp95: 1.869, sp98: 1.939, e85: 0.809 },
  },
  {
    id: '5',
    name: 'Intermarché Grasse',
    city: 'Grasse',
    address: '210 Avenue du Président Roosevelt',
    distance: 18.7,
    lastUpdate: new Date(Date.now() - 2700000).toISOString(),
    prices: { gazole: 1.699, sp95: 1.829, sp98: 1.899, e85: 0.769 },
  },
  {
    id: '6',
    name: 'Carrefour Nice',
    city: 'Nice',
    address: '5 Avenue Notre-Dame',
    distance: 2.3,
    lastUpdate: new Date(Date.now() - 900000).toISOString(),
    prices: { gazole: 1.739, sp95: 1.859, sp98: 1.929, e85: 0.799 },
  },
  {
    id: '7',
    name: 'Total Vence',
    city: 'Vence',
    address: '4 Place Godeau',
    distance: 25.3,
    lastUpdate: new Date(Date.now() - 10800000).toISOString(),
    prices: { gazole: 1.689, sp95: 1.819, sp98: 1.889, e85: 0.759 },
  },
  {
    id: '8',
    name: 'Shell Antibes',
    city: 'Antibes',
    address: '78 Boulevard d\'Aguillon',
    distance: 9.5,
    lastUpdate: new Date(Date.now() - 4500000).toISOString(),
    prices: { gazole: 1.759, sp95: 1.879, sp98: 1.949, e85: 0.809 },
  },
  {
    id: '9',
    name: 'Esso Grasse',
    city: 'Grasse',
    address: '22 Route de Cannes',
    distance: 19.2,
    lastUpdate: new Date(Date.now() - 6300000).toISOString(),
    prices: { gazole: 1.709, sp95: 1.839, sp98: 1.909, e85: 0.779 },
  },
  {
    id: '10',
    name: 'Total Valbonne',
    city: 'Valbonne',
    address: '1000 Avenue Picasso',
    distance: 22.8,
    lastUpdate: new Date(Date.now() - 3300000).toISOString(),
    prices: { gazole: 1.729, sp95: 1.849, sp98: 1.919, e85: 0.799 },
  },
  {
    id: '11',
    name: 'BP Sophia',
    city: 'Sophia-Antipolis',
    address: '405 Route des Crêtes',
    distance: 20.1,
    lastUpdate: new Date(Date.now() - 8100000).toISOString(),
    prices: { gazole: 1.769, sp95: 1.879, sp98: 1.949, e85: 0.819 },
  },
  {
    id: '12',
    name: 'Intermarché Antibes',
    city: 'Antibes',
    address: '58 Avenue de la Libération',
    distance: 10.6,
    lastUpdate: new Date(Date.now() - 2100000).toISOString(),
    prices: { gazole: 1.719, sp95: 1.839, sp98: 1.909, e85: 0.789 },
  },
]

const PRICE_VARIATIONS: PriceVariation[] = [
  { fuelType: 'gazole', label: 'Gazole', change7d: -1.8, currentPrice: 1.729 },
  { fuelType: 'sp95', label: 'SP95', change7d: -1.2, currentPrice: 1.849 },
  { fuelType: 'sp98', label: 'SP98', change7d: -0.9, currentPrice: 1.919 },
  { fuelType: 'e85', label: 'E85', change7d: -2.3, currentPrice: 0.799 },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function FuelPricesPage() {
  const [stations, setStations] = useState<FuelStation[]>(MOCK_STATIONS)
  const [fuelTypeFilter, setFuelTypeFilter] = useState<FuelType | 'all'>('gazole')
  const [radiusFilter, setRadiusFilter] = useState<number>(30)
  const [priceRangeMin, setPriceRangeMin] = useState<number>(1.65)
  const [priceRangeMax, setPriceRangeMax] = useState<number>(1.95)
  const [searchCity, setSearchCity] = useState('')

  // Filter logic
  const filtered = useMemo(() => {
    return stations.filter((station) => {
      const matchesRadius = station.distance <= radiusFilter
      const matchesCity = !searchCity || station.city.toLowerCase().includes(searchCity.toLowerCase()) || station.name.toLowerCase().includes(searchCity.toLowerCase())

      if (fuelTypeFilter === 'all') {
        return matchesRadius && matchesCity
      }

      const price = station.prices[fuelTypeFilter]
      const matchesPrice = price >= priceRangeMin && price <= priceRangeMax
      return matchesRadius && matchesCity && matchesPrice
    })
  }, [stations, radiusFilter, searchCity, fuelTypeFilter, priceRangeMin, priceRangeMax])

  // KPI calculations
  const kpiData = useMemo((): KpiData => {
    const gazolesInRange = stations.filter((s) => s.distance <= radiusFilter)
    const avgGazole = gazolesInRange.length > 0 ? gazolesInRange.reduce((sum, s) => sum + s.prices.gazole, 0) / gazolesInRange.length : 0
    const avgSp95 = gazolesInRange.length > 0 ? gazolesInRange.reduce((sum, s) => sum + s.prices.sp95, 0) / gazolesInRange.length : 0

    const minGazole = Math.min(...gazolesInRange.map((s) => s.prices.gazole))
    const maxGazole = Math.max(...gazolesInRange.map((s) => s.prices.gazole))
    const variation7d = ((maxGazole - minGazole) / minGazole) * 100

    // Estimate savings if buying at cheapest station instead of average
    const savingsPerLiter = avgGazole - minGazole
    const estimatedMonthlyConsumption = 500 // liters
    const economiePotentielle = savingsPerLiter * estimatedMonthlyConsumption

    return {
      prixMoyenGazole: avgGazole,
      prixMoyenSp95: avgSp95,
      variation7d,
      economiePotentielle,
    }
  }, [stations, radiusFilter])

  // Find best and worst prices
  const getPriceStats = (fuelType: FuelType) => {
    const prices = filtered.map((s) => s.prices[fuelType]).filter((p) => p > 0)
    if (prices.length === 0) return { min: 0, max: 0, avg: 0 }
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((a, b) => a + b, 0) / prices.length,
    }
  }

  const handleRefresh = () => {
    setStations((prev) =>
      prev.map((s) => ({
        ...s,
        lastUpdate: new Date().toISOString(),
      }))
    )
  }

  const getTimeSinceUpdate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'À l\'instant'
    if (diffMins < 60) return `Il y a ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Il y a ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Il y a ${diffDays}j`
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.prixMoyenGazole.toFixed(3)} €</p>
            <p className="text-xs text-gray-500">Prix moyen Gazole</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.prixMoyenSp95.toFixed(3)} €</p>
            <p className="text-xs text-gray-500">Prix moyen SP95</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              {kpiData.variation7d > 0 ? (
                <TrendingUp className="h-5 w-5 text-orange-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
            </div>
            <p className="text-2xl font-bold">{kpiData.variation7d.toFixed(2)}%</p>
            <p className="text-xs text-gray-500">Variation 7j</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.economiePotentielle.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">Économie potentielle/mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Comparaison des prix carburant</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} stations affichées</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Carburant</label>
          <select
            value={fuelTypeFilter}
            onChange={(e) => setFuelTypeFilter(e.target.value as FuelType | 'all')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
          >
            <option value="all">Tous</option>
            <option value="gazole">Gazole</option>
            <option value="sp95">SP95</option>
            <option value="sp98">SP98</option>
            <option value="e85">E85</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Rayon ({radiusFilter} km)</label>
          <input
            type="range"
            min="5"
            max="50"
            value={radiusFilter}
            onChange={(e) => setRadiusFilter(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Ville</label>
          <Input
            placeholder="Rechercher..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Prix min</label>
          <Input
            type="number"
            placeholder="1.65"
            value={priceRangeMin}
            onChange={(e) => setPriceRangeMin(Number(e.target.value))}
            className="h-9"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Prix max</label>
          <Input
            type="number"
            placeholder="1.95"
            value={priceRangeMax}
            onChange={(e) => setPriceRangeMax(Number(e.target.value))}
            className="h-9"
            step="0.01"
          />
        </div>
      </div>

      {/* Price Trend Chart Placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Évolution des prix (7 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg flex items-end justify-center gap-1 p-4 relative overflow-hidden">
            {/* SVG placeholder chart */}
            <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
              {/* Gazole line */}
              <polyline
                points="0,50 40,48 80,46 120,44 160,42 200,40 240,38 300,36"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {/* SP95 line */}
              <polyline
                points="0,55 40,53 80,51 120,49 160,47 200,45 240,43 300,41"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
              {/* SP98 line */}
              <polyline
                points="0,60 40,58 80,56 120,54 160,52 200,50 240,48 300,46"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              {/* Grid lines */}
              <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
              <line x1="0" y1="100" x2="300" y2="100" stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
            </svg>
          </div>
          <div className="flex gap-6 justify-center mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500" />
              <span>Gazole</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500" />
              <span>SP95</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-amber-500" />
              <span>SP98</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Stations essence à proximité</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Station</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Ville</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Gazole</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">SP95</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">SP98</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">E85</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Distance</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Dernière MAJ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((station) => (
                    <tr key={station.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3">
                        <p className="font-medium">{station.name}</p>
                        <p className="text-xs text-gray-500">{station.address}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {station.city}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{station.prices.gazole.toFixed(3)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{station.prices.sp95.toFixed(3)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{station.prices.sp98.toFixed(3)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{station.prices.e85.toFixed(3)} €</td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">{station.distance.toFixed(1)} km</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{getTimeSinceUpdate(station.lastUpdate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Aucune station ne correspond aux critères de recherche
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Carte des stations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-blue-100 to-slate-100 dark:from-blue-900/30 dark:to-slate-900/30 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Map placeholder with mock markers */}
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 400 300">
              {/* Background roads */}
              <line x1="0" y1="150" x2="400" y2="150" stroke="#9ca3af" strokeWidth="2" opacity="0.5" />
              <line x1="200" y1="0" x2="200" y2="300" stroke="#9ca3af" strokeWidth="2" opacity="0.5" />

              {/* Mock station markers */}
              {filtered.slice(0, 8).map((station, idx) => {
                const x = (idx % 4) * 100 + 50
                const y = Math.floor(idx / 4) * 150 + 75
                const isCheapest = idx === 0
                return (
                  <g key={station.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isCheapest ? 12 : 8}
                      fill={isCheapest ? '#10b981' : '#3b82f6'}
                      opacity="0.7"
                    />
                    <text x={x} y={y + 1} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                      {(idx + 1).toString()}
                    </text>
                  </g>
                )
              })}
            </svg>
            <div className="relative z-10 text-center">
              <MapPin className="h-12 w-12 text-blue-500/50 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Carte des {filtered.length} stations</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Meilleur prix</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Autres stations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Statistics Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Statistiques par type de carburant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['gazole', 'sp95', 'sp98', 'e85'] as const).map((fuelType) => {
              const stats = getPriceStats(fuelType)
              const labels: Record<FuelType, string> = {
                gazole: 'Gazole',
                sp95: 'SP95',
                sp98: 'SP98',
                e85: 'E85',
              }
              return (
                <div key={fuelType} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium mb-2">{labels[fuelType]}</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Min</span>
                      <span className="font-semibold text-green-600">{stats.min.toFixed(3)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Moy</span>
                      <span className="font-semibold">{stats.avg.toFixed(3)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max</span>
                      <span className="font-semibold text-red-600">{stats.max.toFixed(3)} €</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700 mt-1">
                      <span className="text-gray-500">Écart</span>
                      <span className="font-semibold">{(stats.max - stats.min).toFixed(3)} €</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
