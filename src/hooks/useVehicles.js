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
    const orgId = useAuthStore.getState().user?.organizationId
        || useAuthStore.getState().user?.organization_id
        || '';
    const { page = PAGINATION_DEFAULTS.DEFAULT_PAGE, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE, ...otherFilters } = filters;
    return useQuery({
        queryKey: vehicleKeys.list({ ...filters, _orgId: orgId }),
        queryFn: async () => {
            if (!orgId)
                return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
            // Filter out undefined, null, and empty string values to avoid sending invalid params
            const rawParams = {
                page: page.toString(),
                limit: limit.toString(),
            };
            for (const [key, value] of Object.entries(otherFilters)) {
                if (value !== undefined && value !== null && value !== '') {
                    rawParams[key] = String(value);
                }
            }
            const params = new URLSearchParams(rawParams);
            try {
                const response = await apiClient.get(`${API_ROUTES.VEHICLES(orgId)}?${params}`);
                const raw = response.data;
                // Handle different response formats:
                // 1. Already a PaginatedResponse: { data: [...], total, page, totalPages }
                if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.data)) {
                    return raw;
                }
                // 2. Flat array of vehicles (backend returned array directly)
                if (Array.isArray(raw)) {
                    return {
                        data: raw,
                        total: raw.length,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(raw.length / limit) || 1,
                    };
                }
                // 3. Nested: { vehicles: [...] } or { items: [...] }
                if (raw && typeof raw === 'object') {
                    const arr = raw.vehicles || raw.items || raw.results || [];
                    return {
                        data: Array.isArray(arr) ? arr : [],
                        total: raw.total || raw.count || (Array.isArray(arr) ? arr.length : 0),
                        page: raw.page || page,
                        limit: raw.limit || limit,
                        totalPages: raw.totalPages || Math.ceil((raw.total || 0) / limit) || 1,
                    };
                }
                // 4. Fallback
                return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
            }
            catch (err) {
                console.error('useVehicles fetch error:', err);
                return { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
            }
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 2, // 2 minutes — WebSocket handles real-time updates
        gcTime: 1000 * 60 * 10, // Keep in cache 10 minutes
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
export function useVehicleGroups() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: vehicleKeys.groups,
        queryFn: async () => {
            if (!orgId)
                return [];
            try {
                const response = await apiClient.get(API_ROUTES.VEHICLE_GROUPS(orgId));
                const raw = response.data;
                if (Array.isArray(raw))
                    return raw;
                if (raw && Array.isArray(raw.data))
                    return raw.data;
                if (raw && Array.isArray(raw.groups))
                    return raw.groups;
                return [];
            }
            catch {
                return [];
            }
        },
        enabled: !!orgId,
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