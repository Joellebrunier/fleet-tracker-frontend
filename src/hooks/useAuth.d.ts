import { User, LoginRequest, RegisterRequest, UserRole, OrgMembership } from '@/types/user';
export declare function useAuth(): {
    user: User | undefined;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    organizations: OrgMembership[];
    login: import("@tanstack/react-query").UseMutateAsyncFunction<{
        user: User;
        token: any;
    }, Error, LoginRequest, unknown>;
    register: import("@tanstack/react-query").UseMutateAsyncFunction<{
        user: User;
        token: any;
    }, Error, RegisterRequest, unknown>;
    logout: import("@tanstack/react-query").UseMutateAsyncFunction<void, Error, void, unknown>;
    switchOrganization: import("@tanstack/react-query").UseMutateAsyncFunction<{
        user: any;
        token: any;
    }, Error, string, unknown>;
    initAuth: () => void;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    canAccess: (requiredRoles: UserRole[]) => boolean;
    loginMutation: import("@tanstack/react-query").UseMutationResult<{
        user: User;
        token: any;
    }, Error, LoginRequest, unknown>;
    registerMutation: import("@tanstack/react-query").UseMutationResult<{
        user: User;
        token: any;
    }, Error, RegisterRequest, unknown>;
    logoutMutation: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
    switchOrganizationMutation: import("@tanstack/react-query").UseMutationResult<{
        user: any;
        token: any;
    }, Error, string, unknown>;
};
export declare function useCanAccess(requiredRoles: UserRole[]): boolean;
export declare function useHasRole(role: UserRole | UserRole[]): boolean;
//# sourceMappingURL=useAuth.d.ts.map