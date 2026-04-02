import { useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { apiClient } from '@/lib/api'
import { User, AuthResponse, LoginRequest, RegisterRequest, UserRole } from '@/types/user'
import { API_ROUTES, STORAGE_KEYS } from '@/lib/constants'

// Backend wraps responses in { success, data, message }
interface ApiWrappedResponse<T> {
  success: boolean
  data: T
  message?: string
}

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    setIsLoading,
    setError,
    hydrate,
    hasRole,
    canAccess,
  } = useAuthStore()

  // Fetch current user
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<ApiWrappedResponse<User>>(API_ROUTES.AUTH_ME)
      return response.data?.data || response.data
    },
    enabled: !!token && !user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      setIsLoading(true)
      try {
        const response = await apiClient.post<ApiWrappedResponse<AuthResponse>>(API_ROUTES.AUTH_LOGIN, credentials)
        const wrapped = response.data
        const authData = wrapped.data || (wrapped as any)

        const accessToken = authData.accessToken || (authData as any).access_token || (authData as any).token
        const userData = authData.user

        // login() in the store normalizes snake_case fields and stores to localStorage
        login(userData, accessToken)
        setError(null)

        return { user: userData, token: accessToken }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Login failed'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      setIsLoading(true)
      try {
        const response = await apiClient.post<ApiWrappedResponse<AuthResponse>>(API_ROUTES.AUTH_REGISTER, data)
        const wrapped = response.data
        const authData = wrapped.data || (wrapped as any)

        const accessToken = authData.accessToken || (authData as any).access_token || (authData as any).token
        const userData = authData.user

        // login() in the store normalizes snake_case fields and stores to localStorage
        login(userData, accessToken)
        setError(null)

        return { user: userData, token: accessToken }
      } catch (err: any) {
        const message = err.response?.data?.message || 'Registration failed'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post(API_ROUTES.AUTH_LOGOUT)
      } catch (err) {
        // Logout locally even if API call fails
      } finally {
        logout()
      }
    },
  })

  // Initialize auth from storage
  const initAuth = useCallback(() => {
    hydrate()
  }, [hydrate])

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
  }
}

// Hook to check if user can access a feature
export function useCanAccess(requiredRoles: UserRole[]): boolean {
  const { canAccess } = useAuth()
  return canAccess(requiredRoles)
}

// Hook to check if user has a specific role
export function useHasRole(role: UserRole | UserRole[]): boolean {
  const { hasRole } = useAuth()
  return hasRole(role)
}
