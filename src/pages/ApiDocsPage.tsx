import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  category: string
}

const endpoints: ApiEndpoint[] = [
  // Véhicules
  {
    method: 'GET',
    path: '/api/vehicles',
    description: 'Récupérer la liste de tous les véhicules',
    category: 'Véhicules',
  },
  {
    method: 'GET',
    path: '/api/vehicles/:id',
    description: 'Récupérer les détails d\'un véhicule',
    category: 'Véhicules',
  },
  {
    method: 'POST',
    path: '/api/vehicles',
    description: 'Créer un nouveau véhicule',
    category: 'Véhicules',
  },
  {
    method: 'PUT',
    path: '/api/vehicles/:id',
    description: 'Mettre à jour un véhicule',
    category: 'Véhicules',
  },
  {
    method: 'DELETE',
    path: '/api/vehicles/:id',
    description: 'Supprimer un véhicule',
    category: 'Véhicules',
  },

  // Conducteurs
  {
    method: 'GET',
    path: '/api/drivers',
    description: 'Récupérer la liste de tous les conducteurs',
    category: 'Conducteurs',
  },
  {
    method: 'GET',
    path: '/api/drivers/:id',
    description: 'Récupérer les détails d\'un conducteur',
    category: 'Conducteurs',
  },
  {
    method: 'POST',
    path: '/api/drivers',
    description: 'Créer un nouveau conducteur',
    category: 'Conducteurs',
  },
  {
    method: 'PUT',
    path: '/api/drivers/:id',
    description: 'Mettre à jour un conducteur',
    category: 'Conducteurs',
  },

  // Géofences
  {
    method: 'GET',
    path: '/api/geofences',
    description: 'Récupérer la liste de tous les géofences',
    category: 'Géofences',
  },
  {
    method: 'POST',
    path: '/api/geofences',
    description: 'Créer un nouveau géofence',
    category: 'Géofences',
  },
  {
    method: 'PUT',
    path: '/api/geofences/:id',
    description: 'Mettre à jour un géofence',
    category: 'Géofences',
  },
  {
    method: 'DELETE',
    path: '/api/geofences/:id',
    description: 'Supprimer un géofence',
    category: 'Géofences',
  },

  // Alertes
  {
    method: 'GET',
    path: '/api/alerts',
    description: 'Récupérer la liste de toutes les alertes',
    category: 'Alertes',
  },
  {
    method: 'GET',
    path: '/api/alerts/:id',
    description: 'Récupérer les détails d\'une alerte',
    category: 'Alertes',
  },
  {
    method: 'POST',
    path: '/api/alerts',
    description: 'Créer une nouvelle alerte',
    category: 'Alertes',
  },

  // GPS
  {
    method: 'GET',
    path: '/api/gps/location/:vehicleId',
    description: 'Récupérer la localisation actuelle d\'un véhicule',
    category: 'GPS',
  },
  {
    method: 'GET',
    path: '/api/gps/history/:vehicleId',
    description: 'Récupérer l\'historique GPS d\'un véhicule',
    category: 'GPS',
  },
]

const categories = Array.from(new Set(endpoints.map((e) => e.category)))

function getMethodColor(
  method: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (method) {
    case 'GET':
      return 'default'
    case 'POST':
      return 'secondary'
    case 'PUT':
      return 'outline'
    case 'DELETE':
      return 'destructive'
    default:
      return 'default'
  }
}

