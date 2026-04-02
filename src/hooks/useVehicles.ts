import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Vehicle, VehicleListQuery, VehicleFormData, VehicleGroup } from '@/types/vehicle'
import { PaginatedResponse } from '@/types/api'
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'

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
  const orgId = useAuthStore.getState().user?.organizationId
    || (useAuthStore.getState().user as any)?.organization_id
    || ''
  const {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
    ...otherFilters
  } = filters

  return useQuery({
    queryKey: vehicleKeys.list({ ...filters, _orgId: orgId } as any),
    queryFn: async () => {
      if (!orgId) return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as any

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...otherFilters,
      } as any)

      try {
        const response = await apiClient.get(
          `${API_ROUTES.VEHICLES(orgId)}?${params}`
        )
        const raw = response.data

        // Handle different response formats:
        // 1. Already a PaginatedResponse: { data: [...], total, page, totalPages }
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.data)) {
          return raw as any
        }
        // 2. Flat array of vehicles (backend returned array directly)
        if (Array.isArray(raw)) {
          return {
            data: raw as Vehicle[],
            total: raw.length,
            page: page,
            limit: limit,
            totalPages: Math.ceil(raw.length / limit) || 1,
          } as any
        }
        // 3. Nested: { vehicles: [...] } or { items: [...] }
        if (raw && typeof raw === 'object') {
          const arr = raw.vehicles || raw.items || raw.results || []
          return {
            data: Array.isArray(arr) ? arr : [],
            total: raw.total || raw.count || (Array.isArray(arr) ? arr.length : 0),
            page: raw.page || page,
            limit: raw.limit || limit,
            totalPages: raw.totalPages || Math.ceil((raw.total || 0) / limit) || 1,
          } as any
        }
        // 4. Fallback
        return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as any
      } catch (err) {
        console.error('useVehicles fetch error:', err)
        return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 } as any
      }
    },
    enabled: !!orgId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get single vehicle
export function useVehicle(id: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Vehicle>(API_ROUTES.VEHICLE_DETAIL(orgId, id))
      return response.data
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })
}

// Get vehicle position
export function useVehiclePosition(id: string, enabled = true) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: vehicleKeys.position(id),
    queryFn: async () => {
      const response = await apiClient.get(API_ROUTES.VEHICLE_POSITION(orgId, id))
      return response.data
    },
    enabled: !!id && enabled,
    refetchInterval: 5000, // Real-time updates
  })
}

// Get vehicle history
export function useVehicleHistory(id: string, dateFrom?: Date, dateTo?: Date) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: vehicleKeys.history(id),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('vehicleId', id)
      if (dateFrom) params.append('dateFrom', dateFrom.toISOString())
      if (dateTo) params.append('dateTo', dateTo.toISOString())

      const response = await apiClient.get(
        `${API_ROUTES.GPS_HISTORY(orgId)}?${params}`
      )
      return response.data
    },
    enabled: !!id,
  })
}

// Get vehicle stats
// NOTE: VEHICLE_STATS route has been removed from the backend
// This hook is deprecated - stats are now included in vehicle detail or GPS_HISTORY endpoints
export function useVehicleStats(id: string) {
  return useQuery({
    queryKey: vehicleKeys.stats(id),
    queryFn: async () => {
      // Placeholder - returns null until endpoint is restored or replaced
      return null
    },
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get vehicle groups
// NOTE: VEHICLE_GROUPS route has been removed from the backend
// This functionality has been deprecated
export function useVehicleGroups() {
  return useQuery({
    queryKey: vehicleKeys.groups,
    queryFn: async () => {
      // Placeholder - returns empty array until endpoint is restored
      return []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Create vehicle
export function useCreateVehicle() {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: VehicleFormData) => {
      const response = await apiClient.post<Vehicle>(API_ROUTES.VEHICLES(orgId), data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

// Update vehicle
export function useUpdateVehicle(id: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<VehicleFormData>) => {
      const response = await apiClient.put<Vehicle>(
        API_ROUTES.VEHICLE_DETAIL(orgId, id),
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
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ROUTES.VEHICLE_DETAIL(orgId, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}

// Bulk operations
export function useBulkUpdateVehicles() {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      vehicleIds: string[]
      updates: Partial<VehicleFormData>
    }) => {
      const response = await apiClient.post(`${API_ROUTES.VEHICLES(orgId)}/bulk-update`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
    },
  })
}
