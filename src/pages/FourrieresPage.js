import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuthStore } from '@/stores/authStore';
import { AlertTriangle, MapPin, Clock, CheckCircle2, XCircle, Search, Eye, Shield, Car, Navigation, RefreshCw, History, Building2, Phone } from 'lucide-react';
// Mock impound lot locations (fourrières) - in production these would come from an API
const FOURRIERES_DB = [
    { id: 'f1', name: 'Fourrière de Paris - Pantin', address: '14 Rue Raymond Queneau, 93500 Pantin', lat: 48.8943, lng: 2.4075, phone: '01 49 15 36 00', capacity: 200, type: 'municipal' },
    { id: 'f2', name: 'Fourrière de Paris - Bonneuil', address: 'Rue Robespierre, 94380 Bonneuil-sur-Marne', lat: 48.7723, lng: 2.4896, phone: '01 45 13 86 50', capacity: 300, type: 'municipal' },
    { id: 'f3', name: 'Fourrière Préfecture de Lyon', address: '7 Rue de Gerland, 69007 Lyon', lat: 45.7300, lng: 4.8400, phone: '04 72 73 54 00', capacity: 150, type: 'prefectural' },
    { id: 'f4', name: 'Fourrière de Marseille', address: 'Chemin de Gibbes, 13014 Marseille', lat: 43.3393, lng: 5.3775, phone: '04 91 02 99 30', capacity: 180, type: 'municipal' },
    { id: 'f5', name: 'Fourrière de Bordeaux', address: 'Quai de Brazza, 33100 Bordeaux', lat: 44.8500, lng: -0.5500, phone: '05 56 96 28 30', capacity: 120, type: 'municipal' },
    { id: 'f6', name: 'Fourrière de Lille', address: '8 Rue du Port, 59000 Lille', lat: 50.6300, lng: 3.0600, phone: '03 20 49 90 90', capacity: 100, type: 'municipal' },
    { id: 'f7', name: 'Fourrière de Nice', address: '4 Bd de la Madeleine, 06000 Nice', lat: 43.7000, lng: 7.2700, phone: '04 97 13 44 00', capacity: 90, type: 'prefectural' },
    { id: 'f8', name: 'Fourrière de Toulouse', address: 'Chemin de Mange-Pommes, 31200 Toulouse', lat: 43.6300, lng: 1.4500, phone: '05 61 22 78 00', capacity: 140, type: 'municipal' },
];
// Detection radius in meters
const DEFAULT_RADIUS = 500;
function haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export default function FourrieresPage() {
    const { user } = useAuthStore();
    const { data: vehiclesData, isLoading } = useVehicles({ limit: 1000 });
    const [activeTab, setActiveTab] = useState('alertes');
    const [searchTerm, setSearchTerm] = useState('');
    const [detectionRadius, setDetectionRadius] = useState(DEFAULT_RADIUS);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
    const [resolvedAlerts, setResolvedAlerts] = useState(new Set());
    const [falseAlarms, setFalseAlarms] = useState(new Set());
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [ackNotes, setAckNotes] = useState('');
    const [annuaireSearch, setAnnuaireSearch] = useState('');
    const vehicles = vehiclesData?.data || [];
    // Detect vehicles near impound lots
    const alerts = useMemo(() => {
        const results = [];
        for (const v of vehicles) {
            if (!v.currentLat || !v.currentLng)
                continue;
            for (const f of FOURRIERES_DB) {
                const dist = haversineDistance(v.currentLat, v.currentLng, f.lat, f.lng);
                if (dist <= detectionRadius) {
                    const alertId = `${v.id}-${f.id}`;
                    let status = 'active';
                    if (falseAlarms.has(alertId))
                        status = 'false_alarm';
                    else if (resolvedAlerts.has(alertId))
                        status = 'resolved';
                    else if (acknowledgedAlerts[alertId])
                        status = 'acknowledged';
                    results.push({
                        id: alertId,
                        vehicleName: v.name || 'Véhicule inconnu',
                        vehiclePlate: v.plate || '---',
                        vehicleId: v.id,
                        fourriereName: f.name,
                        fourriereAddress: f.address,
                        fourrierePhone: f.phone,
                        distance: Math.round(dist),
                        detectedAt: new Date(),
                        status,
                        acknowledgedBy: acknowledgedAlerts[alertId]?.by,
                        acknowledgedAt: acknowledgedAlerts[alertId]?.at,
                        notes: acknowledgedAlerts[alertId]?.notes,
                    });
                }
            }
        }
        return results.sort((a, b) => a.distance - b.distance);
    }, [vehicles, detectionRadius, acknowledgedAlerts, resolvedAlerts, falseAlarms]);
    const filteredAlerts = useMemo(() => {
        let result = alerts;
        if (statusFilter !== 'all') {
            result = result.filter(a => a.status === statusFilter);
        }
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(a => a.vehicleName.toLowerCase().includes(q) ||
                a.vehiclePlate.toLowerCase().includes(q) ||
                a.fourriereName.toLowerCase().includes(q));
        }
        return result;
    }, [alerts, statusFilter, searchTerm]);
    const filteredFourrieres = useMemo(() => {
        if (!annuaireSearch)
            return FOURRIERES_DB;
        const q = annuaireSearch.toLowerCase();
        return FOURRIERES_DB.filter(f => f.name.toLowerCase().includes(q) || f.address.toLowerCase().includes(q));
    }, [annuaireSearch]);
    const activeCount = alerts.filter(a => a.status === 'active').length;
    const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
    const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
    const handleAcknowledge = (alert) => {
        setAcknowledgedAlerts(prev => ({
            ...prev,
            [alert.id]: {
                by: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
                at: new Date(),
                notes: ackNotes,
            }
        }));
        setAckNotes('');
        setSelectedAlert(null);
    };
    const handleResolve = (alertId) => {
        setResolvedAlerts(prev => new Set(prev).add(alertId));
    };
    const handleFalseAlarm = (alertId) => {
        setFalseAlarms(prev => new Set(prev).add(alertId));
    };
    const handleRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };
    const tabs = [
        { key: 'alertes', label: 'ALERTES PROXIMITÉ', icon: AlertTriangle },
        { key: 'annuaire', label: 'ANNUAIRE FOURRIÈRES', icon: Building2 },
        { key: 'historique', label: 'HISTORIQUE', icon: History },
        { key: 'parametres', label: 'PARAMÈTRES', icon: Shield },
    ];
    const statusBadge = (status) => {
        const map = {
            active: { bg: 'bg-red-100 text-red-700', label: 'ACTIF' },
            acknowledged: { bg: 'bg-amber-100 text-amber-700', label: 'PRIS EN CHARGE' },
            resolved: { bg: 'bg-green-100 text-green-700', label: 'RÉSOLU' },
            false_alarm: { bg: 'bg-gray-100 text-gray-500', label: 'FAUSSE ALERTE' },
        };
        const s = map[status];
        return _jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg}`, children: s.label });
    };
    return (_jsxs("div", { className: "h-[calc(100vh-6.5rem)] flex flex-col bg-gray-50", children: [_jsxs("div", { className: "bg-white border-b border-gray-200 px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center", children: _jsx(AlertTriangle, { size: 20, className: "text-red-500" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold text-gray-900", children: "D\u00E9tection Fourri\u00E8res" }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: "Surveillance automatique de la proximit\u00E9 avec les fourri\u00E8res" })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "hidden md:flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-100", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-red-500 animate-pulse" }), _jsxs("span", { className: "text-xs font-bold text-red-700", children: [activeCount, " actif", activeCount !== 1 ? 's' : ''] })] }), _jsx("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100", children: _jsxs("span", { className: "text-xs font-bold text-amber-700", children: [acknowledgedCount, " pris en charge"] }) }), _jsx("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100", children: _jsxs("span", { className: "text-xs font-bold text-green-700", children: [resolvedCount, " r\u00E9solu", resolvedCount !== 1 ? 's' : ''] }) })] }), _jsxs("button", { onClick: handleRefresh, className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-[#4361EE] text-white text-xs font-semibold hover:bg-[#3a56d4] transition-colors", children: [_jsx(RefreshCw, { size: 14, className: isRefreshing ? 'animate-spin' : '' }), "Actualiser"] })] })] }), _jsx("div", { className: "flex items-center gap-1 mt-4", children: tabs.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.key;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.key), className: `flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${active
                                    ? 'bg-[#4361EE] text-white'
                                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`, children: [_jsx(Icon, { size: 13 }), tab.label, tab.key === 'alertes' && activeCount > 0 && (_jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'}`, children: activeCount }))] }, tab.key));
                        }) })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-6", children: [activeTab === 'alertes' && (_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3 mb-4", children: [_jsxs("div", { className: "relative flex-1 min-w-[200px] max-w-md", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher v\u00E9hicule, plaque, fourri\u00E8re...", className: "w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]", value: searchTerm, onChange: e => setSearchTerm(e.target.value) })] }), _jsx("div", { className: "flex items-center gap-1", children: [
                                            { key: 'all', label: 'TOUS' },
                                            { key: 'active', label: 'ACTIFS' },
                                            { key: 'acknowledged', label: 'PRIS EN CHARGE' },
                                            { key: 'resolved', label: 'RÉSOLUS' },
                                        ].map(f => (_jsx("button", { onClick: () => setStatusFilter(f.key), className: `px-3 py-1.5 rounded text-[11px] font-semibold transition-all ${statusFilter === f.key
                                                ? 'bg-[#4361EE] text-white'
                                                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`, children: f.label }, f.key))) }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [_jsx(MapPin, { size: 12 }), "Rayon: ", _jsxs("strong", { children: [detectionRadius, "m"] })] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(RefreshCw, { size: 24, className: "animate-spin text-gray-300" }) })) : filteredAlerts.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx(CheckCircle2, { size: 48, className: "mx-auto text-green-300 mb-3" }), _jsx("p", { className: "text-gray-500 font-medium", children: "Aucune alerte de proximit\u00E9" }), _jsxs("p", { className: "text-gray-400 text-sm mt-1", children: ["Aucun v\u00E9hicule d\u00E9tect\u00E9 \u00E0 moins de ", detectionRadius, "m d'une fourri\u00E8re"] })] })) : (_jsx("div", { className: "space-y-3", children: filteredAlerts.map(alert => (_jsx("div", { className: `bg-white rounded-xl border p-4 transition-all hover:shadow-md ${alert.status === 'active' ? 'border-red-200 shadow-sm' :
                                        alert.status === 'acknowledged' ? 'border-amber-200' :
                                            'border-gray-200'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${alert.status === 'active' ? 'bg-red-100' :
                                                            alert.status === 'acknowledged' ? 'bg-amber-100' :
                                                                'bg-gray-100'}`, children: _jsx(Car, { size: 18, className: alert.status === 'active' ? 'text-red-600' :
                                                                alert.status === 'acknowledged' ? 'text-amber-600' :
                                                                    'text-gray-400' }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-bold text-sm text-gray-900", children: alert.vehicleName }), _jsx("span", { className: "text-xs text-gray-400 font-mono", children: alert.vehiclePlate }), statusBadge(alert.status)] }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx(Building2, { size: 12, className: "text-gray-400" }), _jsx("span", { className: "text-xs text-gray-600", children: alert.fourriereName })] }), _jsxs("div", { className: "flex items-center gap-2 mt-0.5", children: [_jsx(MapPin, { size: 12, className: "text-gray-400" }), _jsx("span", { className: "text-xs text-gray-500", children: alert.fourriereAddress })] }), _jsxs("div", { className: "flex items-center gap-4 mt-2", children: [_jsxs("span", { className: "text-[11px] text-gray-400", children: [_jsx(Navigation, { size: 10, className: "inline mr-1" }), alert.distance, "m de distance"] }), _jsxs("span", { className: "text-[11px] text-gray-400", children: [_jsx(Clock, { size: 10, className: "inline mr-1" }), alert.detectedAt.toLocaleString('fr-FR')] }), alert.fourrierePhone && (_jsxs("span", { className: "text-[11px] text-gray-400", children: [_jsx(Phone, { size: 10, className: "inline mr-1" }), alert.fourrierePhone] }))] }), alert.notes && (_jsxs("p", { className: "text-xs text-gray-500 mt-2 italic bg-gray-50 rounded px-2 py-1", children: ["Note: ", alert.notes] }))] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [alert.status === 'active' && (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => { setSelectedAlert(alert); setAckNotes(''); }, className: "flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-semibold hover:bg-amber-100 transition-colors", children: [_jsx(Eye, { size: 12 }), "Prendre en charge"] }), _jsxs("button", { onClick: () => handleFalseAlarm(alert.id), className: "flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[11px] font-semibold hover:bg-gray-100 transition-colors", children: [_jsx(XCircle, { size: 12 }), "Fausse alerte"] })] })), alert.status === 'acknowledged' && (_jsxs("button", { onClick: () => handleResolve(alert.id), className: "flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-[11px] font-semibold hover:bg-green-100 transition-colors", children: [_jsx(CheckCircle2, { size: 12 }), "R\u00E9soudre"] }))] })] }) }, alert.id))) }))] })), activeTab === 'annuaire' && (_jsxs("div", { children: [_jsxs("div", { className: "relative max-w-md mb-4", children: [_jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Rechercher une fourri\u00E8re...", className: "w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]", value: annuaireSearch, onChange: e => setAnnuaireSearch(e.target.value) })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: filteredFourrieres.map(f => (_jsx("div", { className: "bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0", children: _jsx(Building2, { size: 18, className: "text-blue-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 truncate", children: f.name }), _jsxs("p", { className: "text-xs text-gray-500 mt-1 flex items-start gap-1", children: [_jsx(MapPin, { size: 11, className: "shrink-0 mt-0.5" }), f.address] }), _jsxs("div", { className: "flex items-center gap-3 mt-2", children: [_jsxs("span", { className: "text-[11px] text-gray-500 flex items-center gap-1", children: [_jsx(Phone, { size: 10 }), f.phone] }), _jsxs("span", { className: "text-[11px] text-gray-500 flex items-center gap-1", children: [_jsx(Car, { size: 10 }), "Capacit\u00E9: ", f.capacity] })] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: `text-[10px] font-bold px-2 py-0.5 rounded-full ${f.type === 'municipal' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`, children: f.type === 'municipal' ? 'MUNICIPALE' : 'PRÉFECTORALE' }) })] })] }) }, f.id))) })] })), activeTab === 'historique' && (_jsxs("div", { className: "text-center py-20", children: [_jsx(History, { size: 48, className: "mx-auto text-gray-200 mb-3" }), _jsx("p", { className: "text-gray-500 font-medium", children: "Historique des alertes" }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: "L'historique des d\u00E9tections de proximit\u00E9 sera disponible prochainement." }), _jsx("p", { className: "text-gray-400 text-xs mt-2", children: "Les alertes trait\u00E9es dans cette session sont visibles dans l'onglet \"Alertes proximit\u00E9\" avec le filtre \"R\u00E9solus\"." })] })), activeTab === 'parametres' && (_jsx("div", { className: "max-w-xl", children: _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 p-6 space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-1", children: "Rayon de d\u00E9tection" }), _jsx("p", { className: "text-xs text-gray-500 mb-3", children: "Distance maximale pour d\u00E9clencher une alerte de proximit\u00E9 avec une fourri\u00E8re" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("input", { type: "range", min: 100, max: 2000, step: 100, value: detectionRadius, onChange: e => setDetectionRadius(Number(e.target.value)), className: "flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#4361EE]" }), _jsxs("span", { className: "text-sm font-bold text-[#4361EE] w-16 text-right", children: [detectionRadius, "m"] })] }), _jsxs("div", { className: "flex justify-between text-[10px] text-gray-400 mt-1", children: [_jsx("span", { children: "100m" }), _jsx("span", { children: "2000m" })] })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-1", children: "Notifications" }), _jsx("p", { className: "text-xs text-gray-500 mb-3", children: "Recevoir des notifications lors de la d\u00E9tection d'un v\u00E9hicule pr\u00E8s d'une fourri\u00E8re" }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded border-gray-300 text-[#4361EE] focus:ring-[#4361EE]" }), _jsx("span", { className: "text-sm text-gray-700", children: "Activer les alertes push" })] }), _jsxs("label", { className: "flex items-center gap-3 cursor-pointer mt-2", children: [_jsx("input", { type: "checkbox", defaultChecked: true, className: "rounded border-gray-300 text-[#4361EE] focus:ring-[#4361EE]" }), _jsx("span", { className: "text-sm text-gray-700", children: "Notification email" })] })] }), _jsxs("div", { className: "border-t border-gray-100 pt-4", children: [_jsx("h3", { className: "font-semibold text-sm text-gray-900 mb-1", children: "Base de donn\u00E9es fourri\u00E8res" }), _jsxs("p", { className: "text-xs text-gray-500 mb-2", children: [FOURRIERES_DB.length, " fourri\u00E8res r\u00E9f\u00E9renc\u00E9es dans la base"] }), _jsx("p", { className: "text-xs text-gray-400", children: "La base est mise \u00E0 jour r\u00E9guli\u00E8rement. Contactez le support pour ajouter des fourri\u00E8res." })] })] }) }))] }), selectedAlert && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm", children: _jsxs("div", { className: "bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden", style: { animation: 'fadeInDown 0.2s ease-out' }, children: [_jsxs("div", { className: "px-6 py-4 bg-amber-50 border-b border-amber-100", children: [_jsx("h3", { className: "font-bold text-amber-800", children: "Prendre en charge l'alerte" }), _jsxs("p", { className: "text-xs text-amber-600 mt-0.5", children: [selectedAlert.vehicleName, " \u2014 ", selectedAlert.vehiclePlate] })] }), _jsxs("div", { className: "px-6 py-4 space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Fourri\u00E8re d\u00E9tect\u00E9e" }), _jsx("p", { className: "text-sm font-medium text-gray-900", children: selectedAlert.fourriereName }), _jsx("p", { className: "text-xs text-gray-500", children: selectedAlert.fourriereAddress })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Distance" }), _jsxs("p", { className: "text-sm font-medium text-gray-900", children: [selectedAlert.distance, "m"] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-500 block mb-1", children: "Notes (optionnel)" }), _jsx("textarea", { rows: 2, className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE]", placeholder: "Ajoutez une note...", value: ackNotes, onChange: e => setAckNotes(e.target.value) })] })] }), _jsxs("div", { className: "px-6 py-3 bg-gray-50 border-t flex justify-end gap-2", children: [_jsx("button", { onClick: () => setSelectedAlert(null), className: "px-4 py-2 text-sm text-gray-500 hover:text-gray-700", children: "Annuler" }), _jsx("button", { onClick: () => handleAcknowledge(selectedAlert), className: "px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors", children: "Confirmer la prise en charge" })] })] }) })), _jsx("style", { children: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      ` })] }));
}
//# sourceMappingURL=FourrieresPage.js.map