function getMethodLabel(method: string): string {
  switch (method) {
    case 'GET':
      return 'Lecture'
    case 'POST':
      return 'Créer'
    case 'PUT':
      return 'Modifier'
    case 'DELETE':
      return 'Supprimer'
    default:
      return method
  }
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<
    'endpoints' | 'examples' | 'auth' | 'limits' | 'keys'
  >('endpoints')
  const [apiKey, setApiKey] = useState('sk_live_1a2b3c4d5e6f7g8h9i0j')
  const [showKey, setShowKey] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredEndpoints = selectedCategory
    ? endpoints.filter((e) => e.category === selectedCategory)
    : endpoints

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const generateNewKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 26)}`
    setApiKey(newKey)
  }

  const revokeKey = () => {
    setApiKey('sk_revoked_' + Date.now())
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 font-sans">Documentation API</h1>
        <p className="mt-2 text-gray-500">
          Intégrez Fleet Tracker dans votre application
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {[
          { id: 'endpoints', label: 'Endpoints' },
          { id: 'examples', label: 'Exemples' },
          { id: 'auth', label: 'Authentification' },
          { id: 'limits', label: 'Limites' },
          { id: 'keys', label: 'Clés API' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-3 font-medium text-sm border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  )}
                >
                  Tous
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium transition-colors',
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Endpoints List */}
          {filteredEndpoints.map((endpoint, idx) => (
            <Card key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getMethodColor(endpoint.method)}>
                        {getMethodLabel(endpoint.method)}
                      </Badge>
                      <code className="text-sm font-mono bg-white px-3 py-1 rounded text-gray-900">
                        {endpoint.path}
                      </code>
                    </div>
                    <p className="text-gray-500">{endpoint.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.path)}
                  >
                    <Copy size={16} className="mr-2" />
                    Copier
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Examples Tab */}
      {activeTab === 'examples' && (
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Récupérer les véhicules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">cURL</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`curl -X GET "https://api.fleet-tracker.com/api/vehicles" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X GET "https://api.fleet-tracker.com/api/vehicles" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  JavaScript (fetch)
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`const response = await fetch('https://api.fleet-tracker.com/api/vehicles', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `const response = await fetch('https://api.fleet-tracker.com/api/vehicles', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Python</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.fleet-tracker.com/api/vehicles', headers=headers)
data = response.json()`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.fleet-tracker.com/api/vehicles', headers=headers)
data = response.json()`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Récupérer l'historique GPS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">cURL</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`curl -X GET "https://api.fleet-tracker.com/api/gps/history/vehicle-123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X GET "https://api.fleet-tracker.com/api/gps/history/vehicle-123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">JavaScript (fetch)</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`const vehicleId = 'vehicle-123';
const response = await fetch(\`https://api.fleet-tracker.com/api/gps/history/\${vehicleId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const history = await response.json();`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `const vehicleId = 'vehicle-123';
const response = await fetch(\`https://api.fleet-tracker.com/api/gps/history/\${vehicleId}\`, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const history = await response.json();`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Python</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`import requests

vehicle_id = 'vehicle-123'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

url = f'https://api.fleet-tracker.com/api/gps/history/{vehicle_id}'
response = requests.get(url, headers=headers)
history = response.json()`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `import requests

vehicle_id = 'vehicle-123'
headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

url = f'https://api.fleet-tracker.com/api/gps/history/{vehicle_id}'
response = requests.get(url, headers=headers)
history = response.json()`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Créer un géofence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">cURL</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`curl -X POST "https://api.fleet-tracker.com/api/geofences" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Zone de dépôt",
    "shape": {
      "type": "circle",
      "center": {"lat": 48.8566, "lng": 2.3522},
      "radiusMeters": 200
    },
    "alertOnEntry": true,
    "alertOnExit": true
  }'`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X POST "https://api.fleet-tracker.com/api/geofences" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Zone de dépôt",
    "shape": {
      "type": "circle",
      "center": {"lat": 48.8566, "lng": 2.3522},
      "radiusMeters": 200
    },
    "alertOnEntry": true,
    "alertOnExit": true
  }'`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  JavaScript (fetch)
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`const response = await fetch('https://api.fleet-tracker.com/api/geofences', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Zone de dépôt',
    shape: {
      type: 'circle',
      center: { lat: 48.8566, lng: 2.3522 },
      radiusMeters: 200
    },
    alertOnEntry: true,
    alertOnExit: true
  })
});
const data = await response.json();`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `const response = await fetch('https://api.fleet-tracker.com/api/geofences', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Zone de dépôt',
    shape: {
      type: 'circle',
      center: { lat: 48.8566, lng: 2.3522 },
      radiusMeters: 200
    },
    alertOnEntry: true,
    alertOnExit: true
  })
});
const data = await response.json();`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Python</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

