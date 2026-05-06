import { useState } from 'react'
import { RefreshCw, CheckCircle2, AlertTriangle, Clock, Activity, Zap } from 'lucide-react'

interface ApiEndpoint {
  id: string
  name: string
  path: string
  status: 'online' | 'warning' | 'offline'
  lastSync: string
  responseTime: number
  dataFreshness: 'up-to-date' | 'stale' | 'critical'
  recordCount: number
}

const MOCK_FUEL_ENDPOINTS: ApiEndpoint[] = [
  {
    id: '1',
    name: 'API Stations Carburant',
    path: '/api/fuel/stations',
    status: 'online',
    lastSync: new Date(Date.now() - 300000).toISOString(),
    responseTime: 145,
    dataFreshness: 'up-to-date',
    recordCount: 8340,
  },
  {
    id: '2',
    name: 'API Prix Carburant',
    path: '/api/fuel/prices',
    status: 'online',
    lastSync: new Date(Date.now() - 600000).toISOString(),
    responseTime: 89,
    dataFreshness: 'up-to-date',
    recordCount: 12540,
  },
  {
    id: '3',
    name: 'API Transactions Carburant',
    path: '/api/fuel/transactions',
    status: 'online',
    lastSync: new Date(Date.now() - 900000).toISOString(),
    responseTime: 234,
    dataFreshness: 'up-to-date',
    recordCount: 4521,
  },
  {
    id: '4',
    name: 'API Consommation Véhicules',
    path: '/api/fuel/consumption',
    status: 'online',
    lastSync: new Date(Date.now() - 1200000).toISOString(),
    responseTime: 312,
    dataFreshness: 'stale',
    recordCount: 1840,
  },
  {
    id: '5',
    name: 'API Recalculs',
    path: '/api/fuel/recalculations',
    status: 'warning',
    lastSync: new Date(Date.now() - 1800000).toISOString(),
    responseTime: 521,
    dataFreshness: 'stale',
    recordCount: 156,
  },
  {
    id: '6',
    name: 'API Anomalies',
    path: '/api/fuel/anomalies',
    status: 'online',
    lastSync: new Date(Date.now() - 600000).toISOString(),
    responseTime: 178,
    dataFreshness: 'up-to-date',
    recordCount: 47,
  },
  {
    id: '7',
    name: 'API Rapport Carbone',
    path: '/api/fuel/carbon-report',
    status: 'online',
    lastSync: new Date(Date.now() - 3600000).toISOString(),
    responseTime: 445,
    dataFreshness: 'stale',
    recordCount: 18,
  },
  {
    id: '8',
    name: 'API Géolocalisation Stations',
    path: '/api/fuel/locations',
    status: 'offline',
    lastSync: new Date(Date.now() - 86400000).toISOString(),
    responseTime: 0,
    dataFreshness: 'critical',
    recordCount: 0,
  },
]

interface ErrorLog {
  id: string
  timestamp: string
  endpoint: string
  error: string
  statusCode: number
}

const MOCK_ERROR_LOGS: ErrorLog[] = [
  {
    id: 'ERR-001',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    endpoint: 'API Géolocalisation Stations',
    error: 'Connection timeout',
    statusCode: 504,
  },
  {
    id: 'ERR-002',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    endpoint: 'API Recalculs',
    error: 'Database lock contention',
    statusCode: 503,
  },
  {
    id: 'ERR-003',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    endpoint: 'API Consommation Véhicules',
    error: 'Missing required parameter',
    statusCode: 400,
  },
]

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'online':
      return 'text-green-600 bg-green-50'
    case 'warning':
      return 'text-amber-600 bg-amber-50'
    case 'offline':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'online':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
    case 'offline':
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    default:
      return null
  }
}

