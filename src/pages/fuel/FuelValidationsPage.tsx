import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Eye,
  Check,
  X,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ValidationStatus = 'en_attente' | 'validé' | 'rejeté' | 'suspect'

interface FuelTransaction {
  id: string
  date: string
  vehicleName: string
  vehicleLicensePlate: string
  driverName: string
  station: string
  liters: number
  amount: number
  expectedLiters: number
  deviation: number // percentage
  status: ValidationStatus
}

interface ValidationDetail {
  transactionId: string
  approverName?: string
  rejectionReason?: string
  notes?: string
  validationDate?: string
  previousValidations: Array<{
    date: string
    status: ValidationStatus
    note: string
  }>
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<ValidationStatus, string> = {
  en_attente: 'En attente',
  validé: 'Validé',
  rejeté: 'Rejeté',
  suspect: 'Suspect',
}

const STATUS_COLORS: Record<ValidationStatus, string> = {
  en_attente: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500',
  validé: 'bg-green-500/20 text-green-700 dark:text-green-500',
  rejeté: 'bg-red-500/20 text-red-700 dark:text-red-500',
  suspect: 'bg-orange-500/20 text-orange-700 dark:text-orange-500',
}

const STATUS_ICONS: Record<ValidationStatus, any> = {
  en_attente: Clock,
  validé: CheckCircle2,
  rejeté: XCircle,
  suspect: AlertCircle,
}

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const MOCK_TRANSACTIONS: FuelTransaction[] = [
  { id: '1', date: new Date(Date.now() - 3600000).toISOString(), vehicleName: 'Renault Clio', vehicleLicensePlate: 'HJ-180-PW', driverName: 'Jean Dupont', station: 'Total Nice Arenas', liters: 42, amount: 75.6, expectedLiters: 40, deviation: 5.0, status: 'en_attente' },
  { id: '2', date: new Date(Date.now() - 86400000).toISOString(), vehicleName: 'Peugeot 308', vehicleLicensePlate: 'FP-456-AB', driverName: 'Marie Martin', station: 'BP Antibes', liters: 38, amount: 71.82, expectedLiters: 37, deviation: 2.7, status: 'en_attente' },
  { id: '3', date: new Date(Date.now() - 86400000 * 2).toISOString(), vehicleName: 'Renault Master', vehicleLicensePlate: 'AB-123-CD', driverName: 'Pierre Bernard', station: 'Shell Cannes', liters: 65, amount: 113.75, expectedLiters: 60, deviation: 8.3, status: 'suspect' },
  { id: '4', date: new Date(Date.now() - 86400000 * 3).toISOString(), vehicleName: 'Peugeot Expert', vehicleLicensePlate: 'EF-456-GH', driverName: 'Luc Moreau', station: 'Esso Mougins', liters: 55, amount: 94.6, expectedLiters: 54, deviation: 1.9, status: 'validé' },
  { id: '5', date: new Date(Date.now() - 86400000 * 4).toISOString(), vehicleName: 'Citroën Jumpy', vehicleLicensePlate: 'IJ-789-KL', driverName: 'Sophie Leroy', station: 'Intermarché Grasse', liters: 48, amount: 80.64, expectedLiters: 50, deviation: -4.0, status: 'validé' },
  { id: '6', date: new Date(Date.now() - 86400000 * 5).toISOString(), vehicleName: 'Dacia Duster', vehicleLicensePlate: 'MN-012-OP', driverName: 'Thomas Dubois', station: 'Total Vence', liters: 52, amount: 90.48, expectedLiters: 48, deviation: 8.3, status: 'rejeté' },
  { id: '7', date: new Date(Date.now() - 86400000 * 6).toISOString(), vehicleName: 'Mercedes Sprinter', vehicleLicensePlate: 'QR-345-ST', driverName: 'Catherine Durand', station: 'Carrefour Nice', liters: 68, amount: 119.2, expectedLiters: 65, deviation: 4.6, status: 'en_attente' },
  { id: '8', date: new Date(Date.now() - 86400000 * 7).toISOString(), vehicleName: 'Renault Kangoo', vehicleLicensePlate: 'UV-678-WX', driverName: 'François Morin', station: 'Shell Antibes', liters: 32, amount: 55.68, expectedLiters: 30, deviation: 6.7, status: 'en_attente' },
  { id: '9', date: new Date(Date.now() - 86400000 * 8).toISOString(), vehicleName: 'Iveco Daily', vehicleLicensePlate: 'YZ-901-AB', driverName: 'Élise Bernard', station: 'Esso Grasse', liters: 78, amount: 132.3, expectedLiters: 75, deviation: 4.0, status: 'suspect' },
  { id: '10', date: new Date(Date.now() - 86400000 * 9).toISOString(), vehicleName: 'Citroën C3', vehicleLicensePlate: 'CD-234-EF', driverName: 'Nicole Fournier', station: 'Total Valbonne', liters: 28, amount: 47.6, expectedLiters: 35, deviation: -20.0, status: 'rejeté' },
  { id: '11', date: new Date(Date.now() - 86400000 * 10).toISOString(), vehicleName: 'Renault Clio', vehicleLicensePlate: 'GH-567-IJ', driverName: 'Olivier Legrand', station: 'BP Sophia', liters: 41, amount: 73.8, expectedLiters: 40, deviation: 2.5, status: 'validé' },
  { id: '12', date: new Date(Date.now() - 86400000 * 11).toISOString(), vehicleName: 'Peugeot 3008', vehicleLicensePlate: 'KL-890-MN', driverName: 'Isabelle Mercier', station: 'Intermarché Antibes', liters: 45, amount: 76.5, expectedLiters: 42, deviation: 7.1, status: 'en_attente' },
  { id: '13', date: new Date(Date.now() - 86400000 * 12).toISOString(), vehicleName: 'Fiat Ducato', vehicleLicensePlate: 'OP-123-QR', driverName: 'Rémi Beaumont', station: 'Shell Mougins', liters: 60, amount: 102.0, expectedLiters: 58, deviation: 3.4, status: 'validé' },
  { id: '14', date: new Date(Date.now() - 86400000 * 13).toISOString(), vehicleName: 'Renault Master', vehicleLicensePlate: 'ST-456-UV', driverName: 'Anne Leclerc', station: 'Carrefour Cannes', liters: 72, amount: 126.4, expectedLiters: 70, deviation: 2.9, status: 'en_attente' },
  { id: '15', date: new Date(Date.now() - 86400000 * 14).toISOString(), vehicleName: 'Peugeot Partner', vehicleLicensePlate: 'WX-789-YZ', driverName: 'Laurent Vincent', station: 'Total Vallauris', liters: 35, amount: 59.5, expectedLiters: 55, deviation: -36.4, status: 'suspect' },
]

const MOCK_VALIDATION_HISTORY: Record<string, ValidationDetail> = {
  '1': {
    transactionId: '1',
    previousValidations: [
      { date: new Date(Date.now() - 3600000).toISOString(), status: 'en_attente', note: 'Ajoutée en attente de validation' },
    ],
  },
  '3': {
    transactionId: '3',
    previousValidations: [
      { date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'en_attente', note: 'Écart de 8.3% détecté - consommation supérieure à la normale' },
      { date: new Date(Date.now() - 86400000 * 1.5).toISOString(), status: 'suspect', note: 'Marquée comme suspecte par système d\'alerte' },
    ],
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SelectedTransaction {
  transaction: FuelTransaction
  detail?: ValidationDetail
}

export default function FuelValidationsPage() {
  const [transactions, setTransactions] = useState<FuelTransaction[]>(MOCK_TRANSACTIONS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<ValidationStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [vehicleFilter, setVehicleFilter] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<SelectedTransaction | null>(null)

  // Filter logic
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesVehicle = !vehicleFilter || t.vehicleName.toLowerCase().includes(vehicleFilter.toLowerCase()) || t.vehicleLicensePlate.toLowerCase().includes(vehicleFilter.toLowerCase())
      const tDate = new Date(t.date)
      const fromDate = dateFrom ? new Date(dateFrom) : new Date('2000-01-01')
      const toDate = dateTo ? new Date(dateTo) : new Date('2099-12-31')
      const matchesDate = tDate >= fromDate && tDate <= toDate
      return matchesStatus && matchesVehicle && matchesDate
    })
  }, [transactions, statusFilter, vehicleFilter, dateFrom, dateTo])

