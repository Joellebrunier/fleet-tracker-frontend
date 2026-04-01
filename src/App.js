import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { UserRole } from '@/types/user';
// Layout
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import MapPage from '@/pages/MapPage';
import VehiclesPage from '@/pages/VehiclesPage';
import VehicleDetailPage from '@/pages/VehicleDetailPage';
import VehicleGroupsPage from '@/pages/VehicleGroupsPage';
import DriversPage from '@/pages/DriversPage';
import GeofencesPage from '@/pages/GeofencesPage';
import AlertsPage from '@/pages/AlertsPage';
import ReportsPage from '@/pages/ReportsPage';
import SettingsPage from '@/pages/SettingsPage';
import SuperAdminPage from '@/pages/SuperAdminPage';
function App() {
    const { initAuth, isAuthenticated } = useAuth();
    const { theme, setTheme } = useUIStore();
    // Initialize auth on app load
    useEffect(() => {
        initAuth();
    }, [initAuth]);
    // Apply theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        }
        else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: isAuthenticated ? _jsx(Navigate, { to: "/", replace: true }) : _jsx(LoginPage, {}) }), _jsxs(Route, { element: _jsx(AppLayout, {}), children: [_jsx(Route, { path: "/", element: _jsx(ProtectedRoute, { children: _jsx(DashboardPage, {}) }) }), _jsx(Route, { path: "/map", element: _jsx(ProtectedRoute, { children: _jsx(MapPage, {}) }) }), _jsx(Route, { path: "/vehicles", element: _jsx(ProtectedRoute, { children: _jsx(VehiclesPage, {}) }) }), _jsx(Route, { path: "/vehicles/:id", element: _jsx(ProtectedRoute, { children: _jsx(VehicleDetailPage, {}) }) }), _jsx(Route, { path: "/vehicle-groups", element: _jsx(ProtectedRoute, { children: _jsx(VehicleGroupsPage, {}) }) }), _jsx(Route, { path: "/drivers", element: _jsx(ProtectedRoute, { children: _jsx(DriversPage, {}) }) }), _jsx(Route, { path: "/geofences", element: _jsx(ProtectedRoute, { children: _jsx(GeofencesPage, {}) }) }), _jsx(Route, { path: "/alerts", element: _jsx(ProtectedRoute, { children: _jsx(AlertsPage, {}) }) }), _jsx(Route, { path: "/reports", element: _jsx(ProtectedRoute, { children: _jsx(ReportsPage, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { children: _jsx(SettingsPage, {}) }) }), _jsx(Route, { path: "/admin", element: _jsx(ProtectedRoute, { requiredRoles: [UserRole.SUPER_ADMIN], children: _jsx(SuperAdminPage, {}) }) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
export default App;
//# sourceMappingURL=App.js.map