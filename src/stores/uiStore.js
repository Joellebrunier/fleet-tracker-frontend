import { create } from 'zustand';
export const useUIStore = create((set, get) => ({
    sidebarOpen: true,
    theme: localStorage.getItem('fleet-tracker_theme') || 'light',
    locale: localStorage.getItem('fleet-tracker_locale') || 'en',
    notifications: [],
    toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
    },
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setTheme: (theme) => {
        localStorage.setItem('fleet-tracker_theme', theme);
        set({ theme });
        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    },
    setLocale: (locale) => {
        localStorage.setItem('fleet-tracker_locale', locale);
        set({ locale });
    },
    addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
            notifications: [...state.notifications, { ...notification, id }],
        }));
        // Auto remove after 5 seconds
        setTimeout(() => {
            get().removeNotification(id);
        }, 5000);
    },
    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },
}));
//# sourceMappingURL=uiStore.js.map