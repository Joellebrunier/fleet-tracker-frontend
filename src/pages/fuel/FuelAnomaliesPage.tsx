import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle2, Eye, Car, Fuel, MapPin } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

type Severity = 'high' | 'medium' | 'low'
type AnomalyStatus = 'new' | 'investigating' | 'resolved'

interface FuelAnomaly {
  id: string
  date: string
  vehicleName: string
  licensePlate: string
  type: string
  description: string
  severity: Severity
  status: AnomalyStatus
  estimatedLoss?: number
}

const SEVERITY_COLORS: Record<Severity, string> = {
  high: 'bg-red-500/20 text-red-500',
  medium: 'bg-amber-500/20 text-amber-500',
  low: 'bg-blue-500/20 text-blue-500',
}

const STATUS_COLORS: Record<AnomalyStatus, string> = {
  new: 'bg-red-500/20 text-red-400',
  investigating: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-green-500/20 text-green-400',
}

const MOCK_ANOMALIES: FuelAnomaly[] = [
  { id: '1', date: new Date(Date.now() - 86400000).toISOString(), vehicleName: 'Renault Master', licensePlate: 'AB-123-CD', type: 'Surconsommation', description: 'Consommation 35% supérieure à la moyenne du véhicule sur les 7 derniers jours.', severity: 'high', status: 'new', estimatedLoss: 180 },
  { id: '2', date: new Date(Date.now() - 86400000 * 3).toISOString(), vehicleName: 'Citroën Jumpy', licensePlate: 'IJ-789-KL', type: 'Plein suspect', description: 'Plein de 85L détecté alors que le réservoir a une capacité maximale de 70L.', severity: 'high', status: 'investigating', estimatedLoss: 95 },
  { id: '3', date: new Date(Date.now() - 86400000 * 5).toISOString(), vehicleName: 'Dacia Duster', licensePlate: 'MN-012-OP', type: 'Écart kilométrique', description: 'Différence de 120km entre le kilométrage déclaré et le kilométrage GPS.', severity: 'medium', status: 'new' },
  { id: '4', date: new Date(Date.now() - 86400000 * 10).toISOString(), vehicleName: 'Peugeot 308', licensePlate: 'FP-456-AB', type: 'Plein hors zone', description: 'Plein effectué à 250km du périmètre habituel du véhicule.', severity: 'low', status: 'resolved' },
]

export default function FuelAnomaliesPage() {
  const [anomalies, setAnomalies] = useState(MOCK_ANOMALIES)
  const [filter, setFilter] = useState<AnomalyStatus | 'all'>('all')

  const filtered = anomalies.filter((a) => filter === 'all' || a.status === filter)
  const newCount = anomalies.filter((a) => a.status === 'new').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Anomalies carburant
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {newCount} nouvelle{newCount > 1 ? 's' : ''} anomalie{newCount > 1 ? 's' : ''} à traiter
          </p>
        </div>
        <div className="flex gap-1">
          {(['all', 'new', 'investigating', 'resolved'] as const).map((s) => (
            <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>
              {s === 'all' ? 'Toutes' : s === 'new' ? 'Nouvelles' : s === 'investigating' ? 'En cours' : 'Résolues'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((a) => (
          <Card key={a.id} className={`transition ${a.status === 'new' ? 'border-red-500/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${SEVERITY_COLORS[a.severity]}`}>
                      {a.severity === 'high' ? 'Élevée' : a.severity === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                    <Badge className={`text-[10px] ${STATUS_COLORS[a.status]}`}>
                      {a.status === 'new' ? 'Nouveau' : a.status === 'investigating' ? 'Investigation' : 'Résolu'}
                    </Badge>
                    <span className="text-xs text-gray-500">{a.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-medium">{a.vehicleName}</span>
                    <span className="text-gray-500">({a.licensePlate})</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{formatDateTime(a.date)}</span>
                    {a.estimatedLoss && (
                      <span className="text-red-500 font-medium">Perte estimée : {a.estimatedLoss} €</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-4">
                  {a.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAnomalies((prev) => prev.map((x) => x.id === a.id ? { ...x, status: 'resolved' } : x))}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Résoudre
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
