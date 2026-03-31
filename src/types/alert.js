export var AlertType;
(function (AlertType) {
    AlertType["GEOFENCE_ENTRY"] = "geofence_entry";
    AlertType["GEOFENCE_EXIT"] = "geofence_exit";
    AlertType["OVERSPEED"] = "overspeed";
    AlertType["IDLE_TIMEOUT"] = "idle_timeout";
    AlertType["OFFLINE"] = "offline";
    AlertType["LOW_BATTERY"] = "low_battery";
    AlertType["MAINTENANCE_DUE"] = "maintenance_due";
    AlertType["FUEL_ALERT"] = "fuel_alert";
    AlertType["HARSH_ACCELERATION"] = "harsh_acceleration";
    AlertType["HARSH_BRAKING"] = "harsh_braking";
    AlertType["ENGINE_OVERHEAT"] = "engine_overheat";
    AlertType["DOOR_OPENED"] = "door_opened";
    AlertType["UNAUTHORIZED_MOVEMENT"] = "unauthorized_movement";
})(AlertType || (AlertType = {}));
export var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["CRITICAL"] = "critical";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["LOW"] = "low";
    AlertSeverity["INFO"] = "info";
})(AlertSeverity || (AlertSeverity = {}));
//# sourceMappingURL=alert.js.map