import { useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { API_ROUTES, STORAGE_KEYS } from '@/lib/constants';
export function useAuth() {
    const { user, token, isAuthenticated, isLoading, error, login, logout, setIsLoading, setError, hydrate, hasRole, canAccess, } = useAuthStore();
    // Fetch current user
    const { data: currentUser, isLoading: userLoading } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: async () => {
            const response = await apiClient.get(API_ROUTES.AUTH_ME);
            return response.data;
        },
        enabled: !!token && !user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            setIsLoading(true);
            try {
                const response = await apiClient.post(API_ROUTES.AUTH_LOGIN, credentials);
                const { user, token, refreshToken } = response.data;
                localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                login(user, token);
                setError(null);
                return { user, token, refreshToken };
            }
            catch (err) {
                const message = err.response?.data?.message || 'Login failed';
                setError(message);
                throw err;
            }
            finally {
                setIsLoading(false);
            }
        },
    });
    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (data) => {
            setIsLoading(true);
            try {
                const response = await apiClient.post(API_ROUTES.AUTH_REGISTER, data);
                const { user, token, refreshToken } = response.data;
                localStorage.setItem(STORAGE_KEYS.TOKEN, token);
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                login(user, token);
                setError(null);
                return { user, token, refreshToken };
            }
            catch (err) {
                const message = err.response?.data?.message || 'Registration failed';
                setError(message);
                throw err;
            }
            finally {
                setIsLoading(false);
            }
        },
    });
    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: async () => {
            try {
                await apiClient.post(API_ROUTES.AUTH_LOGOUT);
            }
            catch (err) {
                // Logout locally even if API call fails
            }
            finally {
                logout();
            }
        },
    });
    // Initialize auth from storage
    const initAuth = useCallback(() => {
        hydrate();
    }, [hydrate]);
    return {
        user: user || currentUser,
        token,
        isAuthenticated: isAuthenticated || !!currentUser,
        isLoading: isLoading || userLoading,
        error,
        // Methods
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout: logoutMutation.mutateAsync,
        initAuth,
        hasRole,
        canAccess,
        // Mutations
        loginMutation,
        registerMutation,
        logoutMutation,
    };
}
// Hook to check if user can access a feature
export function useCanAccess(requiredRoles) {
    const { canAccess } = useAuth();
    return canAccess(requiredRoles);
}
// Hook to check if user has a specific role
export function useHasRole(role) {
    const { hasRole } = useAuth();
    return hasRole(role);
}
//# sourceMappingURL=useAuth.js.map