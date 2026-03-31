interface MapFilter {
    status?: string;
    groupId?: string;
    searchTerm?: string;
}
interface MapState {
    selectedVehicleId: string | null;
    mapCenter: [number, number];
    zoom: number;
    mapStyle: string;
    filters: MapFilter;
    showGeofences: boolean;
    showTrail: boolean;
    trailVehicleId: string | null;
    selectedGeofenceId: string | null;
    mapReady: boolean;
    selectVehicle: (vehicleId: string | null) => void;
    setMapCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    setMapStyle: (style: string) => void;
    setFilters: (filters: MapFilter) => void;
    toggleGeofences: (show: boolean) => void;
    toggleTrail: (show: boolean, vehicleId?: string) => void;
    selectGeofence: (geofenceId: string | null) => void;
    setMapReady: (ready: boolean) => void;
    resetView: () => void;
}
export declare const useMapStore: import("zustand").UseBoundStore<import("zustand").StoreApi<MapState>>;
export {};
//# sourceMappingURL=mapStore.d.ts.map