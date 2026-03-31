export declare enum VehicleStatus {
    ACTIVE = "active",
    IDLE = "idle",
    OFFLINE = "offline",
    MAINTENANCE = "maintenance",
    INACTIVE = "inactive"
}
export interface VehicleLocation {
    lat: number;
    lng: number;
    accuracy: number;
    heading: number;
}
export interface VehicleStats {
    totalDistance: number;
    averageSpeed: number;
    maxSpeed: number;
    totalFuelUsed: number;
    engineHours: number;
    idleTime: number;
    harshAccelerations: number;
    harshBrakings: number;
}
export interface Vehicle {
    id: string;
    vin: string;
    registrationNumber: string;
    name: string;
    type: 'car' | 'truck' | 'bus' | 'motorcycle' | 'van' | 'other';
    manufacturer?: string;
    model?: string;
    year?: number;
    color?: string;
    organizationId: string;
    groupId?: string;
    driverId?: string;
    status: VehicleStatus;
    location: VehicleLocation;
    speed: number;
    lastUpdate: Date;
    odometer: number;
    fuelLevel?: number;
    batteryLevel?: number;
    temperature?: number;
    engineStatus: 'running' | 'stopped';
    isGPSActive: boolean;
    features: {
        hasGPS: boolean;
        hasFuelSensor: boolean;
        hasTemperatureSensor: boolean;
        hasCrashSensor: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface VehicleGroup {
    id: string;
    name: string;
    description?: string;
    organizationId: string;
    color?: string;
    icon?: string;
    parentGroupId?: string;
    vehicleCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface VehicleWithGroup extends Vehicle {
    group?: VehicleGroup;
}
export interface VehicleFormData {
    vin: string;
    registrationNumber: string;
    name: string;
    type: string;
    manufacturer?: string;
    model?: string;
    year?: number;
    color?: string;
    groupId?: string;
    driverId?: string;
    features: {
        hasGPS: boolean;
        hasFuelSensor: boolean;
        hasTemperatureSensor: boolean;
        hasCrashSensor: boolean;
    };
}
export interface VehicleListQuery {
    page?: number;
    limit?: number;
    status?: VehicleStatus;
    groupId?: string;
    search?: string;
    sortBy?: 'name' | 'status' | 'speed' | 'lastUpdate';
    sortOrder?: 'asc' | 'desc';
}
export interface Driver {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    licenseNumber: string;
    licenseExpiry: Date;
    organizationId: string;
    assignedVehicleId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MaintenanceRecord {
    id: string;
    vehicleId: string;
    type: 'oil_change' | 'tire_rotation' | 'inspection' | 'repair' | 'other';
    description: string;
    odometer: number;
    cost: number;
    nextScheduled?: Date;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=vehicle.d.ts.map