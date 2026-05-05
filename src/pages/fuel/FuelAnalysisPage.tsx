import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Fuel, Euro, ArrowRight } from 'lucide-react'

const MONTHLY_DATA = [
  { month: 'Jan', liters: 4200, cost: 7560 },
  { month: 'Fév', liters: 3900, cost: 7020 },
  { month: 'Mar', liters: 4500, cost: 8100 },
  { month: 'Avr', liters: 4100, cost: 7380 },
  { month: 'Mai', liters: 4825, cost: 8685 },
]

export default function FuelAnalysisPage() {
  const maxLiters = Math.max(...MONTHLY_DATA.map((d) => d.liters))

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        Analyse de consommation
      </h2>

      {/* Simple bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Consommation mensuelle (litres)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 h-48">
            {MONTHLY_DATA.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium">{d.liters} L</span>
                <div
                  className="w-full bg-blue-500 rounded-t-md transition-all"
                  style={{ height: `${(d.liters / maxLiters) * 100}%` }}
                />
                <span className="text-xs text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Points positifs
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                Consommation moyenne en baisse de 4.2% vs mois précédent
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                3 véhicules sous le seuil de 7 L/100km
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                Coût moyen au litre en baisse (-0.03€/L)
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Fuel className="h-4 w-4 text-amber-500" />
              Points d'attention
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                Renault Master au-dessus de 12 L/100km (+15% vs flotte)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                3 anomalies non résolues cette semaine
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                Budget mensuel à 72% en milieu de mois
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
