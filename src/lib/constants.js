// Mapbox configuration
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const MAPBOX_TILE_URL = (style = 'streets-v12') => `https://api.mapbox.com/styles/v1/mapbox/${style}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
// Helper to build org-scoped routes
const org = (orgId) => `/api/organizations/${orgId}`;
// API Routes
export const API_ROUTES = {
    // Auth (no org scope)
    AUTH_LOGIN: '/api/auth/login',
    AUTH_REGISTER: '/api/auth/register',
    AUTH_REFRESH: '/api/auth/refresh',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_ME: '/api/auth/me',
    // Organizations
    ORGANIZATIONS: '/api/organizations',
    ORGANIZATION: (orgId) => `/api/organizations/${orgId}`,
    // Vehicles (org-scoped)
    VEHICLES: (orgId) => `${org(orgId)}/vehicles`,
    VEHICLE_DETAIL: (orgId, id) => `${org(orgId)}/vehicles/${id}`,
    VEHICLE_POSITION: (orgId, id) => `${org(orgId)}/vehicles/${id}/position`,
    // Geofences (org-scoped)
    GEOFENCES: (orgId) => `${org(orgId)}/geofences`,
    GEOFENCE_DETAIL: (orgId, id) => `${org(orgId)}/geofences/${id}`,
    GEOFENCE_ASSIGN_VEHICLE: (orgId, id, vehicleId) => `${org(orgId)}/geofences/${id}/assign-vehicle/${vehicleId}`,
    // Alerts (org-scoped)
    ALERTS: (orgId) => `${org(orgId)}/alerts`,
    ALERT_ACKNOWLEDGE: (orgId, id) => `${org(orgId)}/alerts/${id}/acknowledge`,
    ALERT_ACKNOWLEDGE_MULTIPLE: (orgId) => `${org(orgId)}/alerts/acknowledge-multiple`,
    ALERT_RULES: (orgId) => `${org(orgId)}/alerts/rules`,
    ALERT_RULE_DETAIL: (orgId, ruleId) => `${org(orgId)}/alerts/rules/${ruleId}`,
    // GPS History (org-scoped)
    GPS_HISTORY: (orgId) => `${org(orgId)}/gps-history`,
    GPS_PLAYBACK: (orgId, vehicleId) => `${org(orgId)}/gps-history/${vehicleId}/playback`,
    // Reports (org-scoped)
    REPORTS_GENERATE: (orgId) => `${org(orgId)}/reports/generate`,
    // Users (org-scoped)
    USERS: (orgId) => `${org(orgId)}/users`,
    USER_DETAIL: (orgId, id) => `${org(orgId)}/users/${id}`,
    // Super Admin
    SUPER_ADMIN_HEALTH: '/api/super-admin/health',
    SUPER_ADMIN_STATS: '/api/super-admin/stats',
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