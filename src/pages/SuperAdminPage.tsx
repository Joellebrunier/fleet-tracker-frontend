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
  Download,
  Upload,
  Power,
  HardDrive,
  AlertCircle,
  Info,
  TrendingUp,
  DollarSign,
  Headphones,
  Palette,
  Radio,
  Send,
  Circle,
  AlertOctagon,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { formatDateTime, formatTimeAgo } from '@/lib/utils'

type TabType = 'overview' | 'organizations' | 'users' | 'config' | 'revenue' | 'support' | 'billing' | 'whitelabel' | 'echoes'

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

interface SupportTicket {
  id: string
  organizationId: string
  organizationName: string
  subject: string
  status: 'ouvert' | 'en cours' | 'résolu'
  priority: 'basse' | 'normale' | 'haute' | 'critique'
  createdAt: string
  assignedTo?: string
  lastUpdate: string
}

interface Tracker {
  id: string
  name: string
  status: 'online' | 'offline' | 'maintenance'
  lastCommunication: string
  organizationId: string
  organizationName: string
}

interface BillingRecord {
  id: string
  date: string
  amount: number
  status: 'payée' | 'en attente' | 'échouée'
  description: string
}

interface RevenueStat {
  month: string
  revenue: number
}

// Mock error logs data
const mockErrors = [
  { time: '14:32', level: 'error', message: 'Connexion GPS perdue — Flespi channel #4521', count: 3 },
  { time: '13:15', level: 'warning', message: 'Temps de réponse API > 2s', count: 12 },
  { time: '12:01', level: 'info', message: 'Sauvegarde automatique terminée', count: 1 },
  { time: '10:45', level: 'error', message: 'Échec synchronisation Echoes', count: 5 },
]

// Mock GPS provider health data
const gpsProviderHealth = [
  { name: 'Flespi', status: 'connected', latency: 45 },
  { name: 'Echoes', status: 'degraded', latency: 350 },
  { name: 'KeepTrace', status: 'connected', latency: 89 },
  { name: 'Ubiwan', status: 'disconnected', latency: null },
]

// Mock revenue data
const mockRevenueData: RevenueStat[] = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Fév', revenue: 15800 },
  { month: 'Mar', revenue: 18200 },
  { month: 'Avr', revenue: 21500 },
  { month: 'Mai', revenue: 19800 },
  { month: 'Juin', revenue: 24300 },
  { month: 'Juil', revenue: 28500 },
  { month: 'Aoû', revenue: 31200 },
  { month: 'Sep', revenue: 29800 },
  { month: 'Oct', revenue: 35600 },
  { month: 'Nov', revenue: 38900 },
  { month: 'Déc', revenue: 42100 },
]

// Mock support tickets
const mockSupportTickets: SupportTicket[] = [
  {
    id: 'TK-001',
    organizationId: 'org-1',
    organizationName: 'TechCorp Solutions',
    subject: 'Intégration GPS Flespi ne fonctionne pas',
    status: 'ouvert',
    priority: 'haute',
    createdAt: '2026-04-01T10:30:00Z',
    lastUpdate: '2026-04-01T10:30:00Z',
  },
  {
    id: 'TK-002',
    organizationId: 'org-2',
    organizationName: 'GlobalTech Inc',
    subject: 'Demande d\'accès API pour développement',
    status: 'en cours',
    priority: 'normale',
    createdAt: '2026-03-31T14:15:00Z',
    assignedTo: 'support@trackzone.com',
    lastUpdate: '2026-03-31T16:45:00Z',
  },
  {
    id: 'TK-003',
    organizationId: 'org-3',
    organizationName: 'MobileFleet Tracking',
    subject: 'Mise à jour du plan facturation',
    status: 'résolu',
    priority: 'normale',
    createdAt: '2026-03-28T09:00:00Z',
    assignedTo: 'billing@trackzone.com',
    lastUpdate: '2026-03-30T12:00:00Z',
  },
  {
    id: 'TK-004',
    organizationId: 'org-4',
    organizationName: 'CityLogistics Ltd',
    subject: 'Alertes géofence ne se déclenchent pas',
    status: 'en cours',
    priority: 'critique',
    createdAt: '2026-04-01T08:20:00Z',
    assignedTo: 'support@trackzone.com',
    lastUpdate: '2026-04-01T11:15:00Z',
  },
]

