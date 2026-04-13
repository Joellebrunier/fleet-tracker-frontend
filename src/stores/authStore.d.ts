import { User, UserRole, Organization, OrgMembership } from '@/types/user';
interface AuthState {
    user: User | null;
    organization: Organization | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    /** All organizations the user belongs to (for org switcher) */
    organizations: OrgMembership[];
    setUser: (user: User | null) => void;
    setOrganization: (org: Organization | null) => void;
    setToken: (token: string | null) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setOrganizations: (orgs: OrgMembership[]) => void;
    login: (user: User, token: string, organizations?: OrgMembership[]) => void;
    switchOrg: (user: User, token: string, organizations?: OrgMembership[]) => void;
    logout: () => void;
    hydrate: () => void;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    canAccess: (requiredRoles: UserRole[]) => boolean;
}
export declare const useAuthStore: import("zustand").UseBoundStore<import("zustand").StoreApi<AuthState>>;
export {};
//# sourceMappingURL=authStore.d.ts.map