  // KPI calculations
  const kpiData = useMemo(() => {
    const enAttente = filtered.filter((t) => t.status === 'en_attente').length
    const montantTotal = filtered.reduce((sum, t) => sum + t.amount, 0)
    const ecartsDetectes = filtered.filter((t) => Math.abs(t.deviation) > 5).length
    const validationRate = filtered.length > 0 ? ((filtered.filter((t) => t.status === 'validé').length / filtered.length) * 100).toFixed(1) : '0'

    return { enAttente, montantTotal, ecartsDetectes, validationRate }
  }, [filtered])

  // Bulk actions
  const handleValidateSelected = () => {
    setTransactions((prev) =>
      prev.map((t) => (selectedIds.has(t.id) ? { ...t, status: 'validé' as ValidationStatus } : t))
    )
    setSelectedIds(new Set())
  }

  const handleRejectSelected = () => {
    setTransactions((prev) =>
      prev.map((t) => (selectedIds.has(t.id) ? { ...t, status: 'rejeté' as ValidationStatus } : t))
    )
    setSelectedIds(new Set())
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)))
    }
  }

  const toggleSelectTransaction = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleOpenDetail = (transaction: FuelTransaction) => {
    const detail = MOCK_VALIDATION_HISTORY[transaction.id] || { transactionId: transaction.id, previousValidations: [] }
    setSelectedTransaction({ transaction, detail })
  }

  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.enAttente}</p>
            <p className="text-xs text-gray-500">En attente de validation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.montantTotal.toFixed(2)} €</p>
            <p className="text-xs text-gray-500">Montant total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.ecartsDetectes}</p>
            <p className="text-xs text-gray-500">Écarts détectés (&gt;5%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{kpiData.validationRate}%</p>
            <p className="text-xs text-gray-500">Taux de validation</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Validations des transactions</h2>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} transactions affichées</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Du</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Au</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Véhicule</label>
          <Input
            placeholder="Filtre véhicule..."
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Statut</label>
          <div className="flex gap-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter('all')}
            >
              Tous
            </Button>
            <Button
              variant={statusFilter === 'en_attente' ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter('en_attente')}
            >
              Attente
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selectedIds.size} transaction(s) sélectionnée(s)</span>
              <div className="flex gap-2">
                <Button size="sm" variant="default" onClick={handleValidateSelected} className="bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4 mr-1" />
                  Valider
                </Button>
                <Button size="sm" variant="default" onClick={handleRejectSelected} className="bg-red-600 hover:bg-red-700">
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Véhicule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Conducteur</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Station</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Litres</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Montant</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Écart</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => {
                  const StatusIcon = STATUS_ICONS[transaction.status]
                  const deviationColor = transaction.deviation > 5 ? 'text-orange-600 dark:text-orange-400' : transaction.deviation < -5 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                  return (
                    <tr
                      key={transaction.id}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition ${selectedIds.has(transaction.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(transaction.id)}
                          onChange={() => toggleSelectTransaction(transaction.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{transaction.vehicleName}</p>
                        <p className="text-xs text-gray-500">{transaction.vehicleLicensePlate}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{transaction.driverName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{transaction.station}</td>
                      <td className="px-4 py-3 text-right font-medium">{transaction.liters} L</td>
                      <td className="px-4 py-3 text-right font-semibold">{transaction.amount.toFixed(2)} €</td>
                      <td className={`px-4 py-3 text-right font-medium ${deviationColor}`}>
                        {transaction.deviation > 0 ? '+' : ''}{transaction.deviation.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={STATUS_COLORS[transaction.status]}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_LABELS[transaction.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(transaction)}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Détails de la transaction</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTransaction(null)}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Date</p>
                  <p className="font-semibold">{formatDateTime(selectedTransaction.transaction.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Véhicule</p>
                  <p className="font-semibold">{selectedTransaction.transaction.vehicleName}</p>
                  <p className="text-xs text-gray-500">{selectedTransaction.transaction.vehicleLicensePlate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Conducteur</p>
                  <p className="font-semibold">{selectedTransaction.transaction.driverName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Station</p>
                  <p className="font-semibold">{selectedTransaction.transaction.station}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Litres</p>
                  <p className="font-semibold">{selectedTransaction.transaction.liters} L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Montant</p>
                  <p className="font-semibold">{selectedTransaction.transaction.amount.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Litres attendus</p>
                  <p className="font-semibold">{selectedTransaction.transaction.expectedLiters} L</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Écart</p>
                  <p className={`font-semibold ${Math.abs(selectedTransaction.transaction.deviation) > 5 ? 'text-orange-600' : ''}`}>
                    {selectedTransaction.transaction.deviation > 0 ? '+' : ''}{selectedTransaction.transaction.deviation.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Validation History */}
              <div>
                <h3 className="font-semibold text-sm mb-3">Historique de validation</h3>
                <div className="space-y-2">
                  {selectedTransaction.detail?.previousValidations && selectedTransaction.detail.previousValidations.length > 0 ? (
                    selectedTransaction.detail.previousValidations.map((hist, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={STATUS_COLORS[hist.status]}>
                            {STATUS_LABELS[hist.status]}
                          </Badge>
                          <span className="text-xs text-gray-500">{formatDateTime(hist.date)}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{hist.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Aucun historique disponible</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => setSelectedTransaction(null)}>
                  <Check className="h-4 w-4 mr-1" />
                  Valider
                </Button>
                <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700" onClick={() => setSelectedTransaction(null)}>
                  <X className="h-4 w-4 mr-1" />
                  Rejeter
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