const getFreshnessColor = (freshness: string): string => {
  switch (freshness) {
    case 'up-to-date':
      return 'bg-green-100 text-green-700'
    case 'stale':
      return 'bg-yellow-100 text-yellow-700'
    case 'critical':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export default function FuelApiDiagnosticsPage() {
  const [syncing, setSyncing] = useState<string | null>(null)
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>(MOCK_FUEL_ENDPOINTS)

  const handleManualSync = (endpointId: string) => {
    setSyncing(endpointId)
    setTimeout(() => {
      setSyncing(null)
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === endpointId ? { ...e, lastSync: new Date().toISOString() } : e
        )
      )
    }, 1500)
  }

  const stats = {
    online: endpoints.filter((e) => e.status === 'online').length,
    warning: endpoints.filter((e) => e.status === 'warning').length,
    offline: endpoints.filter((e) => e.status === 'offline').length,
    totalRecords: endpoints.reduce((sum, e) => sum + e.recordCount, 0),
    avgResponseTime: Math.round(endpoints.filter((e) => e.status !== 'offline').reduce((sum, e) => sum + e.responseTime, 0) / endpoints.filter((e) => e.status !== 'offline').length),
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Diagnostiques API Carburant</h2>
        <p className="text-sm text-gray-500 mt-1">État des connecteurs et synchronisation des données</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{stats.online}</p>
          <p className="text-xs text-gray-500">Endpoints en ligne</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{stats.warning}</p>
          <p className="text-xs text-gray-500">Avertissements</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mb-2" />
          <p className="text-2xl font-bold">{stats.offline}</p>
          <p className="text-xs text-gray-500">Hors ligne</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <Activity className="h-5 w-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{stats.avgResponseTime}ms</p>
          <p className="text-xs text-gray-500">Temps réponse moyen</p>
        </div>
      </div>

      {/* Endpoints status table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            État des endpoints
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nom de l'endpoint</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Chemin d'accès</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Statut</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Temps réponse</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Fraîcheur données</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Enregistrements</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Dernière sync</th>
                <th className="text-center px-6 py-3 font-medium text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {endpoints.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{endpoint.name}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{endpoint.path}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(endpoint.status)}`}>
                      {getStatusIcon(endpoint.status)}
                      {endpoint.status === 'online' ? 'En ligne' : endpoint.status === 'warning' ? 'Avertissement' : 'Hors ligne'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">
                    {endpoint.responseTime > 0 ? `${endpoint.responseTime}ms` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getFreshnessColor(endpoint.dataFreshness)}`}>
                      {endpoint.dataFreshness === 'up-to-date' ? 'À jour' : endpoint.dataFreshness === 'stale' ? 'Obsolète' : 'Critique'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">{endpoint.recordCount.toLocaleString('fr-FR')}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(endpoint.lastSync).toLocaleDateString('fr-FR')} <br />
                    {new Date(endpoint.lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleManualSync(endpoint.id)}
                      disabled={syncing === endpoint.id}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${syncing === endpoint.id ? 'animate-spin' : ''}`} />
                      {syncing === endpoint.id ? 'Sync...' : 'Sync'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Résumé des données</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total des enregistrements synchronisés</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalRecords.toLocaleString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Endpoints avec données à jour</p>
            <p className="text-3xl font-bold text-green-600">
              {endpoints.filter((e) => e.dataFreshness === 'up-to-date').length}/
              <span className="text-lg">{endpoints.length}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Dernière synchronisation globale</p>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(Math.max(...endpoints.map((e) => new Date(e.lastSync).getTime()))).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(Math.max(...endpoints.map((e) => new Date(e.lastSync).getTime()))).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {/* Error log */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Journal des erreurs (24h)
          </h3>
        </div>
        {MOCK_ERROR_LOGS.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {MOCK_ERROR_LOGS.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{log.endpoint}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleDateString('fr-FR')} à {new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="inline-block px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {log.statusCode}
                  </span>
                </div>
                <p className="text-sm text-gray-700 font-mono">{log.error}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Aucune erreur détectée dans les 24 dernières heures</p>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">Informations:</span> Les données sont synchronisées automatiquement toutes les 5-10 minutes. Vous pouvez forcer une synchronisation manuelle en cliquant sur le bouton "Sync" pour chaque endpoint.
        </p>
      </div>
    </div>
  )
}
