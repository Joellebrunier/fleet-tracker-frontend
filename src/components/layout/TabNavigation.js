import { jsx as _jsx } from "react/jsx-runtime";
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
const TAB_ITEMS = [
    { label: 'CARTE', path: '/map', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'TABLEAU DE BORD', path: '/', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'ALERTES', path: '/alerts', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
    { label: 'ADMINISTRATION', path: '/admin', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
    { label: 'CONDUCTEURS', path: '/drivers', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN] },
    { label: 'SUPPORT', path: '/help', roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.SUPER_ADMIN] },
];
export default function TabNavigation() {
    const location = useLocation();
    const { hasRole } = useAuth();
    const visibleTabs = TAB_ITEMS.filter((tab) => tab.roles.some((role) => hasRole(role)));
    const isActive = (path) => location.pathname === path;
    return (_jsx("nav", { className: "sticky top-14 z-30 bg-white border-b border-gray-200 h-12 flex items-center px-6 overflow-x-auto no-scrollbar", children: _jsx("div", { className: "flex items-center gap-8", children: visibleTabs.map((tab) => {
                const active = isActive(tab.path);
                return (_jsx("a", { href: tab.path, className: cn('text-sm font-semibold whitespace-nowrap py-3 px-1 border-b-2 transition-colors', active
                        ? 'text-[#4361EE] border-[#4361EE]'
                        : 'text-[#6B7280] border-transparent hover:text-gray-900'), children: tab.label }, tab.path));
            }) }) }));
}
//# sourceMappingURL=TabNavigation.js.map