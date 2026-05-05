import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Fuel, CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

const MOCK_HISTORY = [
  { id: '1', date: new Date(Date.now() - 3600000 * 5).toISOString(), liters: 42, cost: 75.60, station: 'Total Nice Arenas', fuelType: 'SP95', mileage: 45230, status: 'validated' as const },
  { id: '2', date: new Date(Date.now() - 86400000 * 3).toISOString(), liters: 40, cost: 71.20, station: 'Carrefour Nice', fuelType: 'SP95', mileage: 44890, status: 'validated' as const },
  { id: '3', date: new Date(Date.now() - 86400000 * 7).toISOString(), liters: 38, cost: 68.40, station: 'BP Saint-Laurent', fuelType: 'SP95', mileage: 44520, status: 'validated' as const },
  { id: '4', date: new Date(Date.now() - 86400000 * 12).toISOString(), liters: 41, cost: 73.80, station: 'Total Nice Arenas', fuelType: 'SP95', mileage: 44100, status: 'pending' as const },
]

export default function DriverAppHistory() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-500" />
        Historique des pleins
      </h1>

      <div className="space-y-3">
        {MOCK_HISTORY.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm">{h.liters} L — {h.cost.toFixed(2)} €</span>
                    <Badge variant="outline" className="text-[10px]">{h.fuelType}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {h.station}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(h.date)} — {h.mileage.toLocaleString('fr-FR')} km</p>
                </div>
                <Badge className={`text-[10px] ${h.status === 'validated' ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                  {h.status === 'validated' ? 'Validé' : 'En attente'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
