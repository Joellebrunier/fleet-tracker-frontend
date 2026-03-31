import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
const alertKeys = {
    all: ['alerts'],
    lists: () => [...alertKeys.all, 'list'],
    list: (filters) => [...alertKeys.lists(), filters],
    details: () => [...alertKeys.all, 'detail'],
    detail: (id) => [...alertKeys.details(), id],
    stats: ['alert-stats'],
    rules: ['alert-rules'],
};
// Get alerts list
export function useAlerts(filters = {}) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const { page = PAGINATION_DEFAULTS.DEFAULT_PAGE, limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE, ...otherFilters } = filters;
    return useQuery({
        queryKey: alertKeys.list(filters),
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...otherFilters,
            });
            const response = await apiClient.get(`${API_ROUTES.ALERTS(orgId)}?${params}`);
            return response.data;
        },
        staleTime: 1000 * 10, // 10 seconds
    });
}
// Get single alert
// NOTE: ALERT_DETAIL route has been removed - use ALERTS with filter instead
export function useAlert(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: alertKeys.detail(id),
        queryFn: async () => {
            const params = new URLSearchParams({ alertId: id });
            const response = await apiClient.get(`${API_ROUTES.ALERTS(orgId)}?${params}`);
            // Return first alert from results, or create empty alert object
            return response.data?.data?.[0] || {};
        },
        enabled: !!id,
    });
}
// Get alert statistics
export function useAlertStats() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: alertKeys.stats,
        queryFn: async () => {
            const response = await apiClient.get(`${API_ROUTES.ALERTS(orgId)}/stats`);
            return response.data;
        },
        staleTime: 1000 * 30, // 30 seconds
    });
}
// Get alert rules
export function useAlertRules() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    return useQuery({
        queryKey: alertKeys.rules,
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.ALERT_RULES(orgId));
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}
// Acknowledge alert
export function useAcknowledgeAlert(alertId) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await apiClient.post(API_ROUTES.ALERT_ACKNOWLEDGE(orgId, alertId), {});
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.detail(alertId) });
            queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
            queryClient.invalidateQueries({ queryKey: alertKeys.stats });
        },
    });
}
// Bulk acknowledge alerts
export function useBulkAcknowledgeAlerts() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (alertIds) => {
            const response = await apiClient.post(API_ROUTES.ALERT_ACKNOWLEDGE_MULTIPLE(orgId), {
                alertIds,
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
            queryClient.invalidateQueries({ queryKey: alertKeys.stats });
        },
    });
}
// Create alert rule
export function useCreateAlertRule() {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.post(API_ROUTES.ALERT_RULES(orgId), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.rules });
        },
    });
}
// Update alert rule
export function useUpdateAlertRule(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await apiClient.put(API_ROUTES.ALERT_RULE_DETAIL(orgId, id), data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.rules });
        },
    });
}
// Delete alert rule
export function useDeleteAlertRule(id) {
    const orgId = useAuthStore.getState().user?.organizationId || '';
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            await apiClient.delete(API_ROUTES.ALERT_RULE_DETAIL(orgId, id));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: alertKeys.rules });
        },
    });
}
// Get unacknowledged alerts count
export function useUnacknowledgedAlertsCount() {
    const { data } = useAlertStats();
    return data?.unacknowledged || 0;
}
//# sourceMappingURL=useAlerts.js.map