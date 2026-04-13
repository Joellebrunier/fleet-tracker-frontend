import { useState, useMemo } from 'react'
import { useVehicles } from '@/hooks/useVehicles'
import { useAuthStore } from '@/stores/authStore'
import {
  AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Search, Filter,
  ChevronDown, Eye, Bell, Shield, Car, Navigation, RefreshCw, History,
  Building2, Phone, Mail, Globe, ArrowUpDown, MoreHorizontal
} from 'lucide-react'

// Mock impound lot locations (fourrières) - in production these would come from an API
const FOURRIERES_DB = [
  { id: 'f1', name: 'Fourrière de Paris - Pantin', address: '14 Rue Raymond Queneau, 93500 Pantin', lat: 48.8943, lng: 2.4075, phone: '01 49 15 36 00', capacity: 200, type: 'municipal' },
  { id: 'f2', name: 'Fourrière de Paris - Bonneuil', address: 'Rue Robespierre, 94380 Bonneuil-sur-Marne', lat: 48.7723, lng: 2.4896, phone: '01 45 13 86 50', capacity: 300, type: 'municipal' },
  { id: 'f3', name: 'Fourrière Préfecture de Lyon', address: '7 Rue de Gerland, 69007 Lyon', lat: 45.7300, lng: 4.8400, phone: '04 72 73 54 00', capacity: 150, type: 'prefectural' },
  { id: 'f4', name: 'Fourrière de Marseille', address: 'Chemin de Gibbes, 13014 Marseille', lat: 43.3393, lng: 5.3775, phone: '04 91 02 99 30', capacity: 180, type: 'municipal' },
  { id: 'f5', name: 'Fourrière de Bordeaux', address: 'Quai de Brazza, 33100 Bordeaux', lat: 44.8500, lng: -0.5500, phone: '05 56 96 28 30', capacity: 120, type: 'municipal' },
  { id: 'f6', name: 'Fourrière de Lille', address: '8 Rue du Port, 59000 Lille', lat: 50.6300, lng: 3.0600, phone: '03 20 49 90 90', capacity: 100, type: 'municipal' },
  { id: 'f7', name: 'Fourrière de Nice', address: '4 Bd de la Madeleine, 06000 Nice', lat: 43.7000, lng: 7.2700, phone: '04 97 13 44 00', capacity: 90, type: 'prefectural' },
  { id: 'f8', name: 'Fourrière de Toulouse', address: 'Chemin de Mange-Pommes, 31200 Toulouse', lat: 43.6300, lng: 1.4500, phone: '05 61 22 78 00', capacity: 140, type: 'municipal' },
]

// Detection radius in meters
const DEFAULT_RADIUS = 500

interface FourriereAlert {
  id: string
  vehicleName: string
  vehiclePlate: string
  vehicleId: string
  fourriereName: string
  fourriereAddress: string
  fourrierePhone: string
  distance: number
  detectedAt: Date
  status: 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedAt?: Date
  notes?: string
}

