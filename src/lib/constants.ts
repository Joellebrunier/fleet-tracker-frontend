// TomTom configuration
export const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '9fFJXdBwrgdAawv56noq3ldNdnlXqTHv'

export const TOMTOM_TILE_URL = (style: string = 'basic') => {
  switch (style) {
    case 'satellite':
    case 'sat':
      return `https://api.tomtom.com/map/1/tile/sat/main/{z}/{x}/{y}.jpg?key=${TOMTOM_API_KEY}`
    case 'hybrid':
      return `https://api.tomtom.com/map/1/tile/hybrid/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
    case 'night':
    case 'dark':
      return `https://api.tomtom.com/map/1/tile/basic/night/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
    case 'labels':
      return `https://api.tomtom.com/map/1/tile/labels/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
    default:
      return `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
  }
}

export const TOMTOM_TRAFFIC_FLOW_URL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`
export const TOMTOM_TRAFFIC_INCIDENTS_URL = `https://api.tomtom.com/traffic/map/4/tile/incidents/s3/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`

// Legacy aliases for compatibility
export const MAPBOX_TOKEN = TOMTOM_API_KEY
export const MAPBOX_TILE_URL = TOMTOM_TILE_URL

// Helper to build org-scoped routes
const org = (orgId: string) => `/api/organizations/${orgId}`;

// API Routes
export const API_ROUTES = {
  // Auth (no org scope)
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  AUTH_ORGANIZATIONS: '/api/auth/organizations',
  AUTH_SWITCH_ORG: '/api/auth/switch-organization',

  // Organizations
  ORGANIZATIONS: '/api/organizations',
  ORGANIZATION: (orgId: string) => `/api/organizations/${orgId}`,
  ORGANIZATION_TREE: (orgId: string) => `/api/organizations/${orgId}/tree`,
  ORGANIZATION_ACCESSIBLE_IDS: (orgId: string) => `/api/organizations/${orgId}/accessible-ids`,
  SUB_CLIENTS: (orgId: string) => `/api/organizations/${orgId}/sub-clients`,
  PROVIDER_CREDENTIALS: (orgId: string) => `/api/organizations/${orgId}/provider-credentials`,
  PROVIDER_CREDENTIAL_DELETE: (orgId: string, provider: string) => `/api/organizations/${orgId}/provider-credentials/${provider}`,
  BULK_ASSIGN_VEHICLES: (orgId: string) => `${org(orgId)}/vehicles/bulk-assign`,
  BULK_UNASSIGN_VEHICLES: (orgId: string) => `${org(orgId)}/vehicles/bulk-unassign`,

  // Vehicles (org-scoped)
  VEHICLES: (orgId: string) => `${org(orgId)}/vehicles`,
  VEHICLE_DETAIL: (orgId: string, id: string) => `${org(orgId)}/vehicles/${id}`,
  VEHICLE_POSITION: (orgId: string, id: string) => `${org(orgId)}/vehicles/${id}/position`,

  // Geofences (org-scoped)
  GEOFENCES: (orgId: string) => `${org(orgId)}/geofences`,
  GEOFENCE_DETAIL: (orgId: string, id: string) => `${org(orgId)}/geofences/${id}`,
  GEOFENCE_ASSIGN_VEHICLE: (orgId: string, id: string, vehicleId: string) =>
    `${org(orgId)}/geofences/${id}/assign-vehicle/${vehicleId}`,

  // Alerts (org-scoped)
  ALERTS: (orgId: string) => `${org(orgId)}/alerts`,
  ALERT_ACKNOWLEDGE: (orgId: string, id: string) => `${org(orgId)}/alerts/${id}/acknowledge`,
  ALERT_ACKNOWLEDGE_MULTIPLE: (orgId: string) => `${org(orgId)}/alerts/acknowledge-multiple`,
  ALERT_RULES: (orgId: string) => `${org(orgId)}/alerts/rules`,
  ALERT_RULE_DETAIL: (orgId: string, ruleId: string) => `${org(orgId)}/alerts/rules/${ruleId}`,

  // GPS History (org-scoped)
  GPS_HISTORY: (orgId: string) => `${org(orgId)}/gps-history`,
  GPS_PLAYBACK: (orgId: string, vehicleId: string, startDate?: string, endDate?: string) => {
    const base = `${org(orgId)}/gps-history`
    const params = new URLSearchParams({ vehicleId })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    return `${base}?${params.toString()}`
  },

  // Reports (org-scoped)
  REPORTS_GENERATE: (orgId: string) => `${org(orgId)}/reports/generate`,

  // Users (org-scoped)
  USERS: (orgId: string) => `${org(orgId)}/users`,
  USER_DETAIL: (orgId: string, id: string) => `${org(orgId)}/users/${id}`,

  // Drivers (org-scoped)
  DRIVERS: (orgId: string) => `${org(orgId)}/drivers`,
  DRIVER_DETAIL: (orgId: string, id: string) => `${org(orgId)}/drivers/${id}`,
  DRIVER_STATS: (orgId: string, id: string) => `${org(orgId)}/drivers/${id}/stats`,

  // Departments (org-scoped)
  DEPARTMENTS: (orgId: string) => `${org(orgId)}/departments`,
  DEPARTMENT_DETAIL: (orgId: string, id: string) => `${org(orgId)}/departments/${id}`,

  // Vehicle Groups (org-scoped)
  VEHICLE_GROUPS: (orgId: string) => `${org(orgId)}/vehicle-groups`,
  VEHICLE_GROUP_DETAIL: (orgId: string, id: string) => `${org(orgId)}/vehicle-groups/${id}`,

  // GPS Providers (org-scoped)
  GPS_PROVIDERS: (orgId: string) => `${org(orgId)}/gps-providers`,
  GPS_PROVIDER_DETAIL: (orgId: string, provider: string) => `${org(orgId)}/gps-providers/${provider}`,

  // Sessions
  AUTH_SESSIONS: '/api/auth/sessions',
  AUTH_SESSION_DETAIL: (id: string) => `/api/auth/sessions/${id}`,

  // Super Admin
  SUPER_ADMIN_HEALTH: '/api/super-admin/health',
  SUPER_ADMIN_STATS: '/api/super-admin/stats',
} as const;

// Map defaults
export const MAP_DEFAULTS = {
  DEFAULT_CENTER: [7.12, 43.7] as [number, number], // Nice, France
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 2,
  MAX_ZOOM: 20,
  MAP_STYLE: 'basic',
  SATELLITE_STYLE: 'satellite',
  TERRAIN_STYLE: 'hybrid',
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
