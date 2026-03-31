export enum GeofenceType {
  CIRCLE = 'circle',
  POLYGON = 'polygon',
  ROUTE = 'route',
}

export enum GeofenceEvent {
  ENTRY = 'entry',
  EXIT = 'exit',
  BOTH = 'both',
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface CircleGeofence {
  type: 'circle'
  center: Coordinates
  radiusMeters: number
}

export interface PolygonGeofence {
  type: 'polygon'
  points: Coordinates[]
}

export interface RouteGeofence {
  type: 'route'
  waypoints: Coordinates[]
  bufferMeters: number
}

export type GeofenceShape = CircleGeofence | PolygonGeofence | RouteGeofence

export interface Geofence {
  id: string
  name: string
  description?: string
  organizationId: string
  shape: GeofenceShape
  triggerEvent: GeofenceEvent
  isActive: boolean
  alertOnEntry: boolean
  alertOnExit: boolean
  notifyUsers: string[]
  vehicleIds?: string[]
  groupIds?: string[]
  metadata?: {
    category?: string
    purpose?: string
    color?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface GeofenceViolation {
  id: string
  geofenceId: string
  vehicleId: string
  type: 'entry' | 'exit'
  location: Coordinates
  timestamp: Date
  duration?: number // in seconds, for exit violations
  alertId?: string
  createdAt: Date
}

export interface VehicleGeofence {
  vehicleId: string
  geofenceId: string
  isInside: boolean
  entryTime?: Date
  exitTime?: Date
  updatedAt: Date
}

export interface GeofenceFormData {
  name: string
  description?: string
  shape: GeofenceShape
  triggerEvent: GeofenceEvent
  alertOnEntry: boolean
  alertOnExit: boolean
  notifyUsers: string[]
  vehicleIds?: string[]
  groupIds?: string[]
}

export interface GeofenceListQuery {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  category?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface GeofenceStats {
  total: number
  active: number
  violations: number
  vehiclesAssigned: number
}
