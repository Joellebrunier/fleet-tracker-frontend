import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Fuel,
  Euro,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Car,
  Activity,
  ArrowRight,
  Calendar,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

interface FuelSummary {
  totalLiters: number
  totalCost: number
  avgConsumption: number
  avgCostPerKm: number
  vehicleCount: number
  anomalyCount: number
  periodLabel: string
  trendLiters: number  // percent change vs previous period
  trendCost: number
}

interface TopConsumer {
  vehicleId: string
  vehicleName: string
  licensePlate: string
  liters: number
  cost: number
  consumption: number  // L/100km
  distance: number
}

const MOCK_SUMMARY: FuelSummary = {
  totalLiters: 4825,
  totalCost: 8684,
  avgConsumption: 7.2,
  avgCostPerKm: 0.13,
  vehicleCount: 18,
  anomalyCount: 3,
  periodLabel: 'Ce mois',
  trendLiters: -4.2,
  trendCost: -2.8,
}

const MOCK_TOP_CONSUMERS: TopConsumer[] = [
  { vehicleId: '1', vehicleName: 'Renault Master', licensePlate: 'AB-123-CD', liters: 680, cost: 1224, consumption: 12.5, distance: 5440 },
  { vehicleId: '2', vehicleName: 'Peugeot Expert', licensePlate: 'EF-456-GH', liters: 520, cost: 936, consumption: 9.8, distance: 5306 },
  { vehicleId: '3', vehicleName: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', liters: 485, cost: 873, consumption: 9.2, distance: 5272 },
  { vehicleId: '4', vehicleName: 'Renault Clio', licensePlate: 'HJ-180-PW', liters: 310, cost: 558, consumption: 6.1, distance: 5082 },
  { vehicleId: '5', vehicleName: 'Peugeot 308', licensePlate: 'FP-456-AB', liters: 295, cost: 531, consumption: 5.8, distance: 5086 },
]

const MOCK_RECENT_FILLS = [
  { id: '1', vehicle: 'HJ-180-PW', liters: 42, cost: 75.6, station: 'Total Nice Arenas', date: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: '2', vehicle: 'FP-456-AB', liters: 38, cost: 68.4, station: 'BP Antibes', date: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', vehicle: 'AB-123-CD', liters: 65, cost: 117, station: 'Shell Cannes', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '4', vehicle: 'EF-456-GH', liters: 55, cost: 99, station: 'Esso Mougins', date: new Date(Date.now() - 86400000 * 3).toISOString() },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function TrendBadge({ value }: { value: number }) {
  const isPositive = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-red-500' : 'text-green-500'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export default function FuelDashboardPage() {
  const [summary] = useState<FuelSummary>(MOCK_SUMMARY)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month')

  return (
    <div className="p-6 space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Vue d'ensemble</h2>
        <div className="flex gap-1">
          {([['month', 'Mois'], ['quarter', 'Trimestre'], ['year', 'Année']] as const).map(([k, label]) => (
            <Button
              key={k}
              variant={period === k ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(k)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Fuel className="h-5 w-5 text-blue-500" />
              <TrendBadge value={summary.trendLiters} />
            </div>
            <p className="text-2xl font-bold">{summary.totalLiters.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-gray-500">Litres consommés</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Euro className="h-5 w-5 text-green-500" />
              <TrendBadge value={summary.trendCost} />
            </div>
            <p className="text-2xl font-bold">{summary.totalCost.toLocaleString('fr-FR')} €</p>
            <p className="text-xs text-gray-500">Coût total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{summary.avgConsumption}</p>
            <p className="text-xs text-gray-500">L/100km moyenne</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold">{summary.anomalyCount}</p>
            <p className="text-xs text-gray-500">
              <Link to="/fuel/anomalies" className="hover:underline">
                Anomalies détectées
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top consumers */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Car className="h-4 w-4" />
                Plus gros consommateurs
              </CardTitle>
              <Link to="/fuel/vehicles">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {MOCK_TOP_CONSUMERS.map((v, i) => (
                <div key={v.vehicleId} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{v.vehicleName}</p>
                      <p className="text-xs text-gray-500">{v.licensePlate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{v.liters} L</p>
                    <p className="text-xs text-gray-500">{v.consumption} L/100km</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Derniers pleins
              </CardTitle>
              <Link to="/fuel/transactions">
                <Button variant="ghost" size="sm" className="text-xs">
                  Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {MOCK_RECENT_FILLS.map((fill) => (
                <div key={fill.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div>
                    <p className="text-sm font-medium">{fill.vehicle}</p>
                    <p className="text-xs text-gray-500">{fill.station}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{fill.liters} L — {fill.cost} €</p>
                    <p className="text-xs text-gray-500">
                      {new Date(fill.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget overview bar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Budget mensuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Consommé</span>
            <span className="font-medium">{summary.totalCost.toLocaleString('fr-FR')} € / 12 000 €</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                summary.totalCost / 12000 > 0.9 ? 'bg-red-500' : summary.totalCost / 12000 > 0.7 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((summary.totalCost / 12000) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {((summary.totalCost / 12000) * 100).toFixed(0)}% du budget utilisé
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