payload = {
    'name': 'Zone de dépôt',
    'shape': {
        'type': 'circle',
        'center': {'lat': 48.8566, 'lng': 2.3522},
        'radiusMeters': 200
    },
    'alertOnEntry': True,
    'alertOnExit': True
}

response = requests.post('https://api.fleet-tracker.com/api/geofences',
                         headers=headers, json=payload)
data = response.json()`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `import requests
import json

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

payload = {
    'name': 'Zone de dépôt',
    'shape': {
        'type': 'circle',
        'center': {'lat': 48.8566, 'lng': 2.3522},
        'radiusMeters': 200
    },
    'alertOnEntry': True,
    'alertOnExit': True
}

response = requests.post('https://api.fleet-tracker.com/api/geofences',
                         headers=headers, json=payload)
data = response.json()`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Récupérer les alertes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">cURL</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`curl -X GET "https://api.fleet-tracker.com/api/alerts" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `curl -X GET "https://api.fleet-tracker.com/api/alerts" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">JavaScript (fetch)</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`const response = await fetch('https://api.fleet-tracker.com/api/alerts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const alerts = await response.json();`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `const response = await fetch('https://api.fleet-tracker.com/api/alerts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const alerts = await response.json();`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Python</h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <code>{`import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.fleet-tracker.com/api/alerts', headers=headers)
alerts = response.json()`}</code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    copyToClipboard(
                      `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.fleet-tracker.com/api/alerts', headers=headers)
alerts = response.json()`
                    )
                  }
                >
                  <Copy size={16} className="mr-2" />
                  Copier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Authentication Tab */}
      {activeTab === 'auth' && (
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Authentification par Bearer Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Utiliser une clé API
              </h3>
              <p className="text-gray-500 mb-4">
                Incluez votre clé API dans l'en-tête Authorization de chaque requête :
              </p>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code>Authorization: Bearer sk_live_YOUR_KEY_HERE</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Exemple</h3>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <code>{`GET /api/vehicles HTTP/1.1
Host: api.fleet-tracker.com
Authorization: Bearer sk_live_1a2b3c4d5e6f7g8h9i0j
Content-Type: application/json`}</code>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-900">
                <strong>Sécurité :</strong> Ne stockez pas vos clés API dans le code
                source. Utilisez des variables d'environnement.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rate Limits Tab */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle>Limites de taux (Rate Limiting)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Plan Starter</h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">100</p>
                    <p className="text-gray-500 text-sm">requêtes par minute</p>
                  </div>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Plan Professionnel
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">500</p>
                    <p className="text-gray-500 text-sm">requêtes par minute</p>
                  </div>
                  <div className="border border-gray-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Plan Entreprise
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mb-2">
                      Illimité
                    </p>
                    <p className="text-gray-500 text-sm">Support prioritaire</p>
                  </div>
                </div>

                <div className="bg-white border border-amber-500 p-4 rounded-lg">
                  <p className="text-amber-500">
                    <strong>En cas de dépassement :</strong> Vous recevrez une réponse
                    429 Too Many Requests. Attendez avant de réessayer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Gestion des clés API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Clés actives</h3>
              <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Production</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono bg-white px-2 py-1 rounded flex-1">
                          {showKey ? apiKey : apiKey.substring(0, 10) + '...'}
                        </code>
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="p-1 hover:bg-white rounded"
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey)}
                          className="p-1 hover:bg-white rounded"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={generateNewKey}
                    className="flex-1"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Générer une nouvelle clé
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={revokeKey}
                    className="flex-1"
                  >
                    Révoquer
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-4 rounded-lg">
              <p className="text-gray-900">
                <strong>Conseil :</strong> Générez une nouvelle clé régulièrement pour
                renforcer la sécurité. Les anciennes clés seront désactivées.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
