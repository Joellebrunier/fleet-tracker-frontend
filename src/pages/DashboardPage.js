import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/useVehicles';
import { useAlerts } from '@/hooks/useAlerts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, } from 'recharts';
import { Truck, Activity, Navigation, WifiOff, Clock, MapPin, ChevronRight, AlertCircle, FileText, Zap, Plus, Route, } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: vehiclesData, isLoading } = useVehicles({ limit: 500 });
    const { data: alertsData } = useAlerts({ limit: 5, status: 'unacknowledged' });
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
    // Generate mock hourly fleet activity data
    const hourlyData = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            moving: Math.floor(Math.random() * stats.moving * 0.3 + stats.moving * 0.5),
            stopped: Math.floor(Math.random() * stats.stopped * 0.3 + stats.stopped * 0.5),
        }));
    }, [stats.moving, stats.stopped]);
    // Alerts data
    const alertsList = useMemo(() => alertsData?.data || [], [alertsData]);
    // Vehicle status distribution for pie chart
    const vehicleStatusData = useMemo(() => {
        const active = vehicles.filter((v) => (v.currentSpeed || 0) > 2).length;
        const idle = vehicles.filter((v) => (v.currentSpeed || 0) <= 2 && v.currentLat && v.currentLng).length;
        const offline = vehicles.filter((v) => !v.currentLat || !v.currentLng).length;
        const maintenance = Math.floor(vehicles.length * 0.05); // Mock maintenance count (5% of fleet)
        return [
            { name: 'En mouvement', value: active, color: '#22c55e' },
            { name: 'Arrêtés', value: idle, color: '#eab308' },
            { name: 'Hors ligne', value: offline, color: '#9ca3af' },
            { name: 'Maintenance', value: maintenance, color: '#f97316' },
        ].filter((item) => item.value > 0);
    }, [vehicles]);
    // Alert distribution by type
    const alertDistributionData = useMemo(() => {
        // Mock data for alert distribution by type
        const counts = {
            'Vitesse excessive': 12,
            'Géobarrière': 8,
            'Batterie faible': 5,
            'Maintenance': 3,
            'Diagnostic': 2,
        };
        return Object.entries(counts).map(([type, count]) => ({
            type: type,
            count: count,
        }));
    }, []);
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-64" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-28" }, i))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx(Skeleton, { className: "h-80 lg:col-span-2" }), _jsx(Skeleton, { className: "h-80" })] })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Tableau de bord" }), _jsxs("p", { className: "mt-1 text-sm text-gray-600", children: ["Vue d'ensemble de votre flotte \u2014 ", stats.total, " v\u00E9hicules, ", stats.withGps, " avec GPS actif"] })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { className: "border-l-4 border-l-blue-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Total v\u00E9hicules" }), _jsx("p", { className: "text-3xl font-bold text-gray-900 mt-1", children: stats.total }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [stats.withGps, " GPS actif"] })] }), _jsx("div", { className: "rounded-xl bg-blue-50 p-3", children: _jsx(Truck, { className: "text-blue-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-green-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "En mouvement" }), _jsx("p", { className: "text-3xl font-bold text-green-600 mt-1", children: stats.moving }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: [stats.stopped, " \u00E0 l'arr\u00EAt"] })] }), _jsx("div", { className: "rounded-xl bg-green-50 p-3", children: _jsx(Navigation, { className: "text-green-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-amber-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Actifs r\u00E9cents" }), _jsx("p", { className: "text-3xl font-bold text-amber-600 mt-1", children: stats.recentlyActive }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "derni\u00E8res 10 min" })] }), _jsx("div", { className: "rounded-xl bg-amber-50 p-3", children: _jsx(Activity, { className: "text-amber-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-red-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Hors ligne" }), _jsx("p", { className: "text-3xl font-bold text-red-600 mt-1", children: stats.noGps }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "sans position GPS" })] }), _jsx("div", { className: "rounded-xl bg-red-50 p-3", children: _jsx(WifiOff, { className: "text-red-600", size: 24 }) })] }) }) }), _jsx(Card, { className: "border-l-4 border-l-indigo-500", children: _jsx(CardContent, { className: "pt-5 pb-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: "Km du jour" }), _jsx("p", { className: "text-3xl font-bold text-indigo-600 mt-1", children: "1,247" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "distance totale" })] }), _jsx("div", { className: "rounded-xl bg-indigo-50 p-3", children: _jsx(Route, { className: "text-indigo-600", size: 24 }) })] }) }) })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "Activit\u00E9 horaire (24h)" }), _jsx(CardDescription, { className: "text-xs", children: "V\u00E9hicules en mouvement vs arr\u00EAt\u00E9s" })] }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: hourlyData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorMoving", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0.1 })] }), _jsxs("linearGradient", { id: "colorStopped", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#ef4444", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#ef4444", stopOpacity: 0.1 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "hour", stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                }, formatter: (value) => [value, ''] }), _jsx(Area, { type: "monotone", dataKey: "moving", stroke: "#22c55e", fillOpacity: 1, fill: "url(#colorMoving)", name: "En mouvement" }), _jsx(Area, { type: "monotone", dataKey: "stopped", stroke: "#ef4444", fillOpacity: 1, fill: "url(#colorStopped)", name: "Arr\u00EAt\u00E9s" })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "\u00C9tat de la flotte" }), _jsx(CardDescription, { className: "text-xs", children: "Distribution par statut v\u00E9hicule" })] }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: vehicleStatusData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, value }) => `${name}: ${value}`, outerRadius: 100, fill: "#8884d8", dataKey: "value", children: vehicleStatusData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => `${value} véhicules` })] }) }) })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "Distribution des alertes" }), _jsx(CardDescription, { className: "text-xs", children: "Nombre d'alertes par type (derni\u00E8res 24h)" })] }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: alertDistributionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#e5e7eb" }), _jsx(XAxis, { dataKey: "type", stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9ca3af", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #e5e7eb',
                                                    borderRadius: '8px',
                                                }, formatter: (value) => [`${value} alertes`, 'Nombre'] }), _jsx(Bar, { dataKey: "count", fill: "#3b82f6", radius: [8, 8, 0, 0] })] }) }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "Actions rapides" }), _jsx(CardDescription, { className: "text-xs", children: "Acc\u00E8s direct aux fonctionnalit\u00E9s" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 gap-2.5", children: [_jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row", onClick: () => navigate('/map'), children: [_jsx(MapPin, { size: 16 }), _jsx("span", { className: "text-xs", children: "Voir Carte" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row", onClick: () => navigate('/reports'), children: [_jsx(FileText, { size: 16 }), _jsx("span", { className: "text-xs", children: "Rapport" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row", onClick: () => navigate('/geofences'), children: [_jsx(Zap, { size: 16 }), _jsx("span", { className: "text-xs", children: "G\u00E9obarri\u00E8re" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row", onClick: () => navigate('/alerts/new'), children: [_jsx(Plus, { size: 16 }), _jsx("span", { className: "text-xs", children: "Alerte" })] })] }) })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Fil d'activit\u00E9 r\u00E9cente" }), _jsx(CardDescription, { className: "text-xs", children: "Alertes et changements de statut" })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-xs", onClick: () => navigate('/alerts'), children: "Voir tous" })] }) }), _jsx(CardContent, { children: alertsList.length > 0 ? (_jsx("div", { className: "space-y-3", children: alertsList.map((alert, idx) => (_jsxs("div", { className: "flex items-start gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer transition-colors", children: [_jsx(AlertCircle, { size: 16, className: alert.severity === 'critical'
                                                    ? 'text-red-500 flex-shrink-0 mt-0.5'
                                                    : 'text-orange-500 flex-shrink-0 mt-0.5' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: alert.title }), _jsx(Badge, { variant: alert.severity === 'critical' ? 'destructive' : 'secondary', className: "flex-shrink-0 text-xs", children: alert.severity })] }), _jsx("p", { className: "text-xs text-gray-500 line-clamp-2 mt-1", children: alert.message }), _jsx("p", { className: "text-xs text-gray-400 mt-2", children: formatTimeAgo(alert.createdAt) })] })] }, idx))) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-center", children: [_jsx(AlertCircle, { size: 24, className: "text-gray-300 mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Aucune alerte r\u00E9cente" })] })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "R\u00E9sum\u00E9 des statuts" }), _jsx(CardDescription, { className: "text-xs", children: "Derni\u00E8res mises \u00E0 jour v\u00E9hicule" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: recentlyUpdated.slice(0, 8).map((v) => {
                                        const isMoving = (v.currentSpeed || 0) > 2;
                                        return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50 cursor-pointer", onClick: () => navigate(`/vehicles/${v.id}`), children: [_jsx("span", { className: `h-2 w-2 rounded-full flex-shrink-0 ${isMoving ? 'bg-green-500' : 'bg-yellow-500'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: v.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [isMoving ? 'En mouvement' : 'Arrêté', " \u00B7 ", formatTimeAgo(v.lastCommunication)] })] }), _jsxs("span", { className: "text-xs font-semibold text-gray-900 flex-shrink-0", children: [(v.currentSpeed || 0).toFixed(0), _jsx("span", { className: "text-gray-500 font-normal", children: " km/h" })] })] }, v.id));
                                    }) }) })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: "Activit\u00E9 de la flotte" }), _jsx(CardDescription, { className: "text-xs", children: "V\u00E9hicules avec position GPS, tri\u00E9s par vitesse" })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1 text-xs", onClick: () => navigate('/map'), children: ["Carte", _jsx(ChevronRight, { size: 14 })] })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "space-y-2", children: topMoving.map((vehicle) => {
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