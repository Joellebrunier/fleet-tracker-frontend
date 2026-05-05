import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Receipt, Download, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type TransactionStatus = 'validated' | 'pending' | 'rejected'

interface FuelTransaction {
  id: string
  date: string
  vehicleName: string
  licensePlate: string
  driverName: string
  station: string
  fuelType: string
  liters: number
  pricePerLiter: number
  totalCost: number
  mileage: number
  status: TransactionStatus
  cardNumber?: string
}

const STATUS_LABELS: Record<TransactionStatus, string> = {
  validated: 'Validé',
  pending: 'En attente',
  rejected: 'Rejeté',
}

const STATUS_ICONS: Record<TransactionStatus, any> = {
  validated: CheckCircle2,
  pending: Clock,
  rejected: XCircle,
}

const STATUS_COLORS: Record<TransactionStatus, string> = {
  validated: 'bg-green-500/20 text-green-500',
  pending: 'bg-amber-500/20 text-amber-500',
  rejected: 'bg-red-500/20 text-red-500',
}

const MOCK_TRANSACTIONS: FuelTransaction[] = [
  { id: '1', date: new Date(Date.now() - 3600000 * 5).toISOString(), vehicleName: 'Renault Clio', licensePlate: 'HJ-180-PW', driverName: 'Jean Dupont', station: 'Total Nice Arenas', fuelType: 'SP95', liters: 42, pricePerLiter: 1.80, totalCost: 75.60, mileage: 45230, status: 'validated', cardNumber: '****1234' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), vehicleName: 'Peugeot 308', licensePlate: 'FP-456-AB', driverName: 'Marie Martin', station: 'BP Antibes', fuelType: 'SP98', liters: 38, pricePerLiter: 1.89, totalCost: 71.82, mileage: 32100, status: 'validated', cardNumber: '****5678' },
  { id: '3', date: new Date(Date.now() - 86400000 * 2).toISOString(), vehicleName: 'Renault Master', licensePlate: 'AB-123-CD', driverName: 'Pierre Bernard', station: 'Shell Cannes', fuelType: 'Diesel', liters: 65, pricePerLiter: 1.75, totalCost: 113.75, mileage: 78450, status: 'pending' },
  { id: '4', date: new Date(Date.now() - 86400000 * 3).toISOString(), vehicleName: 'Peugeot Expert', licensePlate: 'EF-456-GH', driverName: 'Luc Moreau', station: 'Esso Mougins', fuelType: 'Diesel', liters: 55, pricePerLiter: 1.72, totalCost: 94.60, mileage: 62300, status: 'validated' },
  { id: '5', date: new Date(Date.now() - 86400000 * 4).toISOString(), vehicleName: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', driverName: 'Sophie Leroy', station: 'Intermarché Grasse', fuelType: 'Diesel', liters: 48, pricePerLiter: 1.68, totalCost: 80.64, mileage: 55800, status: 'validated' },
  { id: '6', date: new Date(Date.now() - 86400000 * 5).toISOString(), vehicleName: 'Dacia Duster', licensePlate: 'MN-012-OP', driverName: 'Jean Dupont', station: 'Total Vence', fuelType: 'Diesel', liters: 52, pricePerLiter: 1.74, totalCost: 90.48, mileage: 41200, status: 'rejected' },
  { id: '7', date: new Date(Date.now() - 86400000 * 6).toISOString(), vehicleName: 'Renault Clio', licensePlate: 'HJ-180-PW', driverName: 'Jean Dupont', station: 'Carrefour Nice', fuelType: 'SP95', liters: 40, pricePerLiter: 1.78, totalCost: 71.20, mileage: 44890, status: 'validated' },
]

export default function FuelTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all')

  const filtered = MOCK_TRANSACTIONS.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.station.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalCost = filtered.reduce((s, t) => s + t.totalCost, 0)
  const totalLiters = filtered.reduce((s, t) => s + t.liters, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Transactions carburant</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} transactions — {totalLiters} L — {totalCost.toFixed(2)} €
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par véhicule, conducteur, station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'validated', 'pending', 'rejected'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Véhicule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Conducteur</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Station</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Litres</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">€/L</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const StatusIcon = STATUS_ICONS[t.status]
                  return (
                    <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.vehicleName}</p>
                        <p className="text-xs text-gray-500">{t.licensePlate}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.driverName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{t.station}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px]">{t.fuelType}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{t.liters} L</td>
                      <td className="px-4 py-3 text-right text-gray-500">{t.pricePerLiter.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-right font-semibold">{t.totalCost.toFixed(2)} €</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={`text-[10px] ${STATUS_COLORS[t.status]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[t.status]}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
