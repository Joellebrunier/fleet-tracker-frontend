import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Fuel, Camera, CheckCircle2, MapPin } from 'lucide-react'

export default function DriverAppDeclare() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    liters: '',
    pricePerLiter: '',
    mileage: '',
    station: '',
    fuelType: 'SP95',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const totalCost = form.liters && form.pricePerLiter
    ? (parseFloat(form.liters) * parseFloat(form.pricePerLiter)).toFixed(2)
    : '0.00'

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => navigate('/driver-app'), 2000)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] p-4">
        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-lg font-semibold">Plein enregistré !</h2>
        <p className="text-sm text-gray-500 mt-1">
          {form.liters} L à {form.station || 'station inconnue'}
        </p>
        <p className="text-lg font-bold mt-2">{totalCost} €</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/driver-app')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">Déclarer un plein</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Fuel type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type de carburant</label>
            <div className="grid grid-cols-4 gap-2">
              {['SP95', 'SP98', 'Diesel', 'E85'].map((type) => (
                <button
                  key={type}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    form.fuelType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setForm((p) => ({ ...p, fuelType: type }))}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Liters */}
          <div>
            <label className="text-sm font-medium mb-1 block">Quantité (litres)</label>
            <Input
              type="number"
              step="0.1"
              value={form.liters}
              onChange={(e) => setForm((p) => ({ ...p, liters: e.target.value }))}
              placeholder="42.5"
              className="text-lg"
            />
          </div>

          {/* Price per liter */}
          <div>
            <label className="text-sm font-medium mb-1 block">Prix au litre (€)</label>
            <Input
              type="number"
              step="0.01"
              value={form.pricePerLiter}
              onChange={(e) => setForm((p) => ({ ...p, pricePerLiter: e.target.value }))}
              placeholder="1.80"
            />
          </div>

          {/* Total */}
          {form.liters && form.pricePerLiter && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold text-blue-600">{totalCost} €</p>
            </div>
          )}

          {/* Mileage */}
          <div>
            <label className="text-sm font-medium mb-1 block">Kilométrage actuel</label>
            <Input
              type="number"
              value={form.mileage}
              onChange={(e) => setForm((p) => ({ ...p, mileage: e.target.value }))}
              placeholder="45 230"
            />
          </div>

          {/* Station */}
          <div>
            <label className="text-sm font-medium mb-1 block">Station</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={form.station}
                onChange={(e) => setForm((p) => ({ ...p, station: e.target.value }))}
                placeholder="Nom de la station"
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-1 block">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Remarques..."
              rows={2}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm resize-none"
            />
          </div>

          {/* Photo button */}
          <Button variant="outline" className="w-full">
            <Camera className="h-4 w-4 mr-2" />
            Prendre une photo du ticket
          </Button>

          {/* Submit */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={!form.liters || !form.pricePerLiter}
          >
            <Fuel className="h-4 w-4 mr-2" />
            Enregistrer le plein
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
