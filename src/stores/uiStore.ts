import { create } from 'zustand'
import { STORAGE_KEYS } from '@/lib/constants'

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  locale: string
  notifications: Array<{
    id: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>

  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
  setLocale: (locale: string) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  theme: (localStorage.getItem('fleet-tracker_theme') as 'light' | 'dark') || 'light',
  locale: (localStorage.getItem('fleet-tracker_locale') as string) || 'en',
  notifications: [],

  toggleSidebar: () => {
    const { sidebarOpen } = get()
    set({ sidebarOpen: !sidebarOpen })
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    localStorage.setItem('fleet-tracker_theme', theme)
    set({ theme })
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },

  setLocale: (locale) => {
    localStorage.setItem('fleet-tracker_locale', locale)
    set({ locale })
  },

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }))
    // Auto remove after 5 seconds
    setTimeout(() => {
      get().removeNotification(id)
    }, 5000)
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },
}))
