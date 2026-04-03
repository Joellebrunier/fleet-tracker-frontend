export declare const MAPBOX_TOKEN: any;
export declare const MAPBOX_TILE_URL: (style?: string) => string;
export declare const API_ROUTES: {
    readonly AUTH_LOGIN: "/api/auth/login";
    readonly AUTH_REGISTER: "/api/auth/register";
    readonly AUTH_REFRESH: "/api/auth/refresh";
    readonly AUTH_LOGOUT: "/api/auth/logout";
    readonly AUTH_ME: "/api/auth/me";
    readonly ORGANIZATIONS: "/api/organizations";
    readonly ORGANIZATION: (orgId: string) => string;
    readonly VEHICLES: (orgId: string) => string;
    readonly VEHICLE_DETAIL: (orgId: string, id: string) => string;
    readonly VEHICLE_POSITION: (orgId: string, id: string) => string;
    readonly GEOFENCES: (orgId: string) => string;
    readonly GEOFENCE_DETAIL: (orgId: string, id: string) => string;
    readonly GEOFENCE_ASSIGN_VEHICLE: (orgId: string, id: string, vehicleId: string) => string;
    readonly ALERTS: (orgId: string) => string;
    readonly ALERT_ACKNOWLEDGE: (orgId: string, id: string) => string;
    readonly ALERT_ACKNOWLEDGE_MULTIPLE: (orgId: string) => string;
    readonly ALERT_RULES: (orgId: string) => string;
    readonly ALERT_RULE_DETAIL: (orgId: string, ruleId: string) => string;
    readonly GPS_HISTORY: (orgId: string) => string;
    readonly GPS_PLAYBACK: (orgId: string, vehicleId: string) => string;
    readonly REPORTS_GENERATE: (orgId: string) => string;
    readonly USERS: (orgId: string) => string;
    readonly USER_DETAIL: (orgId: string, id: string) => string;
    readonly DRIVERS: (orgId: string) => string;
    readonly DRIVER_DETAIL: (orgId: string, id: string) => string;
    readonly DRIVER_STATS: (orgId: string, id: string) => string;
    readonly DEPARTMENTS: (orgId: string) => string;
    readonly DEPARTMENT_DETAIL: (orgId: string, id: string) => string;
    readonly VEHICLE_GROUPS: (orgId: string) => string;
    readonly VEHICLE_GROUP_DETAIL: (orgId: string, id: string) => string;
    readonly GPS_PROVIDERS: (orgId: string) => string;
    readonly GPS_PROVIDER_DETAIL: (orgId: string, provider: string) => string;
    readonly AUTH_SESSIONS: "/api/auth/sessions";
    readonly AUTH_SESSION_DETAIL: (id: string) => string;
    readonly SUPER_ADMIN_HEALTH: "/api/super-admin/health";
    readonly SUPER_ADMIN_STATS: "/api/super-admin/stats";
};
export declare const MAP_DEFAULTS: {
    readonly DEFAULT_CENTER: [number, number];
    readonly DEFAULT_ZOOM: 12;
    readonly MIN_ZOOM: 2;
    readonly MAX_ZOOM: 20;
    readonly MAP_STYLE: "mapbox://styles/mapbox/streets-v12";
    readonly SATELLITE_STYLE: "mapbox://styles/mapbox/satellite-streets-v12";
    readonly TERRAIN_STYLE: "mapbox://styles/mapbox/outdoors-v12";
};
export declare const PAGINATION_DEFAULTS: {
    readonly DEFAULT_PAGE_SIZE: 20;
    readonly DEFAULT_PAGE: 1;
    readonly MAX_PAGE_SIZE: 100;
};
export declare const VEHICLE_STATUS: {
    readonly ACTIVE: "active";
    readonly IDLE: "idle";
    readonly OFFLINE: "offline";
    readonly MAINTENANCE: "maintenance";
    readonly INACTIVE: "inactive";
};
export declare const ALERT_SEVERITY: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly INFO: "info";
};
export declare const ALERT_TYPE: {
    readonly GEOFENCE_ENTRY: "geofence_entry";
    readonly GEOFENCE_EXIT: "geofence_exit";
    readonly OVERSPEED: "overspeed";
    readonly IDLE_TIMEOUT: "idle_timeout";
    readonly OFFLINE: "offline";
    readonly LOW_BATTERY: "low_battery";
    readonly MAINTENANCE_DUE: "maintenance_due";
    readonly FUEL_ALERT: "fuel_alert";
    readonly HARSH_ACCELERATION: "harsh_acceleration";
    readonly HARSH_BRAKING: "harsh_braking";
};
export declare const GEOFENCE_TYPE: {
    readonly CIRCLE: "circle";
    readonly POLYGON: "polygon";
    readonly ROUTE: "route";
};
export declare const STORAGE_KEYS: {
    readonly TOKEN: "fleet-tracker_token";
    readonly REFRESH_TOKEN: "fleet-tracker_refresh_token";
    readonly USER: "fleet-tracker_user";
    readonly PREFERENCES: "fleet-tracker_preferences";
};
export declare const DATE_FORMATS: {
    readonly DISPLAY_DATE: "MMM dd, yyyy";
    readonly DISPLAY_TIME: "HH:mm:ss";
    readonly DISPLAY_DATETIME: "MMM dd, yyyy HH:mm";
    readonly ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx";
};
export declare const SPEED_UNITS: {
    readonly KMH: "km/h";
    readonly MPH: "mph";
    readonly KN: "kn";
};
export declare const DISTANCE_UNITS: {
    readonly KM: "km";
    readonly MI: "mi";
    readonly M: "m";
};
export declare const DEFAULT_SPEED_LIMIT = 120;
export declare const REALTIME_INTERVALS: {
    readonly POSITION_UPDATE: 5000;
    readonly HEALTH_CHECK: 30000;
    readonly RECONNECT_RETRY: 3000;
    readonly MAX_RECONNECT_ATTEMPTS: 10;
};
//# sourceMappingURL=constants.d.ts.map