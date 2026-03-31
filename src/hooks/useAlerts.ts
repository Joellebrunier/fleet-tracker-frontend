import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { Alert, AlertListQuery, AlertRule, AlertStats } from '@/types/alert'
import { PaginatedResponse } from '@/types/api'
import { API_ROUTES, PAGINATION_DEFAULTS } from '@/lib/constants'

const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (filters: AlertListQuery) => [...alertKeys.lists(), filters] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
  stats: ['alert-stats'] as const,
  rules: ['alert-rules'] as const,
}

// Get alerts list
export function useAlerts(filters: AlertListQuery = {}) {
  const {
    page = PAGINATION_DEFAULTS.DEFAULT_PAGE,
    limit = PAGINATION_DEFAULTS.DEFAULT_PAGE_SIZE,
    ...otherFilters
  } = filters

  return useQuery({
    queryKey: alertKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...otherFilters,
      } as any)

      const response = await apiClient.get<PaginatedResponse<Alert>>(
        `${API_ROUTES.ALERTS}?${params}`
      )
      return response.data
    },
    staleTime: 1000 * 10, // 10 seconds
  })
}

// Get single alert
export function useAlert(id: string) {
  return useQuery({
    queryKey: alertKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Alert>(API_ROUTES.ALERT_DETAIL(id))
      return response.data
    },
    enabled: !!id,
  })
}

// Get alert statistics
export function useAlertStats() {
  return useQuery({
    queryKey: alertKeys.stats,
    queryFn: async () => {
      const response = await apiClient.get<AlertStats>('/api/alerts/stats')
      return response.data
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

// Get alert rules
export function useAlertRules() {
  return useQuery({
    queryKey: alertKeys.rules,
    queryFn: async () => {
      const response = await apiClient.get<AlertRule[]>(API_ROUTES.ALERT_RULES)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Acknowledge alert
export function useAcknowledgeAlert(alertId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<Alert>(
        API_ROUTES.ALERT_ACKNOWLEDGE(alertId),
        {}
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.detail(alertId) })
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats })
    },
  })
}

// Bulk acknowledge alerts
export function useBulkAcknowledgeAlerts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (alertIds: string[]) => {
      const response = await apiClient.post('/api/alerts/acknowledge-bulk', {
        alertIds,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertKeys.stats })
    },
  })
}

// Create alert rule
export function useCreateAlertRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<AlertRule>) => {
      const response = await apiClient.post<AlertRule>(API_ROUTES.ALERT_RULES, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.rules })
    },
  })
}

// Update alert rule
export function useUpdateAlertRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<AlertRule>) => {
      const response = await apiClient.put<AlertRule>(
        API_ROUTES.ALERT_RULE_DETAIL(id),
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.rules })
    },
  })
}

// Delete alert rule
export function useDeleteAlertRule(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete(API_ROUTES.ALERT_RULE_DETAIL(id))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertKeys.rules })
    },
  })
}

// Get unacknowledged alerts count
export function useUnacknowledgedAlertsCount() {
  const { data } = useAlertStats()
  return data?.unacknowledged || 0
}
