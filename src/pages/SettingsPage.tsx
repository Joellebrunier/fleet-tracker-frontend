import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useUIStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Key, Database, MapPin, Globe, Copy, RefreshCw, Eye, EyeOff, Wifi, Server, User, Bell, Palette, Shield, LogOut, Plus, Trash2 } from 'lucide-react'

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

  // Load active sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/auth/sessions')
        if (response.ok) {
          const data = await response.json()
          setSessions(data.sessions || [])
        }
      } catch (error) {
        // Fallback to mock data on error
        setSessions([
          {
            id: '1',
            deviceName: 'Chrome sur Windows',
            ipAddress: '192.168.1.100',
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
        const response = await fetch(`/api/organizations/${organizationId}`)
        if (response.ok) {
          const data = await response.json()
          setOrganization({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
          })
        }
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
        const response = await fetch(`/api/organizations/${organizationId}/departments`)
        if (response.ok) {
          const data = await response.json()
          setDepartments(data.departments || [])
        }
      } catch (error) {
        console.error('Failed to load departments:', error)
      } finally {
        setDeptsLoading(false)
      }
    }
    loadDepartments()
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

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
  }

  const regenerateApiKey = () => {
    const newKey = 'ft_key_' + Math.random().toString(36).substr(2, 24)
    setApiKey(newKey)
  }

  const handleDisconnectSession = async (sessionId: string) => {
    try {
      await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Failed to disconnect session:', error)
    }
  }

  const handleDisconnectAllSessions = async () => {
    try {
      await fetch('/api/auth/sessions', { method: 'DELETE' })
      setSessions([])
    } catch (error) {
      console.error('Failed to disconnect all sessions:', error)
    }
  }

  const handleSaveOrganization = async () => {
    if (!organizationId) return
    try {
      await fetch(`/api/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organization),
      })
      setOrgEditing(false)
    } catch (error) {
      console.error('Failed to save organization:', error)
    }
  }

  const handleAddDepartment = async () => {
    if (!organizationId || !newDeptName.trim()) return
    try {
      const response = await fetch(`/api/organizations/${organizationId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDeptName,
          description: newDeptDesc,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setDepartments(prev => [...prev, data])
        setNewDeptName('')
        setNewDeptDesc('')
        setShowNewDept(false)
      }
    } catch (error) {
      console.error('Failed to create department:', error)
    }
  }

  const handleDeleteDepartment = async (deptId: string) => {
    if (!organizationId) return
    try {
      await fetch(`/api/organizations/${organizationId}/departments/${deptId}`, {
        method: 'DELETE',
      })
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

  const isAdmin = user?.role === ('ADMIN' as any) || user?.role === ('SUPER_ADMIN' as any) || (user?.role as string) === 'admin' || (user?.role as string) === 'administrator'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="mt-2 text-gray-600">Gérez votre profil et vos préférences</p>
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
            <label className="block text-sm font-medium text-gray-700">Prénom</label>
            <Input
              type="text"
              value={user?.firstName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <Input
              type="text"
              value={user?.lastName || ''}
              disabled={!isEditing}
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <Input type="email" value={user?.email || ''} disabled className="mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Rôle</label>
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
                <label className="block text-sm font-medium text-gray-700">Nom de l'organisation</label>
                <Input
                  type="text"
                  value={organization.name}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                <Input
                  type="text"
                  value={organization.address}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, address: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                <Input
                  type="tel"
                  value={organization.phone}
                  disabled={!orgEditing}
                  onChange={(e) => setOrganization({...organization, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                {orgEditing ? (
                  <>
                    <Button onClick={handleSaveOrganization} className="flex-1">
                      Enregistrer
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOrgEditing(false)}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setOrgEditing(true)} variant="outline" className="w-full">
                    Modifier l'organisation
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Departments section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server size={20} />
            Départements
          </CardTitle>
          <CardDescription>Gérez les départements de votre organisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {deptsLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : (
            <>
              {departments.length > 0 ? (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                        {dept.description && (
                          <p className="text-xs text-gray-500">{dept.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun département</p>
              )}

              {showNewDept ? (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du département</label>
                    <Input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="Ex: Logistique"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                    <Input
                      type="text"
                      value={newDeptDesc}
                      onChange={(e) => setNewDeptDesc(e.target.value)}
                      placeholder="Description du département"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddDepartment} className="flex-1">
                      Créer
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowNewDept(false)
                        setNewDeptName('')
                        setNewDeptDesc('')
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNewDept(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Ajouter un département
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Security section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Sécurité
          </CardTitle>
          <CardDescription>Gérez la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Authentification à deux facteurs (2FA)</p>
              <p className="text-sm text-gray-500">Ajoutez une couche de sécurité supplémentaire à votre compte</p>
            </div>
            <Button variant="outline">Activer</Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Dernière connexion</p>
              <p className="text-sm text-gray-500">{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Information non disponible'}</p>
            </div>
          </div>
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">Sessions actives</p>
                <p className="text-sm text-gray-500">{sessions.length} session(s) active(s)</p>
              </div>
              {sessions.length > 0 && (
                <Button
                  variant="outline"
                  className="text-red-600"
                  onClick={handleDisconnectAllSessions}
                >
                  Déconnecter tout
                </Button>
              )}
            </div>
            {sessionsLoading ? (
              <p className="text-sm text-gray-500">Chargement...</p>
            ) : sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{session.deviceName}</p>
                      <p className="text-xs text-gray-500">IP: {session.ipAddress}</p>
                      <p className="text-xs text-gray-500">
                        Dernière activité: {new Date(session.lastActive).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDisconnectSession(session.id)}
                    >
                      <LogOut size={16} className="mr-1" />
                      Déconnecter
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune session active</p>
            )}
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Changer le mot de passe</p>
              <p className="text-sm text-gray-500">Mettez à jour votre mot de passe régulièrement</p>
            </div>
            <Button variant="outline">Modifier</Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={20} />
            Préférences
          </CardTitle>
          <CardDescription>Personnalisez votre expérience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Thème</label>
            <div className="flex gap-4">
              {['light', 'dark'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t as 'light' | 'dark')}
                  className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                    theme === t
                      ? 'bg-fleet-tracker-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t === 'light' ? 'Clair' : 'Sombre'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Langue</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Unité de vitesse</label>
            <select
              value={speedUnit}
              onChange={(e) => handleSpeedUnitChange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="kmh">Kilomètres par heure (km/h)</option>
              <option value="mph">Miles par heure (mph)</option>
              <option value="kn">Nœuds (kn)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Unité de distance</label>
            <select
              value={distanceUnit}
              onChange={(e) => handleDistanceUnitChange(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="km">Kilomètres (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </CardTitle>
          <CardDescription>Contrôlez la réception de vos alertes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Notifications par email', key: 'email' },
            { label: 'Notifications push', key: 'push' },
            { label: 'Notifications SMS', key: 'sms' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{item.label}</label>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>
          ))}

          {/* WhatsApp Channel */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                <p className="text-xs text-gray-500">Bientôt disponible</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
          </div>

          {/* Push Mobile Channel */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Push mobile</label>
                <p className="text-xs text-gray-500">Configurez l'app mobile</p>
              </div>
              <input type="checkbox" disabled className="h-4 w-4" />
            </div>
          </div>

          {/* Quiet Hours Section */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Heures silencieuses</label>
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            {quietHoursEnabled && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Aucune notification ne sera envoyée pendant ces heures</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
                    <input
                      type="time"
                      value={quietHoursStart}
                      onChange={(e) => setQuietHoursStart(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">À</label>
                    <input
                      type="time"
                      value={quietHoursEnd}
                      onChange={(e) => setQuietHoursEnd(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL du logo</label>
              <Input
                type="url"
                value={whiteLabel.logoUrl}
                onChange={(e) => setWhiteLabel({...whiteLabel, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
              <Input
                type="text"
                value={whiteLabel.companyName}
                onChange={(e) => setWhiteLabel({...whiteLabel, companyName: e.target.value})}
                placeholder="Nom de votre entreprise"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Couleur primaire</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={whiteLabel.primaryColor}
                  onChange={(e) => setWhiteLabel({...whiteLabel, primaryColor: e.target.value})}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Domaine personnalisé</label>
              <Input
                type="text"
                value={whiteLabel.customDomain}
                onChange={(e) => setWhiteLabel({...whiteLabel, customDomain: e.target.value})}
                placeholder="app.votreentreprise.com"
              />
            </div>

            <Button className="w-full">Enregistrer les paramètres de marque blanche</Button>
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
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.flespi.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token API</label>
                  <Input
                    type="password"
                    placeholder="Entrer le token API Flespi"
                    value={providers.flespi.token}
                    onChange={(e) => handleProviderChange('flespi', 'token', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID du canal</label>
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
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.echoes.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL API</label>
                  <Input
                    type="text"
                    placeholder="https://api.echoes.com"
                    value={providers.echoes.url}
                    onChange={(e) => handleProviderChange('echoes', 'url', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clé de confidentialité</label>
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
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.keeptrace.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
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
          <div className="space-y-3 p-4 border border-gray-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${providers.ubiwan.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL du point d'accès</label>
                  <Input
                    type="text"
                    placeholder="https://api.ubiwan.com"
                    value={providers.ubiwan.endpoint}
                    onChange={(e) => handleProviderChange('ubiwan', 'endpoint', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identifiants</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Votre clé API</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Période de conservation de l'historique GPS</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
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
          <Button className="w-full">Enregistrer la politique de conservation</Button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLat}
                onChange={(e) => handleMapDefaultChange('centerLat', e.target.value)}
                placeholder="43.7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude du centre</label>
              <Input
                type="text"
                value={mapDefaults.centerLng}
                onChange={(e) => handleMapDefaultChange('centerLng', e.target.value)}
                placeholder="7.12"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de zoom par défaut</label>
            <Input
              type="text"
              value={mapDefaults.zoom}
              onChange={(e) => handleMapDefaultChange('zoom', e.target.value)}
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couche de tuiles</label>
            <select
              value={mapDefaults.tileLayer}
              onChange={(e) => handleMapDefaultChange('tileLayer', e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 w-full text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <option value="streets">Mapbox Plan (streets-v12)</option>
              <option value="satellite">Mapbox Satellite (satellite-streets-v12)</option>
              <option value="terrain">Mapbox Terrain (outdoors-v12)</option>
              <option value="dark">Mapbox Sombre (dark-v11)</option>
            </select>
          </div>
          <Button className="w-full">Enregistrer les paramètres de carte</Button>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">La suppression de votre compte est irréversible. Soyez certain de votre choix.</p>
          <Button variant="destructive" className="w-full">
            Supprimer le compte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
