import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Euro, TrendingUp, AlertCircle, CheckCircle2, Target } from 'lucide-react'

interface BudgetLine {
  id: string
  label: string
  allocated: number
  spent: number
}

const MOCK_BUDGETS: BudgetLine[] = [
  { id: '1', label: 'Véhicules utilitaires', allocated: 6000, spent: 4800 },
  { id: '2', label: 'Véhicules de service', allocated: 4000, spent: 2800 },
  { id: '3', label: 'Véhicules de direction', allocated: 2000, spent: 1084 },
]

export default function FuelBudgetPage() {
  const [budgets] = useState(MOCK_BUDGETS)
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0)
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0)
  const totalPct = (totalSpent / totalAllocated) * 100

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-500" />
        Gestion du budget carburant
      </h2>

      {/* Global summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Budget total mensuel</p>
              <p className="text-3xl font-bold">{totalAllocated.toLocaleString('fr-FR')} €</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Consommé</p>
              <p className="text-3xl font-bold">{totalSpent.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                totalPct > 90 ? 'bg-red-500' : totalPct > 70 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(totalPct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className={`font-medium ${totalPct > 90 ? 'text-red-500' : totalPct > 70 ? 'text-amber-500' : 'text-green-500'}`}>
              {totalPct.toFixed(0)}% utilisé
            </span>
            <span className="text-gray-500">
              Reste : {(totalAllocated - totalSpent).toLocaleString('fr-FR')} €
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Budget lines */}
      <div className="space-y-3">
        {budgets.map((b) => {
          const pct = (b.spent / b.allocated) * 100
          return (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{b.label}</h3>
                  <div className="text-right text-sm">
                    <span className="font-semibold">{b.spent.toLocaleString('fr-FR')} €</span>
                    <span className="text-gray-500"> / {b.allocated.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{pct.toFixed(0)}% — Reste {(b.allocated - b.spent).toLocaleString('fr-FR')} €</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
