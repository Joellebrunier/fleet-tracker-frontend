'use client';

import React, { useState } from 'react';
import {
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  Server,
  Network,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

type EndpointStatus = 'online' | 'degraded' | 'offline';

interface Endpoint {
  id: string;
  name: string;
  method: string;
  status: EndpointStatus;
  latency: number;
  lastCheck: string;
  uptime: number;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  endpoint: string;
  statusCode: number;
  message: string;
}

interface SystemMetrics {
  apiUptime: number;
  avgLatency: number;
  requestsPerMin: number;
  errorRate: number;
  wsConnected: boolean;
  dbConnected: boolean;
}

export default function ApiDiagnosticsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | EndpointStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTestingEndpoints, setIsTestingEndpoints] = useState(false);
  const [testProgress, setTestProgress] = useState(0);

  const mockEndpoints: Endpoint[] = [
    {
      id: '1',
      name: 'Récupérer tous les véhicules',
      method: 'GET',
      status: 'online',
      latency: 145,
      lastCheck: '2 secondes',
      uptime: 99.98,
    },
    {
      id: '2',
      name: 'Position actuelle du véhicule',
      method: 'GET',
      status: 'online',
      latency: 89,
      lastCheck: '1 seconde',
      uptime: 99.99,
    },
    {
      id: '3',
      name: 'Créer une alerte',
      method: 'POST',
      status: 'online',
      latency: 234,
      lastCheck: '5 secondes',
      uptime: 99.95,
    },
    {
      id: '4',
      name: 'Historique des trajets',
      method: 'GET',
      status: 'degraded',
      latency: 892,
      lastCheck: '3 secondes',
      uptime: 98.5,
    },
    {
      id: '5',
      name: 'Données de carburant',
      method: 'GET',
      status: 'online',
      latency: 267,
      lastCheck: '4 secondes',
      uptime: 99.91,
    },
    {
      id: '6',
      name: 'Gestion des chauffeurs',
      method: 'GET',
      status: 'online',
      latency: 156,
      lastCheck: '2 secondes',
      uptime: 99.87,
    },
    {
      id: '7',
      name: 'Configuration des géobarrières',
      method: 'POST',
      status: 'online',
      latency: 345,
      lastCheck: '6 secondes',
      uptime: 99.82,
    },
    {
      id: '8',
      name: 'Événements de dépassement de vitesse',
      method: 'GET',
      status: 'online',
      latency: 198,
      lastCheck: '2 secondes',
      uptime: 99.94,
    },
    {
      id: '9',
      name: 'Statistiques de consommation',
      method: 'GET',
      status: 'degraded',
      latency: 1234,
      lastCheck: '8 secondes',
      uptime: 97.2,
    },
    {
      id: '10',
      name: 'Authentification',
      method: 'POST',
      status: 'online',
      latency: 245,
      lastCheck: '1 seconde',
      uptime: 99.99,
    },
    {
      id: '11',
      name: 'Renouvellement des tokens',
      method: 'POST',
      status: 'online',
      latency: 123,
      lastCheck: '3 secondes',
      uptime: 99.97,
    },
    {
      id: '12',
      name: 'Gestion des permissions',
      method: 'GET',
      status: 'online',
      latency: 167,
      lastCheck: '4 secondes',
      uptime: 99.93,
    },
    {
      id: '13',
      name: 'Alertes de maintenance',
      method: 'GET',
      status: 'online',
      latency: 234,
      lastCheck: '5 secondes',
      uptime: 99.88,
    },
    {
      id: '14',
      name: 'Exportation des rapports',
      method: 'POST',
      status: 'online',
      latency: 2156,
      lastCheck: '30 secondes',
      uptime: 99.6,
    },
    {
      id: '15',
      name: 'Configuration des notifications',
      method: 'PUT',
      status: 'online',
      latency: 178,
      lastCheck: '3 secondes',
      uptime: 99.92,
    },
    {
      id: '16',
      name: 'Synchronisation SIM',
      method: 'GET',
      status: 'offline',
      latency: 0,
      lastCheck: '45 secondes',
      uptime: 95.1,
    },
    {
      id: '17',
      name: 'Téléchargement de données',
      method: 'GET',
      status: 'online',
      latency: 456,
      lastCheck: '10 secondes',
      uptime: 99.71,
    },
    {
      id: '18',
      name: 'Calcul des anomalies carburant',
      method: 'POST',
      status: 'online',
      latency: 789,
      lastCheck: '15 secondes',
      uptime: 99.65,
    },
  ];

  const mockErrorLogs: ErrorLog[] = [
    {
      id: '1',
      timestamp: '2026-05-06 14:23:45',
      endpoint: 'Synchronisation SIM',
      statusCode: 503,
      message: 'Service temporairement indisponible',
    },
    {
      id: '2',
      timestamp: '2026-05-06 14:18:12',
      endpoint: 'Historique des trajets',
      statusCode: 429,
      message: 'Limite de taux dépassée',
    },
    {
      id: '3',
      timestamp: '2026-05-06 14:12:33',
      endpoint: 'Statistiques de consommation',
      statusCode: 500,
      message: 'Erreur interne du serveur - Timeout base de données',
    },
  ];

  const mockMetrics: SystemMetrics = {
    apiUptime: 99.72,
    avgLatency: 412,
    requestsPerMin: 18450,
    errorRate: 0.28,
    wsConnected: true,
    dbConnected: true,
  };

  const handleTestEndpoints = () => {
    setIsTestingEndpoints(true);
    setTestProgress(0);

    const interval = setInterval(() => {
      setTestProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsTestingEndpoints(false), 1000);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
  };

  const filteredEndpoints = mockEndpoints.filter((endpoint) => {
    const matchesStatus = statusFilter === 'all' || endpoint.status === statusFilter;
    const matchesSearch =
      endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: EndpointStatus) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
    }
  };

  const getStatusBgColor = (status: EndpointStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-100';
      case 'degraded':
        return 'bg-yellow-100';
      case 'offline':
        return 'bg-red-100';
    }
  };

  const getStatusLabel = (status: EndpointStatus) => {
    switch (status) {
      case 'online':
        return 'En ligne';
      case 'degraded':
        return 'Dégradé';
      case 'offline':
        return 'Hors ligne';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Diagnostics API
              </h1>
              <p className="text-gray-600 mt-1">
                Surveillance en temps réel de la santé de vos services
              </p>
            </div>
            <button
              onClick={handleTestEndpoints}
              disabled={isTestingEndpoints}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw className={`h-5 w-5 ${isTestingEndpoints ? 'animate-spin' : ''}`} />
              Tester tous les endpoints
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Test Progress */}
        {isTestingEndpoints && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  Test en cours...
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(testProgress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                  style={{ width: `${testProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Disponibilité API
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockMetrics.apiUptime.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Latence moyenne
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockMetrics.avgLatency}ms
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Requêtes/min
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockMetrics.requestsPerMin.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Taux d'erreurs
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {mockMetrics.errorRate.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-gray-900">
                  WebSocket connecté
                </span>
              </div>
              <span className="text-sm text-green-600 font-semibold">
                Actif
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-gray-900">
                  Base de données
                </span>
              </div>
              <span className="text-sm text-green-600 font-semibold">
                Connectée
              </span>
            </div>
          </div>
        </div>

        {/* Endpoints Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                État des endpoints
              </h2>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Rechercher un endpoint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
                    Filtrer
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none transition z-10">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100"
                    >
                      Tous les états
                    </button>
                    <button
                      onClick={() => setStatusFilter('online')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100"
                    >
                      En ligne
                    </button>
                    <button
                      onClick={() => setStatusFilter('degraded')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700 border-b border-gray-100"
                    >
                      Dégradé
                    </button>
                    <button
                      onClick={() => setStatusFilter('offline')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                    >
                      Hors ligne
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Méthode
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    État
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Latence (ms)
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Dernier vérification
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Disponibilité
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEndpoints.map((endpoint) => (
                  <tr
                    key={endpoint.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {endpoint.name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded font-mono text-xs">
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            endpoint.status === 'online'
                              ? 'bg-green-500 animate-pulse'
                              : endpoint.status === 'degraded'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${getStatusColor(
                            endpoint.status
                          )}`}
                        >
                          {getStatusLabel(endpoint.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {endpoint.latency}ms
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {endpoint.lastCheck}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              endpoint.uptime >= 99
                                ? 'bg-green-500'
                                : endpoint.uptime >= 98
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${endpoint.uptime}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10">
                          {endpoint.uptime.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Error Logs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              Erreurs récentes
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {mockErrorLogs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {log.endpoint}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-mono text-sm">
                      {log.statusCode}
                    </span>
                    <p className="text-xs text-gray-500 mt-2">
                      {log.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
