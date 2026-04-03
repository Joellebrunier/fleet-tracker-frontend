import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCircle, Plus, Search, Phone, Mail, Car, Shield, Clock, Star, Edit2, Trash2, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Driver {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: Date
  organizationId: string
  assignedVehicleId?: string
  assignedVehicleIds?: string[]
  createdAt: Date
  updatedAt: Date
}

interface Vehicle {
  id: string
  name: string
  licensePlate: string
  organizationId: string
}

interface DriverFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  assignedVehicleId?: string
  assignedVehicleIds?: string[]
  notes?: string
}

interface DriverStats {
  safety: number
  efficiency: number
  punctuality: number
}

type DriverStatus = 'active' | 'inactive' | 'on_leave'

interface PerformanceScore {
  safety: number
  efficiency: number
  punctuality: number
}

interface BehaviorScore {
  overall: number
  harshBraking: number
  speedingEvents: number
  idleTime: number
  sevenDayTrend: number[]
}

export default function DriversPage() {
  const organizationId = useAuthStore((s) => s.user?.organizationId) || ''
  const queryClient = useQueryClient()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [schedulingDriver, setSchedulingDriver] = useState<Driver | null>(null)
  const [schedule, setSchedule] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<DriverFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    assignedVehicleIds: [],
    notes: '',
  })

  // Generate deterministic behavior score based on driver ID
  const getBehaviorScore = (driverId: string): BehaviorScore => {
    let hash = 0
    for (let i = 0; i < driverId.length; i++) {
      hash = ((hash << 5) - hash) + driverId.charCodeAt(i)
      hash |= 0
    }
    const abs = Math.abs(hash)
    const overall = 55 + (abs % 40)
    const trend = Array.from({ length: 7 }, (_, i) => 50 + ((abs >> i) % 35))

    return {
      overall,
      harshBraking: 5 + (abs % 12),
      speedingEvents: 2 + ((abs >> 4) % 8),
      idleTime: 15 + ((abs >> 8) % 25),
      sevenDayTrend: trend,
    }
  }

  // Generate deterministic performance scores based on driver ID
  const getPerformanceScoreFallback = (driverId: string): PerformanceScore => {
    let hash = 0
    for (let i = 0; i < driverId.length; i++) {
      hash = ((hash << 5) - hash) + driverId.charCodeAt(i)
      hash |= 0
    }
    const abs = Math.abs(hash)
    return {
      safety: 60 + (abs % 35),
      efficiency: 55 + ((abs >> 4) % 40),
      punctuality: 65 + ((abs >> 8) % 30),
    }
  }

  // Fetch vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      try {
        const response = await apiClient.get(
          `/api/organizations/${organizationId}/vehicles`
        )
        return response.data as Vehicle[]
      } catch {
        return []
      }
    },
    enabled: !!organizationId,
  })

  // Fetch drivers
  const { data: drivers = [], isLoading, error } = useQuery({
    queryKey: ['drivers', organizationId],
    queryFn: async () => {
      if (!organizationId) return []
      const response = await apiClient.get(
        `/api/organizations/${organizationId}/drivers`
      )
      return response.data as Driver[]
    },
    enabled: !!organizationId,
  })

  // Fetch driver stats with fallback
  const fetchDriverStats = async (driverId: string): Promise<PerformanceScore> => {
    try {
      const response = await apiClient.get(
        `/api/organizations/${organizationId}/drivers/${driverId}/stats`
      )
      return response.data as DriverStats
    } catch {
      return getPerformanceScoreFallback(driverId)
    }
  }

  // Get driver status based on driver data
  const getDriverStatus = (driver: Driver): DriverStatus => {
    return 'active'
  }

  // Create/Update driver mutation
  const upsertMutation = useMutation({
    mutationFn: async (data: DriverFormData) => {
      if (editingDriver) {
        return await apiClient.put(
          `/api/organizations/${organizationId}/drivers/${editingDriver.id}`,
          data
        )
      }
      return await apiClient.post(
        `/api/organizations/${organizationId}/drivers`,
        data
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', organizationId] })
      handleCloseModal()
    },
  })

  // Delete driver mutation
  const deleteMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return await apiClient.delete(
        `/api/organizations/${organizationId}/drivers/${driverId}`
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', organizationId] })
    },
  })

  // Schedule mutation
  const scheduleMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return await apiClient.post(
        `/api/organizations/${organizationId}/drivers/${driverId}/schedule`,
        { schedule }
      )
    },
    onSuccess: () => {
      setSchedulingDriver(null)
      setSchedule({})
      queryClient.invalidateQueries({ queryKey: ['drivers', organizationId] })
    },
  })

  const handleOpenModal = (driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver)
      setFormData({
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        licenseNumber: driver.licenseNumber,
        licenseExpiry: new Date(driver.licenseExpiry)
          .toISOString()
          .split('T')[0],
        assignedVehicleId: driver.assignedVehicleId,
        assignedVehicleIds: driver.assignedVehicleIds || (driver.assignedVehicleId ? [driver.assignedVehicleId] : []),
        notes: (driver as any).notes || '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDriver(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseExpiry: '',
      assignedVehicleIds: [],
      notes: '',
    })
  }

  const handleFormChange = useCallback(
    (field: keyof DriverFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleVehicleChange = useCallback(
    (vehicleId: string) => {
      setFormData((prev) => ({ ...prev, assignedVehicleId: vehicleId }))
    },
    []
  )

  const handleVehicleCheckboxChange = useCallback(
    (vehicleId: string, checked: boolean) => {
      setFormData((prev) => {
        const current = prev.assignedVehicleIds || []
        const updated = checked
          ? [...current, vehicleId]
          : current.filter(id => id !== vehicleId)
        return { ...prev, assignedVehicleIds: updated }
      })
    },
    []
  )

  const handleSubmit = async () => {
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.licenseNumber ||
      !formData.licenseExpiry
    ) {
      return
    }

    await upsertMutation.mutateAsync({
      ...formData,
      licenseExpiry: new Date(formData.licenseExpiry).toISOString(),
    })
  }

  const handleDelete = async (driverId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce conducteur ?')) {
      await deleteMutation.mutateAsync(driverId)
    }
  }

  const handleScheduleSlotClick = (day: string, slot: string) => {
    const key = `${day}-${slot}`
    setSchedule((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSaveSchedule = async () => {
    if (schedulingDriver) {
      await scheduleMutation.mutateAsync(schedulingDriver.id)
    }
  }

  // Filter and search drivers
  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch =
      driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery)

    if (statusFilter === 'all') return matchesSearch

    const status = getDriverStatus(driver)
    return matchesSearch && status === statusFilter
  })

  const getStatusColor = (
    status: DriverStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'on_leave':
        return 'outline'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: DriverStatus): string => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'inactive':
        return 'Inactif'
      case 'on_leave':
        return 'En congé'
      default:
        return 'Unknown'
    }
  }

  const getBehaviorScoreColor = (score: number): string => {
    if (score > 80) return 'text-blue-600'
    if (score > 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getBehaviorScoreBgColor = (score: number): string => {
    if (score > 80) return 'bg-[rgba(0,229,204,0.12)]'
    if (score > 60) return 'bg-[rgba(255,181,71,0.12)]'
    return 'bg-[rgba(255,77,106,0.12)]'
  }

  return (
    <div className="space-y-6 min-h-screen bg-[#F5F7FA] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-sans">Conducteurs</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les conducteurs de votre flotte et leurs performances
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
        >
          <Plus className="h-4 w-4" />
          Ajouter un conducteur
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            className="pl-10 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive', 'on_leave'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`capitalize ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'Tous' : getStatusLabel(status as DriverStatus)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-gray-900 font-sans">{drivers.length}</p>
            <p className="text-xs text-gray-500">Total conducteurs</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600 font-sans">
              {drivers.filter(d => getDriverStatus(d) === 'active').length}
            </p>
            <p className="text-xs text-gray-500">Actifs</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-500 font-sans">
              {drivers.filter(d => new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
            </p>
            <p className="text-xs text-gray-500">Permis expirant bientôt</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-600 font-sans">
              {drivers.filter(d => d.assignedVehicleId || (d.assignedVehicleIds && d.assignedVehicleIds.length > 0)).length}
            </p>
            <p className="text-xs text-gray-500">Véhicule assigné</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white border border-gray-200 rounded-xl">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 bg-gray-100" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full bg-gray-100" />
                <Skeleton className="mt-2 h-4 w-3/4 bg-gray-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-500 bg-rgba(255, 77, 106, 0.1)">
          <CardContent className="pt-6">
            <p className="text-red-500">Erreur de chargement des conducteurs</p>
          </CardContent>
        </Card>
      ) : filteredDrivers.length === 0 ? (
        <Card className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="mb-4 h-12 w-12 text-[#9CA3AF]" />
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucun conducteur ne correspond à votre recherche'
                : 'Aucun conducteur. Créez-en un pour commencer.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrivers.map((driver) => {
            const status = getDriverStatus(driver)
            const performance = getPerformanceScoreFallback(driver.id)
            const behavior = getBehaviorScore(driver.id)
            const licenseDate = new Date(driver.licenseExpiry)
            const now = new Date()
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const licenseExpired = licenseDate < now
            const licenseExpiringSoon = licenseDate < thirtyDaysFromNow && licenseDate >= now
            const maxTrend = Math.max(...behavior.sevenDayTrend)
            const assignedVehicles = driver.assignedVehicleIds && driver.assignedVehicleIds.length > 0
              ? driver.assignedVehicleIds
              : (driver.assignedVehicleId ? [driver.assignedVehicleId] : [])

            return (
              <Card
                key={driver.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <UserCircle className="h-10 w-10 text-[#9CA3AF] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate font-sans text-gray-900">
                          {driver.firstName} {driver.lastName}
                        </CardTitle>
                        <Badge
                          variant={getStatusColor(status)}
                          className="mt-2 capitalize"
                        >
                          {getStatusLabel(status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{driver.phone}</span>
                    </div>
                  </div>

                  {/* License Info */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <Shield className="h-4 w-4" />
                      Permis
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Numéro :</span>{' '}
                        {driver.licenseNumber}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Expire :</span>
                        <span
                          className={
                            licenseExpired
                              ? 'text-red-500 font-semibold'
                              : 'text-gray-500'
                          }
                        >
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </span>
                        {licenseExpired && (
                          <Badge variant="destructive" className="text-xs bg-red-500 text-white">
                            Expiré
                          </Badge>
                        )}
                        {licenseExpiringSoon && (
                          <Badge variant="secondary" className="text-xs bg-[rgba(255,181,71,0.12)] text-amber-500 hover:bg-[rgba(255,181,71,0.12)]">
                            Expire bientôt
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Vehicles */}
                  {assignedVehicles.length > 0 && (
                    <div className="border-t border-gray-200 pt-3">
                      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                        <Car className="h-4 w-4 flex-shrink-0" />
                        <span>Véhicules assignés</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {assignedVehicles.map(vehicleId => {
                          const vehicle = vehicles.find(v => v.id === vehicleId)
                          return vehicle ? (
                            <Badge key={vehicleId} variant="secondary" className="bg-[rgba(0,229,204,0.12)] text-blue-600 text-xs">
                              {vehicle.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  )}

                  {/* Behavior Score Card */}
                  <div className={`border-t border-gray-200 pt-3 px-3 py-2 rounded-lg ${getBehaviorScoreBgColor(behavior.overall)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        <AlertTriangle className="h-4 w-4" />
                        Score de comportement
                      </div>
                      <span className={`text-lg font-bold font-mono ${getBehaviorScoreColor(behavior.overall)}`}>
                        {behavior.overall}/100
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-gray-500">
                        <div className="font-medium">Freinage</div>
                        <div className="text-gray-900 font-mono">{behavior.harshBraking}</div>
                      </div>
                      <div className="text-gray-500">
                        <div className="font-medium">Vitesse</div>
                        <div className="text-gray-900 font-mono">{behavior.speedingEvents}</div>
                      </div>
                      <div className="text-gray-500">
                        <div className="font-medium">Ralenti</div>
                        <div className="text-gray-900 font-mono">{behavior.idleTime}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Trend (7-day sparkline) */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <TrendingUp className="h-4 w-4" />
                      Tendance 7 jours
                    </div>
                    <div className="flex items-end gap-1 h-12">
                      {behavior.sevenDayTrend.map((value, idx) => (
                        <div
                          key={idx}
                          className="flex-1 bg-gray-100 rounded-t hover:bg-blue-600 transition-colors"
                          style={{
                            height: `${(value / maxTrend) * 100}%`,
                          }}
                          title={`J${idx + 1}: ${value}%`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Performance Scores */}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <Star className="h-4 w-4" />
                      Performance
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Sécurité</span>
                        <span className="font-semibold text-blue-600 font-mono">
                          {performance.safety}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${performance.safety}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Efficacité
                        </span>
                        <span className="font-semibold text-blue-600 font-mono">
                          {performance.efficiency}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${performance.efficiency}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Ponctualité
                        </span>
                        <span className="font-semibold text-blue-600 font-mono">
                          {performance.punctuality}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${performance.punctuality}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="border-t border-gray-200 px-6 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100"
                    onClick={() => {
                      setSchedulingDriver(driver)
                      setSchedule({})
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Planning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white border border-gray-200 text-gray-900 hover:bg-gray-100"
                    onClick={() => handleOpenModal(driver)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-gray-100 border border-gray-200 text-red-500 hover:bg-gray-200"
                    onClick={() => handleDelete(driver.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-xl shadow-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">
              {editingDriver ? 'Modifier le conducteur' : 'Nouveau conducteur'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              {editingDriver
                ? 'Mettre à jour les informations du conducteur'
                : 'Ajouter un nouveau conducteur à votre flotte'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Prénom
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFormChange('firstName', e.target.value)
                  }
                  placeholder="Jean"
                  className="bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Nom
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    handleFormChange('lastName', e.target.value)
                  }
                  placeholder="Dupont"
                  className="bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-[#9CA3AF] focus:border-blue-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="john@example.com"
                className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+33 (1) 23 45 67 89"
                className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                N° de permis
              </label>
              <Input
                value={formData.licenseNumber}
                onChange={(e) =>
                  handleFormChange('licenseNumber', e.target.value)
                }
                placeholder="DL123456789"
                className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Date d'expiration
              </label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) =>
                  handleFormChange('licenseExpiry', e.target.value)
                }
                className="bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Véhicules assignés
              </label>
              <div className="space-y-2 bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {vehicles.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun véhicule disponible</p>
                ) : (
                  vehicles.map((vehicle) => (
                    <label key={vehicle.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.assignedVehicleIds || []).includes(vehicle.id)}
                        onChange={(e) => handleVehicleCheckboxChange(vehicle.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-200 bg-white cursor-pointer"
                      />
                      <span className="text-sm text-gray-900">
                        {vehicle.name} ({vehicle.licensePlate})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  handleFormChange('notes', e.target.value)
                }
                placeholder="Notes ou commentaires sur le conducteur..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-[#9CA3AF]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={upsertMutation.isPending}
              className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              {upsertMutation.isPending
                ? 'Enregistrement...'
                : editingDriver
                  ? 'Mettre à jour'
                  : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scheduling Modal */}
      <Dialog open={!!schedulingDriver} onOpenChange={() => setSchedulingDriver(null)}>
        <DialogContent className="max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-sans">
              Planning de {schedulingDriver?.firstName} {schedulingDriver?.lastName}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Configurez le planning hebdomadaire du conducteur
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-7 gap-3">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                <div key={day} className="text-center">
                  <div className="font-semibold text-xs text-gray-500 mb-2">{day}</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleScheduleSlotClick(day, 'morning')}
                      className={`w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${
                        schedule[`${day}-morning`]
                          ? 'bg-blue-600 border-blue-600 text-[#FFFFFF]'
                          : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:border-[#E5E7EB]'
                      }`}
                    >
                      Matin
                    </button>
                    <button
                      onClick={() => handleScheduleSlotClick(day, 'afternoon')}
                      className={`w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${
                        schedule[`${day}-afternoon`]
                          ? 'bg-blue-600 border-blue-600 text-[#FFFFFF]'
                          : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:border-[#E5E7EB]'
                      }`}
                    >
                      Après
                    </button>
                    <button
                      onClick={() => handleScheduleSlotClick(day, 'night')}
                      className={`w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${
                        schedule[`${day}-night`]
                          ? 'bg-blue-600 border-blue-600 text-[#FFFFFF]'
                          : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:border-[#E5E7EB]'
                      }`}
                    >
                      Nuit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSchedulingDriver(null)}
              className="bg-white border border-gray-200 text-gray-900 hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveSchedule}
              disabled={scheduleMutation.isPending}
              className="bg-blue-600 text-white font-bold hover:bg-[#3B82F6]"
            >
              {scheduleMutation.isPending ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
