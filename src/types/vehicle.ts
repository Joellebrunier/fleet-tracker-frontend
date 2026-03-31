export enum VehicleStatus {
  ACTIVE = 'active',
  IDLE = 'idle',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export interface VehicleLocation {
  lat: number
  lng: number
  accuracy: number
  heading: number
}

export interface VehicleStats {
  totalDistance: number
  averageSpeed: number
  maxSpeed: number
  totalFuelUsed: number
  engineHours: number
  idleTime: number
  harshAccelerations: number
  harshBrakings: number
}

export interface Vehicle {
  id: string
  name: string
  plate: string
  vin?: string | null
  brand?: string | null
  model?: string | null
  year?: number | null
  type?: string | null
  organizationId: string
  groupId?: string | null
  deviceImei?: string | null
  status: VehicleStatus
  currentLat?: number | null
  currentLng?: number | null
  currentSpeed: number
  currentHeading?: number | null
  lastCommunication?: string | null
  metadata?: Record<string, any> | null
  createdAt: string
  updatedAt: string

  // Computed/alias getters for backward compatibility
  /** @deprecated use plate */
  registrationNumber?: string
  /** @deprecated use currentSpeed */
  speed?: number
  /** @deprecated use lastCommunication */
  lastUpdate?: string | Date
  odometer?: number
  location?: VehicleLocation
  fuelLevel?: number
  batteryLevel?: number
  engineStatus?: 'running' | 'stopped'
  isGPSActive?: boolean
  features?: {
    hasGPS: boolean
    hasFuelSensor: boolean
    hasTemperatureSensor: boolean
    hasCrashSensor: boolean
  }
}

export interface VehicleGroup {
  id: string
  name: string
  description?: string
  organizationId: string
  color?: string
  icon?: string
  parentGroupId?: string
  vehicleCount: number
  createdAt: Date
  updatedAt: Date
}

export interface VehicleWithGroup extends Vehicle {
  group?: VehicleGroup
}

export interface VehicleFormData {
  vin: string
  registrationNumber: string
  name: string
  type: string
  manufacturer?: string
  model?: string
  year?: number
  color?: string
  groupId?: string
  driverId?: string
  features: {
    hasGPS: boolean
    hasFuelSensor: boolean
    hasTemperatureSensor: boolean
    hasCrashSensor: boolean
  }
}

export interface VehicleListQuery {
  page?: number
  limit?: number
  status?: VehicleStatus
  groupId?: string
  search?: string
  sortBy?: 'name' | 'status' | 'speed' | 'lastUpdate'
  sortOrder?: 'asc' | 'desc'
}

export interface Driver {
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

export interface MaintenanceRecord {
  id: string
  vehicleId: string
  type: 'oil_change' | 'tire_rotation' | 'inspection' | 'repair' | 'other'
  description: string
  odometer: number
  cost: number
  nextScheduled?: Date
  completedAt: Date
  createdAt: Date
  updatedAt: Date
}
