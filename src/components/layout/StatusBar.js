import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useVehicles } from '@/hooks/useVehicles';
import { useUnacknowledgedAlertsCount } from '@/hooks/useAlerts';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Settings, Moon, Sun } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
export default function StatusBar() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const { theme, setTheme } = useUIStore();
    const { data: vehiclesData } = useVehicles({ limit: 1000 });
    const alertsCount = useUnacknowledgedAlertsCount();
    // Calculate vehicle statistics
    const vehicles = vehiclesData?.data || [];
    const totalVehicles = vehicles.length;
    const movingVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE && v.currentSpeed && v.currentSpeed > 0).length;
    const stoppedVehicles = vehicles.filter((v) => v.status === VehicleStatus.ACTIVE && (!v.currentSpeed || v.currentSpeed === 0)).length;
    const notLocatedVehicles = vehicles.filter((v) => v.status === VehicleStatus.OFFLINE || !v.currentLat || !v.currentLng).length;
    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
    };
    return (_jsx("div", { className: "bg-black text-white", children: _jsx("div", { className: "px-6 py-3", children: _jsxs("div", { className: "flex items-center justify-between gap-6", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-baseline gap-2", children: [_jsx("h1", { className: "text-lg font-bold tracking-wider", children: "TRACKZONE" }), _jsx("p", { className: "text-xs text-slate-500 font-semibold", children: "by MAT\u00C9RIEL TECH+" })] }), _jsx("p", { className: "text-xs text-slate-400 font-semibold", children: "FLEET MANAGEMENT \u2014 G\u00C9OLOCALISATION" })] }) }), _jsxs("div", { className: "flex items-center gap-6 flex-1 justify-center", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-300", children: "V\u00C9HICULES" }), _jsx("span", { className: "border border-slate-500 text-white px-3 py-1 rounded-full text-sm font-semibold", children: totalVehicles })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-300", children: "EN MOUVEMENT" }), _jsx("span", { className: "border border-green-500 text-green-400 px-3 py-1 rounded-full text-sm font-semibold", children: movingVehicles })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-300", children: "\u00C0 L'ARR\u00CAT" }), _jsx("span", { className: "border border-amber-500 text-amber-400 px-3 py-1 rounded-full text-sm font-semibold", children: stoppedVehicles })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-300", children: "NON LOCALIS\u00C9S" }), _jsx("span", { className: "border border-red-500 text-red-400 px-3 py-1 rounded-full text-sm font-semibold", children: notLocatedVehicles })] })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("button", { onClick: () => navigate('/alerts'), className: "relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors", children: [_jsx(Bell, { size: 18 }), _jsx("span", { children: "Alertes" }), alertsCount > 0 && (_jsx("span", { className: "absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center", children: alertsCount > 99 ? '99+' : alertsCount }))] }), _jsx("button", { onClick: handleRefresh, className: "rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors", title: "Rafra\u00EEchir les donn\u00E9es", children: _jsx(RefreshCw, { size: 18 }) }), _jsx("button", { onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark'), className: "rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors", title: theme === 'dark' ? 'Mode clair' : 'Mode sombre', children: theme === 'dark' ? _jsx(Sun, { size: 18 }) : _jsx(Moon, { size: 18 }) }), _jsx("button", { onClick: () => navigate('/settings'), className: "rounded-lg px-3 py-2 text-slate-300 hover:bg-white/10 transition-colors", title: "Param\u00E8tres", children: _jsx(Settings, { size: 18 }) })] })] }) }) }));
}
//# sourceMappingURL=StatusBar.js.map