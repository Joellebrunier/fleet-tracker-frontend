import { Geofence, GeofenceFormData, GeofenceViolation, GeofenceStats } from '@/types/geofence';
import { PaginatedResponse } from '@/types/api';
export declare function useGeofences(page?: number, limit?: 20): import("@tanstack/react-query").UseQueryResult<PaginatedResponse<Geofence>, Error>;
export declare function useGeofence(id: string): import("@tanstack/react-query").UseQueryResult<Geofence, Error>;
export declare function useGeofenceViolations(id: string): import("@tanstack/react-query").UseQueryResult<PaginatedResponse<GeofenceViolation>, Error>;
export declare function useGeofenceStats(): import("@tanstack/react-query").UseQueryResult<GeofenceStats, Error>;
export declare function useCreateGeofence(): import("@tanstack/react-query").UseMutationResult<Geofence, Error, GeofenceFormData, unknown>;
export declare function useUpdateGeofence(id: string): import("@tanstack/react-query").UseMutationResult<Geofence, Error, Partial<GeofenceFormData>, unknown>;
export declare function useDeleteGeofence(id: string): import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
export declare function useAssignVehiclesToGeofence(geofenceId: string): import("@tanstack/react-query").UseMutationResult<any, Error, string[], unknown>;
//# sourceMappingURL=useGeofences.d.ts.map