import { useState } from 'react'
import { MapPin, Fuel, Search, Sliders } from 'lucide-react'

interface FuelStation {
  id: string
  name: string
  address: string
  distance: number
  diesel: number | null
  sp95: number | null
  sp98: number | null
  e85: number | null
}

const MOCK_STATIONS: FuelStation[] = [
  {
    id: '1',
    name: 'Total Nice Arenas',
    address: '123 Promenade des Anglais, 06000 Nice',
    distance: 2.3,
    diesel: 1.649,
    sp95: 1.759,
    sp98: 1.859,
    e85: 0.849,
  },
  {
    id: '2',
    name: 'BP Antibes',
    address: '456 Boulevard de la Salis, 06600 Antibes',
    distance: 4.8,
    diesel: 1.689,
    sp95: 1.799,
    sp98: 1.899,
    e85: 0.879,
  },
  {
    id: '3',
    name: 'Shell Cannes',
    address: '789 Rue d\'Antibes, 06400 Cannes',
    distance: 6.2,
    diesel: 1.659,
    sp95: 1.769,
    sp98: 1.869,
    e85: 0.859,
  },
  {
    id: '4',
    name: 'Esso Mougins',
    address: '321 Route de Grasse, 06250 Mougins',
    distance: 8.5,
    diesel: 1.719,
    sp95: 1.829,
    sp98: 1.929,
    e85: 0.899,
  },
  {
    id: '5',
    name: 'Carrefour Villefranche',
    address: '654 Boulevard Michotte, 06230 Villefranche-sur-Mer',
    distance: 5.1,
    diesel: 1.679,
    sp95: 1.789,
    sp98: 1.889,
    e85: 0.869,
  },
  {
    id: '6',
    name: 'Leclerc Saint-Laurent',
    address: '987 Avenue Saint-Laurent, 06700 Saint-Laurent-du-Var',
    distance: 7.3,
    diesel: 1.639,
    sp95: 1.749,
    sp98: 1.849,
    e85: 0.839,
  },
  {
    id: '7',
    name: 'Intermarché Beaulieu',
    address: '147 Boulevard de la Mer, 06310 Beaulieu-sur-Mer',
    distance: 3.9,
    diesel: 1.699,
    sp95: 1.809,
    sp98: 1.909,
    e85: 0.889,
  },
  {
    id: '8',
    name: 'Cora Cagnes',
    address: '258 Avenue de la Gare, 06800 Cagnes-sur-Mer',
    distance: 9.2,
    diesel: 1.709,
    sp95: 1.819,
    sp98: 1.919,
    e85: 0.899,
  },
]

export default function FuelMapPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [fuelFilter, setFuelFilter] = useState<'all' | 'diesel' | 'sp95' | 'sp98' | 'e85'>('all')
  const [radiusFilter, setRadiusFilter] = useState<5 | 10 | 25 | 50>(10)

  const getCheapestFuel = (station: FuelStation): { type: string; price: number } | null => {
    const prices = [
      station.diesel !== null ? { type: 'Diesel', price: station.diesel } : null,
      station.sp95 !== null ? { type: 'SP95', price: station.sp95 } : null,
      station.sp98 !== null ? { type: 'SP98', price: station.sp98 } : null,
      station.e85 !== null ? { type: 'E85', price: station.e85 } : null,
    ].filter(Boolean) as { type: string; price: number }[]

    if (prices.length === 0) return null
    return prices.reduce((cheapest, current) => (current.price < cheapest.price ? current : cheapest))
  }

  const filtered = MOCK_STATIONS.filter((s) => {
    if (s.distance > radiusFilter) return false
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (fuelFilter !== 'all') {
      const fuelMap = { diesel: 'diesel', sp95: 'sp95', sp98: 'sp98', e85: 'e85' }
      const price = s[fuelMap[fuelFilter] as keyof FuelStation]
      if (price === null) return false
    }
    return true
  }).sort((a, b) => a.distance - b.distance)

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Main map area */}
      <div className="flex-1">
        <div className="w-full h-full rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border border-gray-300">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Carte des stations</p>
            <p className="text-sm text-gray-400 mt-1">{filtered.length} station{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Sidebar panel */}
      <div className="w-80 flex flex-col gap-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une station..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Fuel type filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Fuel className="h-4 w-4" />
              Type de carburant
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'all' as const, label: 'Tous' },
                { value: 'diesel' as const, label: 'Diesel' },
                { value: 'sp95' as const, label: 'SP95' },
                { value: 'sp98' as const, label: 'SP98' },
                { value: 'e85' as const, label: 'E85' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFuelFilter(opt.value)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                    fuelFilter === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Sliders className="h-4 w-4" />
              Rayon de recherche
            </label>
            <div className="flex gap-2">
              {[5, 10, 25, 50].map((radius) => (
                <button
                  key={radius}
                  onClick={() => setRadiusFilter(radius as 5 | 10 | 25 | 50)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                    radiusFilter === radius
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {radius} km
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stations list */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-2">
            {filtered.map((station) => {
              const cheapest = getCheapestFuel(station)
              return (
                <div key={station.id} className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{station.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{station.address}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {station.distance.toFixed(1)} km
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {station.diesel !== null && (
                      <div className={`p-2 rounded ${cheapest?.type === 'Diesel' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'}`}>
                        Diesel: {station.diesel.toFixed(3)} €
                      </div>
                    )}
                    {station.sp95 !== null && (
                      <div className={`p-2 rounded ${cheapest?.type === 'SP95' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'}`}>
                        SP95: {station.sp95.toFixed(3)} €
                      </div>
                    )}
                    {station.sp98 !== null && (
                      <div className={`p-2 rounded ${cheapest?.type === 'SP98' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'}`}>
                        SP98: {station.sp98.toFixed(3)} €
                      </div>
                    )}
                    {station.e85 !== null && (
                      <div className={`p-2 rounded ${cheapest?.type === 'E85' ? 'bg-green-100 text-green-700 font-semibold' : 'bg-gray-100'}`}>
                        E85: {station.e85.toFixed(3)} €
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
