export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T = any> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
declare class ApiClient {
    private instance;
    private refreshPromise;
    constructor();
    private getToken;
    private getRefreshToken;
    private setToken;
    private refreshToken;
    logout(): void;
    get<T = any>(url: string, config?: any): Promise<import("axios").AxiosResponse<T, any, {}>>;
    post<T = any>(url: string, data?: any, config?: any): Promise<import("axios").AxiosResponse<T, any, {}>>;
    put<T = any>(url: string, data?: any, config?: any): Promise<import("axios").AxiosResponse<T, any, {}>>;
    patch<T = any>(url: string, data?: any, config?: any): Promise<import("axios").AxiosResponse<T, any, {}>>;
    delete<T = any>(url: string, config?: any): Promise<import("axios").AxiosResponse<T, any, {}>>;
}
export declare const apiClient: ApiClient;
/**
 * Generic API request handler with error handling
 */
export declare function apiRequest<T = any>(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, data?: any): Promise<ApiResponse<T>>;
export {};
//# sourceMappingURL=api.d.ts.map