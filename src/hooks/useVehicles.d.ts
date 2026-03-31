import { Vehicle, VehicleListQuery, VehicleFormData, VehicleGroup } from '@/types/vehicle';
import { PaginatedResponse } from '@/types/api';
export declare function useVehicles(filters?: VehicleListQuery): import("@tanstack/react-query").UseQueryResult<PaginatedResponse<Vehicle>, Error>;
export declare function useVehicle(id: string): import("@tanstack/react-query").UseQueryResult<Vehicle, Error>;
export declare function useVehiclePosition(id: string, enabled?: boolean): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useVehicleHistory(id: string, dateFrom?: Date, dateTo?: Date): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useVehicleStats(id: string): import("@tanstack/react-query").UseQueryResult<any, Error>;
export declare function useVehicleGroups(): import("@tanstack/react-query").UseQueryResult<VehicleGroup[], Error>;
export declare function useCreateVehicle(): import("@tanstack/react-query").UseMutationResult<Vehicle, Error, VehicleFormData, unknown>;
export declare function useUpdateVehicle(id: string): import("@tanstack/react-query").UseMutationResult<Vehicle, Error, Partial<VehicleFormData>, unknown>;
export declare function useDeleteVehicle(id: string): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
export declare function useBulkUpdateVehicles(): import("@tanstack/react-query").UseMutationResult<any, Error, {
    vehicleIds: string[];
    updates: Partial<VehicleFormData>;
}, unknown>;
//# sourceMappingURL=useVehicles.d.ts.map