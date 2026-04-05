import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { API_ROUTES } from '@/lib/constants'
import { UserRole } from '@/types/user'
import {
  Building2, Plus, Trash2, Save, Key, Truck, ChevronRight,
  Search, Check, X, Loader2, ArrowLeftRight, AlertCircle, RefreshCw
} from 'lucide-react'

type TabType = 'sub-clients' | 'providers' | 'trackers'

interface SubClient {
  id: string
  name: string
  slug: string
  isActive: boolean
  parentOrganizationId: string
  children?: SubClient[]
  createdAt: string
}

interface ProviderCred {
  id: string
  provider: string
  credentials: Record<string, string>
  isActive: boolean
  label?: string
  lastSyncAt?: string
  lastError?: string
}

interface Vehicle {
  id: string
  name: string
  plate: string
  organizationId: string
  status: string
  currentLat?: number
  currentLng?: number
  metadata?: Record<string, any>
}

const PROVIDER_FIELDS: Record<string, { label: string; fields: { key: string; label: string; type?: string }[] }> = {
  FLESPI: {
    label: 'Flespi',
    fields: [{ key: 'token', label: 'Token API' }],
  },
  ECHOES: {
    label: 'Echoes',
    fields: [
      { key: 'apiUrl', label: 'URL API' },
      { key: 'accountId', label: 'Account ID' },
      { key: 'apiKey', label: 'Clé API' },
    ],
  },
  KEEPTRACE: {
    label: 'KeepTrace',
    fields: [
      { key: 'apiUrl', label: 'URL API' },
      { key: 'apiKey', label: 'Clé API' },
    ],
  },
  UBIWAN: {
    label: 'Ubiwan',
    fields: [
      { key: 'apiUrl', label: 'URL API' },
      { key: 'username', label: 'Utilisateur' },
      { key: 'password', label: 'Mot de passe (MD5)', type: 'password' },
      { key: 'license', label: 'Licence' },
      { key: 'serverKey', label: 'Server Key' },
    ],
  },
}

