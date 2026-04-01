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
import { UserCircle, Plus, Search, Phone, Mail, Car, Shield, Clock, Star, Edit2, Trash2 } from 'lucide-react'
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

interface DriverFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  assignedVehicleId?: string
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
  const [formData, setFormData] = useState<DriverFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
  })

  // Mock performance scores
  const performanceScores: Record<string, PerformanceScore> = {
    safety: { safety: 85, efficiency: 72, punctuality: 91 },
    efficiency: { safety: 78, efficiency: 88, punctuality: 79 },
    punctuality: { safety: 92, efficiency: 75, punctuality: 94 },
  }

  // Mock driver statuses
  const driverStatuses: Record<string, DriverStatus> = {}

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
    })
  }

  const handleFormChange = useCallback(
    (field: keyof DriverFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
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
    if (confirm('Are you sure you want to delete this driver?')) {
      await deleteMutation.mutateAsync(driverId)
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

    const status = driverStatuses[driver.id] || 'active'
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
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'on_leave':
        return 'On Leave'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Drivers</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your fleet drivers and their performance metrics
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Driver
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10"
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
                className="capitalize"
              >
                {status === 'all' ? 'All' : getStatusLabel(status as DriverStatus)}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Failed to load drivers</p>
          </CardContent>
        </Card>
      ) : filteredDrivers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCircle className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-slate-600">
              {searchQuery || statusFilter !== 'all'
                ? 'No drivers match your search or filter'
                : 'No drivers yet. Create one to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDrivers.map((driver) => {
            const status = driverStatuses[driver.id] || 'active'
            const performance = performanceScores.safety
            const licenseExpired =
              new Date(driver.licenseExpiry) < new Date()

            return (
              <Card
                key={driver.id}
                className="flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <UserCircle className="h-10 w-10 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">
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
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{driver.phone}</span>
                    </div>
                  </div>

                  {/* License Info */}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Shield className="h-4 w-4" />
                      License
                    </div>
                    <div className="space-y-1 text-sm text-slate-600">
                      <div>
                        <span className="font-medium">Number:</span>{' '}
                        {driver.licenseNumber}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Expires:</span>
                        <span
                          className={
                            licenseExpired
                              ? 'text-red-600 font-semibold'
                              : 'text-slate-600'
                          }
                        >
                          {new Date(driver.licenseExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Vehicle */}
                  {driver.assignedVehicleId && (
                    <div className="border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Car className="h-4 w-4 flex-shrink-0" />
                        <span>Vehicle assigned</span>
                      </div>
                    </div>
                  )}

                  {/* Performance Scores */}
                  <div className="border-t border-slate-200 pt-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Star className="h-4 w-4" />
                      Performance
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Safety</span>
                        <span className="font-semibold text-slate-900">
                          {performance.safety}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${performance.safety}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Efficiency
                        </span>
                        <span className="font-semibold text-slate-900">
                          {performance.efficiency}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${performance.efficiency}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">
                          Punctuality
                        </span>
                        <span className="font-semibold text-slate-900">
                          {performance.punctuality}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500"
                          style={{ width: `${performance.punctuality}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Actions */}
                <div className="border-t border-slate-200 px-6 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenModal(driver)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(driver.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver' : 'Create New Driver'}
            </DialogTitle>
            <DialogDescription>
              {editingDriver
                ? 'Update driver information and details'
                : 'Add a new driver to your fleet'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    handleFormChange('firstName', e.target.value)
                  }
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    handleFormChange('lastName', e.target.value)
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                License Number
              </label>
              <Input
                value={formData.licenseNumber}
                onChange={(e) =>
                  handleFormChange('licenseNumber', e.target.value)
                }
                placeholder="DL123456789"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                License Expiry
              </label>
              <Input
                type="date"
                value={formData.licenseExpiry}
                onChange={(e) =>
                  handleFormChange('licenseExpiry', e.target.value)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={upsertMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending
                ? 'Saving...'
                : editingDriver
                  ? 'Update Driver'
                  : 'Create Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
