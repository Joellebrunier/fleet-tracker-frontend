import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/useVehicles';
import { Truck, Activity, Navigation, WifiOff, Clock, ChevronRight, } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: vehiclesData, isLoading } = useVehicles({ limit: 500 });
    const vehicles = useMemo(() => vehiclesData?.data || [], [vehiclesData]);
    // Compute stats
    const stats = useMemo(() => {
        const total = vehicles.length;
        const withGps = vehicles.filter((v) => v.currentLat && v.currentLng);
        const moving = withGps.filter((v) => (v.currentSpeed || 0) > 2);
        const stopped = withGps.filter((v) => (v.currentSpeed || 0) <= 2);
        const noGps = vehicles.filter((v) => !v.currentLat || !v.currentLng);
        // Provider breakdown from metadata
        const providers = {};
        for (const v of vehicles) {
            const meta = v.metadata || {};
            if (meta.flespiChannelId)
                providers['Flespi'] = (providers['Flespi'] || 0) + 1;
            else if (meta.echoesUid)
                providers['Echoes'] = (providers['Echoes'] || 0) + 1;
            else if (meta.keeptraceId)
                providers['KeepTrace'] = (providers['KeepTrace'] || 0) + 1;
            else if (meta.ubiwanId)
                providers['Ubiwan'] = (providers['Ubiwan'] || 0) + 1;
            else
                providers['Autre'] = (providers['Autre'] || 0) + 1;
        }
        // Top speed
        const maxSpeed = Math.max(...vehicles.map((v) => v.currentSpeed || 0), 0);
        const avgSpeed = withGps.length > 0
            ? withGps.reduce((sum, v) => sum + (v.currentSpeed || 0), 0) / withGps.length
            : 0;
        // Recently active (last 10 minutes)
        const tenMinAgo = Date.now() - 10 * 60 * 1000;
        const recentlyActive = vehicles.filter((v) => v.lastCommunication && new Date(v.lastCommunication).getTime() > tenMinAgo);
        return {
            total,
            withGps: withGps.length,
            moving: moving.length,
            stopped: stopped.length,
            noGps: noGps.length,
            providers,
            maxSpeed,
            avgSpeed,
            recentlyActive: recentlyActive.length,
        };
    }, [vehicles]);
    // Sorted vehicles by speed (moving first)
    const topMoving = useMemo(() => [...vehicles]
        .filter((v) => v.currentLat && v.currentLng)
        .sort((a, b) => (b.currentSpeed || 0) - (a.currentSpeed || 0))
        .slice(0, 8), [vehicles]);
    // Recently updated vehicles
    const recentlyUpdated = useMemo(() => [...vehicles]
        .filter((v) => v.lastCommunication)
        .sort((a, b) => new Date(b.lastCommunication).getTime() - new Date(a.lastCommunication).getTime())
        .slice(0, 5), [vehicles]);
    const providerColors = {
        Flespi: 'bg-purple-500',
        Echoes: 'bg-blue-500',
        KeepTrace: 'bg-emerald-500',
        Ubiwan: 'bg-orange-500',
        Autre: 'bg-gray-400',
    };
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-64" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-28" }, i))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx(Skeleton, { className: "h-80 lg:col-span-2" }), _jsx(Skeleton, { className: "h-80" })] })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Tableau de bord" }), _jsxs("p", { className: "mt-1 text-sm text-gray-600", children: ["Vue d'ensemble de votre flotte \u2014 ", stats.total, " v\u00E9hicules, ", stats.withGps, " avec GPS actif"] })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { className: "border-l-4 border-l-blue-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Total v\u00E9hicules" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 mt-1", children: stats.total }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [stats.withGps, " GPS actif"] })] }), _jsx("div", { className: "rounded-xl bg-blue-50 p-3", children: _jsx(Truck, { className: "text-blue-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-green-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "En mouvement" }), _jsx("p", { className: "text-3xl font-bold text-green-600 mt-1", children: stats.moving }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [stats.stopped, " \u00E0 l'arr\u00EAt"] })] }), _jsx("div", { className: "rounded-xl bg-green-50 p-3", children: _jsx(Navigation, { className: "text-green-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-amber-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Actifs r\u00E9cents" }), _jsx("p", { className: "text-3xl font-bold text-amber-600 mt-1", children: stats.recentlyActive }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "derni\u00E8res 10 min" })] }), _jsx("div", { className: "rounded-xl bg-amber-50 p-3", children: _jsx(Activity, { className: "text-amber-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-red-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Hors ligne" }), _jsx("p", { className: "text-3xl font-bold text-red-600 mt-1", children: stats.noGps }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "sans position GPS" })] }), _jsx("div", { className: "rounded-xl bg-red-50 p-3", children: _jsx(WifiOff, { className: "text-red-600", size: 24 }) })] }) }) })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Activit\u00E9 de la flotte" }), _jsx(CardDescription, { className: "text-xs", children: "V\u00E9hicules avec position GPS, tri\u00E9s par vitesse" })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1 text-xs", onClick: () => navigate('/map'), children: ["Carte", _jsx(ChevronRight, { size: 14 })] })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-2", children: topMoving.map((vehicle) => {
                                            const isMoving = (vehicle.currentSpeed || 0) > 2;
                                            return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full flex-shrink-0 ${isMoving ? 'bg-green-500' : 'bg-gray-400'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.plate })] }), _jsx("div", { className: "text-right flex-shrink-0", children: _jsxs("p", { className: "text-sm font-bold text-gray-900", children: [(vehicle.currentSpeed || 0).toFixed(0), ' ', _jsx("span", { className: "text-xs font-normal text-gray-500", children: "km/h" })] }) }), _jsx("div", { className: "text-right flex-shrink-0 min-w-20", children: _jsx("p", { className: "text-xs text-gray-400", children: formatTimeAgo(vehicle.lastCommunication) }) }), _jsx(ChevronRight, { size: 14, className: "text-gray-300" })] }, vehicle.id));
                                        }) }), _jsx(Button, { variant: "outline", className: "mt-4 w-full text-sm", onClick: () => navigate('/vehicles'), children: "Voir tous les v\u00E9hicules" })] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "Fournisseurs GPS" }), _jsx(CardDescription, { className: "text-xs", children: "R\u00E9partition par provider" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-3", children: Object.entries(stats.providers)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .map(([name, count]) => {
                                                    const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                                    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-sm mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-3 w-3 rounded-full ${providerColors[name] || 'bg-gray-400'}` }), _jsx("span", { className: "font-medium text-gray-700", children: name })] }), _jsx("span", { className: "text-gray-500 font-medium", children: count })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-100", children: _jsx("div", { className: `h-2 rounded-full ${providerColors[name] || 'bg-gray-400'} transition-all`, style: { width: `${pct}%` } }) })] }, name));
                                                }) }), _jsx("div", { className: "mt-4 pt-3 border-t border-gray-100 text-center", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Vitesse max: ", _jsxs("span", { className: "font-bold text-gray-700", children: [stats.maxSpeed.toFixed(0), " km/h"] }), ' · ', "Moyenne: ", _jsxs("span", { className: "font-bold text-gray-700", children: [stats.avgSpeed.toFixed(0), " km/h"] })] }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-base", children: "Mises \u00E0 jour r\u00E9centes" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2.5", children: recentlyUpdated.map((v) => (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx(Clock, { size: 12, className: "text-gray-400 flex-shrink-0" }), _jsx("span", { className: "font-medium text-gray-700 truncate flex-1", children: v.name }), _jsx("span", { className: "text-gray-400 flex-shrink-0", children: formatTimeAgo(v.lastCommunication) })] }, v.id))) }) })] })] })] })] }));
}
//# sourceMappingURL=DashboardPage.js.map