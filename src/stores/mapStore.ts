import { create } from 'zustand'
import { MAP_DEFAULTS } from '@/lib/constants'

interface MapFilter {
  status?: string
  groupId?: string
  searchTerm?: string
}

interface MapState {
  selectedVehicleId: string | null
  mapCenter: [number, number]
  zoom: number
  mapStyle: string
  filters: MapFilter
  showGeofences: boolean
  showTrail: boolean
  trailVehicleId: string | null
  selectedGeofenceId: string | null
  mapReady: boolean

  // Actions
  selectVehicle: (vehicleId: string | null) => void
  setMapCenter: (center: [number, number]) => void
  setZoom: (zoom: number) => void
  setMapStyle: (style: string) => void
  setFilters: (filters: MapFilter) => void
  toggleGeofences: (show: boolean) => void
  toggleTrail: (show: boolean, vehicleId?: string) => void
  selectGeofence: (geofenceId: string | null) => void
  setMapReady: (ready: boolean) => void
  resetView: () => void
}

export const useMapStore = create<MapState>((set) => ({
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

  toggleTrail: (show, vehicleId) =>
    set({
      showTrail: show,
      trailVehicleId: vehicleId || null,
    }),

  selectGeofence: (geofenceId) => set({ selectedGeofenceId: geofenceId }),

  setMapReady: (ready) => set({ mapReady: ready }),

  resetView: () =>
    set({
      selectedVehicleId: null,
      mapCenter: MAP_DEFAULTS.DEFAULT_CENTER,
      zoom: MAP_DEFAULTS.DEFAULT_ZOOM,
      filters: {},
      showTrail: false,
      trailVehicleId: null,
    }),
}))
