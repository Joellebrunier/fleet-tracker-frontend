import { useState, useCallback } from 'react'
import {
  useAlerts,
  useAlertStats,
  useBulkAcknowledgeAlerts,
  useAlertRules,
  useCreateAlertRule,
} from '@/hooks/useAlerts'
import {
  AlertType,
  AlertSeverity,
  AlertRule,
  AlertCondition,
  AlertAction,
} from '@/types/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  Check,
  Plus,
  Bell,
  BellOff,
  Settings,
  Zap,
  Search,
  Filter,
  ChevronRight,
  Shield,
  Gauge,
  MapPin,
  Clock,
  Battery,
  Wrench,
  Fuel,
  Activity,
  Trash2,
} from 'lucide-react'
import { formatDateTime, getSeverityColor } from '@/lib/utils'

// Alert type configuration for the rule builder
const alertTypeConfig: Record<
  string,
  { label: string; icon: React.ReactNode; description: string; fields: string[] }
> = {
  [AlertType.OVERSPEED]: {
    label: 'Overspeed',
    icon: <Gauge size={18} />,
    description: 'Alert when vehicle exceeds speed limit',
    fields: ['speedLimit'],
  },
  [AlertType.GEOFENCE_ENTRY]: {
    label: 'Geofence Entry',
    icon: <MapPin size={18} />,
    description: 'Alert when vehicle enters a geofence zone',
    fields: ['geofenceId'],
  },
  [AlertType.GEOFENCE_EXIT]: {
    label: 'Geofence Exit',
    icon: <MapPin size={18} />,
    description: 'Alert when vehicle exits a geofence zone',
    fields: ['geofenceId'],
  },
  [AlertType.IDLE_TIMEOUT]: {
    label: 'Idle Timeout',
    icon: <Clock size={18} />,
    description: 'Alert when vehicle is idle for too long',
    fields: ['idleMinutes'],
  },
  [AlertType.OFFLINE]: {
    label: 'Offline',
    icon: <BellOff size={18} />,
    description: 'Alert when vehicle goes offline',
    fields: ['offlineMinutes'],
  },
  [AlertType.LOW_BATTERY]: {
    label: 'Low Battery',
    icon: <Battery size={18} />,
    description: 'Alert when tracker battery is low',
    fields: ['batteryPercent'],
  },
  [AlertType.MAINTENANCE_DUE]: {
    label: 'Maintenance Due',
    icon: <Wrench size={18} />,
    description: 'Alert for scheduled maintenance',
    fields: ['kmThreshold'],
  },
  [AlertType.FUEL_ALERT]: {
    label: 'Fuel Alert',
    icon: <Fuel size={18} />,
    description: 'Alert on sudden fuel level changes',
    fields: ['fuelDropPercent'],
  },
  [AlertType.HARSH_ACCELERATION]: {
    label: 'Harsh Acceleration',
    icon: <Activity size={18} />,
    description: 'Alert on sudden acceleration events',
    fields: ['gForce'],
  },
  [AlertType.HARSH_BRAKING]: {
    label: 'Harsh Braking',
    icon: <Activity size={18} />,
    description: 'Alert on sudden braking events',
    fields: ['gForce'],
  },
}

const severityOptions = [
  { value: AlertSeverity.CRITICAL, label: 'Critical', color: 'text-red-600' },
  { value: AlertSeverity.HIGH, label: 'High', color: 'text-orange-600' },
  { value: AlertSeverity.MEDIUM, label: 'Medium', color: 'text-yellow-600' },
  { value: AlertSeverity.LOW, label: 'Low', color: 'text-blue-600' },
  { value: AlertSeverity.INFO, label: 'Info', color: 'text-gray-600' },
]

interface RuleFormState {
  name: string
  description: string
  type: AlertType | ''
  severity: AlertSeverity
  conditionValue: string
  conditionDuration: string
  actions: AlertAction[]
  enabled: boolean
}

