import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants';
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
    const { page = PAGINATION_DEFAULTS.DEFAULT_PAGE, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE, ...otherFilters } = filters;
    return useQuery({
        queryKey: vehicleKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...otherFilters,
            });
            const response = await apiClient.get(`${API_ROUTES.VEHICLES}?${params}`);
            return response.data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}
// Get single vehicle
export function useVehicle(id) {
    return useQuery({
        queryKey: vehicleKeys.detail(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_DETAIL(id));
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 30,
    });
}
// Get vehicle position
export function useVehiclePosition(id, enabled = true) {
    return useQuery({
        queryKey: vehicleKeys.position(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_POSITION(id));
            return response.data;
        },
        enabled: !!id && enabled,
        refetchInterval: 5000, // Real-time updates
    });
}
// Get vehicle history
export function useVehicleHistory(id, dateFrom, dateTo) {
    return useQuery({
        queryKey: vehicleKeys.history(id),
        queryFn: async () => {
            const params = new URLSearchParams();
            if (dateFrom)
                params.append('dateFrom', dateFrom.toISOString());
            if (dateTo)
                params.append('dateTo', dateTo.toISOString());
            const response = await apiClient.get(`${API_ROUTES.VEHICLE_HISTORY(id)}?${params}`);
            return response.data;
        },
        enabled: !!id,
    });
}
// Get vehicle stats
export function useVehicleStats(id) {
    return useQuery({
        queryKey: vehicleKeys.stats(id),
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_STATS(id));
            return response.data;
        },
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
    });
}
// Get vehicle groups
export function useVehicleGroups() {
    return useQuery({
        queryKey: vehicleKeys.groups,
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.VEHICLE_GROUPS);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Create vehicle
export function useCreateVehicle() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(API_ROUTES.VEHICLES, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
// Update vehicle
export function useUpdateVehicle(id) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.put(API_ROUTES.VEHICLE_DETAIL(id), data);
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
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiClient.delete(API_ROUTES.VEHICLE_DETAIL(id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
// Bulk operations
export function useBulkUpdateVehicles() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post('/api/vehicles/bulk-update', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() });
        },
    });
}
//# sourceMappingURL=useVehicles.js.map