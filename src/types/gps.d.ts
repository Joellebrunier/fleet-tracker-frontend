export declare enum GPSProvider {
    GPS = "gps",
    GLONASS = "glonass",
    GALILEO = "galileo",
    BEIDOU = "beidou",
    COMBINED = "combined"
}
export interface GPSPosition {
    id: string;
    vehicleId: string;
    lat: number;
    lng: number;
    altitude?: number;
    accuracy: number;
    heading: number;
    speed: number;
    provider: GPSProvider;
    satellites?: number;
    timestamp: Date;
    createdAt: Date;
}
export interface GPSHistory {
    id: string;
    vehicleId: string;
    positions: GPSPosition[];
    distance: number;
    duration: number;
    averageSpeed: number;
    maxSpeed: number;
    startTime: Date;
    endTime: Date;
    startAddress?: string;
    endAddress?: string;
}
export interface GPSRoute {
    vehicleId: string;
    positions: GPSPosition[];
    distance: number;
    duration: number;
    startTime: Date;
    endTime: Date;
}
export interface HistoryQuery {
    vehicleId: string;
    startDate: Date;
    endDate: Date;
    page?: number;
    limit?: number;
}
export interface PositionUpdate {
    vehicleId: string;
    lat: number;
    lng: number;
    speed: number;
    heading: number;
    timestamp: Date;
    accuracy?: number;
    altitude?: number;
}
export interface RouteInfo {
    distance: number;
    duration: number;
    avgSpeed: number;
    maxSpeed: number;
    minSpeed: number;
    waypoints: {
        lat: number;
        lng: number;
    }[];
}
//# sourceMappingURL=gps.d.ts.map