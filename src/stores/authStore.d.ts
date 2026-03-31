import { User, UserRole, Organization } from '@/types/user';
interface AuthState {
    user: User | null;
    organization: Organization | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    setUser: (user: User | null) => void;
    setOrganization: (org: Organization | null) => void;
    setToken: (token: string | null) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    hydrate: () => void;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    canAccess: (requiredRoles: UserRole[]) => boolean;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=authStore.d.ts.map