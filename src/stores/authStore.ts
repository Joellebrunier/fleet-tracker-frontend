import { create } from 'zustand'
import { User, UserRole, Organization, OrgMembership } from '@/types/user'
import { STORAGE_KEYS } from '@/lib/constants'

interface AuthState {
  user: User | null
  organization: Organization | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  /** All organizations the user belongs to (for org switcher) */
  organizations: OrgMembership[]

  // Actions
  setUser: (user: User | null) => void
  setOrganization: (org: Organization | null) => void
  setToken: (token: string | null) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOrganizations: (orgs: OrgMembership[]) => void
  login: (user: User, token: string, organizations?: OrgMembership[]) => void
  switchOrg: (user: User, token: string, organizations?: OrgMembership[]) => void
  logout: () => void
  hydrate: () => void
  hasRole: (role: UserRole | UserRole[]) => boolean
  canAccess: (requiredRoles: UserRole[]) => boolean
}

// Hydrate initial state synchronously from localStorage to avoid redirect race condition
function getInitialAuthState() {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    if (token && userStr) {
      const raw = JSON.parse(userStr)
      // Normalize: backend may return snake_case (organization_id) or camelCase (organizationId)
      const user: User = {
        ...raw,
        organizationId: raw.organizationId || raw.organization_id || '',
        role: raw.role ? (raw.role.toUpperCase() as any) : raw.role,
      }
      return { user, token, isAuthenticated: true }
    }
  } catch {
    // Invalid stored data — start fresh
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }
  return { user: null, token: null, isAuthenticated: false }
}

const initialAuth = getInitialAuthState()

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialAuth.user,
  organization: null,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: false,
  error: null,
  organizations: [],

  setUser: (user) => set({ user }),

  setOrganization: (organization) => set({ organization }),

  setOrganizations: (organizations) => set({ organizations }),

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

  login: (user, token, organizations) => {
    // Normalize snake_case fields from backend
    const normalizedUser: User = {
      ...user,
      organizationId: (user as any).organizationId || (user as any).organization_id || '',
      role: user.role ? (user.role.toUpperCase() as any) : user.role,
    }
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser))
    if (organizations) {
      localStorage.setItem('fleet-tracker_orgs', JSON.stringify(organizations))
    }
    set({
      user: normalizedUser,
      token,
      isAuthenticated: true,
      error: null,
      organizations: organizations || [],
    })
  },

  switchOrg: (user, token, organizations) => {
    const normalizedUser: User = {
      ...user,
      organizationId: (user as any).organizationId || (user as any).organization_id || '',
      role: user.role ? (user.role.toUpperCase() as any) : user.role,
    }
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(normalizedUser))
    if (organizations) {
      localStorage.setItem('fleet-tracker_orgs', JSON.stringify(organizations))
    }
    set({
      user: normalizedUser,
      token,
      isAuthenticated: true,
      organizations: organizations || get().organizations,
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
    const orgsStr = localStorage.getItem('fleet-tracker_orgs')

    if (token && userStr) {
      try {
        const raw = JSON.parse(userStr)
        const user: User = {
          ...raw,
          organizationId: raw.organizationId || raw.organization_id || '',
          role: raw.role ? (raw.role.toUpperCase() as any) : raw.role,
        }
        let organizations: OrgMembership[] = []
        if (orgsStr) {
          try { organizations = JSON.parse(orgsStr) } catch {}
        }
        set({
          user,
          token,
          isAuthenticated: true,
          organizations,
        })
      } catch (e) {
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
