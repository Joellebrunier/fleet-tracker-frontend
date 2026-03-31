import { Alert, AlertListQuery, AlertRule, AlertStats } from '@/types/alert';
import { PaginatedResponse } from '@/types/api';
export declare function useAlerts(filters?: AlertListQuery): import("@tanstack/react-query").UseQueryResult<PaginatedResponse<Alert>, Error>;
export declare function useAlert(id: string): import("@tanstack/react-query").UseQueryResult<Alert, Error>;
export declare function useAlertStats(): import("@tanstack/react-query").UseQueryResult<AlertStats, Error>;
export declare function useAlertRules(): import("@tanstack/react-query").UseQueryResult<AlertRule[], Error>;
export declare function useAcknowledgeAlert(alertId: string): import("@tanstack/react-query").UseMutationResult<Alert, Error, void, unknown>;
export declare function useBulkAcknowledgeAlerts(): import("@tanstack/react-query").UseMutationResult<any, Error, string[], unknown>;
export declare function useCreateAlertRule(): import("@tanstack/react-query").UseMutationResult<AlertRule, Error, Partial<AlertRule>, unknown>;
export declare function useUpdateAlertRule(id: string): import("@tanstack/react-query").UseMutationResult<AlertRule, Error, Partial<AlertRule>, unknown>;
export declare function useDeleteAlertRule(id: string): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
export declare function useUnacknowledgedAlertsCount(): number;
//# sourceMappingURL=useAlerts.d.ts.map