export default function OrganizationAdminPage() {
  const user = useAuthStore((s) => s.user)
  const orgId = user?.organizationId || ''
  const [activeTab, setActiveTab] = useState<TabType>('sub-clients')

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'sub-clients', label: 'Sous-clients', icon: Building2 },
    { id: 'providers', label: 'Fournisseurs GPS', icon: Key },
    { id: 'trackers', label: 'Affectation Trackeurs', icon: Truck },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration Organisation</h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos sous-clients, fournisseurs GPS et affectation de trackeurs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'sub-clients' && <SubClientsTab orgId={orgId} />}
      {activeTab === 'providers' && <ProvidersTab orgId={orgId} />}
      {activeTab === 'trackers' && <TrackersTab orgId={orgId} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-CLIENTS TAB
// ═══════════════════════════════════════════════════════════════════════════

function SubClientsTab({ orgId }: { orgId: string }) {
  const [subClients, setSubClients] = useState<SubClient[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchSubClients = useCallback(async () => {
    try {
      setLoading(true)
      const resp = await apiClient.get(API_ROUTES.SUB_CLIENTS(orgId))
      const data = (resp.data as any)?.data || resp.data || []
      setSubClients(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching sub-clients:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { fetchSubClients() }, [fetchSubClients])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const slug = newSlug.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
      await apiClient.post(API_ROUTES.SUB_CLIENTS(orgId), { name: newName.trim(), slug })
      setNewName('')
      setNewSlug('')
      setShowCreate(false)
      await fetchSubClients()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Sous-clients</h2>
          <p className="text-sm text-gray-500">{subClients.length} sous-client(s)</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Nouveau sous-client
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="p-5 border-b border-gray-100 bg-blue-50/50">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Transport Martin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Slug (optionnel)</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="transport-martin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Créer
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewName(''); setNewSlug('') }}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : subClients.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucun sous-client</p>
          <p className="text-sm mt-1">Créez votre premier sous-client pour commencer à organiser vos trackeurs.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {subClients.map((sc) => (
            <div key={sc.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{sc.name}</p>
                  <p className="text-xs text-gray-500">{sc.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  sc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {sc.isActive ? 'Actif' : 'Inactif'}
                </span>
                {sc.children && sc.children.length > 0 && (
                  <span className="text-xs text-gray-400">{sc.children.length} sous-client(s)</span>
                )}
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PROVIDERS TAB
// ═══════════════════════════════════════════════════════════════════════════

function ProvidersTab({ orgId }: { orgId: string }) {
  const [credentials, setCredentials] = useState<ProviderCred[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [formLabel, setFormLabel] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchCredentials = useCallback(async () => {
    try {
      setLoading(true)
      const resp = await apiClient.get(API_ROUTES.PROVIDER_CREDENTIALS(orgId))
      const data = (resp.data as any)?.data || resp.data || []
      setCredentials(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching credentials:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { fetchCredentials() }, [fetchCredentials])

  const handleSave = async (provider: string) => {
    setSaving(true)
    try {
      await apiClient.post(API_ROUTES.PROVIDER_CREDENTIALS(orgId), {
        provider,
        credentials: formData,
        label: formLabel || undefined,
      })
      setEditingProvider(null)
      setFormData({})
      setFormLabel('')
      await fetchCredentials()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider: string) => {
    if (!confirm(`Supprimer les credentials ${provider} ?`)) return
    try {
      await apiClient.delete(API_ROUTES.PROVIDER_CREDENTIAL_DELETE(orgId, provider))
      await fetchCredentials()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const startEdit = (provider: string) => {
    const existing = credentials.find((c) => c.provider === provider)
    setEditingProvider(provider)
    setFormData(existing?.credentials || {})
    setFormLabel(existing?.label || '')
  }

  return (
    <div className="space-y-4">
      {Object.entries(PROVIDER_FIELDS).map(([providerKey, config]) => {
        const existing = credentials.find((c) => c.provider === providerKey)
        const isEditing = editingProvider === providerKey

        return (
          <div key={providerKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  existing?.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Key size={16} className={existing?.isActive ? 'text-green-600' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{config.label}</h3>
                  {existing ? (
                    <p className="text-xs text-green-600 font-medium">Configuré{existing.label ? ` — ${existing.label}` : ''}</p>
                  ) : (
                    <p className="text-xs text-gray-400">Non configuré</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {existing?.lastError && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Erreur
                  </span>
                )}
                {existing?.lastSyncAt && (
                  <span className="text-xs text-gray-400">
                    Sync: {new Date(existing.lastSyncAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {!isEditing && (
                  <button
                    onClick={() => startEdit(providerKey)}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {existing ? 'Modifier' : 'Configurer'}
                  </button>
                )}
                {existing && !isEditing && (
                  <button
                    onClick={() => handleDelete(providerKey)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div className="p-4 bg-gray-50/50 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Label (optionnel)</label>
                  <input
                    type="text"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder={`Ex: ${config.label} Production`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {config.fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium text-gray-700 mb-1">{field.label}</label>
                      <input
                        type={field.type || 'text'}
                        value={formData[field.key] || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.label}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => { setEditingProvider(null); setFormData({}); setFormLabel('') }}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleSave(providerKey)}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TRACKERS ASSIGNMENT TAB
// ═══════════════════════════════════════════════════════════════════════════

function TrackersTab({ orgId }: { orgId: string }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [subClients, setSubClients] = useState<SubClient[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [targetOrgId, setTargetOrgId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOrg, setFilterOrg] = useState<string>('all')

  // Fetch accessible org IDs and their vehicles
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch sub-clients
      const scResp = await apiClient.get(API_ROUTES.SUB_CLIENTS(orgId))
      const scData = (scResp.data as any)?.data || scResp.data || []
      setSubClients(Array.isArray(scData) ? scData : [])

      // Fetch accessible org IDs
      const idsResp = await apiClient.get(API_ROUTES.ORGANIZATION_ACCESSIBLE_IDS(orgId))
      const accessibleIds: string[] = (idsResp.data as any)?.data || idsResp.data || [orgId]

      // Fetch vehicles for all accessible orgs
      const allVehicles: Vehicle[] = []
      for (const oid of accessibleIds) {
        try {
          const vResp = await apiClient.get(API_ROUTES.VEHICLES(oid) + '?limit=500')
          const vData = (vResp.data as any)?.data?.data || (vResp.data as any)?.data || []
          if (Array.isArray(vData)) {
            allVehicles.push(...vData)
          }
        } catch {}
      }
      setVehicles(allVehicles)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleSelect = (id: string) => {
    setSelectedVehicles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    const filtered = getFilteredVehicles()
    if (selectedVehicles.size === filtered.length) {
      setSelectedVehicles(new Set())
    } else {
      setSelectedVehicles(new Set(filtered.map((v) => v.id)))
    }
  }

  const handleBulkAssign = async () => {
    if (selectedVehicles.size === 0 || !targetOrgId) return
    setAssigning(true)
    try {
      await apiClient.post(API_ROUTES.BULK_ASSIGN_VEHICLES(orgId), {
        vehicleIds: Array.from(selectedVehicles),
        targetOrganizationId: targetOrgId,
      })
      setSelectedVehicles(new Set())
      setTargetOrgId('')
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de l\'affectation')
    } finally {
      setAssigning(false)
    }
  }

  const handleBulkUnassign = async () => {
    if (selectedVehicles.size === 0) return
    setAssigning(true)
    try {
      await apiClient.post(API_ROUTES.BULK_UNASSIGN_VEHICLES(orgId), {
        vehicleIds: Array.from(selectedVehicles),
      })
      setSelectedVehicles(new Set())
      await fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur')
    } finally {
      setAssigning(false)
    }
  }

  const getFilteredVehicles = () => {
    let filtered = vehicles
    if (filterOrg !== 'all') {
      filtered = filtered.filter((v) => v.organizationId === filterOrg)
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.plate.toLowerCase().includes(q)
      )
    }
    return filtered
  }

  const filteredVehicles = getFilteredVehicles()

  const getOrgName = (oid: string) => {
    if (oid === orgId) return 'Mon organisation'
    const sc = subClients.find((s) => s.id === oid)
    return sc?.name || oid.slice(0, 8) + '...'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header with actions */}
      <div className="p-5 border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Affectation des trackeurs</h2>
            <p className="text-sm text-gray-500">{vehicles.length} véhicule(s) au total</p>
          </div>
          <button onClick={fetchData} className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou plaque..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Toutes les organisations</option>
            <option value={orgId}>Mon organisation</option>
            {subClients.map((sc) => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>
        </div>

        {/* Bulk action bar */}
        {selectedVehicles.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-700">
              {selectedVehicles.size} véhicule(s) sélectionné(s)
            </span>
            <div className="flex-1" />
            <select
              value={targetOrgId}
              onChange={(e) => setTargetOrgId(e.target.value)}
              className="px-3 py-1.5 border border-blue-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Affecter à...</option>
              {subClients.map((sc) => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
            <button
              onClick={handleBulkAssign}
              disabled={assigning || !targetOrgId}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {assigning ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
              Affecter
            </button>
            <button
              onClick={handleBulkUnassign}
              disabled={assigning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Rappeler
            </button>
          </div>
        )}
      </div>

      {/* Vehicle list */}
      {loading ? (
        <div className="p-10 flex justify-center">
          <Loader2 size={24} className="animate-spin text-blue-600" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-10 text-center text-gray-500">
          <Truck size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Aucun véhicule trouvé</p>
        </div>
      ) : (
        <div>
          {/* Select all header */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
            <input
              type="checkbox"
              checked={selectedVehicles.size === filteredVehicles.length && filteredVehicles.length > 0}
              onChange={selectAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="flex-1">Véhicule</span>
            <span className="w-32">Plaque</span>
            <span className="w-40">Organisation</span>
            <span className="w-20 text-center">Statut</span>
          </div>

          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {filteredVehicles.map((v) => (
              <div
                key={v.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                  selectedVehicles.has(v.id) ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => toggleSelect(v.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedVehicles.has(v.id)}
                  onChange={() => toggleSelect(v.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{v.name}</p>
                </div>
                <span className="w-32 text-sm text-gray-600 font-mono">{v.plate}</span>
                <span className="w-40 text-xs text-gray-500 truncate">
                  {getOrgName(v.organizationId)}
                </span>
                <div className="w-20 flex justify-center">
                  <span className={`inline-flex h-2 w-2 rounded-full ${
                    v.status === 'active' || v.status === 'ACTIVE'
                      ? v.currentLat ? 'bg-green-500' : 'bg-yellow-500'
                      : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