type TabView = 'alertes' | 'annuaire' | 'historique' | 'parametres'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function FourrieresPage() {
  const { user } = useAuthStore()
  const { data: vehiclesData, isLoading } = useVehicles({ limit: 1000 })
  const [activeTab, setActiveTab] = useState<TabView>('alertes')
  const [searchTerm, setSearchTerm] = useState('')
  const [detectionRadius, setDetectionRadius] = useState(DEFAULT_RADIUS)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, { by: string; at: Date; notes: string }>>({})
  const [resolvedAlerts, setResolvedAlerts] = useState<Set<string>>(new Set())
  const [falseAlarms, setFalseAlarms] = useState<Set<string>>(new Set())
  const [selectedAlert, setSelectedAlert] = useState<FourriereAlert | null>(null)
  const [ackNotes, setAckNotes] = useState('')
  const [annuaireSearch, setAnnuaireSearch] = useState('')

  const vehicles = vehiclesData?.data || []

  // Detect vehicles near impound lots
  const alerts: FourriereAlert[] = useMemo(() => {
    const results: FourriereAlert[] = []
    for (const v of vehicles) {
      if (!v.currentLat || !v.currentLng) continue
      for (const f of FOURRIERES_DB) {
        const dist = haversineDistance(v.currentLat, v.currentLng, f.lat, f.lng)
        if (dist <= detectionRadius) {
          const alertId = `${v.id}-${f.id}`
          let status: FourriereAlert['status'] = 'active'
          if (falseAlarms.has(alertId)) status = 'false_alarm'
          else if (resolvedAlerts.has(alertId)) status = 'resolved'
          else if (acknowledgedAlerts[alertId]) status = 'acknowledged'

          results.push({
            id: alertId,
            vehicleName: v.name || 'Véhicule inconnu',
            vehiclePlate: v.plate || '---',
            vehicleId: v.id,
            fourriereName: f.name,
            fourriereAddress: f.address,
            fourrierePhone: f.phone,
            distance: Math.round(dist),
            detectedAt: new Date(),
            status,
            acknowledgedBy: acknowledgedAlerts[alertId]?.by,
            acknowledgedAt: acknowledgedAlerts[alertId]?.at,
            notes: acknowledgedAlerts[alertId]?.notes,
          })
        }
      }
    }
    return results.sort((a, b) => a.distance - b.distance)
  }, [vehicles, detectionRadius, acknowledgedAlerts, resolvedAlerts, falseAlarms])

  const filteredAlerts = useMemo(() => {
    let result = alerts
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter)
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      result = result.filter(a =>
        a.vehicleName.toLowerCase().includes(q) ||
        a.vehiclePlate.toLowerCase().includes(q) ||
        a.fourriereName.toLowerCase().includes(q)
      )
    }
    return result
  }, [alerts, statusFilter, searchTerm])

  const filteredFourrieres = useMemo(() => {
    if (!annuaireSearch) return FOURRIERES_DB
    const q = annuaireSearch.toLowerCase()
    return FOURRIERES_DB.filter(f =>
      f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q)
    )
  }, [annuaireSearch])

  const activeCount = alerts.filter(a => a.status === 'active').length
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length

  const handleAcknowledge = (alert: FourriereAlert) => {
    setAcknowledgedAlerts(prev => ({
      ...prev,
      [alert.id]: {
        by: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        at: new Date(),
        notes: ackNotes,
      }
    }))
    setAckNotes('')
    setSelectedAlert(null)
  }

  const handleResolve = (alertId: string) => {
    setResolvedAlerts(prev => new Set(prev).add(alertId))
  }

  const handleFalseAlarm = (alertId: string) => {
    setFalseAlarms(prev => new Set(prev).add(alertId))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 800)
  }

  const tabs: { key: TabView; label: string; icon: any }[] = [
    { key: 'alertes', label: 'ALERTES PROXIMITÉ', icon: AlertTriangle },
    { key: 'annuaire', label: 'ANNUAIRE FOURRIÈRES', icon: Building2 },
    { key: 'historique', label: 'HISTORIQUE', icon: History },
    { key: 'parametres', label: 'PARAMÈTRES', icon: Shield },
  ]

  const statusBadge = (status: FourriereAlert['status']) => {
    const map = {
      active: { bg: 'bg-red-100 text-red-700', label: 'ACTIF' },
      acknowledged: { bg: 'bg-amber-100 text-amber-700', label: 'PRIS EN CHARGE' },
      resolved: { bg: 'bg-green-100 text-green-700', label: 'RÉSOLU' },
      false_alarm: { bg: 'bg-gray-100 text-gray-500', label: 'FAUSSE ALERTE' },
    }
    const s = map[status]
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Détection Fourrières</h1>
              <p className="text-xs text-gray-500 mt-0.5">Surveillance automatique de la proximité avec les fourrières</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats badges */}
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-700">{activeCount} actif{activeCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-xs font-bold text-amber-700">{acknowledgedCount} pris en charge</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100">
                <span className="text-xs font-bold text-green-700">{resolvedCount} résolu{resolvedCount !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#4361EE] text-white text-xs font-semibold hover:bg-[#3a56d4] transition-colors"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1 mt-4">
          {tabs.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  active
                    ? 'bg-[#4361EE] text-white'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {tab.key === 'alertes' && activeCount > 0 && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`}>
                    {activeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── ALERTES PROXIMITÉ ── */}
        {activeTab === 'alertes' && (
          <div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher véhicule, plaque, fourrière..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1">
                {[
                  { key: 'all', label: 'TOUS' },
                  { key: 'active', label: 'ACTIFS' },
                  { key: 'acknowledged', label: 'PRIS EN CHARGE' },
                  { key: 'resolved', label: 'RÉSOLUS' },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-all ${
                      statusFilter === f.key
                        ? 'bg-[#4361EE] text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} />
                Rayon: <strong>{detectionRadius}m</strong>
              </div>
            </div>

            {/* Alert list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw size={24} className="animate-spin text-gray-300" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-20">
                <CheckCircle2 size={48} className="mx-auto text-green-300 mb-3" />
                <p className="text-gray-500 font-medium">Aucune alerte de proximité</p>
                <p className="text-gray-400 text-sm mt-1">
                  Aucun véhicule détecté à moins de {detectionRadius}m d'une fourrière
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                      alert.status === 'active' ? 'border-red-200 shadow-sm' :
                      alert.status === 'acknowledged' ? 'border-amber-200' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          alert.status === 'active' ? 'bg-red-100' :
                          alert.status === 'acknowledged' ? 'bg-amber-100' :
                          'bg-gray-100'
                        }`}>
                          <Car size={18} className={
                            alert.status === 'active' ? 'text-red-600' :
                            alert.status === 'acknowledged' ? 'text-amber-600' :
                            'text-gray-400'
                          } />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">{alert.vehicleName}</span>
                            <span className="text-xs text-gray-400 font-mono">{alert.vehiclePlate}</span>
                            {statusBadge(alert.status)}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{alert.fourriereName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{alert.fourriereAddress}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[11px] text-gray-400">
                              <Navigation size={10} className="inline mr-1" />
                              {alert.distance}m de distance
                            </span>
                            <span className="text-[11px] text-gray-400">
                              <Clock size={10} className="inline mr-1" />
                              {alert.detectedAt.toLocaleString('fr-FR')}
                            </span>
                            {alert.fourrierePhone && (
                              <span className="text-[11px] text-gray-400">
                                <Phone size={10} className="inline mr-1" />
                                {alert.fourrierePhone}
                              </span>
                            )}
                          </div>
                          {alert.notes && (
                            <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 rounded px-2 py-1">
                              Note: {alert.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => { setSelectedAlert(alert); setAckNotes('') }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                            >
                              <Eye size={12} />
                              Prendre en charge
                            </button>
                            <button
                              onClick={() => handleFalseAlarm(alert.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors"
                            >
                              <XCircle size={12} />
                              Fausse alerte
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-[11px] font-semibold hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle2 size={12} />
                            Résoudre
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ANNUAIRE FOURRIÈRES ── */}
        {activeTab === 'annuaire' && (
          <div>
            <div className="relative max-w-md mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une fourrière..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]"
                value={annuaireSearch}
                onChange={e => setAnnuaireSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredFourrieres.map(f => (
                <div key={f.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{f.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                        <MapPin size={11} className="shrink-0 mt-0.5" />
                        {f.address}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Phone size={10} />
                          {f.phone}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <Car size={10} />
                          Capacité: {f.capacity}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          f.type === 'municipal' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                        }`}>
                          {f.type === 'municipal' ? 'MUNICIPALE' : 'PRÉFECTORALE'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORIQUE ── */}
        {activeTab === 'historique' && (
          <div className="text-center py-20">
            <History size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">Historique des alertes</p>
            <p className="text-gray-400 text-sm mt-1">
              L'historique des détections de proximité sera disponible prochainement.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Les alertes traitées dans cette session sont visibles dans l'onglet "Alertes proximité" avec le filtre "Résolus".
            </p>
          </div>
        )}

        {/* ── PARAMÈTRES ── */}
        {activeTab === 'parametres' && (
          <div className="max-w-xl">
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1">Rayon de détection</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Distance maximale pour déclencher une alerte de proximité avec une fourrière
                </p>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={100}
                    max={2000}
                    step={100}
                    value={detectionRadius}
                    onChange={e => setDetectionRadius(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4361EE]"
                  />
                  <span className="text-sm font-bold text-[#4361EE] w-16 text-right">{detectionRadius}m</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>100m</span>
                  <span>2000m</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-1">Notifications</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Recevoir des notifications lors de la détection d'un véhicule près d'une fourrière
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#4361EE] focus:ring-[#4361EE]" />
                  <span className="text-sm text-gray-700">Activer les alertes push</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 text-[#4361EE] focus:ring-[#4361EE]" />
                  <span className="text-sm text-gray-700">Notification email</span>
                </label>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-1">Base de données fourrières</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {FOURRIERES_DB.length} fourrières référencées dans la base
                </p>
                <p className="text-xs text-gray-400">
                  La base est mise à jour régulièrement. Contactez le support pour ajouter des fourrières.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Acknowledge dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" style={{ animation: 'fadeInDown 0.2s ease-out' }}>
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
              <h3 className="font-bold text-amber-800">Prendre en charge l'alerte</h3>
              <p className="text-xs text-amber-600 mt-0.5">
                {selectedAlert.vehicleName} — {selectedAlert.vehiclePlate}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Fourrière détectée</p>
                <p className="text-sm font-medium text-gray-900">{selectedAlert.fourriereName}</p>
                <p className="text-xs text-gray-500">{selectedAlert.fourriereAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Distance</p>
                <p className="text-sm font-medium text-gray-900">{selectedAlert.distance}m</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes (optionnel)</label>
                <textarea
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]"
                  placeholder="Ajoutez une note..."
                  value={ackNotes}
                  onChange={e => setAckNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAcknowledge(selectedAlert)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors"
              >
                Confirmer la prise en charge
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
