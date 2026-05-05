import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, Search, Fuel, Euro, Gauge, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react'

interface FuelVehicle {
  id: string
  name: string
  licensePlate: string
  fuelType: string
  totalLiters: number
  totalCost: number
  totalDistance: number
  avgConsumption: number
  trend: number
  lastFill: string
}

const MOCK_VEHICLES: FuelVehicle[] = [
  { id: '1', name: 'Renault Master', licensePlate: 'AB-123-CD', fuelType: 'Diesel', totalLiters: 680, totalCost: 1224, totalDistance: 5440, avgConsumption: 12.5, trend: 3.2, lastFill: new Date(Date.now() - 86400000).toISOString() },
  { id: '2', name: 'Peugeot Expert', licensePlate: 'EF-456-GH', fuelType: 'Diesel', totalLiters: 520, totalCost: 936, totalDistance: 5306, avgConsumption: 9.8, trend: -1.5, lastFill: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '3', name: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', fuelType: 'Diesel', totalLiters: 485, totalCost: 873, totalDistance: 5272, avgConsumption: 9.2, trend: -0.8, lastFill: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: '4', name: 'Renault Clio', licensePlate: 'HJ-180-PW', fuelType: 'Essence', totalLiters: 310, totalCost: 558, totalDistance: 5082, avgConsumption: 6.1, trend: -2.1, lastFill: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '5', name: 'Peugeot 308', licensePlate: 'FP-456-AB', fuelType: 'Essence', totalLiters: 295, totalCost: 531, totalDistance: 5086, avgConsumption: 5.8, trend: 0.5, lastFill: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: '6', name: 'Dacia Duster', licensePlate: 'MN-012-OP', fuelType: 'Diesel', totalLiters: 410, totalCost: 738, totalDistance: 4920, avgConsumption: 8.3, trend: 1.8, lastFill: new Date(Date.now() - 86400000 * 5).toISOString() },
]

type SortKey = 'name' | 'totalLiters' | 'avgConsumption' | 'totalCost'

export default function FuelVehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('totalLiters')
  const [sortDesc, setSortDesc] = useState(true)

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDesc(!sortDesc)
    else { setSortBy(key); setSortDesc(true) }
  }

  const filtered = MOCK_VEHICLES
    .filter((v) =>
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const mul = sortDesc ? -1 : 1
      return mul * (a[sortBy] < b[sortBy] ? -1 : a[sortBy] > b[sortBy] ? 1 : 0)
    })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Consommation par véhicule</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">
                    <button className="flex items-center gap-1" onClick={() => toggleSort('name')}>
                      Véhicule <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('totalLiters')}>
                      Litres <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('totalCost')}>
                      Coût <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Distance</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">
                    <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort('avgConsumption')}>
                      L/100km <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{v.name}</p>
                          <p className="text-xs text-gray-500">{v.licensePlate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px]">{v.fuelType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{v.totalLiters} L</td>
                    <td className="px-4 py-3 text-right font-medium">{v.totalCost} €</td>
                    <td className="px-4 py-3 text-right text-gray-500">{v.totalDistance.toLocaleString('fr-FR')} km</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${v.avgConsumption > 10 ? 'text-red-500' : v.avgConsumption > 7 ? 'text-amber-500' : 'text-green-500'}`}>
                        {v.avgConsumption}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 text-xs ${v.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {v.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(v.trend)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
