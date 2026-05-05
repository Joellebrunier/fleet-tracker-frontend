import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, Gauge, Fuel, Clock } from 'lucide-react'

const MOCK_VEHICLES = [
  { id: '1', name: 'Renault Clio', plate: 'HJ-180-PW', status: 'active', mileage: 45230, fuel: 67, assigned: true },
  { id: '2', name: 'Peugeot 308', plate: 'FP-456-AB', status: 'idle', mileage: 32100, fuel: 45, assigned: false },
]

export default function DriverAppVehicles() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">Mes véhicules</h1>
      {MOCK_VEHICLES.map((v) => (
        <Card key={v.id} className={v.assigned ? 'border-blue-500/30' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${v.assigned ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                  <Car className={`h-5 w-5 ${v.assigned ? 'text-blue-500' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{v.name}</h3>
                  <p className="text-xs text-gray-500">{v.plate}</p>
                </div>
              </div>
              {v.assigned && <Badge className="bg-blue-500/20 text-blue-500 text-[10px]">Assigné</Badge>}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{v.mileage.toLocaleString('fr-FR')} km</span>
              <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuel}%</span>
              <span className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${v.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                {v.status === 'active' ? 'Actif' : 'Au repos'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
