export enum AlertType {
  GEOFENCE_ENTRY = 'geofence_entry',
  GEOFENCE_EXIT = 'geofence_exit',
  OVERSPEED = 'overspeed',
  IDLE_TIMEOUT = 'idle_timeout',
  OFFLINE = 'offline',
  LOW_BATTERY = 'low_battery',
  MAINTENANCE_DUE = 'maintenance_due',
  FUEL_ALERT = 'fuel_alert',
  HARSH_ACCELERATION = 'harsh_acceleration',
  HARSH_BRAKING = 'harsh_braking',
  ENGINE_OVERHEAT = 'engine_overheat',
  DOOR_OPENED = 'door_opened',
  UNAUTHORIZED_MOVEMENT = 'unauthorized_movement',
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface Alert {
  id: string
  vehicleId: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  isAcknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolvedAt?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AlertRule {
  id: string
  organizationId: string
  name: string
  description?: string
  enabled: boolean
  type: AlertType
  severity: AlertSeverity
  condition: AlertCondition
  actions: AlertAction[]
  vehicleIds?: string[]
  groupIds?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface AlertCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'contains'
  value: any
  duration?: number // in seconds, for threshold-based alerts
}

export interface AlertAction {
  type: 'email' | 'sms' | 'push' | 'webhook'
  target: string
}

export interface AlertListQuery {
  page?: number
  limit?: number
  vehicleId?: string
  type?: AlertType
  severity?: AlertSeverity
  status?: 'acknowledged' | 'unacknowledged' | 'resolved'
  dateFrom?: Date
  dateTo?: Date
  search?: string
  sortBy?: 'createdAt' | 'severity' | 'type'
  sortOrder?: 'asc' | 'desc'
}

export interface AlertStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
  acknowledged: number
  unacknowledged: number
}

export interface AlertNotification {
  id: string
  alert: Alert
  userId: string
  method: 'email' | 'sms' | 'push'
  status: 'pending' | 'sent' | 'failed'
  sentAt?: Date
  error?: string
}
