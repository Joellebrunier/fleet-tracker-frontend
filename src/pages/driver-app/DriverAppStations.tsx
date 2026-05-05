import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Fuel, Navigation, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const NEARBY_STATIONS = [
  { id: '1', name: 'Total Nice Arenas', distance: '2.1 km', prices: [{ type: 'SP95', price: 1.80 }, { type: 'Diesel', price: 1.75 }], rating: 4.2, lat: 43.664, lng: 7.215 },
  { id: '2', name: 'Carrefour Nice TNL', distance: '4.8 km', prices: [{ type: 'SP95', price: 1.72 }, { type: 'Diesel', price: 1.68 }], rating: 4.5, lat: 43.685, lng: 7.202 },
  { id: '3', name: 'BP Saint-Laurent', distance: '5.3 km', prices: [{ type: 'SP95', price: 1.84 }, { type: 'Diesel', price: 1.78 }], rating: 3.8, lat: 43.672, lng: 7.188 },
  { id: '4', name: 'Intermarché Cagnes', distance: '8.7 km', prices: [{ type: 'SP95', price: 1.71 }, { type: 'Diesel', price: 1.66 }], rating: 4.3, lat: 43.659, lng: 7.148 },
]

export default function DriverAppStations() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-500" />
        Stations à proximité
      </h1>
      <p className="text-xs text-gray-500">Basé sur votre position actuelle</p>

      <div className="space-y-3">
        {NEARBY_STATIONS.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{s.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.distance}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{s.rating}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {s.prices.map((p) => (
                      <span key={p.type} className="inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs">
                        <Fuel className="h-3 w-3 text-gray-400" />
                        {p.type}: <strong>{p.price.toFixed(2)} €</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    Y aller
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
