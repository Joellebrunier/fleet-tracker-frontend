import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Menu, X, Map, Truck, AlertCircle, Settings, BarChart3, Zap, Shield, Home, } from 'lucide-react';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
export default function Sidebar() {
    const location = useLocation();
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const { user, hasRole } = useAuth();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const isActive = (path) => location.pathname === path;
    const menuItems = [
        {
            label: 'Dashboard',
            icon: Home,
            path: '/',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER, UserRole.SUPER_ADMIN],
        },
        {
            label: 'Map',
            icon: Map,
            path: '/map',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.VIEWER, UserRole.SUPER_ADMIN],
        },
        {
            label: 'Vehicles',
            icon: Truck,
            path: '/vehicles',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER, UserRole.SUPER_ADMIN],
        },
        {
            label: 'Geofences',
            icon: Zap,
            path: '/geofences',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
        },
        {
            label: 'Alerts',
            icon: AlertCircle,
            path: '/alerts',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.VIEWER, UserRole.SUPER_ADMIN],
        },
        {
            label: 'Reports',
            icon: BarChart3,
            path: '/reports',
            roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN],
        },
    ];
    const adminItems = [
        {
            label: 'System Admin',
            icon: Shield,
            path: '/admin',
            roles: [UserRole.SUPER_ADMIN],
        },
    ];
    const visibleMenuItems = menuItems.filter((item) => item.roles.some((role) => hasRole(role)));
    const visibleAdminItems = adminItems.filter((item) => item.roles.some((role) => hasRole(role)));
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "fixed left-4 top-4 z-40 rounded-md bg-fleet-tracker-600 p-2 text-white lg:hidden", children: sidebarOpen ? _jsx(X, { size: 24 }) : _jsx(Menu, { size: 24 }) }), _jsxs("aside", { className: cn('fixed inset-y-0 left-0 z-30 w-64 border-r border-gray-200 bg-white transition-transform duration-300 ease-in-out lg:translate-x-0', sidebarOpen ? 'translate-x-0' : '-translate-x-full'), children: [_jsxs("div", { className: "border-b border-gray-200 p-6", children: [_jsx("h1", { className: "text-2xl font-bold text-fleet-tracker-600", children: "Fleet Tracker" }), _jsx("p", { className: "text-xs text-gray-500", children: "Fleet Management System" })] }), _jsxs("nav", { className: "space-y-2 p-4", children: [visibleMenuItems.map((item) => {
                                const Icon = item.icon;
                                return (_jsxs(Link, { to: item.path, onClick: () => setSidebarOpen(false), className: cn('flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors', isActive(item.path)
                                        ? 'bg-fleet-tracker-100 text-fleet-tracker-600'
                                        : 'text-gray-700 hover:bg-gray-100'), children: [_jsx(Icon, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: item.label })] }, item.path));
                            }), visibleAdminItems.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-4 border-t border-gray-200" }), visibleAdminItems.map((item) => {
                                        const Icon = item.icon;
                                        return (_jsxs(Link, { to: item.path, onClick: () => setSidebarOpen(false), className: cn('flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors', isActive(item.path)
                                                ? 'bg-red-100 text-red-600'
                                                : 'text-gray-700 hover:bg-gray-100'), children: [_jsx(Icon, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: item.label })] }, item.path));
                                    })] }))] }), _jsx("div", { className: "absolute bottom-0 w-full border-t border-gray-200 p-4", children: _jsxs(Link, { to: "/settings", onClick: () => setSidebarOpen(false), className: cn('flex items-center space-x-3 rounded-lg px-4 py-3 transition-colors', isActive('/settings')
                                ? 'bg-fleet-tracker-100 text-fleet-tracker-600'
                                : 'text-gray-700 hover:bg-gray-100'), children: [_jsx(Settings, { size: 20 }), _jsx("span", { className: "text-sm font-medium", children: "Settings" })] }) })] }), sidebarOpen && (_jsx("div", { className: "fixed inset-0 z-20 bg-black/50 lg:hidden", onClick: () => setSidebarOpen(false) }))] }));
}
//# sourceMappingURL=Sidebar.js.map