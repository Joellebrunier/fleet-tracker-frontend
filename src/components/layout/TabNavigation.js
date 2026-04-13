import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVehicles } from '@/hooks/useVehicles';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
const TAB_ITEMS = [
    { label: 'CARTE', path: '/map', countKey: 'map', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'TABLEAU DE BORD', path: '/', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'ALERTES', path: '/alerts', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'FOURRIÈRES', path: '/fourrieres', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'RAPPORTS', path: '/reports', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'ADMINISTRATION', path: '/admin', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'CONDUCTEURS', path: '/drivers', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { label: 'SUPPORT', path: '/help', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'ÉQUIPE', path: '/organizations', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
];
export default function TabNavigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = useAuth();
    const { data: vehiclesData } = useVehicles({ limit: 1000 });
    const vehiclesWithGps = (vehiclesData?.data || []).filter((v) => v.currentLat && v.currentLng).length;
    const visibleTabs = TAB_ITEMS.filter((tab) => tab.roles.some((role) => hasRole(role)));
    const isActive = (path) => {
        if (path === '/')
            return location.pathname === '/';
        return location.pathname.startsWith(path);
    };
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    };
    return (_jsxs("nav", { className: "sticky top-14 z-30 bg-white border-b border-gray-200 h-11 flex items-center justify-between px-4 overflow-x-auto no-scrollbar", children: [_jsx("div", { className: "flex items-center gap-1", children: visibleTabs.map((tab) => {
                    const active = isActive(tab.path);
                    return (_jsxs("button", { onClick: (e) => { e.preventDefault(); navigate(tab.path); }, className: cn('flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold whitespace-nowrap transition-all', active
                            ? 'bg-[#4361EE] text-white'
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'), children: [tab.label, tab.countKey === 'map' && (_jsx("span", { className: `text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}`, children: vehiclesWithGps }))] }, tab.path));
                }) }), _jsxs("button", { onClick: handleRefresh, className: "flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-[12px] font-semibold transition-all shrink-0", children: [_jsx(RefreshCw, { size: 13 }), "RAFRA\u00CECHIR"] })] }));
}
//# sourceMappingURL=TabNavigation.js.map