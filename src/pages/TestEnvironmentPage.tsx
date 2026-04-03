import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RequestHistoryItem {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  status?: number
  timestamp: Date
  body?: string
  response?: any
}

type Environment = 'production' | 'staging' | 'development'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface MockVehicle {
  id: string
  name: string
  licensePlate: string
  status: 'online' | 'offline'
  latitude: number
  longitude: number
  speed: number
}

interface MockDriver {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  status: 'active' | 'inactive'
}

interface MockGeofence {
  id: string
  name: string
  type: 'circle' | 'polygon'
  center?: { lat: number; lng: number }
  radius?: number
}

export default function TestEnvironmentPage() {
  const [environment, setEnvironment] = useState<Environment>('development')
  const [sandboxMode, setSandboxMode] = useState(true)
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [requestHistory, setRequestHistory] = useState<RequestHistoryItem[]>([])

  const baseUrls: Record<Environment, string> = {
    production: 'https://api.trackzone.com',
    staging: 'https://staging-api.trackzone.com',
    development: 'http://localhost:3000',
  }

  const generateMockVehicles = (): MockVehicle[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `vehicle-${i + 1}`,
      name: `Camion ${String(i + 1).padStart(2, '0')}`,
      licensePlate: `AB-${String(i + 1).padStart(3, '0')}-CD`,
      status: Math.random() > 0.2 ? 'online' : 'offline',
      latitude: 48.8566 + (Math.random() - 0.5) * 0.5,
      longitude: 2.3522 + (Math.random() - 0.5) * 0.5,
      speed: Math.floor(Math.random() * 120),
    }))
  }

  const generateMockDrivers = (): MockDriver[] => {
    const firstNames = [
      'Jean',
      'Pierre',
      'Marc',
      'Luc',
      'Paul',
    ]
    const lastNames = [
      'Dupont',
      'Martin',
      'Bernard',
      'Thomas',
      'Robert',
    ]
    return Array.from({ length: 5 }, (_, i) => ({
      id: `driver-${i + 1}`,
      firstName: firstNames[i],
      lastName: lastNames[i],
      phone: `06${String(Math.floor(Math.random() * 10000000)).padStart(8, '0')}`,
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@example.com`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
    }))
  }

  const generateMockGeofences = (): MockGeofence[] => {
    return [
      {
        id: 'geofence-1',
        name: 'Zone de dépôt',
        type: 'circle',
        center: { lat: 48.8566, lng: 2.3522 },
        radius: 200,
      },
      {
        id: 'geofence-2',
        name: 'Zone de livraison',
        type: 'circle',
        center: { lat: 48.9022, lng: 2.2897 },
        radius: 500,
      },
      {
        id: 'geofence-3',
        name: 'Zone interdite',
        type: 'polygon',
      },
    ]
  }

  const handleSendRequest = async () => {
    setLoading(true)
    try {
      const fullUrl = `${baseUrls[environment]}${url}`
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_test_dummy_key',
          'X-Sandbox-Mode': sandboxMode ? 'true' : 'false',
        },
      }

      if (method !== 'GET' && body) {
        options.body = body
      }

      const res = await fetch(fullUrl, options)
      const data = await res.json().catch(() => ({ error: 'Invalid JSON response' }))

      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      })

      const newRequest: RequestHistoryItem = {
        id: `req-${Date.now()}`,
        method,
        url,
        status: res.status,
        timestamp: new Date(),
        body: method !== 'GET' ? body : undefined,
        response: data,
      }

      setRequestHistory([newRequest, ...requestHistory.slice(0, 9)])
    } catch (error: any) {
      setResponse({
        error: error.message || 'Erreur réseau',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMockData = (type: 'vehicles' | 'drivers' | 'geofences') => {
    let mockData
    let dataUrl

    switch (type) {
      case 'vehicles':
        mockData = generateMockVehicles()
        dataUrl = '/api/vehicles'
        break
      case 'drivers':
        mockData = generateMockDrivers()
        dataUrl = '/api/drivers'
        break
      case 'geofences':
        mockData = generateMockGeofences()
        dataUrl = '/api/geofences'
        break
    }

    setMethod('POST')
    setUrl(dataUrl)
    setBody(JSON.stringify(mockData, null, 2))
  }

  const handleHistoryClick = (item: RequestHistoryItem) => {
    setMethod(item.method)
    setUrl(item.url)
    if (item.body) setBody(item.body)
    setResponse({
      status: item.status,
      data: item.response,
    })
  }

  const clearHistory = () => {
    setRequestHistory([])
  }

  return (
    <div className="space-y-6 bg-[#0A0A0F] min-h-screen p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">
          Environnement de test
        </h1>
        <p className="mt-2 text-[#6B6B80]">
          Testez l'API TrackZone avant la mise en production
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Testing Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Environment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#F0F0F5] mb-2">
                  Environnement
                </label>
                <div className="flex gap-2">
                  {(
                    Object.keys(baseUrls) as Environment[]
                  ).map((env) => (
                    <button
                      key={env}
                      onClick={() => setEnvironment(env)}
                      className={cn(
                        'px-4 py-2 rounded-lg font-medium transition-colors',
                        environment === env
                          ? 'bg-[#00E5CC] text-[#0A0A0F]'
                          : 'bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#2A2A3D]'
                      )}
                    >
                      {env.charAt(0).toUpperCase() + env.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-[#F0F0F5]">
                    Mode Sandbox
                  </span>
                </label>
                {sandboxMode && (
                  <Badge variant="secondary">Données fictives</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Request Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Testeur de requête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Method and URL */}
              <div className="flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as HttpMethod)}
                  className="px-3 py-2 border border-[#1F1F2E] rounded-lg font-medium bg-[#12121A]"
                >
                  <option>GET</option>
                  <option>POST</option>
                  <option>PUT</option>
                  <option>DELETE</option>
                </select>
                <Input
                  placeholder="/api/vehicles"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
              </div>

              {/* Body */}
              {method !== 'GET' && (
                <div>
                  <label className="block text-sm font-medium text-[#F0F0F5] mb-2">
                    Body (JSON)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"name": "..."}'
                    className="w-full px-3 py-2 border border-[#1F1F2E] rounded-lg font-mono text-sm h-40 resize-none"
                  />
                </div>
              )}

              {/* Send Button */}
              <Button
                onClick={handleSendRequest}
                disabled={loading || !url}
                className="w-full"
              >
                <Send size={16} className="mr-2" />
                {loading ? 'Envoi...' : 'Envoyer la requête'}
              </Button>
            </CardContent>
          </Card>

          {/* Response */}
          {response && (
            <Card className={
              response.status && response.status >= 200 && response.status < 300
                ? 'border-[#00E5CC] bg-[#12121A]'
                : response.error
                  ? 'border-[#FF4D6A] bg-[#12121A]'
                  : 'border-[#1F1F2E] bg-[#12121A]'
            }>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Réponse</CardTitle>
                  <Badge variant={
                    response.status && response.status >= 200 && response.status < 300
                      ? 'default'
                      : 'destructive'
                  }>
                    {response.status || 'Erreur'} {response.statusText || ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-[#0A0A0F] text-[#00E5CC] p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <code className="whitespace-pre-wrap break-words">
                    {JSON.stringify(response.data || response.error || response, null, 2)}
                  </code>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mock Data Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Générateur de données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGenerateMockData('vehicles')}
              >
                10 Véhicules
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGenerateMockData('drivers')}
              >
                5 Conducteurs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGenerateMockData('geofences')}
              >
                3 Géofences
              </Button>
            </CardContent>
          </Card>

          {/* Request History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historique</CardTitle>
                {requestHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="p-1 hover:bg-[#1A1A25] rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {requestHistory.length === 0 ? (
                <p className="text-sm text-[#6B6B80]">Aucune requête</p>
              ) : (
                requestHistory.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full text-left p-2 hover:bg-[#0A0A0F] rounded-lg border border-[#1F1F2E] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Badge variant={getMethodBadgeVariant(item.method)}>
                        {item.method}
                      </Badge>
                      {item.status && (
                        <span
                          className={cn(
                            'text-xs font-medium',
                            item.status >= 200 && item.status < 300
                              ? 'text-[#00E5CC]'
                              : 'text-[#FF4D6A]'
                          )}
                        >
                          {item.status}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6B80] truncate">
                      {item.url}
                    </p>
                    <p className="text-xs text-[#6B6B80]">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Documentation Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-[#6B6B80]">
                Besoin d'aide pour les endpoints ?
              </p>
              <Button
                variant="outline"
                className="w-full justify-start text-[#00E5CC] hover:text-[#00E5CC]"
                onClick={() =>
                  window.open('/api-docs', '_blank')
                }
              >
                Consulter la documentation
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-[#00E5CC] hover:text-[#00E5CC]"
                onClick={() =>
                  window.open('/sdk-examples', '_blank')
                }
              >
                Voir les exemples SDK
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function getMethodBadgeVariant(
  method: HttpMethod
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
  }
}
