interface UIState {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    locale: string;
    notifications: Array<{
        id: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    }>;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    setTheme: (theme: 'light' | 'dark') => void;
    setLocale: (locale: string) => void;
    addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
    removeNotification: (id: string) => void;
}
export declare const useUIStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UIState>>;
export {};
//# sourceMappingURL=uiStore.d.ts.map