const defaultRuleForm: RuleFormState = {
  name: '',
  description: '',
  type: '',
  severity: AlertSeverity.MEDIUM,
  conditionValue: '',
  conditionDuration: '',
  actions: [],
  enabled: true,
}

type TabView = 'alerts' | 'rules'

export default function AlertsPage() {
  const [tab, setTab] = useState<TabView>('alerts')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'unacknowledged' | 'acknowledged' | undefined>('unacknowledged')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState<RuleFormState>(defaultRuleForm)
  const [ruleStep, setRuleStep] = useState(0)
  const [formError, setFormError] = useState('')
  const [disabledRules, setDisabledRules] = useState<Set<string>>(new Set())

  const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status })
  const { data: stats } = useAlertStats()
  const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts()
  const { data: rules, isLoading: rulesLoading } = useAlertRules()
  const createRuleMutation = useCreateAlertRule()

  const alerts = alertsData?.data || []
  const totalPages = alertsData?.totalPages || 1

  const filteredAlerts = alerts.filter((a) => {
    // Keyword search filter
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.message.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    // Date range filter
    if (dateFrom || dateTo) {
      const alertDate = new Date(a.createdAt)
      if (dateFrom && alertDate < new Date(dateFrom)) return false
      if (dateTo) {
        const endOfDay = new Date(dateTo)
        endOfDay.setHours(23, 59, 59, 999)
        if (alertDate > endOfDay) return false
      }
    }
    return true
  })

  const handleSelectAlert = (id: string) => {
    setSelectedAlerts((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleBulkAcknowledge = () => {
    if (selectedAlerts.length > 0) {
      bulkAcknowledge(selectedAlerts)
      setSelectedAlerts([])
    }
  }

  const openRuleCreator = () => {
    setRuleForm(defaultRuleForm)
    setRuleStep(0)
    setFormError('')
    setShowRuleModal(true)
  }

  const handleCreateRule = async () => {
    setFormError('')
    if (!ruleForm.name.trim()) {
      setFormError('Rule name is required')
      return
    }
    if (!ruleForm.type) {
      setFormError('Please select an alert type')
      return
    }

    const condition: AlertCondition = {
      field: ruleForm.type === AlertType.OVERSPEED ? 'speed' : ruleForm.type,
      operator: 'greater_than',
      value: parseFloat(ruleForm.conditionValue) || 0,
      duration: parseInt(ruleForm.conditionDuration) || undefined,
    }

    try {
      await createRuleMutation.mutateAsync({
        name: ruleForm.name.trim(),
        description: ruleForm.description.trim() || undefined,
        type: ruleForm.type as AlertType,
        severity: ruleForm.severity,
        condition,
        actions: ruleForm.actions.length > 0 ? ruleForm.actions : [{ type: 'push', target: 'all' }],
        enabled: ruleForm.enabled,
      })
      setShowRuleModal(false)
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create rule')
    }
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
          <p className="mt-1 text-gray-600">Surveiller et gérer les alertes et les règles de la flotte</p>
        </div>
        <div className="flex gap-2">
          {selectedAlerts.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={handleBulkAcknowledge}>
              <Check size={16} />
              Reconnaître ({selectedAlerts.length})
            </Button>
          )}
          <Button className="gap-2" onClick={openRuleCreator}>
            <Plus size={16} />
            Créer une règle
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold">{stats.total}</p>
                </div>
                <Bell size={18} className="text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Non reconnus</p>
                  <p className="text-xl font-bold text-amber-600">{stats.unacknowledged}</p>
                </div>
                <AlertCircle size={18} className="text-amber-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-600 font-medium">Critical</p>
                  <p className="text-xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <Shield size={18} className="text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">High</p>
                  <p className="text-xl font-bold text-orange-600">{stats.high}</p>
                </div>
                <Zap size={18} className="text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Medium</p>
                  <p className="text-xl font-bold text-yellow-600">{stats.medium}</p>
                </div>
                <Activity size={18} className="text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Low / Info</p>
                  <p className="text-xl font-bold text-blue-600">{stats.low + stats.info}</p>
                </div>
                <Bell size={18} className="text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Skeleton className="h-20" />
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('alerts')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'alerts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Alertes ({stats?.total || 0})
        </button>
        <button
          onClick={() => setTab('rules')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'rules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Règles ({(rules as any)?.length || 0})
        </button>
      </div>

      {/* Alerts Tab */}
      {tab === 'alerts' && (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Rechercher les alertes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'unacknowledged', 'acknowledged'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s === 'all' ? undefined : s)
                      setPage(1)
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      (s === 'all' && !status) || status === s
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s === 'all' ? 'Tout' : s === 'unacknowledged' ? 'Actif' : 'Reconnu'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">De</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">À</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                />
              </div>
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setPage(1)
                  }}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* Alert List */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <Bell className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-700">Aucune alerte trouvée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Essayez un terme de recherche différent' : 'Tout clair ! Aucune alerte active.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`transition-all ${
                    selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAlerts.includes(alert.id)}
                        onChange={() => handleSelectAlert(alert.id)}
                        className="mt-1 rounded border-gray-300"
                      />
                      <div
                        className={`rounded-lg p-2 ${getSeverityBadgeClass(alert.severity)}`}
                      >
                        <AlertCircle size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900">{alert.title}</h3>
                            <p className="mt-0.5 text-sm text-gray-600 line-clamp-1">{alert.message}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            {alert.isAcknowledged ? (
                              <Badge variant="secondary" className="text-xs">
                                <Check size={12} className="mr-1" />
                                Reconnu
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 gap-1 text-xs"
                                onClick={() => bulkAcknowledge([alert.id])}
                              >
                                <Check size={12} />
                                Reconnaître
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{formatDateTime(alert.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-4">
          {rulesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : !rules || (rules as any[]).length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <Settings className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-700">Aucune règle d'alerte configurée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Créez des règles pour générer automatiquement des alertes en fonction des conditions des véhicules.
                </p>
                <Button className="mt-4 gap-2" onClick={openRuleCreator}>
                  <Plus size={16} />
                  Créer votre première règle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(rules as AlertRule[]).map((rule) => {
                const typeConf = alertTypeConfig[rule.type]
                return (
                  <Card key={rule.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-lg p-2.5 ${
                            rule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {typeConf?.icon || <Bell size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{rule.name}</h3>
                            <Badge variant={!disabledRules.has(rule.id) && rule.enabled ? 'default' : 'secondary'}>
                              {!disabledRules.has(rule.id) && rule.enabled ? 'Actif' : 'Désactivé'}
                            </Badge>
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(
                                rule.severity
                              )}`}
                            >
                              {rule.severity}
                            </span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {rule.description || typeConf?.description || rule.type}
                          </p>
                        </div>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => {
                              setDisabledRules((prev) => {
                                const next = new Set(prev)
                                if (next.has(rule.id)) {
                                  next.delete(rule.id)
                                } else {
                                  next.add(rule.id)
                                }
                                return next
                              })
                            }}
                            className={`h-8 w-12 rounded-full transition-colors ${
                              disabledRules.has(rule.id)
                                ? 'bg-gray-300'
                                : 'bg-blue-500'
                            }`}
                          />
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Settings size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rule Creation Wizard Modal */}
      <Dialog open={showRuleModal} onOpenChange={() => setShowRuleModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une règle d'alerte</DialogTitle>
            <DialogDescription>
              {ruleStep === 0
                ? 'Étape 1 : Choisir un type d\'alerte'
                : ruleStep === 1
                  ? 'Étape 2 : Configurer la règle'
                  : 'Étape 3 : Définir les actions de notification'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-2">
            {[0, 1, 2].map((step) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < ruleStep
                      ? 'bg-green-100 text-green-600'
                      : step === ruleStep
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step < ruleStep ? <Check size={14} /> : step + 1}
                </div>
                {step < 2 && (
                  <div
                    className={`flex-1 h-0.5 ${step < ruleStep ? 'bg-green-300' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 0: Select Alert Type */}
          {ruleStep === 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(alertTypeConfig).map(([type, config]) => (
                <button
                  key={type}
                  onClick={() => {
                    setRuleForm((prev) => ({
                      ...prev,
                      type: type as AlertType,
                      name: prev.name || config.label + ' Alert',
                    }))
                    setRuleStep(1)
                  }}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 ${
                    ruleForm.type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="rounded-lg bg-gray-100 p-2 text-gray-600">{config.icon}</div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{config.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{config.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Configure */}
          {ruleStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nom de la règle *</label>
                <Input
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex. Alerte de vitesse sur autoroute"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <Input
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description facultative..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gravité</label>
                <div className="flex flex-wrap gap-2">
                  {severityOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRuleForm((prev) => ({ ...prev, severity: opt.value }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        ruleForm.severity === opt.value
                          ? `${getSeverityBadgeClass(opt.value)}`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Value */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Valeur de seuil
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={ruleForm.conditionValue}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, conditionValue: e.target.value }))
                    }
                    placeholder={
                      ruleForm.type === AlertType.OVERSPEED
                        ? 'Limite de vitesse (km/h)'
                        : ruleForm.type === AlertType.IDLE_TIMEOUT
                          ? 'Minutes'
                          : ruleForm.type === AlertType.LOW_BATTERY
                            ? 'Batterie %'
                            : 'Valeur'
                    }
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={ruleForm.conditionDuration}
                    onChange={(e) =>
                      setRuleForm((prev) => ({ ...prev, conditionDuration: e.target.value }))
                    }
                    placeholder="Durée (secondes)"
                    className="flex-1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Durée : combien de temps la condition doit être respectée avant le déclenchement
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={ruleForm.enabled}
                  onChange={(e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Activer la règle immédiatement
              </label>
            </div>
          )}

          {/* Step 2: Actions */}
          {ruleStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Choisissez comment être averti lorsque cette règle se déclenche :
              </p>

              {['push', 'email', 'sms', 'webhook'].map((actionType) => {
                const isSelected = ruleForm.actions.some((a) => a.type === actionType)
                return (
                  <label
                    key={actionType}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        setRuleForm((prev) => ({
                          ...prev,
                          actions: isSelected
                            ? prev.actions.filter((a) => a.type !== actionType)
                            : [
                                ...prev.actions,
                                { type: actionType as AlertAction['type'], target: 'all' },
                              ],
                        }))
                      }}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {actionType === 'push'
                          ? 'Notification Push'
                          : actionType === 'email'
                            ? 'Notification Email'
                            : actionType === 'sms'
                              ? 'Notification SMS'
                              : 'Webhook'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {actionType === 'push'
                          ? 'Notification in-app pour tous les membres de l\'équipe'
                          : actionType === 'email'
                            ? 'Envoyer un email aux destinataires configurés'
                            : actionType === 'sms'
                              ? 'Envoyer un SMS aux numéros de téléphone configurés'
                              : 'Appeler l\'URL webhook externe'}
                      </p>
                    </div>
                  </label>
                )
              })}
            </div>
          )}

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {formError}
            </div>
          )}

          <DialogFooter>
            {ruleStep > 0 && (
              <Button variant="outline" onClick={() => setRuleStep((s) => s - 1)}>
                Retour
              </Button>
            )}
            {ruleStep < 2 ? (
              <Button
                onClick={() => {
                  if (ruleStep === 0 && !ruleForm.type) {
                    setFormError('Veuillez sélectionner un type d\'alerte')
                    return
                  }
                  setFormError('')
                  setRuleStep((s) => s + 1)
                }}
              >
                Suivant
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? 'Création...' : 'Créer une règle'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
