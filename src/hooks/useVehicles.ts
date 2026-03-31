import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Vehicle, VehicleListQuery, VehicleFormData, VehicleGroup } from '@/types/vehicle'
import { PaginatedResponse } from '@/types/api'
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants'

// Query keys
const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (filters: VehicleListQuery) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, 'detail'] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  position: (id: string) => [...vehicleKeys.detail(id), 'position'] as const,
  history: (id: string) => [...vehicleKeys.detail(id), 'history'] as const,
  stats: (id: string) => [...vehicleKeys.detail(id), 'stats'] as const,
  groups: ['vehicle-groups'] as const,
}

// Get vehicles list
export function useVehicles(filters: VehicleListQuery = {}) {
  const {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
    ...otherFilters
  } = filters

  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...otherFilters,
      } as any)

      const response = await apiClient.get<PaginatedResponse<Vehicle>>(
        `${API_ROUTES.VEHICLES}?${params}`
      )
      return response.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get single vehicle
export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Vehicle>(API_ROUTES.VEHICLE_DETAIL(id))
      return response.data
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

// Get vehicle position
export function useVehiclePosition(id: string, enabled = true) {
  return useQuery({
    queryKey: vehicleKeys.position(id),
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.VEHICLE_POSITION(id))
      return response.data
    },
    enabled: !!id && enabled,
    refetchInterval: 5000, // Real-time updates
  })
}

// Get vehicle history
export function useVehicleHistory(id: string, dateFrom?: Date, dateTo?: Date) {
  return useQuery({
    queryKey: vehicleKeys.history(id),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
      if (dateTo) params.append('dateTo', dateTo.toISOString())

      const response = await apiClient.get(
        `${API_ROUTES.VEHICLE_HISTORY(id)}?${params}`
      )
      return response.data
    },
    enabled: !!id,
  })
}

// Get vehicle stats
export function useVehicleStats(id: string) {
  return useQuery({
    queryKey: vehicleKeys.stats(id),
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.VEHICLE_STATS(id))
      return response.data
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get vehicle groups
export function useVehicleGroups() {
  return useQuery({
    queryKey: vehicleKeys.groups,
    queryFn: async () => {
      const response = await apiClient.get<VehicleGroup[]>(API_ROUTES.VEHICLE_GROUPS)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Create vehicle
export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await apiClient.post<Vehicle>(API_ROUTES.VEHICLES, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

// Update vehicle
export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<VehicleFormData>) => {
      const response = await apiClient.put<Vehicle>(
        API_ROUTES.VEHICLE_DETAIL(id),
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

// Delete vehicle
export function useDeleteVehicle(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ROUTES.VEHICLE_DETAIL(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

// Bulk operations
export function useBulkUpdateVehicles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      vehicleIds: string[]
      updates: Partial<VehicleFormData>
    }) => {
      const response = await apiClient.post('/api/vehicles/bulk-update', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}
