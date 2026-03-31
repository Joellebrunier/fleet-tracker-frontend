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
    VEHICLE_DETAIL: (id) => `/api/vehicles/${id}`,
    VEHICLE_POSITION: (id) => `/api/vehicles/${id}/position`,
    VEHICLE_HISTORY: (id) => `/api/vehicles/${id}/history`,
    VEHICLE_STATS: (id) => `/api/vehicles/${id}/stats`,
    // Vehicle Groups
    VEHICLE_GROUPS: '/api/vehicle-groups',
    VEHICLE_GROUP_DETAIL: (id) => `/api/vehicle-groups/${id}`,
    // Geofences
    GEOFENCES: '/api/geofences',
    GEOFENCE_DETAIL: (id) => `/api/geofences/${id}`,
    GEOFENCE_VIOLATIONS: (id) => `/api/geofences/${id}/violations`,
    // Alerts
    ALERTS: '/api/alerts',
    ALERT_DETAIL: (id) => `/api/alerts/${id}`,
    ALERT_ACKNOWLEDGE: (id) => `/api/alerts/${id}/acknowledge`,
    ALERT_RULES: '/api/alert-rules',
    ALERT_RULE_DETAIL: (id) => `/api/alert-rules/${id}`,
    // Reports
    REPORTS: '/api/reports',
    REPORT_GENERATE: '/api/reports/generate',
    REPORT_EXPORT: (id) => `/api/reports/${id}/export`,
    // Users
    USERS: '/api/users',
    USER_DETAIL: (id) => `/api/users/${id}`,
    USER_PROFILE: '/api/users/profile',
    // Organization
    ORGANIZATION: '/api/organization',
    ORGANIZATION_SETTINGS: '/api/organization/settings',
};
// Map defaults
export const MAP_DEFAULTS = {
    DEFAULT_CENTER: [7.12, 43.7], // Nice, France
    DEFAULT_ZOOM: 12,
    MIN_ZOOM: 2,
    MAX_ZOOM: 20,
    MAP_STYLE: 'mapbox://styles/mapbox/streets-v12',
    SATELLITE_STYLE: 'mapbox://styles/mapbox/satellite-streets-v12',
    TERRAIN_STYLE: 'mapbox://styles/mapbox/outdoors-v12',
};
// Pagination
export const PAGINATION_DEFAULTS = {
    DEFAULT_PAGE_SIZE: 20,
    DEFAULT_PAGE: 1,
    MAX_PAGE_SIZE: 100,
};
// Vehicle status
export const VEHICLE_STATUS = {
    ACTIVE: 'active',
    IDLE: 'idle',
    OFFLINE: 'offline',
    MAINTENANCE: 'maintenance',
    INACTIVE: 'inactive',
};
// Alert severity
export const ALERT_SEVERITY = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
};
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
};
// Geofence types
export const GEOFENCE_TYPE = {
    CIRCLE: 'circle',
    POLYGON: 'polygon',
    ROUTE: 'route',
};
// Storage keys
export const STORAGE_KEYS = {
    TOKEN: 'fleet-tracker_token',
    REFRESH_TOKEN: 'fleet-tracker_refresh_token',
    USER: 'fleet-tracker_user',
    PREFERENCES: 'fleet-tracker_preferences',
};
// Date/time formats
export const DATE_FORMATS = {
    DISPLAY_DATE: 'MMM dd, yyyy',
    DISPLAY_TIME: 'HH:mm:ss',
    DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};
// Speed units
export const SPEED_UNITS = {
    KMH: 'km/h',
    MPH: 'mph',
    KN: 'kn',
};
// Distance units
export const DISTANCE_UNITS = {
    KM: 'km',
    MI: 'mi',
    M: 'm',
};
// Default speed limit for overspeed alert
export const DEFAULT_SPEED_LIMIT = 120; // km/h
// Realtime subscription intervals (ms)
export const REALTIME_INTERVALS = {
    POSITION_UPDATE: 5000,
    HEALTH_CHECK: 30000,
    RECONNECT_RETRY: 3000,
    MAX_RECONNECT_ATTEMPTS: 10,
};
//# sourceMappingURL=constants.js.map