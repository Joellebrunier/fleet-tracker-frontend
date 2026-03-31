import { create } from 'zustand'
import { User, UserRole, Organization } from '@/types/user'
import { STORAGE_KEYS } from '@/lib/constants'

interface AuthState {
  user: User | null
  organization: Organization | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setToken: (token: string | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  hydrate: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  canAccess: (requiredRoles: UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  organization: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  setOrganization: (organization) => set({ organization }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
    }
    set({ token })
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  login: (user, token) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    set({
      user,
      token,
      isAuthenticated: true,
      error: null,
    })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    set({
      user: null,
      organization: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  hydrate: () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({
          user,
          token,
          isAuthenticated: true,
        })
      } catch (e) {
        // Invalid stored data
        get().logout()
      }
    }
  },

  hasRole: (role) => {
    const { user } = get()
    if (!user) return false

    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  },

  canAccess: (requiredRoles) => {
    const { user } = get()
    if (!user) return false

    // Super admin can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return true
    }

    return requiredRoles.includes(user.role)
  },
}))
