// API Routes
export const API_ROUTES = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',

  // Vehicles
  VEHICLES: '/api/vehicles',
  VEHICLE_DETAIL: (id: string) => `/api/vehicles/${id}`,
  VEHICLE_POSITION: (id: string) => `/api/vehicles/${id}/position`,
  VEHICLE_HISTORY: (id: string) => `/api/vehicles/${id}/history`,
  VEHICLE_STATS: (id: string) => `/api/vehicles/${id}/stats`,

  // Vehicle Groups
  VEHICLE_GROUPS: '/api/vehicle-groups',
  VEHICLE_GROUP_DETAIL: (id: string) => `/api/vehicle-groups/${id}`,

  // Geofences
  GEOFENCES: '/api/geofences',
  GEOFENCE_DETAIL: (id: string) => `/api/geofences/${id}`,
  GEOFENCE_VIOLATIONS: (id: string) => `/api/geofences/${id}/violations`,

  // Alerts
  ALERTS: '/api/alerts',
  ALERT_DETAIL: (id: string) => `/api/alerts/${id}`,
  ALERT_ACKNOWLEDGE: (id: string) => `/api/alerts/${id}/acknowledge`,
  ALERT_RULES: '/api/alert-rules',
  ALERT_RULE_DETAIL: (id: string) => `/api/alert-rules/${id}`,

  // Reports
  REPORTS: '/api/reports',
  REPORT_GENERATE: '/api/reports/generate',
  REPORT_EXPORT: (id: string) => `/api/reports/${id}/export`,

  // Users
  USERS: '/api/users',
  USER_DETAIL: (id: string) => `/api/users/${id}`,
  USER_PROFILE: '/api/users/profile',

  // Organization
  ORGANIZATION: '/api/organization',
  ORGANIZATION_SETTINGS: '/api/organization/settings',
} as const;

// Map defaults
export const MAP_DEFAULTS = {
  DEFAULT_CENTER: [7.12, 43.7] as [number, number], // Nice, France
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 2,
  MAX_ZOOM: 20,
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
  SATELLITE_STYLE: 'mapbox://styles/mapbox/satellite-streets-v12',
  TERRAIN_STYLE: 'mapbox://styles/mapbox/outdoors-v12',
} as const;

// Pagination
export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
  MAX_PAGE_SIZE: 100,
} as const;

// Vehicle status
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  IDLE: 'idle',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
} as const;

// Alert severity
export const ALERT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

// Alert types
export const ALERT_TYPE = {
  GEOFENCE_ENTRY: 'geofence_entry',
  GEOFENCE_EXIT: 'geofence_exit',
  OVERSPEED: 'overspeed',
  IDLE_TIMEOUT: 'idle_timeout',
  OFFLINE: 'offline',
  LOW_BATTERY: 'low_battery',
  MAINTENANCE_DUE: 'maintenance_due',
  FUEL_ALERT: 'fuel_alert',
  HARSH_ACCELERATION: 'harsh_acceleration',
  HARSH_BRAKING: 'harsh_braking',
} as const;

// Geofence types
export const GEOFENCE_TYPE = {
  CIRCLE: 'circle',
  POLYGON: 'polygon',
  ROUTE: 'route',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'fleet-tracker_token',
  REFRESH_TOKEN: 'fleet-tracker_refresh_token',
  USER: 'fleet-tracker_user',
  PREFERENCES: 'fleet-tracker_preferences',
} as const;

// Date/time formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'HH:mm:ss',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Speed units
export const SPEED_UNITS = {
  KMH: 'km/h',
  MPH: 'mph',
  KN: 'kn',
} as const;

// Distance units
export const DISTANCE_UNITS = {
  KM: 'km',
  MI: 'mi',
  M: 'm',
} as const;

// Default speed limit for overspeed alert
export const DEFAULT_SPEED_LIMIT = 120; // km/h

// Realtime subscription intervals (ms)
export const REALTIME_INTERVALS = {
  POSITION_UPDATE: 5000,
  HEALTH_CHECK: 30000,
  RECONNECT_RETRY: 3000,
  MAX_RECONNECT_ATTEMPTS: 10,
} as const;
