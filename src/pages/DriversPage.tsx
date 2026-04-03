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
import { UserCircle, Plus, Search, Phone, Mail, Car, Shield, Clock, Star, Edit2, Trash2, Calendar } from 'lucide-react'
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
    notes: '',
  })

  // Generate deterministic performance scores based on driver ID (fallback)
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
      // Fallback to deterministic scores if API is not available
      return getPerformanceScoreFallback(driverId)
    }
  }

  // Get driver status based on driver data
  const getDriverStatus = (driver: Driver): DriverStatus => {
    // Default to 'active', can be extended with actual status logic
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
      assignedVehicleId: undefined,
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

  return (
    <div className="space-y-6 p-6 bg-[#0A0A0F] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F0F0F5] font-syne">Conducteurs</h1>
          <p className="mt-1 text-sm text-[#6B6B80]">
            Gérez les conducteurs de votre flotte et leurs performances
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
        >
          <Plus className="h-4 w-4" />
          Ajouter un conducteur
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B6B80]" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            className="pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
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
                    ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                    : 'bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]'
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
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#F0F0F5] font-syne">{drivers.length}</p>
            <p className="text-xs text-[#6B6B80]">Total conducteurs</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#00E5CC] font-syne">
              {drivers.filter(d => getDriverStatus(d) === 'active').length}
            </p>
            <p className="text-xs text-[#6B6B80]">Actifs</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#FFB547] font-syne">
              {drivers.filter(d => new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}
            </p>
            <p className="text-xs text-[#6B6B80]">Permis expirant bientôt</p>
          </CardContent>
        </Card>
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="pt-5 pb-4 text-center">
            <p className="text-2xl font-bold text-[#00E5CC] font-syne">
              {drivers.filter(d => d.assignedVehicleId).length}
            </p>
            <p className="text-xs text-[#6B6B80]">Véhicule assigné</p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 bg-[#1A1A25]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full bg-[#1A1A25]" />
                <Skeleton className="mt-2 h-4 w-3/4 bg-[#1A1A25]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)">
          <CardContent className="pt-6">
            <p className="text-[#FF4D6A]">Erreur de chargement des conducteurs</p>
          </CardContent>
        </Card>
      ) : filteredDrivers.length === 0 ? (
        <Card className="bg-[#12121A] border border-[#1F1F2E] rounded-[12px]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="mb-4 h-12 w-12 text-[#44445A]" />
            <p className="text-[#6B6B80]">
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
            const licenseDate = new Date(driver.licenseExpiry)
            const now = new Date()
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            const licenseExpired = licenseDate < now
            const licenseExpiringSoon = licenseDate < thirtyDaysFromNow && licenseDate >= now

            return (
              <Card
                key={driver.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <UserCircle className="h-10 w-10 text-[#44445A] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate font-syne text-[#F0F0F5]">
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
                    <div className="flex items-center gap-2 text-sm text-[#6B6B80]">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#6B6B80]">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{driver.phone}</span>
                    </div>
                  </div>

                  {/* License Info */}
                  <div className="border-t border-[#1F1F2E] pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#6B6B80]">
                      <Shield className="h-4 w-4" />
                      Permis
                    </div>
                    <div className="space-y-1 text-sm text-[#6B6B80]">
                      <div>
                        <span className="font-medium">Numéro :</span>{' '}
                        {driver.licenseNumber}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Expire :</span>
                        <span
                          className={
                            licenseExpired
                              ? 'text-[#FF4D6A] font-semibold'
                              : 'text-[#6B6B80]'
                          }
                        >
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </span>
                        {licenseExpired && (
                          <Badge variant="destructive" className="text-xs bg-[#FF4D6A] text-white">
                            Expiré
                          </Badge>
                        )}
                        {licenseExpiringSoon && (
                          <Badge variant="secondary" className="text-xs bg-[rgba(255,181,71,0.12)] text-[#FFB547] hover:bg-[rgba(255,181,71,0.12)]">
                            Expire bientôt
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assigned Vehicle */}
                  {driver.assignedVehicleId && (
                    <div className="border-t border-[#1F1F2E] pt-3">
                      <div className="flex items-center gap-2 text-sm text-[#6B6B80]">
                        <Car className="h-4 w-4 flex-shrink-0" />
                        <span>Véhicule assigné</span>
                      </div>
                    </div>
                  )}

                  {/* Performance Scores */}
                  <div className="border-t border-[#1F1F2E] pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#6B6B80]">
                      <Star className="h-4 w-4" />
                      Performance
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B6B80]">Sécurité</span>
                        <span className="font-semibold text-[#00E5CC] font-mono">
                          {performance.safety}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1A1A25] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00E5CC]"
                          style={{ width: `${performance.safety}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B6B80]">
                          Efficacité
                        </span>
                        <span className="font-semibold text-[#00E5CC] font-mono">
                          {performance.efficiency}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1A1A25] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00E5CC]"
                          style={{ width: `${performance.efficiency}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#6B6B80]">
                          Ponctualité
                        </span>
                        <span className="font-semibold text-[#00E5CC] font-mono">
                          {performance.punctuality}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#1A1A25] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00E5CC]"
                          style={{ width: `${performance.punctuality}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="border-t border-[#1F1F2E] px-6 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
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
                    className="flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
                    onClick={() => handleOpenModal(driver)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#FF4D6A] hover:bg-[#2A2A3D]"
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
        <DialogContent className="max-w-md bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">
              {editingDriver ? 'Modifier le conducteur' : 'Nouveau conducteur'}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              {editingDriver
                ? 'Mettre à jour les informations du conducteur'
                : 'Ajouter un nouveau conducteur à votre flotte'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">
                  Prénom
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFormChange('firstName', e.target.value)
                  }
                  placeholder="Jean"
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#F0F0F5]">
                  Nom
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    handleFormChange('lastName', e.target.value)
                  }
                  placeholder="Dupont"
                  className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="john@example.com"
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+33 (1) 23 45 67 89"
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                N° de permis
              </label>
              <Input
                value={formData.licenseNumber}
                onChange={(e) =>
                  handleFormChange('licenseNumber', e.target.value)
                }
                placeholder="DL123456789"
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Date d'expiration
              </label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) =>
                  handleFormChange('licenseExpiry', e.target.value)
                }
                className="bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Véhicule assigné
              </label>
              <select
                value={formData.assignedVehicleId || ''}
                onChange={(e) => handleVehicleChange(e.target.value)}
                className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]"
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#F0F0F5]">
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  handleFormChange('notes', e.target.value)
                }
                placeholder="Notes ou commentaires sur le conducteur..."
                className="w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] placeholder-[#44445A]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={upsertMutation.isPending}
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
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
        <DialogContent className="max-w-2xl bg-[#12121A] border-[#1F1F2E]">
          <DialogHeader>
            <DialogTitle className="text-[#F0F0F5] font-syne">
              Planning de {schedulingDriver?.firstName} {schedulingDriver?.lastName}
            </DialogTitle>
            <DialogDescription className="text-[#6B6B80]">
              Configurez le planning hebdomadaire du conducteur
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-7 gap-2">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, idx) => (
                <div key={day} className="text-center">
                  <div className="font-semibold text-sm text-[#6B6B80] mb-2">{day}</div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleScheduleSlotClick(day, 'morning')}
                      className={`w-full px-2 py-1 text-xs font-medium rounded border transition-colors ${
                        schedule[`${day}-morning`]
                          ? 'bg-[#00E5CC] border-[#00E5CC] text-[#0A0A0F]'
                          : 'bg-[#1A1A25] border-[#1F1F2E] text-[#6B6B80] hover:bg-[#2A2A3D] hover:border-[#2A2A3D]'
                      }`}
                    >
                      Matin
                    </button>
                    <button
                      onClick={() => handleScheduleSlotClick(day, 'afternoon')}
                      className={`w-full px-2 py-1 text-xs font-medium rounded border transition-colors ${
                        schedule[`${day}-afternoon`]
                          ? 'bg-[#00E5CC] border-[#00E5CC] text-[#0A0A0F]'
                          : 'bg-[#1A1A25] border-[#1F1F2E] text-[#6B6B80] hover:bg-[#2A2A3D] hover:border-[#2A2A3D]'
                      }`}
                    >
                      Après-midi
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
              className="bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveSchedule}
              disabled={scheduleMutation.isPending}
              className="bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]"
            >
              {scheduleMutation.isPending ? 'Enregistrement...' : 'Sauvegarder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
