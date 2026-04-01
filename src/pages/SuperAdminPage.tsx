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
    org =>
      org.name.toLowerCase().includes(searchOrg.toLowerCase()) ||
      org.id.toLowerCase().includes(searchOrg.toLowerCase())
  )

  const filteredUsers = users.filter(
    user =>
      user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      user.name.toLowerCase().includes(searchUser.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="mt-2 text-gray-600">Super admin only - manage all organizations and users</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshAll}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
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
            {tab === 'overview' && 'Overview'}
            {tab === 'organizations' && 'Organizations'}
            {tab === 'users' && 'Users'}
            {tab === 'config' && 'System Config'}
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
                        <p className="text-sm text-gray-600">Total Users</p>
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
                        <p className="text-sm text-gray-600">Organizations</p>
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
                        <p className="text-sm text-gray-600">Total Vehicles</p>
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
                        <p className="text-sm text-gray-600">Active Trackers</p>
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
                        <p className="text-sm text-gray-600">Active Alerts</p>
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
                System Health
              </CardTitle>
              <CardDescription>Real-time status of critical system components</CardDescription>
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
                        API Server
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
                        Response: {health?.api.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Last check: {health?.api.lastCheck ? formatTimeAgo(new Date(health.api.lastCheck)) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.database.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.database.status || 'down')}`}>
                        Database
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
                        Response: {health?.database.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Connections: {health?.database.connections || 0}
                      </p>
                    </div>
                  </div>

                  {/* GPS Providers Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.gpsProviders.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Wifi className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.gpsProviders.status || 'down')}`}>
                        GPS Providers
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
                        Active: {health?.gpsProviders.activeTrackers || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        Updated: {health?.gpsProviders.lastUpdate ? formatTimeAgo(new Date(health.gpsProviders.lastUpdate)) : 'N/A'}
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
                  System Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="mt-2 text-xl font-semibold text-gray-900">
                      {stats?.uptime ? `${(stats.uptime * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <p className="text-sm text-gray-600">Requests per Second</p>
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
              placeholder="Search by name or ID..."
              value={searchOrg}
              onChange={e => setSearchOrg(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Organization
            </Button>
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
                <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
                <CardDescription>Manage all organizations in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredOrganizations.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No organizations found</p>
                  ) : (
                    filteredOrganizations.map(org => (
                      <div
                        key={org.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-600">
                            {org.plan} Plan • {org.users} users • {org.vehicles} vehicles
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created {formatTimeAgo(new Date(org.createdAt))} • Last activity{' '}
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
                            Manage
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
              placeholder="Search by email or name..."
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              className="flex-1"
            />
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
                <CardTitle>Users ({filteredUsers.length})</CardTitle>
                <CardDescription>All system users and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredUsers.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">No users found</p>
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
                            {user.organizationName} • {user.role} • Joined{' '}
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
                            View
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
                System Configuration
              </CardTitle>
              <CardDescription>Configure global system settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Max GPS Update Interval
                    </label>
                    <Input type="number" placeholder="30" defaultValue="30" />
                    <p className="text-xs text-gray-600 mt-1">in seconds</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Alert Retention Period
                    </label>
                    <Input type="number" placeholder="30" defaultValue="30" />
                    <p className="text-xs text-gray-600 mt-1">in days</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Max Concurrent Connections
                    </label>
                    <Input type="number" placeholder="1000" defaultValue="1000" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email Notification Frequency
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      <option>Immediate</option>
                      <option>Hourly Digest</option>
                      <option>Daily Digest</option>
                      <option>Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Feature Flags</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Real-time GPS tracking</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Automated alerts</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm text-gray-700">Advanced analytics</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">Maintenance mode</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="gap-2">
                    <Settings className="h-4 w-4" />
                    Save Configuration
                  </Button>
                  <Button variant="outline">Reset to Defaults</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Maintenance</CardTitle>
              <CardDescription>Perform system maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Clear Cache
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Rebuild Search Index
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Archive Old Data
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:bg-red-50">
                  Restart Services
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
