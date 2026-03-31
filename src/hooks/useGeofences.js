import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants';
const geofenceKeys = {
    all: ['geofences'],
    lists: () => [...geofenceKeys.all, 'list'],
    list: (page, limit) => [...geofenceKeys.lists(), page, limit],
    details: () => [...geofenceKeys.all, 'detail'],
    detail: (id) => [...geofenceKeys.details(), id],
    violations: (id) => [...geofenceKeys.detail(id), 'violations'],
    stats: ['geofence-stats'],
};
// Get geofences list
export function useGeofences(page = 1, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE) {
    return useQuery({
        queryKey: geofenceKeys.list(page, limit),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            const response = await apiClient.get(`${API_ROUTES.GEOFENCES}?${params}`);
            return response.data;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}
// Get single geofence
export function useGeofence(id) {
    return useQuery({
        queryKey: geofenceKeys.detail(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.GEOFENCE_DETAIL(id));
            return response.data;
        },
        enabled: !!id,
    });
}
// Get geofence violations
export function useGeofenceViolations(id) {
    return useQuery({
        queryKey: geofenceKeys.violations(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.GEOFENCE_VIOLATIONS(id));
            return response.data;
        },
        enabled: !!id,
    });
}
// Get geofence statistics
export function useGeofenceStats() {
    return useQuery({
        queryKey: geofenceKeys.stats,
        queryFn: async () => {
            const response = await apiClient.get('/api/geofences/stats');
            return response.data;
        },
        staleTime: 1000 * 60, // 1 minute
    });
}
// Create geofence
export function useCreateGeofence() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(API_ROUTES.GEOFENCES, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: geofenceKeys.stats });
        },
    });
}
// Update geofence
export function useUpdateGeofence(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.put(API_ROUTES.GEOFENCE_DETAIL(id), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geofenceKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() });
        },
    });
}
// Delete geofence
export function useDeleteGeofence(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiClient.delete(API_ROUTES.GEOFENCE_DETAIL(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() });
            queryClient.invalidateQueries({ queryKey: geofenceKeys.stats });
        },
    });
}
// Assign vehicles to geofence
export function useAssignVehiclesToGeofence(geofenceId) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (vehicleIds) => {
            const response = await apiClient.post(`${API_ROUTES.GEOFENCE_DETAIL(geofenceId)}/assign-vehicles`, { vehicleIds });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: geofenceKeys.detail(geofenceId) });
        },
    });
}
//# sourceMappingURL=useGeofences.js.map