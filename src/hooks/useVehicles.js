import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
// Query keys
const vehicleKeys = {
    all: ['vehicles'],
    lists: () => [...vehicleKeys.all, 'list'],
    list: (filters) => [...vehicleKeys.lists(), filters],
    details: () => [...vehicleKeys.all, 'detail'],
    detail: (id) => [...vehicleKeys.details(), id],
    position: (id) => [...vehicleKeys.detail(id), 'position'],
    history: (id) => [...vehicleKeys.detail(id), 'history'],
    stats: (id) => [...vehicleKeys.detail(id), 'stats'],
    groups: ['vehicle-groups'],
};
// Get vehicles list
export function useVehicles(filters = {}) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const { page = PAGINATION_DEFAULTS.DEFAULT_PAGE, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE, ...otherFilters } = filters;
    return useQuery({
        queryKey: vehicleKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...otherFilters,
            });
            const response = await apiClient.get(`${API_ROUTES.VEHICLES(orgId)}?${params}`);
            return response.data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}
// Get single vehicle
export function useVehicle(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: vehicleKeys.detail(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_DETAIL(orgId, id));
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 30,
    });
}
// Get vehicle position
export function useVehiclePosition(id, enabled = true) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: vehicleKeys.position(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_POSITION(orgId, id));
            return response.data;
        },
        enabled: !!id && enabled,
        refetchInterval: 5000, // Real-time updates
    });
}
// Get vehicle history
export function useVehicleHistory(id, dateFrom, dateTo) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: vehicleKeys.history(id),
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('vehicleId', id);
            if (dateFrom)
                params.append('dateFrom', dateFrom.toISOString());
            if (dateTo)
                params.append('dateTo', dateTo.toISOString());
            const response = await apiClient.get(`${API_ROUTES.GPS_HISTORY(orgId)}?${params}`);
            return response.data;
        },
        enabled: !!id,
    });
}
// Get vehicle stats
// NOTE: VEHICLE_STATS route has been removed from the backend
// This hook is deprecated - stats are now included in vehicle detail or GPS_HISTORY endpoints
export function useVehicleStats(id) {
    return useQuery({
        queryKey: vehicleKeys.stats(id),
        queryFn: async () => {
            // Placeholder - returns null until endpoint is restored or replaced
            return null;
        },
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
    });
}
// Get vehicle groups
// NOTE: VEHICLE_GROUPS route has been removed from the backend
// This functionality has been deprecated
export function useVehicleGroups() {
    return useQuery({
        queryKey: vehicleKeys.groups,
        queryFn: async () => {
            // Placeholder - returns empty array until endpoint is restored
            return [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Create vehicle
export function useCreateVehicle() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(API_ROUTES.VEHICLES(orgId), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
// Update vehicle
export function useUpdateVehicle(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.put(API_ROUTES.VEHICLE_DETAIL(orgId, id), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
// Delete vehicle
export function useDeleteVehicle(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiClient.delete(API_ROUTES.VEHICLE_DETAIL(orgId, id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
// Bulk operations
export function useBulkUpdateVehicles() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(`${API_ROUTES.VEHICLES(orgId)}/bulk-update`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
//# sourceMappingURL=useVehicles.js.map