'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Settings,
  Users,
  Building2,
  BarChart3,
  Activity,
  Shield,
  Server,
  Database,
  Wifi,
  RefreshCw,
  Search,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'

type TabType = 'overview' | 'organizations' | 'users' | 'config'

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'offline'
  api: {
    status: 'operational' | 'degraded' | 'down'
    responseTime: number
    lastCheck: string
  }
  database: {
    status: 'connected' | 'degraded' | 'disconnected'
    responseTime: number
    connections: number
  }
  gpsProviders: {
    status: 'operational' | 'degraded' | 'down'
    activeTrackers: number
    lastUpdate: string
  }
}

interface SystemStats {
  totalUsers: number
  totalOrganizations: number
  totalVehicles: number
  activeTrackers: number
  activeAlerts: number
  uptime: number
  requestsPerSecond: number
}

interface Organization {
  id: string
  name: string
  plan: string
  vehicles: number
  users: number
  status: 'active' | 'paused' | 'suspended'
  createdAt: string
  lastActivity: string
}

interface User {
  id: string
  email: string
  name: string
  role: string
  organizationId: string
  organizationName: string
  status: 'active' | 'inactive' | 'suspended'
  lastLogin: string
  createdAt: string
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchOrg, setSearchOrg] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [orgStatusFilter, setOrgStatusFilter] = useState<'all' | 'active' | 'paused' | 'suspended'>('all')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')

  // Fetch system health
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['super-admin-health'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_HEALTH || '/api/super-admin/health')
      return response.data as SystemHealth
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch system stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_STATS || '/api/super-admin/stats')
      return response.data as SystemStats
    },
    refetchInterval: 60000, // Refetch every 60 seconds
  })

  // Fetch organizations
  const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.ORGANIZATIONS || '/api/organizations')
      return response.data as Organization[]
    },
  })

  // Fetch users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/super-admin/users')
      return response.data as User[]
    },
  })

  const filteredOrganizations = organizations.filter(
    org => {
      const matchesSearch = org.name.toLowerCase().includes(searchOrg.toLowerCase()) ||
        org.id.toLowerCase().includes(searchOrg.toLowerCase())
      const matchesStatus = orgStatusFilter === 'all' || org.status === orgStatusFilter
      return matchesSearch && matchesStatus
    }
  )

  const filteredUsers = users.filter(
    user => {
      const matchesSearch = user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
        user.name.toLowerCase().includes(searchUser.toLowerCase())
      const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter
      return matchesSearch && matchesRole
    }
  )

  const handleRefreshAll = () => {
    refetchHealth()
    refetchStats()
    refetchOrgs()
    refetchUsers()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'active':
        return 'bg-green-50'
      case 'degraded':
        return 'bg-yellow-50'
      case 'down':
      case 'disconnected':
      case 'suspended':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'active':
        return 'text-green-600'
      case 'degraded':
        return 'text-yellow-600'
      case 'down':
      case 'disconnected':
      case 'suspended':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'connected':
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'down':
      case 'disconnected':
      case 'suspended':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration système</h1>
          <p className="mt-2 text-gray-600">Super admin uniquement — gestion de toutes les organisations et utilisateurs</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['overview', 'organizations', 'users', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Vue d\'ensemble'}
            {tab === 'organizations' && 'Organisations'}
            {tab === 'users' && 'Utilisateurs'}
            {tab === 'config' && 'Configuration'}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Utilisateurs totaux</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600 opacity-20" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Organisations</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalOrganizations || 0}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-green-600 opacity-20" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Véhicules totaux</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.totalVehicles || 0}</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600 opacity-20" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Traceurs actifs</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.activeTrackers || 0}</p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-600 opacity-20" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Alertes actives</p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">{stats?.activeAlerts || 0}</p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Santé du système
              </CardTitle>
              <CardDescription>État en temps réel des composants critiques</CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* API Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.api.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.api.status || 'down')}`}>
                        Serveur API
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.api.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.api.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Réponse : {health?.api.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Dernière vérif. : {health?.api.lastCheck ? formatTimeAgo(new Date(health.api.lastCheck)) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.database.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.database.status || 'down')}`}>
                        Base de données
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.database.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.database.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Réponse : {health?.database.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Connexions : {health?.database.connections || 0}
                      </p>
                    </div>
                  </div>

                  {/* GPS Providers Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.gpsProviders.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Wifi className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.gpsProviders.status || 'down')}`}>
                        Fournisseurs GPS
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.gpsProviders.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.gpsProviders.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Actifs : {health?.gpsProviders.activeTrackers || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        Mis à jour : {health?.gpsProviders.lastUpdate ? formatTimeAgo(new Date(health.gpsProviders.lastUpdate)) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Performance */}
          {statsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Disponibilité</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {stats?.uptime ? `${(stats.uptime * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Requêtes par seconde</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {stats?.requestsPerSecond || 0} RPS
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ORGANIZATIONS TAB */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou ID..."
              value={searchOrg}
              onChange={e => setSearchOrg(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle organisation
            </Button>
          </div>

          <div className="flex gap-2">
            {(['all', 'active', 'paused', 'suspended'] as const).map(status => (
              <Button
                key={status}
                variant={orgStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrgStatusFilter(status)}
              >
                {status === 'all' ? 'Tous' : status === 'active' ? 'Actif' : status === 'paused' ? 'En pause' : 'Suspendu'}
              </Button>
            ))}
          </div>

          {orgsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Organisations ({filteredOrganizations.length})</CardTitle>
                <CardDescription>Gérer toutes les organisations du système</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredOrganizations.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">Aucune organisation trouvée</p>
                  ) : (
                    filteredOrganizations.map(org => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-600">
                            Plan {org.plan} • {org.users} utilisateurs • {org.vehicles} véhicules
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Créé {formatTimeAgo(new Date(org.createdAt))} • Dernière activité{' '}
                            {formatTimeAgo(new Date(org.lastActivity))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={org.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {org.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Gérer
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par email ou nom..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {(['all', 'super_admin', 'admin', 'manager', 'operator', 'driver'] as const).map(role => (
              <Button
                key={role}
                variant={userRoleFilter === role ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserRoleFilter(role)}
              >
                {role === 'all' ? 'Tous' : role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : role === 'operator' ? 'Opérateur' : 'Conducteur'}
              </Button>
            ))}
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
                <CardDescription>Tous les utilisateurs et leurs détails</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">Aucun utilisateur trouvé</p>
                  ) : (
                    filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {user.organizationName} • {user.role} • Inscrit{' '}
                            {formatTimeAgo(new Date(user.createdAt))}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {user.status}
                          </Badge>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Eye className="h-4 w-4" />
                            Voir
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* SYSTEM CONFIG TAB */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration système
              </CardTitle>
              <CardDescription>Configurez les paramètres système globaux</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Intervalle max. de mise à jour GPS
                    </label>
                    <Input type="number" placeholder="30" defaultValue="30" />
                    <p className="text-xs text-gray-600 mt-1">en secondes</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Période de conservation des alertes
                    </label>
                    <Input type="number" placeholder="30" defaultValue="30" />
                    <p className="text-xs text-gray-600 mt-1">en jours</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Connexions simultanées max.
                    </label>
                    <Input type="number" placeholder="1000" defaultValue="1000" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Fréquence des notifications email
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Immédiat</option>
                      <option>Résumé horaire</option>
                      <option>Résumé quotidien</option>
                      <option>Désactivé</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Fonctionnalités</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Suivi GPS en temps réel</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Alertes automatisées</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Analyses avancées</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Mode maintenance</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="gap-2">
                    <Settings className="h-4 w-4" />
                    Enregistrer la configuration
                  </Button>
                  <Button variant="outline">Réinitialiser</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Maintenance système</CardTitle>
              <CardDescription>Effectuer des tâches de maintenance système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Vider le cache
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Reconstruire l'index de recherche
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Archiver les anciennes données
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                  Redémarrer les services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
