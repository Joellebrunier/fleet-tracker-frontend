import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Save, Fuel, Euro, AlertTriangle, Bell } from 'lucide-react'

export default function FuelSettingsPage() {
  const [settings, setSettings] = useState({
    defaultFuelPrice: 1.80,
    monthlyBudget: 12000,
    consumptionThreshold: 10,
    anomalyEnabled: true,
    notifyOnAnomaly: true,
    notifyOnBudgetWarning: true,
    budgetWarningPct: 80,
    maxTankCapacity: 80,
  })

  const update = (key: string, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-500" />
          Paramètres carburant
        </h2>
        <Button size="sm">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Tarification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Prix par défaut (€/L)</label>
              <Input
                type="number"
                step="0.01"
                value={settings.defaultFuelPrice}
                onChange={(e) => update('defaultFuelPrice', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Budget mensuel (€)</label>
              <Input
                type="number"
                value={settings.monthlyBudget}
                onChange={(e) => update('monthlyBudget', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Fuel className="h-4 w-4" />
              Seuils
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Seuil de consommation (L/100km)</label>
              <Input
                type="number"
                step="0.5"
                value={settings.consumptionThreshold}
                onChange={(e) => update('consumptionThreshold', parseFloat(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Alerte si un véhicule dépasse ce seuil</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Capacité max réservoir (L)</label>
              <Input
                type="number"
                value={settings.maxTankCapacity}
                onChange={(e) => update('maxTankCapacity', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">Anomalie si un plein dépasse cette valeur</p>
            </div>
          </CardContent>
        </Card>

        {/* Anomaly detection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Détection d'anomalies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.anomalyEnabled}
                onChange={(e) => update('anomalyEnabled', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Activer la détection automatique d'anomalies</span>
            </label>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifyOnAnomaly}
                onChange={(e) => update('notifyOnAnomaly', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Notification lors d'une anomalie</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifyOnBudgetWarning}
                onChange={(e) => update('notifyOnBudgetWarning', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Alerte budget dépassé</span>
            </label>
            <div>
              <label className="text-sm font-medium mb-1 block">Seuil d'alerte budget (%)</label>
              <Input
                type="number"
                value={settings.budgetWarningPct}
                onChange={(e) => update('budgetWarningPct', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
