import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Star, Fuel, Euro } from 'lucide-react'

interface Station {
  id: string
  name: string
  address: string
  brand: string
  distance: number
  prices: { type: string; price: number }[]
  rating: number
  visitCount: number
  lastVisit?: string
}

const MOCK_STATIONS: Station[] = [
  { id: '1', name: 'Total Nice Arenas', address: '455 Promenade des Anglais, Nice', brand: 'Total', distance: 2.1, prices: [{ type: 'SP95', price: 1.80 }, { type: 'Diesel', price: 1.75 }], rating: 4.2, visitCount: 15, lastVisit: '2026-05-03' },
  { id: '2', name: 'BP Antibes', address: '12 Av. de la Libération, Antibes', brand: 'BP', distance: 8.5, prices: [{ type: 'SP98', price: 1.89 }, { type: 'Diesel', price: 1.78 }], rating: 3.8, visitCount: 8 },
  { id: '3', name: 'Shell Cannes', address: '88 Bd Carnot, Cannes', brand: 'Shell', distance: 15.2, prices: [{ type: 'SP95', price: 1.82 }, { type: 'Diesel', price: 1.76 }], rating: 4.0, visitCount: 5 },
  { id: '4', name: 'Intermarché Grasse', address: '25 Route de Nice, Grasse', brand: 'Intermarché', distance: 22.0, prices: [{ type: 'SP95', price: 1.72 }, { type: 'Diesel', price: 1.68 }], rating: 4.5, visitCount: 12 },
  { id: '5', name: 'Carrefour Nice', address: 'Centre commercial TNL, Nice', brand: 'Carrefour', distance: 4.8, prices: [{ type: 'SP95', price: 1.78 }, { type: 'Diesel', price: 1.72 }], rating: 4.1, visitCount: 20 },
  { id: '6', name: 'Esso Mougins', address: '1200 Route des Dolines, Mougins', brand: 'Esso', distance: 18.3, prices: [{ type: 'SP95', price: 1.84 }, { type: 'Diesel', price: 1.74 }], rating: 3.5, visitCount: 3 },
]

export default function FuelStationsPage() {
  const [search, setSearch] = useState('')
  const filtered = MOCK_STATIONS.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.brand.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stations fréquentées</h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="hover:shadow-md transition">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-sm">{s.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{s.address}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">{s.brand}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.distance} km</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{s.rating}</span>
                <span>{s.visitCount} visites</span>
              </div>
              <div className="flex gap-2">
                {s.prices.map((p) => (
                  <div key={p.type} className="flex items-center gap-1 rounded bg-gray-100 dark:bg-gray-800 px-2 py-1">
                    <Fuel className="h-3 w-3 text-gray-400" />
                    <span className="text-xs font-medium">{p.type}</span>
                    <span className="text-xs text-gray-500">{p.price.toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
