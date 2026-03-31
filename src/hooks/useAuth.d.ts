import { User, LoginRequest, RegisterRequest, UserRole } from '@/types/user';
export declare function useAuth(): {
    user: User | undefined;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: import("@tanstack/react-query").UseMutateAsyncFunction<{
        user: User;
        token: string;
        refreshToken: string;
    }, Error, LoginRequest, unknown>;
    register: import("@tanstack/react-query").UseMutateAsyncFunction<{
        user: User;
        token: string;
        refreshToken: string;
    }, Error, RegisterRequest, unknown>;
    logout: import("@tanstack/react-query").UseMutateAsyncFunction<void, Error, void, unknown>;
    initAuth: () => void;
    hasRole: (role: UserRole | UserRole[]) => boolean;
    canAccess: (requiredRoles: UserRole[]) => boolean;
    loginMutation: import("@tanstack/react-query").UseMutationResult<{
        user: User;
        token: string;
        refreshToken: string;
    }, Error, LoginRequest, unknown>;
    registerMutation: import("@tanstack/react-query").UseMutationResult<{
        user: User;
        token: string;
        refreshToken: string;
    }, Error, RegisterRequest, unknown>;
    logoutMutation: import("@tanstack/react-query").UseMutationResult<void, Error, void, unknown>;
};
export declare function useCanAccess(requiredRoles: UserRole[]): boolean;
export declare function useHasRole(role: UserRole | UserRole[]): boolean;
//# sourceMappingURL=useAuth.d.ts.map