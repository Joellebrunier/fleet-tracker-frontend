import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Geofence, GeofenceFormData, GeofenceViolation, GeofenceStats } from '@/types/geofence'
import { PaginatedResponse } from '@/types/api'
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'

const geofenceKeys = {
  all: ['geofences'] as const,
  lists: () => [...geofenceKeys.all, 'list'] as const,
  list: (page?: number, limit?: number) => [...geofenceKeys.lists(), page, limit] as const,
  details: () => [...geofenceKeys.all, 'detail'] as const,
  detail: (id: string) => [...geofenceKeys.details(), id] as const,
  violations: (id: string) => [...geofenceKeys.detail(id), 'violations'] as const,
  stats: ['geofence-stats'] as const,
}

// Get geofences list
export function useGeofences(page = 1, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: geofenceKeys.list(page, limit),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      const response = await apiClient.get<PaginatedResponse<Geofence>>(
        `${API_ROUTES.GEOFENCES(orgId)}?${params}`
      )
      return response.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Get single geofence
export function useGeofence(id: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: geofenceKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Geofence>(API_ROUTES.GEOFENCE_DETAIL(orgId, id))
      return response.data
    },
    enabled: !!id,
  })
}

// Get geofence violations
// NOTE: GEOFENCE_VIOLATIONS route has been removed from the backend
// This functionality is no longer available
export function useGeofenceViolations(id: string) {
  return useQuery({
    queryKey: geofenceKeys.violations(id),
    queryFn: async () => {
      // Placeholder - returns empty result until endpoint is restored
      return { data: [], totalCount: 0 }
    },
    enabled: !!id,
  })
}

// Get geofence statistics
export function useGeofenceStats() {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  return useQuery({
    queryKey: geofenceKeys.stats,
    queryFn: async () => {
      const response = await apiClient.get<GeofenceStats>(`${API_ROUTES.GEOFENCES(orgId)}/stats`)
      return response.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

// Create geofence
export function useCreateGeofence() {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GeofenceFormData) => {
      const response = await apiClient.post<Geofence>(API_ROUTES.GEOFENCES(orgId), data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: geofenceKeys.stats })
    },
  })
}

// Update geofence
export function useUpdateGeofence(id: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<GeofenceFormData>) => {
      const response = await apiClient.put<Geofence>(
        API_ROUTES.GEOFENCE_DETAIL(orgId, id),
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() })
    },
  })
}

// Delete geofence
export function useDeleteGeofence(id: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ROUTES.GEOFENCE_DETAIL(orgId, id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() })
      queryClient.invalidateQueries({ queryKey: geofenceKeys.stats })
    },
  })
}

// Assign vehicles to geofence
export function useAssignVehiclesToGeofence(geofenceId: string) {
  const orgId = useAuthStore.getState().user?.organizationId || ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vehicleIds: string[]) => {
      const response = await apiClient.post(
        `${API_ROUTES.GEOFENCE_DETAIL(orgId, geofenceId)}/assign-vehicles`,
        { vehicleIds }
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.detail(geofenceId) })
    },
  })
}
