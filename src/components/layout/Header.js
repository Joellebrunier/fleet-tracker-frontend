import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts';
import { useVehicles } from '@/hooks/useVehicles';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, User, Search, Bell, RefreshCw, Settings, Menu, Building2, ChevronDown, Check, MapPin } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { VehicleStatus } from '@/types/vehicle';
function StatusPill({ label, value, color }) {
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-white/60 text-xs font-medium uppercase tracking-wide", children: label }), _jsx("span", { className: `text-sm font-bold tabular-nums ${color || 'text-white'}`, children: value })] }));
}
export default function Header() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, logout, organizations, switchOrganization } = useAuth();
    const alertsCount = useUnacknowledgedAlertsCount();
    const { data: vehiclesData } = useVehicles({ limit: 1000 });
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [orgMenuOpen, setOrgMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const menuRef = useRef(null);
    const orgMenuRef = useRef(null);
    const currentOrgName = (organizations || []).find((o) => (o.organizationId || o.id) === user?.organizationId)?.name || 'Organisation';
    const vehicles = vehiclesData?.data || [];
    const totalVehicles = vehicles.length;
    const movingVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE && v.currentSpeed && v.currentSpeed > 0).length;
    const stoppedVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE && (!v.currentSpeed || v.currentSpeed === 0)).length;
    const notLocatedVehicles = vehicles.filter((v) => v.status === VehicleStatus.OFFLINE || !v.currentLat || !v.currentLng).length;
    const pausedVehicles = vehicles.filter((v) => v.status === VehicleStatus.IDLE || v.status === VehicleStatus.MAINTENANCE).length;
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        await queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
        setTimeout(() => setIsRefreshing(false), 800);
    };
    // Close menus on click outside
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
            if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
                setOrgMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
    // Keyboard shortcut for search
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);
    return (_jsxs(_Fragment, { children: [_jsx("header", { className: "sticky top-0 z-40 bg-gradient-to-r from-[#1a2540] to-[#243154] h-14 flex items-center px-4 lg:px-6 shadow-lg", children: _jsxs("div", { className: "flex items-center justify-between w-full gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [_jsx("button", { onClick: () => setSidebarOpen(!sidebarOpen), className: "md:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors", children: _jsx(Menu, { size: 20 }) }), _jsx("div", { className: "w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform", onClick: () => navigate('/'), children: _jsx(MapPin, { size: 16, className: "text-white" }) }), _jsxs("div", { className: "hidden sm:block cursor-pointer", onClick: () => navigate('/'), children: [_jsx("h1", { className: "text-white font-bold text-[14px] tracking-wider leading-none", children: "FLEET TRACK" }), _jsx("p", { className: "text-white/30 text-[9px] font-medium mt-0.5 tracking-widest uppercase", children: "G\u00E9olocalisation temps r\u00E9el" })] })] }), _jsxs("div", { className: "hidden lg:flex items-center gap-6 flex-1 justify-center", children: [_jsx(StatusPill, { label: "V\u00C9HICULES", value: totalVehicles }), _jsx(StatusPill, { label: "EN MOUVEMENT", value: movingVehicles, color: "text-emerald-400" }), _jsx(StatusPill, { label: "\u00C0 L'ARR\u00CAT", value: stoppedVehicles, color: "text-amber-400" }), _jsx(StatusPill, { label: "EN PAUSE", value: pausedVehicles, color: "text-orange-400" }), _jsx(StatusPill, { label: "NON LOCALIS\u00C9S", value: notLocatedVehicles, color: "text-red-400" })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs("button", { onClick: () => navigate('/alerts'), className: "relative flex items-center gap-1.5 px-2 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all", children: [_jsx(Bell, { size: 15 }), _jsx("span", { className: "text-[11px] font-medium hidden md:inline", children: "ALERTES" }), alertsCount > 0 && (_jsx("span", { className: "bg-red-500 text-white text-[9px] font-bold rounded-full h-[16px] min-w-[16px] flex items-center justify-center px-1", children: alertsCount > 99 ? '99+' : alertsCount }))] }), _jsxs("button", { onClick: handleRefresh, className: "flex items-center gap-1.5 px-2 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all", children: [_jsx(RefreshCw, { size: 15, className: isRefreshing ? 'animate-spin' : '' }), _jsx("span", { className: "text-[11px] font-medium hidden md:inline", children: "RAFRA\u00CECHIR" })] }), _jsx("button", { onClick: () => navigate('/settings'), className: "p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all", title: "Param\u00E8tres", children: _jsx(Settings, { size: 15 }) }), _jsx("div", { className: "w-px h-5 bg-white/10 mx-1" }), organizations && organizations.length > 0 && (_jsxs("div", { className: "relative", ref: orgMenuRef, children: [_jsxs("button", { onClick: () => setOrgMenuOpen(!orgMenuOpen), className: "flex items-center gap-2 h-8 px-3 rounded-lg bg-white/8 border border-white/10 text-white/70 hover:bg-white/12 hover:text-white transition-all text-xs", children: [_jsx(Building2, { size: 13 }), _jsx("span", { className: "hidden md:inline max-w-[100px] truncate text-[11px] font-medium", children: currentOrgName }), _jsx(ChevronDown, { size: 12, className: `transition-transform duration-200 ${orgMenuOpen ? 'rotate-180' : ''}` })] }), orgMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden z-50", style: { animation: 'fadeInDown 0.15s ease-out' }, children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50/50", children: _jsx("p", { className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider", children: "Organisations" }) }), _jsx("div", { className: "max-h-60 overflow-y-auto py-1", children: organizations.map((org) => {
                                                        const orgId = org.organizationId || org.id;
                                                        const isActive = orgId === user?.organizationId;
                                                        return (_jsxs("button", { onClick: async () => {
                                                                if (!isActive) {
                                                                    try {
                                                                        await switchOrganization(orgId);
                                                                        queryClient.invalidateQueries();
                                                                    }
                                                                    catch { }
                                                                }
                                                                setOrgMenuOpen(false);
                                                            }, className: `flex items-center justify-between w-full px-4 py-2.5 text-left text-sm transition-all ${isActive
                                                                ? 'bg-[#4361EE]/8 text-[#4361EE] font-semibold'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`, children: [_jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [_jsx("div", { className: `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${isActive ? 'bg-[#4361EE]/15 text-[#4361EE]' : 'bg-gray-100 text-gray-500'}`, children: (org.name || 'O')[0] }), _jsx("span", { className: "truncate text-[13px]", children: org.name || orgId })] }), isActive && _jsx(Check, { size: 14, className: "text-[#4361EE] shrink-0" })] }, orgId));
                                                    }) })] }))] })), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setUserMenuOpen(!userMenuOpen), className: "flex items-center gap-2.5 hover:opacity-90 transition-opacity pl-1", children: [_jsx("div", { className: "h-8 w-8 rounded-lg bg-gradient-to-br from-[#4361EE] to-[#6B8AFF] text-white flex items-center justify-center text-[11px] font-bold shadow-md", children: user && getInitials(`${user.firstName} ${user.lastName}`) }), _jsxs("div", { className: "hidden sm:block text-left", children: [_jsx("p", { className: "text-white text-[12px] font-semibold leading-none", children: user?.firstName }), _jsx("p", { className: "text-white/40 text-[10px] mt-0.5 capitalize", children: user?.role?.toLowerCase() })] })] }), userMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden", style: { animation: 'fadeInDown 0.15s ease-out' }, children: [_jsxs("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50/50", children: [_jsxs("p", { className: "text-sm font-semibold text-gray-900", children: [user?.firstName, " ", user?.lastName] }), _jsx("p", { className: "text-[11px] text-gray-400 mt-0.5", children: user?.email })] }), _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => { navigate('/settings'); setUserMenuOpen(false); }, className: "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors", children: [_jsx(User, { size: 15, className: "text-gray-400" }), _jsx("span", { className: "font-medium", children: "Mon profil" })] }), _jsxs("button", { onClick: () => { navigate('/settings'); setUserMenuOpen(false); }, className: "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors", children: [_jsx(Settings, { size: 15, className: "text-gray-400" }), _jsx("span", { className: "font-medium", children: "Param\u00E8tres" })] })] }), _jsx("div", { className: "border-t border-gray-100 py-1", children: _jsxs("button", { onClick: handleLogout, className: "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-red-50 transition-colors", children: [_jsx(LogOut, { size: 15 }), _jsx("span", { className: "font-medium", children: "D\u00E9connexion" })] }) })] }))] })] })] }) }), searchOpen && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-start justify-center pt-[12vh]", onClick: () => { setSearchOpen(false); setSearchQuery(''); }, children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-full max-w-xl mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200", onClick: (e) => e.stopPropagation(), style: { animation: 'fadeInDown 0.2s ease-out' }, children: [_jsxs("div", { className: "flex items-center gap-3 px-5 py-4 border-b border-gray-100", children: [_jsx(Search, { size: 18, className: "text-[#4361EE] shrink-0" }), _jsx("input", { type: "text", placeholder: "Rechercher v\u00E9hicules, conducteurs, alertes...", className: "flex-1 bg-transparent text-gray-900 text-sm font-medium placeholder:text-gray-300 focus:outline-none", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), autoFocus: true }), _jsx("kbd", { className: "text-[10px] font-mono text-gray-400 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5", children: "ESC" })] }), _jsxs("div", { className: "px-5 py-8 text-center", children: [_jsx(Search, { size: 32, className: "mx-auto text-gray-200 mb-3" }), _jsx("p", { className: "text-sm text-gray-400 font-medium", children: "Tapez pour rechercher..." }), _jsx("p", { className: "text-xs text-gray-300 mt-1", children: "V\u00E9hicules, plaques d'immatriculation, conducteurs" })] })] })] })), _jsx("style", { children: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` })] }));
}
//# sourceMappingURL=Header.js.map