// Mock trackers
const mockTrackers: Tracker[] = [
  {
    id: 'ECH-001',
    name: 'Tracker #12345',
    status: 'online',
    lastCommunication: '2026-04-01T12:15:00Z',
    organizationId: 'org-1',
    organizationName: 'TechCorp Solutions',
  },
  {
    id: 'ECH-002',
    name: 'Tracker #12346',
    status: 'online',
    lastCommunication: '2026-04-01T12:10:00Z',
    organizationId: 'org-1',
    organizationName: 'TechCorp Solutions',
  },
  {
    id: 'ECH-003',
    name: 'Tracker #12347',
    status: 'offline',
    lastCommunication: '2026-04-01T08:30:00Z',
    organizationId: 'org-2',
    organizationName: 'GlobalTech Inc',
  },
  {
    id: 'ECH-004',
    name: 'Tracker #12348',
    status: 'maintenance',
    lastCommunication: '2026-03-31T16:45:00Z',
    organizationId: 'org-3',
    organizationName: 'MobileFleet Tracking',
  },
]

// Mock billing records
const mockBillingRecords: BillingRecord[] = [
  {
    id: 'BIL-001',
    date: '2026-04-01',
    amount: 299,
    status: 'payée',
    description: 'Plan Pro - Avril 2026',
  },
  {
    id: 'BIL-002',
    date: '2026-03-01',
    amount: 299,
    status: 'payée',
    description: 'Plan Pro - Mars 2026',
  },
  {
    id: 'BIL-003',
    date: '2026-02-01',
    amount: 199,
    status: 'payée',
    description: 'Plan Starter - Février 2026',
  },
  {
    id: 'BIL-004',
    date: '2026-01-01',
    amount: 199,
    status: 'payée',
    description: 'Plan Starter - Janvier 2026',
  },
]

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [searchOrg, setSearchOrg] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [orgStatusFilter, setOrgStatusFilter] = useState<'all' | 'active' | 'paused' | 'suspended'>('all')
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all')
  const [suspendedOrgs, setSuspendedOrgs] = useState<Set<string>>(new Set())
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'ouvert' | 'en cours' | 'résolu'>('all')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketReply, setTicketReply] = useState('')
  const [selectedOrgForBilling, setSelectedOrgForBilling] = useState<string>('org-1')
  const [whitelabelOrg, setWhitelabelOrg] = useState<string>('org-1')
  const [trackerStatusFilter, setTrackerStatusFilter] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all')

  // Organization CRUD states
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [orgFormData, setOrgFormData] = useState({ name: '', plan: 'Starter', settings: '' })
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null)

  // User CRUD states
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState({ name: '', email: '', role: 'operator', organizationId: '' })
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  // Revenue and Billing data
  const [revenueData, setRevenueData] = useState<RevenueStat[]>(mockRevenueData)
  const [billingData, setBillingData] = useState<BillingRecord[]>(mockBillingRecords)

  // Config state
  const [configData, setConfigData] = useState({
    gpsUpdateInterval: 30,
    dataRetentionDays: 30,
    maxVehiclesPerOrg: 1000,
    enableRegistration: true,
  })

  // Fetch system health
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['super-admin-health'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_HEALTH || '/api/super-admin/health')
        return (response.data || null) as SystemHealth | null
      } catch { return null }
    },
    refetchInterval: 30000,
    retry: false,
  })

  // Fetch system stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['super-admin-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ROUTES.SUPER_ADMIN_STATS || '/api/super-admin/stats')
        return (response.data || null) as SystemStats | null
      } catch { return null }
    },
    refetchInterval: 60000,
    retry: false,
  })

  // Fetch organizations
  const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const response = await apiClient.get(API_ROUTES.ORGANIZATIONS || '/api/organizations')
        const raw = response.data
        if (Array.isArray(raw)) return raw as Organization[]
        if (raw && Array.isArray(raw.data)) return raw.data as Organization[]
        return [] as Organization[]
      } catch { return [] as Organization[] }
    },
    retry: false,
  })

  // Fetch users
  const { data: users = [], isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/super-admin/users')
        const raw = response.data
        if (Array.isArray(raw)) return raw as User[]
        if (raw && Array.isArray(raw.data)) return raw.data as User[]
        return [] as User[]
      } catch { return [] as User[] }
    },
    retry: false,
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

  // Organization CRUD handlers
  const openOrgModal = (org?: Organization) => {
    if (org) {
      setEditingOrg(org)
      setOrgFormData({ name: org.name, plan: org.plan, settings: '' })
    } else {
      setEditingOrg(null)
      setOrgFormData({ name: '', plan: 'Starter', settings: '' })
    }
    setShowOrgModal(true)
  }

  const closeOrgModal = () => {
    setShowOrgModal(false)
    setEditingOrg(null)
    setOrgFormData({ name: '', plan: 'Starter', settings: '' })
  }

  const saveOrganization = async () => {
    try {
      if (editingOrg) {
        await apiClient.put(`/api/organizations/${editingOrg.id}`, orgFormData)
      } else {
        await apiClient.post('/api/organizations', orgFormData)
      }
      refetchOrgs()
      closeOrgModal()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'organisation:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const deleteOrganization = async (orgId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette organisation ?')) {
      try {
        await apiClient.delete(`/api/organizations/${orgId}`)
        refetchOrgs()
        setOrgToDelete(null)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'organisation:', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  // User CRUD handlers
  const openUserModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setUserFormData({ name: user.name, email: user.email, role: user.role, organizationId: user.organizationId })
    } else {
      setEditingUser(null)
      setUserFormData({ name: '', email: '', role: 'operator', organizationId: organizations[0]?.id || '' })
    }
    setShowUserModal(true)
  }

  const closeUserModal = () => {
    setShowUserModal(false)
    setEditingUser(null)
    setUserFormData({ name: '', email: '', role: 'operator', organizationId: '' })
  }

  const saveUser = async () => {
    try {
      if (editingUser) {
        await apiClient.put(`/api/super-admin/users/${editingUser.id}`, userFormData)
      } else {
        await apiClient.post('/api/super-admin/users', userFormData)
      }
      refetchUsers()
      closeUserModal()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'utilisateur:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const deleteUser = async (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await apiClient.delete(`/api/super-admin/users/${userId}`)
        refetchUsers()
        setUserToDelete(null)
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  // Revenue data handler
  const fetchRevenueData = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/revenue')
      const data = response.data || mockRevenueData
      setRevenueData(Array.isArray(data) ? data : mockRevenueData)
    } catch (error) {
      console.error('Erreur lors de la récupération des revenus:', error)
      setRevenueData(mockRevenueData)
    }
  }

  // Billing data handler
  const fetchBillingData = async () => {
    try {
      const response = await apiClient.get('/api/super-admin/billing')
      const data = response.data || mockBillingRecords
      setBillingData(Array.isArray(data) ? data : mockBillingRecords)
    } catch (error) {
      console.error('Erreur lors de la récupération de la facturation:', error)
      setBillingData(mockBillingRecords)
    }
  }

  // Config save handler
  const saveSystemConfig = async () => {
    try {
      await apiClient.post('/api/super-admin/config', configData)
      alert('Configuration système enregistrée')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error)
      alert('Erreur lors de la sauvegarde de la configuration')
    }
  }

  // Support ticket handlers
  const closeTicket = async () => {
    if (!selectedTicket) return
    try {
      await apiClient.put(`/api/super-admin/tickets/${selectedTicket.id}`, { status: 'résolu' })
      setSelectedTicket(null)
    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error)
    }
  }

  const submitTicketReply = async () => {
    if (!selectedTicket || !ticketReply.trim()) return
    try {
      await apiClient.post(`/api/super-admin/tickets/${selectedTicket.id}/reply`, { message: ticketReply })
      setTicketReply('')
      // Refresh ticket details
      setSelectedTicket(null)
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la réponse:', error)
    }
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

  const toggleOrgSuspend = (orgId: string) => {
    setSuspendedOrgs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orgId)) {
        newSet.delete(orgId)
      } else {
        newSet.add(orgId)
      }
      return newSet
    })
  }

  const handleImportTrackers = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const handleExportTrackers = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const handleImportPlatform = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const handleSyncMetadata = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const handleBackup = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const handleRestore = () => {
    alert('Fonctionnalité en cours de développement')
  }

  const getErrorLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-900'
      case 'warning':
        return 'bg-yellow-100 text-yellow-900'
      case 'info':
        return 'bg-blue-100 text-blue-900'
      default:
        return 'bg-gray-100 text-gray-900'
    }
  }

  const getErrorLevelDot = (level: string) => {
    switch (level) {
      case 'error':
        return <div className="h-3 w-3 rounded-full bg-red-600" />
      case 'warning':
        return <div className="h-3 w-3 rounded-full bg-yellow-600" />
      case 'info':
        return <div className="h-3 w-3 rounded-full bg-blue-600" />
      default:
        return <div className="h-3 w-3 rounded-full bg-gray-600" />
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
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {(['overview', 'organizations', 'users', 'revenue', 'support', 'billing', 'whitelabel', 'echoes', 'config'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'overview' && 'Vue d\'ensemble'}
            {tab === 'organizations' && 'Organisations'}
            {tab === 'users' && 'Utilisateurs'}
            {tab === 'revenue' && 'Revenus'}
            {tab === 'support' && 'Support'}
            {tab === 'billing' && 'Facturation'}
            {tab === 'whitelabel' && 'White Label'}
            {tab === 'echoes' && 'Echoes'}
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

          {/* Connection Health Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Vérifications santé connexion
              </CardTitle>
              <CardDescription>État de connexion des fournisseurs GPS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gpsProviderHealth.map(provider => (
                  <div
                    key={provider.name}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center gap-3">
                      {provider.status === 'connected' && (
                        <>
                          <div className="h-3 w-3 rounded-full bg-green-600" />
                          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                          <span className="text-xs text-green-600">Connecté — {provider.latency}ms</span>
                        </>
                      )}
                      {provider.status === 'degraded' && (
                        <>
                          <div className="h-3 w-3 rounded-full bg-yellow-600" />
                          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                          <span className="text-xs text-yellow-600">Latence élevée — {provider.latency}ms</span>
                        </>
                      )}
                      {provider.status === 'disconnected' && (
                        <>
                          <div className="h-3 w-3 rounded-full bg-red-600" />
                          <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                          <span className="text-xs text-red-600">Déconnecté</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.api?.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Server className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.api?.status || 'down')}`}>
                        Serveur API
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.api?.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.api?.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Réponse : {health?.api?.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Dernière vérif. : {health?.api?.lastCheck ? formatTimeAgo(new Date(health.api.lastCheck)) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.database?.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.database?.status || 'down')}`}>
                        Base de données
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.database?.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.database?.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Réponse : {health?.database?.responseTime}ms
                      </p>
                      <p className="text-xs text-gray-600">
                        Connexions : {health?.database?.connections || 0}
                      </p>
                    </div>
                  </div>

                  {/* GPS Providers Status */}
                  <div className={`rounded-lg p-4 ${getStatusColor(health?.gpsProviders?.status || 'down')}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Wifi className="h-5 w-5" />
                      <p className={`text-sm font-medium ${getStatusTextColor(health?.gpsProviders?.status || 'down')}`}>
                        Fournisseurs GPS
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(health?.gpsProviders?.status || 'down')}
                        <span className="font-semibold text-gray-900 capitalize">
                          {health?.gpsProviders?.status || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        Actifs : {health?.gpsProviders?.activeTrackers || 0}
                      </p>
                      <p className="text-xs text-gray-600">
                        Mis à jour : {health?.gpsProviders?.lastUpdate ? formatTimeAgo(new Date(health.gpsProviders.lastUpdate)) : 'N/A'}
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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openOrgModal()}>
              <Plus className="h-4 w-4" />
              Créer une organisation
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
                    filteredOrganizations.map(org => {
                      const isSuspended = suspendedOrgs.has(org.id)
                      return (
                        <div
                          key={org.id}
                          className="flex flex-col rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{org.name}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                {org.users} utilisateurs • {org.vehicles} véhicules
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Créé {formatTimeAgo(new Date(org.createdAt))} • Dernière activité{' '}
                                {formatTimeAgo(new Date(org.lastActivity))}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={org.plan === 'Pro' || org.plan === 'Enterprise' ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {org.plan}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <div className="flex-1">
                              <p className="text-xs text-gray-600">
                                Facturation : {org.plan} — Prochaine échéance : 01/05/2026
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant={isSuspended ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleOrgSuspend(org.id)}
                                className={isSuspended ? 'gap-1' : 'gap-1'}
                              >
                                {isSuspended ? (
                                  <>
                                    <Power className="h-4 w-4" />
                                    Activer
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4" />
                                    Suspendre
                                  </>
                                )}
                              </Button>
                              <Badge
                                variant={org.status === 'active' && !isSuspended ? 'default' : 'secondary'}
                                className="capitalize"
                              >
                                {isSuspended ? 'Suspendu' : org.status}
                              </Badge>
                              <Button variant="outline" size="sm" className="gap-1" onClick={() => openOrgModal(org)}>
                                <Eye className="h-4 w-4" />
                                Éditer
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:bg-red-50" onClick={() => deleteOrganization(org.id)}>
                                <AlertTriangle className="h-4 w-4" />
                                Supprimer
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
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
            <Button variant="outline" size="sm" className="gap-2" onClick={() => openUserModal()}>
              <Plus className="h-4 w-4" />
              Créer un utilisateur
            </Button>
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
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => openUserModal(user)}>
                            <Eye className="h-4 w-4" />
                            Éditer
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:bg-red-50" onClick={() => deleteUser(user.id)}>
                            <AlertTriangle className="h-4 w-4" />
                            Supprimer
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
                    <Input
                      type="number"
                      value={configData.gpsUpdateInterval}
                      onChange={e => setConfigData({ ...configData, gpsUpdateInterval: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-600 mt-1">en secondes</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Période de conservation des données
                    </label>
                    <Input
                      type="number"
                      value={configData.dataRetentionDays}
                      onChange={e => setConfigData({ ...configData, dataRetentionDays: parseInt(e.target.value) })}
                    />
                    <p className="text-xs text-gray-600 mt-1">en jours</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Véhicules max. par organisation
                    </label>
                    <Input
                      type="number"
                      value={configData.maxVehiclesPerOrg}
                      onChange={e => setConfigData({ ...configData, maxVehiclesPerOrg: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={configData.enableRegistration}
                        onChange={e => setConfigData({ ...configData, enableRegistration: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Activer les nouvelles inscriptions</span>
                    </label>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">À propos</h4>
                  <p className="text-sm text-gray-700">
                    Ces paramètres affectent le comportement global du système pour toutes les organisations.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="gap-2" onClick={saveSystemConfig}>
                    <Settings className="h-4 w-4" />
                    Enregistrer la configuration
                  </Button>
                  <Button variant="outline" onClick={() => setConfigData({
                    gpsUpdateInterval: 30,
                    dataRetentionDays: 30,
                    maxVehiclesPerOrg: 1000,
                    enableRegistration: true,
                  })}>
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import / Export Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import / Export
              </CardTitle>
              <CardDescription>Gérer les traceurs via import/export CSV</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  onClick={handleImportTrackers}
                >
                  <Upload className="h-4 w-4" />
                  Importer des trackers (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  onClick={handleExportTrackers}
                >
                  <Download className="h-4 w-4" />
                  Exporter tous les trackers (CSV)
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  onClick={handleImportPlatform}
                >
                  <Upload className="h-4 w-4" />
                  Importer depuis une plateforme
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  onClick={handleSyncMetadata}
                >
                  <RefreshCw className="h-4 w-4" />
                  Synchroniser les métadonnées
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Logs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Journaux d'erreurs
              </CardTitle>
              <CardDescription>Erreurs et avertissements récents du système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getErrorLevelDot(error.level)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-600">{error.time}</p>
                        <p className="text-sm text-gray-900 truncate">{error.message}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {error.count}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="link"
                className="w-full mt-4 justify-center text-blue-600 hover:text-blue-700"
              >
                Voir tous les journaux
              </Button>
            </CardContent>
          </Card>

          {/* Backup and Restore Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Sauvegarde et restauration
              </CardTitle>
              <CardDescription>Gérer les sauvegardes du système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Dernière sauvegarde :</span> il y a 6 heures
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleBackup}
                  >
                    <HardDrive className="h-4 w-4" />
                    Lancer une sauvegarde
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleRestore}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Restaurer depuis une sauvegarde
                  </Button>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-blue-800">
                      Opération: 0% - Estimation: 5 minutes
                    </p>
                  </div>
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

      {/* REVENUE TAB */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenus mensuels
              </CardTitle>
              <CardDescription>Tendance des revenus sur les 12 derniers mois</CardDescription>
              <Button variant="link" size="sm" onClick={fetchRevenueData} className="mt-2 gap-1">
                <RefreshCw className="h-3 w-3" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                    formatter={(value) => `€${Number(value).toLocaleString()}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Revenu annuel (ARR)</p>
                  <p className="text-3xl font-bold text-gray-900">€342.2K</p>
                  <p className="text-xs text-green-600 font-medium">+12% vs année précédente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Revenu mensuel récurrent</p>
                  <p className="text-3xl font-bold text-gray-900">€28.5K</p>
                  <p className="text-xs text-green-600 font-medium">+18% vs mois dernier</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Taux de croissance</p>
                  <p className="text-3xl font-bold text-gray-900">+3.2%</p>
                  <p className="text-xs text-gray-600 font-medium">Croissance mensuelle</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Organisations actives</p>
                  <p className="text-3xl font-bold text-gray-900">{organizations.length}</p>
                  <p className="text-xs text-gray-600 font-medium">Avec facturation active</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue per Organization Table */}
          <Card>
            <CardHeader>
              <CardTitle>Revenu par organisation</CardTitle>
              <CardDescription>Détail du revenu et du plan par organisation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Organisation</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Plan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Revenu mensuel</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.slice(0, 5).map(org => {
                      const monthlyRevenue = org.plan === 'Enterprise' ? 1299 : org.plan === 'Pro' ? 299 : 99
                      return (
                        <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{org.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{org.plan}</Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">€{monthlyRevenue}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant={org.status === 'active' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {org.status === 'active' ? 'Actif' : org.status === 'paused' ? 'En pause' : 'Suspendu'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUPPORT TICKETS TAB */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Ticket Status Filters */}
          <div className="flex gap-2">
            {(['all', 'ouvert', 'en cours', 'résolu'] as const).map(status => (
              <Button
                key={status}
                variant={ticketStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTicketStatusFilter(status)}
              >
                {status === 'all' ? 'Tous' : status === 'ouvert' ? 'Ouvert' : status === 'en cours' ? 'En cours' : 'Résolu'}
              </Button>
            ))}
          </div>

          {/* Tickets List and Detail */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Tickets List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    Tickets ({mockSupportTickets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mockSupportTickets
                      .filter(t => ticketStatusFilter === 'all' || t.status === ticketStatusFilter)
                      .map(ticket => (
                        <button
                          key={ticket.id}
                          onClick={() => setSelectedTicket(ticket)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedTicket?.id === ticket.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-600">{ticket.id}</p>
                              <p className="text-sm font-medium text-gray-900 truncate">{ticket.subject}</p>
                              <p className="text-xs text-gray-600 mt-1">{ticket.organizationName}</p>
                            </div>
                            <Badge
                              variant={
                                ticket.priority === 'critique'
                                  ? 'destructive'
                                  : ticket.priority === 'haute'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="shrink-0"
                            >
                              {ticket.priority === 'basse' ? 'Basse' : ticket.priority === 'normale' ? 'Normale' : ticket.priority === 'haute' ? 'Haute' : 'Critique'}
                            </Badge>
                          </div>
                        </button>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedTicket.subject}</CardTitle>
                          <CardDescription>{selectedTicket.id}</CardDescription>
                        </div>
                        <Badge
                          variant={
                            selectedTicket.status === 'ouvert'
                              ? 'destructive'
                              : selectedTicket.status === 'en cours'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {selectedTicket.status === 'ouvert' ? 'Ouvert' : selectedTicket.status === 'en cours' ? 'En cours' : 'Résolu'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Organisation</p>
                          <p className="font-medium">{selectedTicket.organizationName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Créé</p>
                          <p className="font-medium">{formatTimeAgo(new Date(selectedTicket.createdAt))}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Assigné à</p>
                          <p className="font-medium">{selectedTicket.assignedTo || 'Non assigné'}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Dernière mise à jour</p>
                          <p className="font-medium">{formatTimeAgo(new Date(selectedTicket.lastUpdate))}</p>
                        </div>
                      </div>
                      {selectedTicket.status !== 'résolu' && (
                        <div className="flex gap-2 mt-4">
                          <select
                            value={selectedTicket.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as 'ouvert' | 'en cours' | 'résolu'
                              const updated = { ...selectedTicket, status: newStatus }
                              setSelectedTicket(updated)
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="ouvert">Ouvert</option>
                            <option value="en cours">En cours</option>
                            <option value="résolu">Résolu</option>
                          </select>
                          <Button size="sm" onClick={closeTicket} className="gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Fermer
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Réponses</p>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Client - 2026-04-01 10:30</p>
                            <p className="text-sm text-gray-900">Nous avons un problème urgent avec l'intégration GPS.</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-1">Support - 2026-04-01 11:00</p>
                            <p className="text-sm text-gray-900">Merci de nous signaler ce problème. Nous enquêtons.</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Ajouter une réponse</p>
                        <textarea
                          value={ticketReply}
                          onChange={e => setTicketReply(e.target.value)}
                          placeholder="Tapez votre réponse..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                        <Button className="mt-2 gap-2" onClick={submitTicketReply}>
                          <Send className="h-4 w-4" />
                          Envoyer la réponse
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex items-center justify-center h-96">
                  <p className="text-gray-500">Sélectionnez un ticket pour voir les détails</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BILLING TAB */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Organization Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une organisation</label>
            <select
              value={selectedOrgForBilling}
              onChange={e => setSelectedOrgForBilling(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Billing Info Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Plan actuel</p>
                  <p className="text-2xl font-bold text-gray-900">Pro</p>
                  <Badge className="w-fit">Actif</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Montant mensuel</p>
                  <p className="text-2xl font-bold text-gray-900">€299</p>
                  <p className="text-xs text-gray-600">Facturé mensuellement</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Prochaine facturation</p>
                  <p className="text-2xl font-bold text-gray-900">01 Mai</p>
                  <p className="text-xs text-gray-600">2026</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Métriques d'utilisation</CardTitle>
              <CardDescription>Utilisation actuelle des ressources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Véhicules suivis</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">847 / 1000</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '84.7%' }}></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Appels API (mois)</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">2.4M / 5M</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '48%' }}></div>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600">Stockage utilisé</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">45.2 GB / 100 GB</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45.2%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Downgrade Options */}
          <Card>
            <CardHeader>
              <CardTitle>Modifier le plan</CardTitle>
              <CardDescription>Changer le plan d'abonnement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">Starter</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">€99</p>
                  <p className="text-xs text-gray-600 mt-1">/mois</p>
                  <Button variant="outline" className="w-full mt-4">
                    Rétrograder
                  </Button>
                </div>
                <div className="rounded-lg border-2 border-blue-600 p-4 bg-blue-50">
                  <p className="font-medium text-gray-900">Pro</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">€299</p>
                  <p className="text-xs text-gray-600 mt-1">/mois</p>
                  <Badge className="w-fit mt-4">Plan actuel</Badge>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="font-medium text-gray-900">Enterprise</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">€1299</p>
                  <p className="text-xs text-gray-600 mt-1">/mois</p>
                  <Button className="w-full mt-4">
                    Passer à Enterprise
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Historique de facturation</CardTitle>
              <CardDescription>Les 12 dernières factures</CardDescription>
              <Button variant="link" size="sm" onClick={fetchBillingData} className="mt-2 gap-1">
                <RefreshCw className="h-3 w-3" />
                Actualiser
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Montant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingData.map(record => (
                      <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{new Date(record.date).toLocaleDateString('fr-FR')}</td>
                        <td className="py-3 px-4">{record.description}</td>
                        <td className="py-3 px-4 font-medium">€{record.amount}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              record.status === 'payée'
                                ? 'default'
                                : record.status === 'en attente'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {record.status === 'payée' ? 'Payée' : record.status === 'en attente' ? 'En attente' : 'Échouée'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WHITE LABEL TAB */}
      {activeTab === 'whitelabel' && (
        <div className="space-y-6">
          {/* Organization Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une organisation</label>
            <select
              value={whitelabelOrg}
              onChange={e => setWhitelabelOrg(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* White Label Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Activation White Label
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">
                  Activer la personnalisation White Label pour cette organisation
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Branding Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options de marque</CardTitle>
              <CardDescription>Personnalisez l'apparence de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Logo personnalisé</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Cliquez pour télécharger votre logo</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG ou SVG - Max 5 MB</p>
                  </div>
                </div>

                {/* Color Pickers */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Couleurs personnalisées</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Couleur primaire</label>
                      <input
                        type="color"
                        defaultValue="#3b82f6"
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Couleur secondaire</label>
                      <input
                        type="color"
                        defaultValue="#8b5cf6"
                        className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Domain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domaine personnalisé</label>
                  <Input
                    type="text"
                    placeholder="app.votresociete.com"
                    defaultValue="trackzone.techcorp.com"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600 mt-2">Configurez les enregistrements DNS pour activer le domaine</p>
                </div>

                {/* Footer Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Texte du pied de page</label>
                  <Input
                    type="text"
                    placeholder="© 2026 Votre entreprise. Tous droits réservés."
                    defaultValue="Propulsé par TrackZone"
                    className="w-full"
                  />
                </div>

                {/* Email Branding */}
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-gray-700">Utiliser le logo dans les e-mails</span>
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="gap-2">
                    <Zap className="h-4 w-4" />
                    Enregistrer les modifications
                  </Button>
                  <Button variant="outline">Aperçu</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="w-24 h-24 rounded-lg bg-white border-2 border-blue-600 flex items-center justify-center mb-4">
                  <span className="text-xs text-gray-500">Logo</span>
                </div>
                <p className="text-sm font-medium text-gray-700 mb-4">Aperçu de votre marque personnalisée</p>
                <p className="text-xs text-gray-600">© 2026 Votre entreprise. Tous droits réservés.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ECHOES INTEGRATION TAB */}
      {activeTab === 'echoes' && (
        <div className="space-y-6">
          {/* Tracker Status Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-green-600 fill-green-600" />
                    <p className="text-sm text-gray-600">En ligne</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">2</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-gray-400 fill-gray-400" />
                    <p className="text-sm text-gray-600">Hors ligne</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                    <p className="text-sm text-gray-600">Maintenance</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">1</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tracker Status Filter */}
          <div className="flex gap-2">
            {(['all', 'online', 'offline', 'maintenance'] as const).map(status => (
              <Button
                key={status}
                variant={trackerStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTrackerStatusFilter(status)}
              >
                {status === 'all' ? 'Tous' : status === 'online' ? 'En ligne' : status === 'offline' ? 'Hors ligne' : 'Maintenance'}
              </Button>
            ))}
          </div>

          {/* Trackers List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Trackers Echoes
              </CardTitle>
              <CardDescription>Gérer les trackers et envoyer des commandes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockTrackers
                  .filter(t => trackerStatusFilter === 'all' || t.status === trackerStatusFilter)
                  .map(tracker => (
                    <div
                      key={tracker.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Circle
                            className={`h-3 w-3 ${
                              tracker.status === 'online'
                                ? 'text-green-600 fill-green-600'
                                : tracker.status === 'offline'
                                ? 'text-gray-400 fill-gray-400'
                                : 'text-yellow-600 fill-yellow-600'
                            }`}
                          />
                          <p className="font-medium text-gray-900">{tracker.name}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>{tracker.organizationName}</span>
                          <span>
                            Dernier contact:{' '}
                            <span className="font-medium">{formatTimeAgo(new Date(tracker.lastCommunication))}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            tracker.status === 'online'
                              ? 'default'
                              : tracker.status === 'offline'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="capitalize"
                        >
                          {tracker.status === 'online' ? 'En ligne' : tracker.status === 'offline' ? 'Hors ligne' : 'Maintenance'}
                        </Badge>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <Zap className="h-3 w-3" />
                          Commandes
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Commands */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes disponibles</CardTitle>
              <CardDescription>Envoyer des commandes aux trackers Echoes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Button variant="outline" className="gap-2 h-auto flex-col justify-start p-4">
                  <Radio className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">Localiser</span>
                  <span className="text-xs text-gray-600">Position GPS immédiate</span>
                </Button>
                <Button variant="outline" className="gap-2 h-auto flex-col justify-start p-4">
                  <Power className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium">Redémarrer</span>
                  <span className="text-xs text-gray-600">Redémarrage du tracker</span>
                </Button>
                <Button variant="outline" className="gap-2 h-auto flex-col justify-start p-4">
                  <AlertOctagon className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium">Diagnostic</span>
                  <span className="text-xs text-gray-600">État et santé du tracker</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                État de la connexion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-2">Serveur Echoes</p>
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 text-green-600 fill-green-600" />
                    <p className="font-medium text-green-600">Connecté</p>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Latence: 42ms</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-600 mb-2">Synchronisation</p>
                  <p className="font-medium text-gray-900">À jour</p>
                  <p className="text-xs text-gray-600 mt-2">Dernière sync: à l'instant</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ORGANIZATION MODAL */}
      {showOrgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingOrg ? 'Éditer organisation' : 'Créer une organisation'}</CardTitle>
              <CardDescription>
                {editingOrg ? 'Modifiez les détails de l\'organisation' : 'Créez une nouvelle organisation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nom</label>
                  <Input
                    value={orgFormData.name}
                    onChange={e => setOrgFormData({ ...orgFormData, name: e.target.value })}
                    placeholder="Nom de l'organisation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Plan</label>
                  <select
                    value={orgFormData.plan}
                    onChange={e => setOrgFormData({ ...orgFormData, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Paramètres</label>
                  <Input
                    value={orgFormData.settings}
                    onChange={e => setOrgFormData({ ...orgFormData, settings: e.target.value })}
                    placeholder="Paramètres additionnels (JSON)"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={closeOrgModal}>
                    Annuler
                  </Button>
                  <Button onClick={saveOrganization}>
                    {editingOrg ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* USER MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingUser ? 'Éditer utilisateur' : 'Créer un utilisateur'}</CardTitle>
              <CardDescription>
                {editingUser ? 'Modifiez les détails de l\'utilisateur' : 'Créez un nouvel utilisateur'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nom</label>
                  <Input
                    value={userFormData.name}
                    onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="Nom complet"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <Input
                    value={userFormData.email}
                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="email@example.com"
                    type="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Rôle</label>
                  <select
                    value={userFormData.role}
                    onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="operator">Opérateur</option>
                    <option value="driver">Conducteur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Organisation</label>
                  <select
                    value={userFormData.organizationId}
                    onChange={e => setUserFormData({ ...userFormData, organizationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">-- Sélectionner une organisation --</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={closeUserModal}>
                    Annuler
                  </Button>
                  <Button onClick={saveUser}>
                    {editingUser ? 'Mettre à jour' : 'Créer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
