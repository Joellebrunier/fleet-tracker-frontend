import { create } from 'zustand';
import { MAP_DEFAULTS } from '@/lib/constants';
export const useMapStore = create((set) => ({
    selectedVehicleId: null,
    mapCenter: MAP_DEFAULTS.DEFAULT_CENTER,
    zoom: MAP_DEFAULTS.DEFAULT_ZOOM,
    mapStyle: MAP_DEFAULTS.MAP_STYLE,
    filters: {},
    showGeofences: true,
    showTrail: false,
    trailVehicleId: null,
    selectedGeofenceId: null,
    mapReady: false,
    selectVehicle: (vehicleId) => set({ selectedVehicleId: vehicleId }),
    setMapCenter: (center) => set({ mapCenter: center }),
    setZoom: (zoom) => set({ zoom }),
    setMapStyle: (style) => set({ mapStyle: style }),
    setFilters: (filters) => set({ filters }),
    toggleGeofences: (show) => set({ showGeofences: show }),
    toggleTrail: (show, vehicleId) => set({
        showTrail: show,
        trailVehicleId: vehicleId || null,
    }),
    selectGeofence: (geofenceId) => set({ selectedGeofenceId: geofenceId }),
    setMapReady: (ready) => set({ mapReady: ready }),
    resetView: () => set({
        selectedVehicleId: null,
        mapCenter: MAP_DEFAULTS.DEFAULT_CENTER,
        zoom: MAP_DEFAULTS.DEFAULT_ZOOM,
        filters: {},
        showTrail: false,
        trailVehicleId: null,
    }),
}));
//# sourceMappingURL=mapStore.js.map