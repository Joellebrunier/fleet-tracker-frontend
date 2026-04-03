import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Database, MapPin, Globe, Copy, RefreshCw, Eye, EyeOff, Wifi, Server, User, Bell, Palette, Shield, LogOut, Plus, Trash2, Save, Check, Smartphone, Lock, BarChart3, Mail, AlertCircle, Download, Send, X } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const { theme, setTheme, locale, setLocale } = useUIStore()
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const [isEditing, setIsEditing] = useState(false)

  // Active sessions state
  const [sessions, setSessions] = useState<Array<{
    id: string
    deviceName: string
    ipAddress: string
    lastActive: string
  }>>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Organization state
  const [organization, setOrganization] = useState<{
    name: string
    address: string
    phone: string
  }>({ name: '', address: '', phone: '' })
  const [orgEditing, setOrgEditing] = useState(false)
  const [orgLoading, setOrgLoading] = useState(true)

  // Departments state
  const [departments, setDepartments] = useState<Array<{
    id: string
    name: string
    description?: string
  }>>([])
  const [newDeptName, setNewDeptName] = useState('')
  const [newDeptDesc, setNewDeptDesc] = useState('')
  const [showNewDept, setShowNewDept] = useState(false)
  const [deptsLoading, setDeptsLoading] = useState(true)

  // White label state
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(false)
  const [whiteLabel, setWhiteLabel] = useState({
    logoUrl: '',
    primaryColor: '#000000',
    companyName: '',
    customDomain: '',
  })

  // Unit preferences state
  const [speedUnit, setSpeedUnit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('speedUnit') || 'kmh'
    }
    return 'kmh'
  })
  const [distanceUnit, setDistanceUnit] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('distanceUnit') || 'km'
    }
    return 'km'
  })

  // GPS Provider states
  const [providers, setProviders] = useState({
    flespi: { enabled: false, token: '', channelId: '' },
    echoes: { enabled: false, url: '', privacyKey: '' },
    keeptrace: { enabled: false, apiKey: '' },
    ubiwan: { enabled: false, endpoint: '', credentials: '' },
  })

  // Custom GPS Provider state
  const [customProviders, setCustomProviders] = useState<Array<{
    id?: string
    name: string
    type: 'HTTP' | 'MQTT'
    endpoint: string
    apiKey: string
  }>>([])
  const [showAddCustomProvider, setShowAddCustomProvider] = useState(false)
  const [newCustomProvider, setNewCustomProvider] = useState({
    name: '',
    type: 'HTTP' as 'HTTP' | 'MQTT',
    endpoint: '',
    apiKey: '',
  })
  const [customProviderSaving, setCustomProviderSaving] = useState(false)

  // API Key state
  const [apiKey, setApiKey] = useState('ft_key_' + 'x'.repeat(24))
  const [showApiKey, setShowApiKey] = useState(false)

  // Data Retention state
  const [dataRetention, setDataRetention] = useState('90')

  // Map Defaults state
  const [mapDefaults, setMapDefaults] = useState({
    centerLat: '43.7',
    centerLng: '7.12',
    zoom: '12',
    tileLayer: 'streets',
  })

  // Quiet Hours state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false)
  const [quietHoursStart, setQuietHoursStart] = useState('22:00')
  const [quietHoursEnd, setQuietHoursEnd] = useState('07:00')

  // Session Timeout state
  const [sessionTimeout, setSessionTimeout] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sessionTimeout') || '1h'
    }
    return '1h'
  })

  // Collaborators state
  const [collaborators, setCollaborators] = useState<Array<{
    id: string
    name: string
    email: string
    role: string
    lastActive: string
  }>>([])
  const [collabsLoading, setCollabsLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Opérateur')

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([
    'ABCD-1234-EFGH', 'IJKL-5678-MNOP', 'QRST-9012-UVWX',
    'YZAB-3456-CDEF', 'GHIJ-7890-KLMN', 'OPQR-1234-STUV',
    'WXYZ-5678-ABCD', 'EFGH-9012-IJKL'
  ])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [twoFASaving, setTwoFASaving] = useState(false)

  // IP Restrictions state
  const [ipRestrictionsEnabled, setIpRestrictionsEnabled] = useState(false)
  const [whitelistedIPs, setWhitelistedIPs] = useState<Array<{
    id: string
    ip: string
    description: string
    addedDate: string
  }>>([
    { id: '1', ip: '192.168.1.100', description: 'Bureau principal', addedDate: '2025-01-15' },
    { id: '2', ip: '10.0.0.50', description: 'VPN entreprise', addedDate: '2025-01-10' }
  ])
  const [currentIP, setCurrentIP] = useState('203.0.113.42')
  const [newIPAddress, setNewIPAddress] = useState('')
  const [newIPDescription, setNewIPDescription] = useState('')
  const [ipSaving, setIpSaving] = useState(false)

  // Activity Logs state
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string
    date: string
    action: string
    ip: string
    browser: string
  }>>([
    { id: '1', date: '2025-03-15 14:32:18', action: 'Connexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '2', date: '2025-03-15 10:15:45', action: 'Modification paramètres', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '3', date: '2025-03-14 18:20:30', action: 'Téléchargement rapport', ip: '10.0.0.50', browser: 'Firefox 124.0' },
    { id: '4', date: '2025-03-14 12:45:10', action: 'Création utilisateur', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '5', date: '2025-03-13 16:32:55', action: 'Connexion', ip: '203.0.113.42', browser: 'Safari 18.1' },
    { id: '6', date: '2025-03-13 09:10:20', action: 'Modification profil', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '7', date: '2025-03-12 22:15:40', action: 'Déconnexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '8', date: '2025-03-12 15:42:18', action: 'Export données', ip: '10.0.0.50', browser: 'Firefox 124.0' },
    { id: '9', date: '2025-03-11 11:35:22', action: 'Connexion', ip: '192.168.1.100', browser: 'Chrome 125.0' },
    { id: '10', date: '2025-03-10 14:20:45', action: 'Changement mot de passe', ip: '203.0.113.42', browser: 'Safari 18.1' }
  ])
  const [logStartDate, setLogStartDate] = useState('2025-03-01')
  const [logEndDate, setLogEndDate] = useState('2025-03-15')

  // Pending Invitations state
  const [pendingInvitations, setPendingInvitations] = useState<Array<{
    id: string
    email: string
    role: string
    status: 'En attente' | 'Accepté' | 'Expiré'
    sentDate: string
    expiryDate: string
  }>>([
    { id: '1', email: 'alice.dupont@example.com', role: 'Opérateur', status: 'En attente', sentDate: '2025-03-10', expiryDate: '2025-03-17' },
    { id: '2', email: 'bob.martin@example.com', role: 'Superviseur', status: 'En attente', sentDate: '2025-03-12', expiryDate: '2025-03-19' },
    { id: '3', email: 'carol.bernard@example.com', role: 'Opérateur', status: 'Accepté', sentDate: '2025-03-01', expiryDate: '2025-03-08' }
  ])

  // White Label saving state
  const [whiteLabelSaving, setWhiteLabelSaving] = useState(false)
  const [whiteLabelSaved, setWhiteLabelSaved] = useState(false)

  // Data Retention saving state
  const [dataRetentionSaving, setDataRetentionSaving] = useState(false)
  const [dataRetentionSaved, setDataRetentionSaved] = useState(false)

  // Map Defaults saving state
  const [mapDefaultsSaving, setMapDefaultsSaving] = useState(false)
  const [mapDefaultsSaved, setMapDefaultsSaved] = useState(false)

  // Quiet Hours saving state
  const [quietHoursSaving, setQuietHoursSaving] = useState(false)
  const [quietHoursSaved, setQuietHoursSaved] = useState(false)

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await apiClient.get(API_ROUTES.AUTH_SESSIONS)
        const data = response.data
        setSessions(data.sessions || data || [])
      } catch (error) {
        setSessions([
          {
            id: '1',
            deviceName: 'Session actuelle',
            ipAddress: '—',
            lastActive: new Date().toISOString(),
          },
        ])
      } finally {
        setSessionsLoading(false)
      }
    }
    loadSessions()
  }, [])

  // Load organization data
  useEffect(() => {
    const loadOrganization = async () => {
      if (!organizationId) {
        setOrgLoading(false)
        return
      }
      try {
        const response = await apiClient.get(API_ROUTES.ORGANIZATION(organizationId))
        const data = response.data
        setOrganization({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
        })
      } catch (error) {
        console.error('Failed to load organization:', error)
      } finally {
        setOrgLoading(false)
      }
    }
    loadOrganization()
  }, [organizationId])

  // Load departments
  useEffect(() => {
    const loadDepartments = async () => {
      if (!organizationId) {
        setDeptsLoading(false)
        return
      }
      try {
        const response = await apiClient.get(API_ROUTES.DEPARTMENTS(organizationId))
        const data = response.data
        setDepartments(data.departments || data || [])
      } catch (error) {
        console.error('Failed to load departments:', error)
      } finally {
        setDeptsLoading(false)
      }
    }
    loadDepartments()
  }, [organizationId])

  // Load GPS providers configuration
  useEffect(() => {
    const loadProviders = async () => {
      if (!organizationId) return
      try {
        const response = await apiClient.get(API_ROUTES.GPS_PROVIDERS(organizationId))
        const data = response.data
        if (data && typeof data === 'object') {
          setProviders(prev => ({ ...prev, ...data }))
        }
      } catch {
        // Keep defaults if API not available
      }
    }
    loadProviders()
  }, [organizationId])

  // Load collaborators
  useEffect(() => {
    const loadCollaborators = async () => {
      if (!organizationId) {
        setCollabsLoading(false)
        return
      }
      try {
        const response = await apiClient.get(`/api/organizations/${organizationId}/users`)
        const data = response.data
        setCollaborators(data.users || data || [])
      } catch (error) {
        console.error('Failed to load collaborators:', error)
      } finally {
        setCollabsLoading(false)
      }
    }
    loadCollaborators()
  }, [organizationId])

  const handleProviderToggle = (provider: string) => {
    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider as keyof typeof prev], enabled: !prev[provider as keyof typeof prev].enabled }
    }))
  }

  const handleProviderChange = (provider: string, field: string, value: string) => {
    setProviders(prev => ({
      ...prev,
      [provider]: { ...prev[provider as keyof typeof prev], [field]: value }
    }))
  }

  const handleMapDefaultChange = (field: string, value: string) => {
    setMapDefaults(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveWhiteLabel = async () => {
    if (!organizationId) return
    setWhiteLabelSaving(true)
    try {
      await apiClient.put(API_ROUTES.ORGANIZATION(organizationId), { whiteLabel })
      setWhiteLabelSaved(true)
      setTimeout(() => setWhiteLabelSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save white label:', error)
    } finally {
      setWhiteLabelSaving(false)
    }
  }

  const handleSaveDataRetention = async () => {
    if (!organizationId) return
    setDataRetentionSaving(true)
    try {
      await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), {
        dataRetentionDays: parseInt(dataRetention),
      })
      setDataRetentionSaved(true)
      setTimeout(() => setDataRetentionSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save data retention:', error)
    } finally {
      setDataRetentionSaving(false)
    }
  }

  const handleSaveMapDefaults = async () => {
    setMapDefaultsSaving(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mapDefaults', JSON.stringify(mapDefaults))
      }
      setMapDefaultsSaved(true)
      setTimeout(() => setMapDefaultsSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save map defaults:', error)
    } finally {
      setMapDefaultsSaving(false)
    }
  }

  const handleSaveQuietHours = async () => {
    if (!organizationId) return
    setQuietHoursSaving(true)
    try {
      await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), {
        quietHours: {
          enabled: quietHoursEnabled,
          start: quietHoursStart,
          end: quietHoursEnd,
        },
      })
      setQuietHoursSaved(true)
      setTimeout(() => setQuietHoursSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save quiet hours:', error)
    } finally {
      setQuietHoursSaving(false)
    }
  }

  const handleSessionTimeoutChange = (value: string) => {
    setSessionTimeout(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('sessionTimeout', value)
    }
  }

  const handleInviteCollaborator = async () => {
    if (!organizationId || !inviteEmail.trim()) return
    try {
      await apiClient.post(`/api/organizations/${organizationId}/users/invite`, {
        email: inviteEmail,
        role: inviteRole,
      })
      setInviteEmail('')
      setInviteRole('Opérateur')
      setShowInviteForm(false)
      // Reload collaborators
      const response = await apiClient.get(`/api/organizations/${organizationId}/users`)
      setCollaborators(response.data.users || response.data || [])
    } catch (error) {
      console.error('Failed to invite collaborator:', error)
    }
  }

  const handleDeleteCollaborator = async (userId: string) => {
    if (!organizationId) return
    try {
      await apiClient.delete(`/api/organizations/${organizationId}/users/${userId}`)
      setCollaborators(prev => prev.filter(c => c.id !== userId))
    } catch (error) {
      console.error('Failed to delete collaborator:', error)
    }
  }

  const handleUpdateCollaboratorRole = async (userId: string, newRole: string) => {
    if (!organizationId) return
    try {
      await apiClient.patch(`/api/organizations/${organizationId}/users/${userId}`, {
        role: newRole,
      })
      setCollaborators(prev =>
        prev.map(c => (c.id === userId ? { ...c, role: newRole } : c))
      )
    } catch (error) {
      console.error('Failed to update collaborator role:', error)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
  }

  const regenerateApiKey = () => {
    const newKey = 'ft_key_' + Math.random().toString(36).substr(2, 24)
    setApiKey(newKey)
  }

  // Save GPS providers
  const [providersSaving, setProvidersSaving] = useState(false)
  const [providersSaved, setProvidersSaved] = useState(false)

  const handleSaveProviders = async () => {
    if (!organizationId) return
    setProvidersSaving(true)
    try {
      await apiClient.put(API_ROUTES.GPS_PROVIDERS(organizationId), providers)
      setProvidersSaved(true)
      setTimeout(() => setProvidersSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save GPS providers:', error)
    } finally {
      setProvidersSaving(false)
    }
  }

  const handleAddCustomProvider = async () => {
    if (!organizationId || !newCustomProvider.name.trim() || !newCustomProvider.endpoint.trim() || !newCustomProvider.apiKey.trim()) {
      console.error('Veuillez remplir tous les champs')
      return
    }
    setCustomProviderSaving(true)
    try {
      await apiClient.post(API_ROUTES.GPS_PROVIDERS(organizationId), newCustomProvider)
      setCustomProviders(prev => [...prev, newCustomProvider as any])
      setNewCustomProvider({ name: '', type: 'HTTP', endpoint: '', apiKey: '' })
      setShowAddCustomProvider(false)
    } catch (error) {
      console.error('Failed to add custom provider:', error)
    } finally {
      setCustomProviderSaving(false)
    }
  }

  const handleDeleteCustomProvider = async (providerId: string) => {
    if (!organizationId) return
    try {
      await apiClient.delete(`${API_ROUTES.GPS_PROVIDERS(organizationId)}/${providerId}`)
      setCustomProviders(prev => prev.filter(p => p.id !== providerId))
    } catch (error) {
      console.error('Failed to delete custom provider:', error)
    }
  }

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      await apiClient.delete(API_ROUTES.AUTH_SESSION_DETAIL(sessionId))
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Failed to disconnect session:', error)
    }
  }

  const handleDisconnectAllSessions = async () => {
    try {
      await apiClient.delete(API_ROUTES.AUTH_SESSIONS)
      setSessions([])
    } catch (error) {
      console.error('Failed to disconnect all sessions:', error)
    }
  }

  const handleSaveOrganization = async () => {
    if (!organizationId) return
    try {
      await apiClient.patch(API_ROUTES.ORGANIZATION(organizationId), organization)
      setOrgEditing(false)
    } catch (error) {
      console.error('Failed to save organization:', error)
    }
  }

  const handleAddDepartment = async () => {
    if (!organizationId || !newDeptName.trim()) return
    try {
      const response = await apiClient.post(API_ROUTES.DEPARTMENTS(organizationId), {
        name: newDeptName,
        description: newDeptDesc,
      })
      const data = response.data
      setDepartments(prev => [...prev, data])
      setNewDeptName('')
      setNewDeptDesc('')
      setShowNewDept(false)
    } catch (error) {
      console.error('Failed to create department:', error)
    }
  }

  const handleDeleteDepartment = async (deptId: string) => {
    if (!organizationId) return
    try {
      await apiClient.delete(API_ROUTES.DEPARTMENT_DETAIL(organizationId, deptId))
      setDepartments(prev => prev.filter(d => d.id !== deptId))
    } catch (error) {
      console.error('Failed to delete department:', error)
    }
  }

  const handleSpeedUnitChange = (value: string) => {
    setSpeedUnit(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('speedUnit', value)
    }
  }

  const handleDistanceUnitChange = (value: string) => {
    setDistanceUnit(value)
    if (typeof window !== 'undefined') {
      localStorage.setItem('distanceUnit', value)
    }
  }

  const handleEnable2FA = async () => {
    setShow2FASetup(true)
  }

  const handleDisable2FA = async () => {
    setTwoFactorEnabled(false)
    setShow2FASetup(false)
    setVerificationCode('')
  }

  const handleVerify2FA = () => {
    if (verificationCode.length === 6) {
      setTwoFASaving(true)
      setTimeout(() => {
        setTwoFactorEnabled(true)
        setShowBackupCodes(true)
        setTwoFASaving(false)
        setVerificationCode('')
      }, 1000)
    }
  }

  const handleAddIPAddress = async () => {
    if (!newIPAddress.trim()) return
    const newIP = {
      id: String(Date.now()),
      ip: newIPAddress,
      description: newIPDescription,
      addedDate: new Date().toISOString().split('T')[0]
    }
    setWhitelistedIPs([...whitelistedIPs, newIP])
    setNewIPAddress('')
    setNewIPDescription('')
  }

  const handleRemoveIPAddress = (ipId: string) => {
    setWhitelistedIPs(whitelistedIPs.filter(ip => ip.id !== ipId))
  }

  const handleResendInvitation = (inviteId: string) => {
    console.log('Resending invitation:', inviteId)
  }

  const handleCancelInvitation = (inviteId: string) => {
    setPendingInvitations(prev => prev.filter(inv => inv.id !== inviteId))
  }

  const isAdmin = user?.role === ('ADMIN' as any) || user?.role === ('SUPER_ADMIN' as any) || (user?.role as string) === 'admin' || (user?.role as string) === 'administrator'

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-500">Gérez votre profil et vos préférences</p>
      </div>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Profil
          </CardTitle>
          <CardDescription>Gérez les informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-500">Prénom</label>
            <Input
              type="text"
              value={user?.firstName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Nom</label>
            <Input
              type="text"
              value={user?.lastName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Email</label>
            <Input type="email" value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">Rôle</label>
            <Input type="text" value={user?.role || ''} disabled className="mt-1" />
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full"
            variant={isEditing ? 'default' : 'outline'}
          >
            {isEditing ? 'Enregistrer' : 'Modifier le profil'}
          </Button>
        </CardContent>
      </Card>

      {/* 2FA Authentication Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            Authentification à deux facteurs
          </CardTitle>
          <CardDescription>Sécurisez votre compte avec l'authentification à deux facteurs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-100">
            <div className="flex items-center gap-3">
              <Lock size={18} className={twoFactorEnabled ? 'text-[#22C55E]' : 'text-gray-500'} />
              <div>
                <p className="font-medium text-gray-900">Statut 2FA</p>
                <p className="text-sm text-gray-500">
                  {twoFactorEnabled ? 'Activé' : 'Désactivé'}
                </p>
              </div>
            </div>
            {!twoFactorEnabled ? (
              <Button onClick={handleEnable2FA} className="bg-blue-600 text-white hover:bg-blue-600/80">
                Activer
              </Button>
            ) : (
              <Button onClick={handleDisable2FA} variant="destructive">
                Désactiver
              </Button>
            )}
          </div>

          {show2FASetup && !twoFactorEnabled && (
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-100">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Code QR</p>
                <div className="flex justify-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-600 to-[#FFFFFF] rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-xs text-center">QR Code Placeholder</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">Scannez ce code avec votre application authenticateur</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Code de vérification (6 chiffres)</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <Button
                onClick={handleVerify2FA}
                disabled={verificationCode.length !== 6 || twoFASaving}
                className="w-full"
              >
                {twoFASaving ? 'Vérification...' : 'Vérifier et activer'}
              </Button>
            </div>
          )}

          {twoFactorEnabled && showBackupCodes && (
            <div className="space-y-3 p-4 border border-amber-500 rounded-lg bg-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Codes de sauvegarde</p>
                  <p className="text-xs text-gray-500 mt-1">Conservez ces codes en sécurité. Vous en aurez besoin si vous perdez l'accès à votre appareil.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded-lg">
                {backupCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center gap-2 font-mono text-sm text-gray-900">
                    <span className="flex-shrink-0 text-gray-500">{idx + 1}.</span>
                    <span>{code}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join('\n'))
                }}
                variant="outline"
                className="w-full gap-2"
              >
                <Copy size={16} />
                Copier les codes
              </Button>
              <Button
                onClick={() => setShowBackupCodes(false)}
                className="w-full bg-blue-600 text-white hover:bg-blue-600/80"
              >
                J'ai sauvegardé les codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IP Access Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Restrictions d'accès par IP
          </CardTitle>
          <CardDescription>Contrôlez l'accès à partir d'adresses IP spécifiques</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-100">
            <div>
              <p className="font-medium text-gray-900">Restrictions d'IP activées</p>
              <p className="text-sm text-gray-500">{whitelistedIPs.length} IP autorisée(s)</p>
            </div>
            <input
              type="checkbox"
              checked={ipRestrictionsEnabled}
              onChange={(e) => setIpRestrictionsEnabled(e.target.checked)}
              className="h-4 w-4"
            />
          </div>

          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 mb-2">Votre adresse IP actuelle</p>
            <div className="flex items-center gap-2 font-mono text-gray-900">
              <span className="font-bold">{currentIP}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigator.clipboard.writeText(currentIP)}
                className="text-blue-600 hover:text-blue-600"
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Ajouter une IP à la liste blanche</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                type="text"
                placeholder="192.168.1.100"
                value={newIPAddress}
                onChange={(e) => setNewIPAddress(e.target.value)}
                className="bg-white border-gray-200"
              />
              <Input
                type="text"
                placeholder="Description (ex: Bureau)"
                value={newIPDescription}
                onChange={(e) => setNewIPDescription(e.target.value)}
                className="bg-white border-gray-200"
              />
              <Button
                onClick={handleAddIPAddress}
                disabled={!newIPAddress.trim()}
                className="bg-blue-600 text-white hover:bg-blue-600/80"
              >
                <Plus size={16} />
                Ajouter
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">IPs autorisées</h4>
            {whitelistedIPs.length > 0 ? (
              <div className="space-y-2">
                {whitelistedIPs.map((ip) => (
                  <div key={ip.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-100">
                    <div className="flex-1">
                      <p className="font-mono text-gray-900 font-medium">{ip.ip}</p>
                      <p className="text-xs text-gray-500">{ip.description} • Ajoutée le {ip.addedDate}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveIPAddress(ip.id)}
                      className="text-red-500 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune IP ajoutée pour le moment</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Journal d'activité
          </CardTitle>
          <CardDescription>Historique de vos connexions et actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Du</label>
              <Input
                type="date"
                value={logStartDate}
                onChange={(e) => setLogStartDate(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Au</label>
              <Input
                type="date"
                value={logEndDate}
                onChange={(e) => setLogEndDate(e.target.value)}
                className="bg-white border-gray-200"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Action</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">IP</th>
                  <th className="px-4 py-3 text-left text-gray-500 font-medium">Navigateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-4 py-3 text-gray-900 font-mono text-xs">{log.date}</td>
                    <td className="px-4 py-3 text-gray-900">{log.action}</td>
                    <td className="px-4 py-3 text-gray-900 font-mono text-xs">{log.ip}</td>
                    <td className="px-4 py-3 text-gray-500">{log.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators & Email Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail size={20} />
            Collaborateurs
          </CardTitle>
          <CardDescription>Gérez les membres de votre équipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Invitations en attente</h4>
              <div className="space-y-2">
                {pendingInvitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{invite.email}</p>
                      <p className="text-xs text-gray-500">
                        Rôle: {invite.role} • {invite.status}
                        {invite.status === 'En attente' && ` • Expire le ${invite.expiryDate}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {invite.status === 'En attente' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResendInvitation(invite.id)}
                            className="text-blue-600 hover:text-blue-600"
                          >
                            <Send size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelInvitation(invite.id)}
                            className="text-red-500 hover:text-red-500"
                          >
                            <X size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Invitation Form */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">Inviter par e-mail</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInviteForm(!showInviteForm)}
              >
                {showInviteForm ? <X size={16} /> : <Plus size={16} />}
              </Button>
            </div>

            {showInviteForm && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Adresse email</label>
                  <Input
                    type="email"
                    placeholder="collaborateur@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-white border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Rôle</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                  >
                    <option>Opérateur</option>
                    <option>Superviseur</option>
                    <option>Administrateur</option>
                  </select>
                </div>
                <Button
                  onClick={handleInviteCollaborator}
                  disabled={!inviteEmail.trim()}
                  className="w-full bg-blue-600 text-white hover:bg-blue-600/80"
                >
                  <Send size={16} className="mr-2" />
                  Envoyer l'invitation
                </Button>
              </div>
            )}
          </div>

          {/* Current Collaborators */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Collaborateurs actuels</h4>
            {collabsLoading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : collaborators.length > 0 ? (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-100">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{collab.name}</p>
                      <p className="text-xs text-gray-500">{collab.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={collab.role}
                        onChange={(e) => handleUpdateCollaboratorRole(collab.id, e.target.value)}
                        className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-xs text-gray-900"
                      >
                        <option>Opérateur</option>
                        <option>Superviseur</option>
                        <option>Administrateur</option>
                      </select>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCollaborator(collab.id)}
                        className="text-red-500 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun collaborateur pour le moment</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Organization Profile section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={20} />
            Organisation
          </CardTitle>
          <CardDescription>Gérez les informations de votre organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {orgLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nom de l'organisation</label>
                <Input
                  type="text"
                  value={organization.name}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Adresse</label>
                <Input
                  type="text"
                  value={organization.address}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, address: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Téléphone</label>
                <Input
                  type="text"
                  value={organization.phone}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleSaveOrganization}
                className="w-full"
                variant={orgEditing ? 'default' : 'outline'}
              >
                {orgEditing ? 'Enregistrer' : 'Modifier l\'organisation'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Préférences de notification
          </CardTitle>
          <CardDescription>Configurez comment vous recevez les alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-500">Alertes email</label>
                <p className="text-xs text-gray-500">Recevoir les alertes par email</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-500">Notifications push</label>
                <p className="text-xs text-gray-500">Configurer l'app mobile</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
          </div>

          {/* Quiet Hours Section */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500">Heures silencieuses</label>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            {quietHoursEnabled && (
              <div className="space-y-3 p-3 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-500">Aucune notification ne sera envoyée pendant ces heures</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">De</label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">À</label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full rounded-md border border-gray-200 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveQuietHours}
                  disabled={quietHoursSaving}
                  size="sm"
                  className="w-full gap-2 bg-white hover:bg-gray-50 text-white"
                >
                  {quietHoursSaved ? (
                    <><Check size={14} /> Enregistré</>
                  ) : quietHoursSaving ? (
                    <><RefreshCw size={14} className="animate-spin" /> Enregistrement...</>
                  ) : (
                    <><Save size={14} /> Enregistrer</>
                  )}
                </Button>
              </div>
            )}
          </div>

          <Button className="w-full mt-4">Enregistrer les préférences</Button>
        </CardContent>
      </Card>

      {/* White Label section - admin only */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette size={20} />
              Marque blanche
            </CardTitle>
            <CardDescription>Personnalisez l'apparence pour votre organisation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-500">Activer la marque blanche</label>
              <input
                type="checkbox"
                checked={whiteLabelEnabled}
                onChange={(e) => setWhiteLabelEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            {whiteLabelEnabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">URL du logo</label>
                  <Input
                    type="url"
                    value={whiteLabel.logoUrl}
                    onChange={(e) => setWhiteLabel({...whiteLabel, logoUrl: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom de l'entreprise</label>
                  <Input
                    type="text"
                    value={whiteLabel.companyName}
                    onChange={(e) => setWhiteLabel({...whiteLabel, companyName: e.target.value})}
                    placeholder="Nom de votre entreprise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Couleur primaire</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={whiteLabel.primaryColor}
                      onChange={(e) => setWhiteLabel({...whiteLabel, primaryColor: e.target.value})}
                      className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={whiteLabel.primaryColor}
                      onChange={(e) => setWhiteLabel({...whiteLabel, primaryColor: e.target.value})}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Domaine personnalisé</label>
                  <Input
                    type="text"
                    value={whiteLabel.customDomain}
                    onChange={(e) => setWhiteLabel({...whiteLabel, customDomain: e.target.value})}
                    placeholder="app.votreentreprise.com"
                  />
                </div>

                <Button
                  onClick={handleSaveWhiteLabel}
                  disabled={whiteLabelSaving}
                  className="w-full gap-2 bg-white hover:bg-gray-50 text-white"
                >
                  {whiteLabelSaved ? (
                    <><Check size={16} /> Enregistré</>
                  ) : whiteLabelSaving ? (
                    <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</>
                  ) : (
                    <><Save size={16} /> Enregistrer les paramètres de marque blanche</>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* GPS Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi size={20} />
            Fournisseurs GPS
          </CardTitle>
          <CardDescription>Configurez et activez les fournisseurs de suivi GPS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flespi */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.flespi.enabled ? 'bg-green-500' : 'bg-gray-50'}`} />
                <label className="font-medium text-gray-900">Flespi</label>
              </div>
              <input
                type="checkbox"
                checked={providers.flespi.enabled}
                onChange={() => handleProviderToggle('flespi')}
                className="h-4 w-4"
              />
            </div>
            {providers.flespi.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Token API</label>
                  <Input
                    type="password"
                    placeholder="Entrer le token API Flespi"
                    value={providers.flespi.token}
                    onChange={(e) => handleProviderChange('flespi', 'token', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">ID du canal</label>
                  <Input
                    type="text"
                    placeholder="Entrer l'ID du canal"
                    value={providers.flespi.channelId}
                    onChange={(e) => handleProviderChange('flespi', 'channelId', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Echoes */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.echoes.enabled ? 'bg-green-500' : 'bg-gray-50'}`} />
                <label className="font-medium text-gray-900">Echoes</label>
              </div>
              <input
                type="checkbox"
                checked={providers.echoes.enabled}
                onChange={() => handleProviderToggle('echoes')}
                className="h-4 w-4"
              />
            </div>
            {providers.echoes.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">URL API</label>
                  <Input
                    type="text"
                    placeholder="https://api.echoes.com"
                    value={providers.echoes.url}
                    onChange={(e) => handleProviderChange('echoes', 'url', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Clé de confidentialité</label>
                  <Input
                    type="password"
                    placeholder="Entrer la clé de confidentialité"
                    value={providers.echoes.privacyKey}
                    onChange={(e) => handleProviderChange('echoes', 'privacyKey', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* KeepTrace */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.keeptrace.enabled ? 'bg-green-500' : 'bg-gray-50'}`} />
                <label className="font-medium text-gray-900">KeepTrace</label>
              </div>
              <input
                type="checkbox"
                checked={providers.keeptrace.enabled}
                onChange={() => handleProviderToggle('keeptrace')}
                className="h-4 w-4"
              />
            </div>
            {providers.keeptrace.enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Clé API</label>
                <Input
                  type="password"
                  placeholder="Entrer la clé API KeepTrace"
                  value={providers.keeptrace.apiKey}
                  onChange={(e) => handleProviderChange('keeptrace', 'apiKey', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Ubiwan */}
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.ubiwan.enabled ? 'bg-green-500' : 'bg-gray-50'}`} />
                <label className="font-medium text-gray-900">Ubiwan</label>
              </div>
              <input
                type="checkbox"
                checked={providers.ubiwan.enabled}
                onChange={() => handleProviderToggle('ubiwan')}
                className="h-4 w-4"
              />
            </div>
            {providers.ubiwan.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">URL du point d'accès</label>
                  <Input
                    type="text"
                    placeholder="https://api.ubiwan.com"
                    value={providers.ubiwan.endpoint}
                    onChange={(e) => handleProviderChange('ubiwan', 'endpoint', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Identifiants</label>
                  <Input
                    type="password"
                    placeholder="Entrer les identifiants"
                    value={providers.ubiwan.credentials}
                    onChange={(e) => handleProviderChange('ubiwan', 'credentials', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save GPS Providers Button */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProviders}
              disabled={providersSaving}
              className="gap-2 bg-white hover:bg-gray-50 text-white"
            >
              {providersSaved ? (
                <><Check size={16} /> Enregistré</>
              ) : providersSaving ? (
                <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</>
              ) : (
                <><Save size={16} /> Enregistrer les fournisseurs</>
              )}
            </Button>
          </div>

          {/* Custom GPS Providers Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Fournisseurs personnalisés</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddCustomProvider(!showAddCustomProvider)}
                className="gap-1"
              >
                <Plus size={14} />
                Ajouter un fournisseur personnalisé
              </Button>
            </div>

            {showAddCustomProvider && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-100 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nom du fournisseur</label>
                  <Input
                    type="text"
                    placeholder="Ex: MonFournisseur GPS"
                    value={newCustomProvider.name}
                    onChange={(e) => setNewCustomProvider({ ...newCustomProvider, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Type de connexion</label>
                  <select
                    value={newCustomProvider.type}
                    onChange={(e) => setNewCustomProvider({ ...newCustomProvider, type: e.target.value as 'HTTP' | 'MQTT' })}
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
                  >
                    <option value="HTTP">HTTP / REST</option>
                    <option value="MQTT">MQTT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">URL du point d'accès</label>
                  <Input
                    type="text"
                    placeholder="https://api.example.com/gps"
                    value={newCustomProvider.endpoint}
                    onChange={(e) => setNewCustomProvider({ ...newCustomProvider, endpoint: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Clé API</label>
                  <Input
                    type="password"
                    placeholder="Entrer votre clé API"
                    value={newCustomProvider.apiKey}
                    onChange={(e) => setNewCustomProvider({ ...newCustomProvider, apiKey: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddCustomProvider(false)
                      setNewCustomProvider({ name: '', type: 'HTTP', endpoint: '', apiKey: '' })
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddCustomProvider}
                    disabled={customProviderSaving}
                    className="gap-1"
                  >
                    {customProviderSaving ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            )}

            {customProviders.length > 0 && (
              <div className="space-y-2">
                {customProviders.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-500">{provider.type} • {provider.endpoint}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-500 hover:bg-gray-100"
                      onClick={() => provider.id && handleDeleteCustomProvider(provider.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            Clés API
          </CardTitle>
          <CardDescription>Gérez vos identifiants API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Votre clé API</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                disabled
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="px-3"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyApiKey}
                className="px-3"
              >
                <Copy size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Gardez votre clé API en sécurité. Ne la partagez jamais.</p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={regenerateApiKey}
          >
            <RefreshCw size={16} className="mr-2" />
            Régénérer la clé API
          </Button>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Conservation des données
          </CardTitle>
          <CardDescription>Contrôlez la durée de conservation de l'historique GPS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-3">Période de conservation de l'historique GPS</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 w-full text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              <option value="30">30 jours</option>
              <option value="60">60 jours</option>
              <option value="90">90 jours</option>
              <option value="180">180 jours</option>
              <option value="365">1 an</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Les données plus anciennes que la période sélectionnée seront automatiquement supprimées.
            </p>
          </div>
          <Button
            onClick={handleSaveDataRetention}
            disabled={dataRetentionSaving}
            className="w-full gap-2 bg-white hover:bg-gray-50 text-white"
          >
            {dataRetentionSaved ? (
              <><Check size={16} /> Enregistré</>
            ) : dataRetentionSaving ? (
              <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</>
            ) : (
              <><Save size={16} /> Enregistrer la politique de conservation</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Map Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Paramètres de carte
          </CardTitle>
          <CardDescription>Configurez les paramètres de carte par défaut</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Latitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLat}
                onChange={(e) => handleMapDefaultChange('centerLat', e.target.value)}
                placeholder="43.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Longitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLng}
                onChange={(e) => handleMapDefaultChange('centerLng', e.target.value)}
                placeholder="7.12"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Niveau de zoom par défaut</label>
            <Input
              type="text"
              value={mapDefaults.zoom}
              onChange={(e) => handleMapDefaultChange('zoom', e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Couche de tuiles</label>
            <select
              value={mapDefaults.tileLayer}
              onChange={(e) => handleMapDefaultChange('tileLayer', e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 w-full text-sm font-medium text-gray-500 hover:bg-gray-100"
            >
              <option value="streets">Mapbox Plan (streets-v12)</option>
              <option value="satellite">Mapbox Satellite (satellite-streets-v12)</option>
              <option value="terrain">Mapbox Terrain (outdoors-v12)</option>
              <option value="dark">Mapbox Sombre (dark-v11)</option>
            </select>
          </div>
          <Button
            onClick={handleSaveMapDefaults}
            disabled={mapDefaultsSaving}
            className="w-full gap-2 bg-white hover:bg-gray-50 text-white"
          >
            {mapDefaultsSaved ? (
              <><Check size={16} /> Enregistré</>
            ) : mapDefaultsSaving ? (
              <><RefreshCw size={16} className="animate-spin" /> Enregistrement...</>
            ) : (
              <><Save size={16} /> Enregistrer les paramètres de carte</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">La suppression de votre compte est irréversible. Soyez certain de votre choix.</p>
          <Button variant="destructive" className="w-full">
            Supprimer le compte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
