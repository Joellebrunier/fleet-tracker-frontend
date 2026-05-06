import { useState } from 'react'
import { Car, Fuel, Euro, AlertCircle, TrendingDown } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  station: string
  liters: number
  pricePerLiter: number
  total: number
  odometer: number
}

const MOCK_VEHICLE = {
  id: '1',
  plate: 'AB-123-CD',
  make: 'Renault',
  model: 'Master',
  fuelType: 'Diesel',
  currentOdometer: 125480,
  avgConsumption: 12.5,
  monthlyCost: 1224,
  fillsThisMonth: 12,
  anomalies: 1,
}

const MOCK_MONTHLY_CONSUMPTION = [
  { month: 'Janvier', liters: 450, cost: 810 },
  { month: 'Février', liters: 480, cost: 864 },
  { month: 'Mars', liters: 510, cost: 918 },
  { month: 'Avril', liters: 620, cost: 1116 },
  { month: 'Mai', liters: 680, cost: 1224 },
  { month: 'Juin', liters: 550, cost: 990 },
]

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: new Date(Date.now() - 3600000 * 5).toISOString(), station: 'Total Nice Arenas', liters: 65, pricePerLiter: 1.649, total: 107.2, odometer: 125420 },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), station: 'Shell Cannes', liters: 55, pricePerLiter: 1.659, total: 91.2, odometer: 125340 },
  { id: '3', date: new Date(Date.now() - 86400000 * 2).toISOString(), station: 'BP Antibes', liters: 68, pricePerLiter: 1.689, total: 114.8, odometer: 125280 },
  { id: '4', date: new Date(Date.now() - 86400000 * 3).toISOString(), station: 'Esso Mougins', liters: 60, pricePerLiter: 1.719, total: 103.1, odometer: 125200 },
  { id: '5', date: new Date(Date.now() - 86400000 * 5).toISOString(), station: 'Leclerc Saint-Laurent', liters: 70, pricePerLiter: 1.639, total: 114.7, odometer: 125080 },
]

export default function FuelVehicleDetailPage() {
  const [vehicle] = useState(MOCK_VEHICLE)
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null)

  const maxConsumption = Math.max(...MOCK_MONTHLY_CONSUMPTION.map(m => m.liters))
  const maxCost = Math.max(...MOCK_MONTHLY_CONSUMPTION.map(m => m.cost))
  const fleetAvgConsumption = 8.2

  return (
    <div className="p-6 space-y-6">
      {/* Vehicle header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">Immatriculation</p>
            <p className="text-3xl font-bold text-gray-900">{vehicle.plate}</p>
          </div>
          <Car className="h-8 w-8 text-gray-400" />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Marque / Modèle</p>
            <p className="font-semibold text-gray-900">{vehicle.make} {vehicle.model}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Type de carburant</p>
            <p className="font-semibold text-gray-900">{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Odomètre actuel</p>
            <p className="font-semibold text-gray-900">{vehicle.currentOdometer.toLocaleString('fr-FR')} km</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Dernière mise à jour</p>
            <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <TrendingDown className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{vehicle.avgConsumption}</p>
          <p className="text-xs text-gray-500">Consommation moyenne (L/100km)</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Euro className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{vehicle.monthlyCost} €</p>
          <p className="text-xs text-gray-500">Coût ce mois</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Fuel className="h-5 w-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{vehicle.fillsThisMonth}</p>
          <p className="text-xs text-gray-500">Pleins ce mois</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AlertCircle className="h-5 w-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{vehicle.anomalies}</p>
          <p className="text-xs text-gray-500">Anomalies détectées</p>
        </div>
      </div>

      {/* Monthly consumption chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Consommation mensuelle</h3>
        <div className="space-y-3">
          {MOCK_MONTHLY_CONSUMPTION.map((item) => (
            <div key={item.month} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 w-16">{item.month}</span>
              <div className="flex-1">
                <div className="h-8 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 relative overflow-hidden" style={{ width: `${(item.liters / maxConsumption) * 100}%` }}>
                  <span className="text-xs font-semibold text-white absolute right-2 top-1/2 -translate-y-1/2">{item.liters} L</span>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600 w-20 text-right">{item.cost} €</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Dernières transactions</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {MOCK_TRANSACTIONS.map((tx) => (
            <div key={tx.id} className="px-6 py-4">
              <button
                onClick={() => setExpandedTransaction(expandedTransaction === tx.id ? null : tx.id)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{tx.station}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('fr-FR')} à {new Date(tx.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{tx.total.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500">{tx.liters} L</p>
                  </div>
                </div>
              </button>
              {expandedTransaction === tx.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Prix au litre</p>
                    <p className="font-medium text-gray-900">{tx.pricePerLiter.toFixed(3)} €</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Odomètre</p>
                    <p className="font-medium text-gray-900">{tx.odometer.toLocaleString('fr-FR')} km</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Consommation</p>
                    <p className="font-medium text-gray-900">{((tx.liters / 100) * 100).toFixed(1)} L/100km</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comparison section */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Comparaison avec la flotte</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Consommation moyenne</span>
              <span className="text-sm font-semibold text-gray-900">{vehicle.avgConsumption} L/100km</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full bg-red-500" style={{ width: `${(vehicle.avgConsumption / 15) * 100}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">Moyenne flotte: {fleetAvgConsumption} L/100km</p>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">+{(vehicle.avgConsumption - fleetAvgConsumption).toFixed(1)} L/100km</span> par rapport à la moyenne
            </p>
          </div>
        </div>
      </div>

      {/* Efficiency trend */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Tendance d'efficacité énergétique</h3>
        <div className="h-32 flex items-end justify-between gap-2">
          {[8.2, 8.5, 8.3, 9.1, 10.8, 12.5].map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg" style={{ height: `${(value / 13) * 100}%` }} />
              <span className="text-xs text-gray-500">{i + 1}m</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">Tendance: <span className="text-red-600 font-semibold">↑ dégradation de 52%</span> sur 6 mois</p>
      </div>
    </div>
  )
}
