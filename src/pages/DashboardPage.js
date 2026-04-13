import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVehicles } from '@/hooks/useVehicles';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuthStore } from '@/stores/authStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line, } from 'recharts';
import { Truck, Activity, Navigation, WifiOff, Clock, MapPin, ChevronRight, AlertCircle, FileText, Zap, Plus, Route, Settings, GripHorizontal, Building2, ChevronUp, ChevronDown, RotateCcw, TrendingUp, TrendingDown, LogOut, LogIn, AlertTriangle, Shield, } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { TOMTOM_TILE_URL } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';
import 'leaflet/dist/leaflet.css';
// Fleet Tracker Design System Colors
const TZ_COLORS = {
    bgMain: '#FFFFFF',
    bgCard: '#FFFFFF',
    bgHover: '#F3F4F6',
    bgActive: '#F9FAFB',
    borderDefault: '#E5E7EB',
    borderHover: '#E5E7EB',
    textPrimary: '#1F2937',
    textMuted: '#6B7280',
    textDim: '#9CA3AF',
    accentCyan: '#4361EE',
    accentDanger: '#EF4444',
    accentWarning: '#F59E0B',
};
const PROVIDER_COLORS_DARK = {
    Flespi: '#8B5CF6',
    Echoes: '#3B82F6',
    KeepTrace: '#4361EE',
    Ubiwan: '#F59E0B',
    Autre: '#6B7280',
};
// Keyboard Shortcuts Modal Component
function KeyboardShortcutsModal() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === '?' && !isOpen) {
                setIsOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen]);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: _jsxs(DialogContent, { className: "bg-white border border-gray-200 max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Raccourcis clavier" }), _jsx(DialogDescription, { className: "text-gray-500", children: "Appuyez sur ? pour afficher ce menu" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "Tableau de bord" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "D" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "Carte" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "M" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "V\u00E9hicules" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "V" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "Alertes" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "A" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "Rapports" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "R" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "G\u00E9obarri\u00E8res" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "G" })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-gray-100 border border-gray-200", children: [_jsx("span", { className: "text-sm text-gray-900", children: "Param\u00E8tres" }), _jsx("kbd", { className: "px-2 py-1 text-xs bg-gray-50 text-gray-500 rounded border border-[#E5E7EB]", children: "S" })] })] }), _jsx("div", { className: "flex gap-2 justify-end pt-2 border-t border-gray-200", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsOpen(false), className: "border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", children: "Fermer" }) })] })] }) }));
}
// Heatmap Marker Component
function HeatmapMarker({ position, density, }) {
    const colorMap = {
        faible: '#3b82f6',
        moyen: '#f59e0b',
        élevé: '#ef4444',
    };
    const radiusMap = {
        faible: 10,
        moyen: 20,
        élevé: 30,
    };
    return (_jsx(CircleMarker, { center: position, radius: radiusMap[density], fillColor: colorMap[density], color: colorMap[density], weight: 2, opacity: 0.8, fillOpacity: 0.6, children: _jsx(Popup, { children: `Densité: ${density}` }) }));
}
export default function DashboardPage() {
    const navigate = useNavigate();
    const { data: vehiclesData, isLoading } = useVehicles({ limit: 500 });
    const { data: alertsData } = useAlerts({ limit: 5, status: 'unacknowledged' });
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    // Widget Configuration State
    const defaultWidgetOrder = [
        'daily-summary',
        'activity-feed',
        'hourly-activity',
        'fleet-status',
        'alert-distribution',
        'quick-actions',
        'alerts-feed',
        'status-summary',
        'mileage-trend',
        'fleet-utilization',
        'speed-distribution',
        'alert-frequency',
        'weekly-comparison',
        'heatmap',
        'fleet-activity',
        'providers',
        'recent-updates',
        'departments',
    ];
    const [widgetConfig, setWidgetConfig] = useState(() => {
        const saved = localStorage.getItem('dashboard_widgets');
        const defaultConfig = {
            'daily-summary': { visible: true, size: 'normal' },
            'activity-feed': { visible: true, size: 'normal' },
            'hourly-activity': { visible: true, size: 'normal' },
            'fleet-status': { visible: true, size: 'normal' },
            'alert-distribution': { visible: true, size: 'normal' },
            'quick-actions': { visible: true, size: 'normal' },
            'alerts-feed': { visible: true, size: 'normal' },
            'status-summary': { visible: true, size: 'normal' },
            'mileage-trend': { visible: true, size: 'normal' },
            'fleet-utilization': { visible: true, size: 'normal' },
            'speed-distribution': { visible: true, size: 'normal' },
            'alert-frequency': { visible: true, size: 'normal' },
            'weekly-comparison': { visible: true, size: 'normal' },
            heatmap: { visible: true, size: 'expanded' },
            'fleet-activity': { visible: true, size: 'normal' },
            providers: { visible: true, size: 'normal' },
            'recent-updates': { visible: true, size: 'normal' },
            departments: { visible: true, size: 'normal' },
        };
        try {
            return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
        }
        catch {
            return defaultConfig;
        }
    });
    const [widgetOrder, setWidgetOrder] = useState(() => {
        const saved = localStorage.getItem('dashboard_widget_order');
        try {
            return saved ? JSON.parse(saved) : defaultWidgetOrder;
        }
        catch {
            return defaultWidgetOrder;
        }
    });
    const [showWidgetConfig, setShowWidgetConfig] = useState(false);
    const [departments, setDepartments] = useState([
        { id: '1', name: 'Logistique', vehicleCount: 24, driverCount: 8, performanceScore: 92 },
        { id: '2', name: 'Maintenance', vehicleCount: 8, driverCount: 3, performanceScore: 85 },
        { id: '3', name: 'Livraison', vehicleCount: 15, driverCount: 12, performanceScore: 88 },
        { id: '4', name: 'Commercial', vehicleCount: 6, driverCount: 4, performanceScore: 90 },
    ]);
    const [newDeptName, setNewDeptName] = useState('');
    const [showNewDeptDialog, setShowNewDeptDialog] = useState(false);
    // Save widget config to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_widgets', JSON.stringify(widgetConfig));
    }, [widgetConfig]);
    // Save widget order to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_widget_order', JSON.stringify(widgetOrder));
    }, [widgetOrder]);
    const widgetLabels = {
        'daily-summary': 'Résumé du jour',
        'activity-feed': 'Fil d\'activité récente',
        'hourly-activity': 'Activité horaire',
        'fleet-status': 'État de la flotte',
        'alert-distribution': 'Distribution des alertes',
        'quick-actions': 'Actions rapides',
        'alerts-feed': 'Flux d\'alertes',
        'status-summary': 'Résumé du statut',
        'mileage-trend': 'Tendance kilométrique',
        'fleet-utilization': 'Utilisation de la flotte',
        'speed-distribution': 'Distribution des vitesses',
        'alert-frequency': 'Fréquence des alertes',
        'weekly-comparison': 'Comparaison hebdomadaire',
        heatmap: 'Carte thermique',
        'fleet-activity': 'Activité de la flotte',
        providers: 'Fournisseurs GPS',
        'recent-updates': 'Mises à jour récentes',
        departments: 'Départements',
    };
    const toggleWidgetVisibility = (id) => {
        setWidgetConfig((prev) => ({
            ...prev,
            [id]: { ...prev[id], visible: !prev[id].visible },
        }));
    };
    const setWidgetSize = (id, size) => {
        setWidgetConfig((prev) => ({
            ...prev,
            [id]: { ...prev[id], size },
        }));
    };
    const moveWidgetUp = (id) => {
        const currentIndex = widgetOrder.indexOf(id);
        if (currentIndex > 0) {
            const reordered = [...widgetOrder];
            const temp = reordered[currentIndex - 1];
            reordered[currentIndex - 1] = reordered[currentIndex];
            reordered[currentIndex] = temp;
            setWidgetOrder(reordered);
        }
    };
    const moveWidgetDown = (id) => {
        const currentIndex = widgetOrder.indexOf(id);
        if (currentIndex < widgetOrder.length - 1) {
            const reordered = [...widgetOrder];
            const temp = reordered[currentIndex + 1];
            reordered[currentIndex + 1] = reordered[currentIndex];
            reordered[currentIndex] = temp;
            setWidgetOrder(reordered);
        }
    };
    const resetWidgetConfig = () => {
        const defaultConfig = {
            'daily-summary': { visible: true, size: 'normal' },
            'activity-feed': { visible: true, size: 'normal' },
            'hourly-activity': { visible: true, size: 'normal' },
            'fleet-status': { visible: true, size: 'normal' },
            'alert-distribution': { visible: true, size: 'normal' },
            'quick-actions': { visible: true, size: 'normal' },
            'alerts-feed': { visible: true, size: 'normal' },
            'status-summary': { visible: true, size: 'normal' },
            'mileage-trend': { visible: true, size: 'normal' },
            'fleet-utilization': { visible: true, size: 'normal' },
            'speed-distribution': { visible: true, size: 'normal' },
            'alert-frequency': { visible: true, size: 'normal' },
            'weekly-comparison': { visible: true, size: 'normal' },
            heatmap: { visible: true, size: 'expanded' },
            'fleet-activity': { visible: true, size: 'normal' },
            providers: { visible: true, size: 'normal' },
            'recent-updates': { visible: true, size: 'normal' },
            departments: { visible: true, size: 'normal' },
        };
        setWidgetConfig(defaultConfig);
        setWidgetOrder(defaultWidgetOrder);
    };
    const addDepartment = () => {
        if (newDeptName.trim()) {
            setDepartments((prev) => [
                ...prev,
                {
                    id: String(Date.now()),
                    name: newDeptName,
                    vehicleCount: 0,
                    driverCount: 0,
                    performanceScore: 80,
                },
            ]);
            setNewDeptName('');
            setShowNewDeptDialog(false);
        }
    };
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
        Flespi: 'bg-[#8B5CF6]',
        Echoes: 'bg-[#3B82F6]',
        KeepTrace: 'bg-blue-600',
        Ubiwan: 'bg-amber-500',
        Autre: 'bg-[#9CA3AF]',
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
    // Mileage trend data (30 days)
    const mileageTrendData = useMemo(() => {
        return Array.from({ length: 30 }, (_, i) => ({
            day: `${i + 1}`,
            km: Math.floor(Math.random() * 500 + 1200),
        }));
    }, []);
    // Fleet utilization data
    const fleetUtilizationData = useMemo(() => {
        const total = Math.max(stats.total, 1);
        return [
            { name: 'En service', value: Math.floor(total * 0.65), color: '#22c55e' },
            { name: 'En maintenance', value: Math.floor(total * 0.15), color: '#f97316' },
            { name: 'Inactif', value: Math.floor(total * 0.12), color: '#eab308' },
            { name: 'Hors ligne', value: Math.floor(total * 0.08), color: '#9ca3af' },
        ];
    }, [stats.total]);
    // Speed distribution data (6 ranges)
    const speedDistributionData = useMemo(() => {
        return [
            { range: '0-30 km/h', count: 45 },
            { range: '31-60 km/h', count: 82 },
            { range: '61-90 km/h', count: 63 },
            { range: '91-120 km/h', count: 28 },
            { range: '>120 km/h', count: 5 },
        ];
    }, []);
    // Alert frequency data (7 days)
    const alertFrequencyData = useMemo(() => {
        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        return days.map((day) => ({
            day,
            count: Math.floor(Math.random() * 25 + 5),
        }));
    }, []);
    // Enhanced heatmap density data (10 points around Nice)
    const heatmapData = useMemo(() => {
        return [
            { position: [43.7, 7.12], density: 'élevé' },
            { position: [43.71, 7.15], density: 'moyen' },
            { position: [43.68, 7.1], density: 'moyen' },
            { position: [43.72, 7.08], density: 'faible' },
            { position: [43.65, 7.2], density: 'faible' },
            { position: [43.73, 7.18], density: 'moyen' },
            { position: [43.66, 7.05], density: 'faible' },
            { position: [43.75, 7.22], density: 'faible' },
            { position: [43.64, 7.15], density: 'moyen' },
            { position: [43.69, 7.25], density: 'faible' },
        ];
    }, []);
    // Daily summary metrics
    const dailySummary = useMemo(() => {
        const totalKm = Math.round(stats.total * 45 + Math.random() * 100);
        const trips = Math.round(stats.moving * 3 + Math.random() * 20);
        const avgDriveTime = 280 + Math.floor(Math.random() * 60);
        const todayAlerts = alertsList.length;
        const geofenceViolations = 3;
        // Calculate day-over-day comparison
        const yesterdayKm = totalKm - Math.floor(totalKm * 0.08);
        const yesterdayTrips = trips - Math.floor(trips * 0.12);
        const yesterdayAlerts = todayAlerts - 1;
        const kmDiff = ((totalKm - yesterdayKm) / yesterdayKm) * 100;
        const tripsDiff = ((trips - yesterdayTrips) / yesterdayTrips) * 100;
        const alertsDiff = ((todayAlerts - yesterdayAlerts) / Math.max(yesterdayAlerts, 1)) * 100;
        return {
            totalKm,
            trips,
            avgDriveTime,
            todayAlerts,
            geofenceViolations,
            comparisons: {
                km: kmDiff,
                trips: tripsDiff,
                alerts: alertsDiff,
            },
        };
    }, [stats.total, stats.moving, alertsList.length]);
    // Activity feed events
    const activityFeedEvents = useMemo(() => {
        const events = [];
        // Generate mock events from the last hour
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        // Vehicle online/offline events
        for (let i = 0; i < 3; i++) {
            events.push({
                id: `evt-online-${i}`,
                type: 'online',
                title: `${vehicles[i % vehicles.length]?.name || 'Véhicule'} connecté`,
                description: 'Le véhicule s\'est connecté au serveur',
                vehicleName: vehicles[i % vehicles.length]?.name || 'Véhicule',
                timestamp: new Date(oneHourAgo.getTime() + i * 12 * 60 * 1000),
                icon: LogIn,
            });
        }
        // Offline events
        for (let i = 0; i < 2; i++) {
            events.push({
                id: `evt-offline-${i}`,
                type: 'offline',
                title: `${vehicles[(i + 4) % vehicles.length]?.name || 'Véhicule'} déconnecté`,
                description: 'Le véhicule s\'est déconnecté',
                vehicleName: vehicles[(i + 4) % vehicles.length]?.name || 'Véhicule',
                timestamp: new Date(oneHourAgo.getTime() + (3 + i * 8) * 10 * 60 * 1000),
                icon: LogOut,
            });
        }
        // Speed violations
        for (let i = 0; i < 2; i++) {
            events.push({
                id: `evt-speed-${i}`,
                type: 'speed',
                title: `Vitesse excessive - ${vehicles[(i + 7) % vehicles.length]?.name || 'Véhicule'}`,
                description: `${88 + i * 5} km/h dans une zone limitée à 90 km/h`,
                vehicleName: vehicles[(i + 7) % vehicles.length]?.name || 'Véhicule',
                timestamp: new Date(oneHourAgo.getTime() + (14 + i * 15) * 4 * 60 * 1000),
                icon: AlertTriangle,
            });
        }
        // Geofence events
        for (let i = 0; i < 2; i++) {
            events.push({
                id: `evt-geo-${i}`,
                type: 'geofence',
                title: `Géobarrière ${i === 0 ? 'entrée' : 'sortie'} - ${vehicles[(i + 10) % vehicles.length]?.name || 'Véhicule'}`,
                description: `Le véhicule a ${i === 0 ? 'quitté' : 'approché'} la zone Zone Commercial`,
                vehicleName: vehicles[(i + 10) % vehicles.length]?.name || 'Véhicule',
                timestamp: new Date(oneHourAgo.getTime() + (22 + i * 10) * 3 * 60 * 1000),
                icon: Shield,
            });
        }
        // Alert triggered events
        for (let i = 0; i < 2; i++) {
            events.push({
                id: `evt-alert-${i}`,
                type: 'alert',
                title: `Alerte - ${vehicles[(i + 13) % vehicles.length]?.name || 'Véhicule'}`,
                description: i === 0 ? 'Batterie faible détectée' : 'Maintenance préventive due',
                vehicleName: vehicles[(i + 13) % vehicles.length]?.name || 'Véhicule',
                timestamp: new Date(oneHourAgo.getTime() + (32 + i * 12) * 2 * 60 * 1000),
                icon: AlertCircle,
            });
        }
        // Sort by timestamp descending (most recent first)
        return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, [vehicles]);
    if (isLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-64" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-28" }, i))) }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx(Skeleton, { className: "h-80 lg:col-span-2" }), _jsx(Skeleton, { className: "h-80" })] })] }));
    }
    return (_jsx("div", { className: "min-h-screen bg-[#F8F9FC]", children: _jsxs("div", { className: "space-y-5", children: [_jsx(KeyboardShortcutsModal, {}), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold font-sans text-gray-900", children: "Tableau de bord" }), _jsxs("p", { className: "mt-0.5 text-[13px] text-gray-400", children: [stats.total, " v\u00E9hicules \u00B7 ", stats.withGps, " GPS actifs \u00B7 Derni\u00E8re mise \u00E0 jour: ", new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })] })] }), _jsx("div", { className: "flex gap-2", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowWidgetConfig(!showWidgetConfig), className: "gap-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 rounded-lg text-[12px] h-8", children: [_jsx(Settings, { size: 14 }), _jsx("span", { children: "Personnaliser" })] }) })] }), showWidgetConfig && (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "pb-4 px-4 md:px-6 pt-6 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Personnaliser les widgets" }), _jsx("p", { className: "text-sm mt-1 text-gray-500", children: "G\u00E9rez la visibilit\u00E9, la taille et l'ordre des widgets de votre tableau de bord" })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: resetWidgetConfig, className: "gap-2 text-amber-500 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20", children: [_jsx(RotateCcw, { size: 14 }), _jsx("span", { children: "R\u00E9initialiser" })] })] }) }), _jsx("div", { className: "px-4 md:px-6 py-6", children: _jsx("div", { className: "space-y-3", children: widgetOrder.map((id) => (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-gray-100 rounded-lg border border-gray-200 hover:border-[#E5E7EB] transition-colors", children: [_jsx("label", { className: "flex items-center gap-2 cursor-pointer", children: _jsx("input", { type: "checkbox", checked: widgetConfig[id].visible, onChange: () => toggleWidgetVisibility(id), className: "w-4 h-4 rounded cursor-pointer accent-[#4361EE]" }) }), _jsx("div", { className: "flex-1", children: _jsx("span", { className: `text-sm font-medium ${widgetConfig[id].visible ? 'text-gray-900' : 'text-gray-500'}`, children: widgetLabels[id] }) }), _jsx("div", { className: "flex gap-1 bg-white rounded-lg p-1", children: ['compact', 'normal', 'expanded'].map((size) => (_jsx("button", { onClick: () => setWidgetSize(id, size), title: size === 'compact' ? 'Compact' : size === 'normal' ? 'Normal' : 'Large', className: `px-2 py-1 text-xs rounded transition-colors ${widgetConfig[id].size === size
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-500 hover:text-gray-900'}`, children: size === 'compact' ? 'C' : size === 'normal' ? 'N' : 'L' }, size))) }), _jsxs("div", { className: "flex gap-1 border-l border-gray-200 pl-3", children: [_jsx("button", { onClick: () => moveWidgetUp(id), disabled: widgetOrder.indexOf(id) === 0, className: "p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors", title: "Monter", children: _jsx(ChevronUp, { size: 16 }) }), _jsx("button", { onClick: () => moveWidgetDown(id), disabled: widgetOrder.indexOf(id) === widgetOrder.length - 1, className: "p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors", title: "Descendre", children: _jsx(ChevronDown, { size: 16 }) })] })] }, id))) }) })] })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3", children: [_jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center", children: _jsx(Truck, { className: "text-blue-500", size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider", children: "Total" })] }), _jsx("p", { className: "text-2xl font-bold tabular-nums text-gray-900", children: stats.total }), _jsxs("p", { className: "text-[11px] text-gray-400 mt-0.5", children: [stats.withGps, " GPS actifs"] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center", children: _jsx(Navigation, { className: "text-emerald-500", size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider", children: "En route" })] }), _jsx("p", { className: "text-2xl font-bold tabular-nums text-emerald-600", children: stats.moving }), _jsxs("p", { className: "text-[11px] text-gray-400 mt-0.5", children: [stats.stopped, " \u00E0 l'arr\u00EAt"] })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center", children: _jsx(Activity, { className: "text-amber-500", size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider", children: "R\u00E9cents" })] }), _jsx("p", { className: "text-2xl font-bold tabular-nums text-amber-600", children: stats.recentlyActive }), _jsx("p", { className: "text-[11px] text-gray-400 mt-0.5", children: "derni\u00E8res 10 min" })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center", children: _jsx(WifiOff, { className: "text-red-400", size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider", children: "Hors ligne" })] }), _jsx("p", { className: "text-2xl font-bold tabular-nums text-red-500", children: stats.noGps }), _jsx("p", { className: "text-[11px] text-gray-400 mt-0.5", children: "sans position GPS" })] }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center", children: _jsx(Route, { className: "text-indigo-500", size: 18 }) }), _jsx("span", { className: "text-[10px] font-bold text-gray-300 uppercase tracking-wider", children: "Km/jour" })] }), _jsxs("p", { className: "text-2xl font-bold tabular-nums text-indigo-600", children: [(dailySummary.totalKm / 1000).toFixed(1), "K"] }), _jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [dailySummary.comparisons.km >= 0 ? (_jsx(TrendingUp, { size: 12, className: "text-emerald-500" })) : (_jsx(TrendingDown, { size: 12, className: "text-red-500" })), _jsxs("span", { className: `text-[11px] font-semibold ${dailySummary.comparisons.km >= 0 ? 'text-emerald-500' : 'text-red-500'}`, children: [dailySummary.comparisons.km >= 0 ? '+' : '', dailySummary.comparisons.km.toFixed(1), "%"] }), _jsx("span", { className: "text-[11px] text-gray-300", children: "vs hier" })] })] })] }), widgetConfig['daily-summary'].visible && (_jsx("div", { className: `${widgetConfig['daily-summary'].size === 'expanded'
                        ? 'md:col-span-2 lg:col-span-4'
                        : widgetConfig['daily-summary'].size === 'normal'
                            ? 'md:col-span-2 lg:col-span-2'
                            : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "R\u00E9sum\u00E9 du jour" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "M\u00E9triques cl\u00E9s d'aujourd'hui" })] }), _jsx("div", { className: "px-4 md:px-4 md:px-6 py-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Route, { className: "text-[#3B82F6]", size: 20 }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Kilom\u00E8tres parcourus" }), _jsxs("p", { className: "text-lg font-bold font-mono text-gray-900 mt-0.5", children: [dailySummary.totalKm.toLocaleString(), " km"] })] })] }), _jsxs("div", { className: `flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${dailySummary.comparisons.km >= 0
                                                                ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                                                                : 'bg-[rgba(255,77,106,0.2)] text-red-500'}`, children: [dailySummary.comparisons.km >= 0 ? (_jsx(TrendingUp, { size: 14 })) : (_jsx(TrendingDown, { size: 14 })), dailySummary.comparisons.km >= 0 ? '+' : '', dailySummary.comparisons.km.toFixed(1), "%"] })] }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-[rgba(168,85,247,0.08)] border border-[rgba(168,85,247,0.15)]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Navigation, { className: "text-[#8B5CF6]", size: 20 }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Nombre de trajets" }), _jsx("p", { className: "text-lg font-bold font-mono text-gray-900 mt-0.5", children: dailySummary.trips })] })] }), _jsxs("div", { className: `flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${dailySummary.comparisons.trips >= 0
                                                                ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                                                                : 'bg-[rgba(255,77,106,0.2)] text-red-500'}`, children: [dailySummary.comparisons.trips >= 0 ? (_jsx(TrendingUp, { size: 14 })) : (_jsx(TrendingDown, { size: 14 })), dailySummary.comparisons.trips >= 0 ? '+' : '', dailySummary.comparisons.trips.toFixed(1), "%"] })] }), _jsx("div", { className: "flex items-center justify-between p-3 rounded-lg bg-[rgba(255,181,71,0.08)] border border-[rgba(255,181,71,0.15)]", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Clock, { className: "text-amber-500", size: 20 }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Temps de conduite moyen" }), _jsxs("p", { className: "text-lg font-bold font-mono text-gray-900 mt-0.5", children: [Math.floor(dailySummary.avgDriveTime / 60), "h ", dailySummary.avgDriveTime % 60, "m"] })] })] }) }), _jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-[rgba(255,77,106,0.08)] border border-[rgba(255,77,106,0.15)]", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(AlertCircle, { className: "text-red-500", size: 20 }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Alertes du jour" }), _jsx("p", { className: "text-lg font-bold font-mono text-gray-900 mt-0.5", children: dailySummary.todayAlerts })] })] }), _jsxs("div", { className: `flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${dailySummary.comparisons.alerts <= 0
                                                                ? 'bg-[rgba(34,197,94,0.2)] text-[#22C55E]'
                                                                : 'bg-[rgba(255,77,106,0.2)] text-red-500'}`, children: [dailySummary.comparisons.alerts <= 0 ? (_jsx(TrendingDown, { size: 14 })) : (_jsx(TrendingUp, { size: 14 })), dailySummary.comparisons.alerts >= 0 ? '+' : '', dailySummary.comparisons.alerts.toFixed(1), "%"] })] }), _jsx("div", { className: "flex items-center justify-between p-3 rounded-lg bg-[rgba(0,229,204,0.08)] border border-[rgba(0,229,204,0.15)]", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "text-blue-600", size: 20 }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "G\u00E9ocl\u00F4tures viol\u00E9es" }), _jsx("p", { className: "text-lg font-bold font-mono text-gray-900 mt-0.5", children: dailySummary.geofenceViolations })] })] }) })] }) })] })] }) })), widgetConfig['activity-feed'].visible && (_jsx("div", { className: `${widgetConfig['activity-feed'].size === 'expanded'
                        ? 'md:col-span-2 lg:col-span-4'
                        : widgetConfig['activity-feed'].size === 'normal'
                            ? 'md:col-span-2 lg:col-span-2'
                            : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 md:px-4 md:px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Fil d'activit\u00E9 r\u00E9cente" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\u00C9v\u00E9nements de la derni\u00E8re heure" })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-xs text-blue-600 hover:bg-gray-100", onClick: () => navigate('/activity'), children: "Tout voir" })] }) }), _jsx("div", { className: "px-4 md:px-4 md:px-6 py-4", children: _jsx("div", { className: "space-y-3 max-h-96 overflow-y-auto", children: activityFeedEvents.slice(0, 12).map((event) => {
                                                const IconComponent = event.icon;
                                                const timeAgo = formatTimeAgo(event.timestamp);
                                                const iconColorMap = {
                                                    online: 'text-[#22C55E] bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.15)]',
                                                    offline: 'text-red-500 bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                                                    alert: 'text-red-500 bg-[rgba(255,77,106,0.1)] border border-[rgba(255,77,106,0.15)]',
                                                    geofence: 'text-[#8B5CF6] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.15)]',
                                                    speed: 'text-amber-500 bg-[rgba(255,181,71,0.1)] border border-[rgba(255,181,71,0.15)]',
                                                };
                                                return (_jsxs("div", { className: "flex gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors", children: [_jsx("div", { className: `rounded-lg p-2 flex-shrink-0 ${iconColorMap[event.type]}`, children: _jsx(IconComponent, { size: 16 }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: event.title }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: event.description }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsx("span", { className: "text-xs font-medium text-[#9CA3AF]", children: event.vehicleName }), _jsx("span", { className: "text-xs text-[#9CA3AF]", children: "\u00B7" }), _jsx("span", { className: "text-xs text-[#9CA3AF]", children: timeAgo })] })] })] }, event.id));
                                            }) }) })] })] }) })), _jsxs("div", { className: "grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4", children: [widgetConfig['hourly-activity'].visible && (_jsx("div", { className: `${widgetConfig['hourly-activity'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['hourly-activity'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Activit\u00E9 horaire (24h)" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "V\u00E9hicules en mouvement vs arr\u00EAt\u00E9s" })] }), _jsx("div", { className: "px-4 md:px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: hourlyData, children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "colorMoving", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#22c55e", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#22c55e", stopOpacity: 0.1 })] }), _jsxs("linearGradient", { id: "colorStopped", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#EF4444", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#EF4444", stopOpacity: 0.1 })] })] }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "hour", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                                    backgroundColor: '#FFFFFF',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '8px',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                                                }, formatter: (value) => [value, ''] }), _jsx(Area, { type: "monotone", dataKey: "moving", stroke: "#22c55e", fillOpacity: 1, fill: "url(#colorMoving)", name: "En mouvement" }), _jsx(Area, { type: "monotone", dataKey: "stopped", stroke: "#EF4444", fillOpacity: 1, fill: "url(#colorStopped)", name: "Arr\u00EAt\u00E9s" })] }) }) })] })] }) })), widgetConfig['fleet-status'].visible && (_jsx("div", { className: `${widgetConfig['fleet-status'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['fleet-status'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "\u00C9tat de la flotte" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Distribution par statut v\u00E9hicule" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: vehicleStatusData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, value }) => `${name}: ${value}`, outerRadius: 100, fill: "#8884d8", dataKey: "value", children: vehicleStatusData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => `${value} véhicules`, contentStyle: {
                                                                    backgroundColor: '#FFFFFF',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '8px',
                                                                    color: '#1F2937',
                                                                } })] }) }) })] })] }) })), widgetConfig['alert-distribution'].visible && (_jsx("div", { className: `${widgetConfig['alert-distribution'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['alert-distribution'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Distribution des alertes" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Nombre d'alertes par type (derni\u00E8res 24h)" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: alertDistributionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "type", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                                    backgroundColor: '#FFFFFF',
                                                                    border: '1px solid #E5E7EB',
                                                                    borderRadius: '8px',
                                                                    color: '#1F2937',
                                                                }, formatter: (value) => [`${value} alertes`, 'Nombre'] }), _jsx(Bar, { dataKey: "count", fill: "#4361EE", radius: [8, 8, 0, 0] })] }) }) })] })] }) })), widgetConfig['quick-actions'].visible && (_jsx("div", { className: `${widgetConfig['quick-actions'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['quick-actions'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Actions rapides" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Acc\u00E8s direct aux fonctionnalit\u00E9s" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsxs("div", { className: "grid grid-cols-1 gap-2.5", children: [_jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", onClick: () => navigate('/map'), children: [_jsx(MapPin, { size: 16 }), _jsx("span", { className: "text-xs", children: "Voir Carte" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", onClick: () => navigate('/reports'), children: [_jsx(FileText, { size: 16 }), _jsx("span", { className: "text-xs", children: "Rapport" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", onClick: () => navigate('/geofences'), children: [_jsx(Zap, { size: 16 }), _jsx("span", { className: "text-xs", children: "G\u00E9obarri\u00E8re" })] }), _jsxs(Button, { variant: "outline", className: "flex items-center justify-start gap-3 h-auto py-2.5 flex-row border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", onClick: () => navigate('/alerts/new'), children: [_jsx(Plus, { size: 16 }), _jsx("span", { className: "text-xs", children: "Alerte" })] })] }) })] })] }) }))] }), _jsxs("div", { className: "grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4", children: [widgetConfig['alerts-feed'].visible && (_jsx("div", { className: `${widgetConfig['alerts-feed'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['alerts-feed'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Fil d'activit\u00E9 r\u00E9cente" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Alertes et changements de statut" })] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-xs text-blue-600 hover:bg-gray-100", onClick: () => navigate('/alerts'), children: "Voir tous" })] }) }), _jsx("div", { className: "px-4 md:px-6 py-4", children: alertsList.length > 0 ? (_jsx("div", { className: "space-y-3", children: alertsList.map((alert, idx) => (_jsxs("div", { className: "flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 cursor-pointer transition-colors", children: [_jsx(AlertCircle, { size: 16, className: alert.severity === 'critical'
                                                                    ? 'text-red-500 flex-shrink-0 mt-0.5'
                                                                    : 'text-amber-500 flex-shrink-0 mt-0.5' }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: alert.title }), _jsx(Badge, { variant: alert.severity === 'critical' ? 'destructive' : 'secondary', className: `flex-shrink-0 text-xs ${alert.severity === 'critical'
                                                                                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                                                                    : 'bg-amber-500/20 text-amber-500 border-amber-500/30'}`, children: alert.severity })] }), _jsx("p", { className: "text-xs text-gray-500 line-clamp-2 mt-1", children: alert.message }), _jsx("p", { className: "text-xs text-[#9CA3AF] mt-2", children: formatTimeAgo(alert.createdAt) })] })] }, idx))) })) : (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-center", children: [_jsx(AlertCircle, { size: 24, className: "text-[#9CA3AF] mb-2" }), _jsx("p", { className: "text-sm text-gray-500", children: "Aucune alerte r\u00E9cente" })] })) })] })] }) })), widgetConfig['status-summary'].visible && (_jsx("div", { className: `${widgetConfig['status-summary'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['status-summary'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-2'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "R\u00E9sum\u00E9 des statuts" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Derni\u00E8res mises \u00E0 jour v\u00E9hicule" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx("div", { className: "space-y-3", children: recentlyUpdated.slice(0, 8).map((v) => {
                                                        const isMoving = (v.currentSpeed || 0) > 2;
                                                        return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-gray-200 p-2.5 hover:bg-gray-100 cursor-pointer", onClick: () => navigate(`/vehicles/${v.id}`), children: [_jsx("span", { className: `h-2 w-2 rounded-full flex-shrink-0 ${isMoving ? 'bg-[#22C55E]' : 'bg-amber-500'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: v.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [isMoving ? 'En mouvement' : 'Arrêté', " \u00B7 ", formatTimeAgo(v.lastCommunication)] })] }), _jsxs("span", { className: "text-xs font-semibold font-mono text-gray-900 flex-shrink-0", children: [(v.currentSpeed || 0).toFixed(0), _jsx("span", { className: "text-gray-500 font-normal", children: " km/h" })] })] }, v.id));
                                                    }) }) })] })] }) }))] }), widgetConfig['mileage-trend'].visible && (_jsx("div", { className: `${widgetConfig['mileage-trend'].size === 'expanded'
                        ? 'lg:col-span-4'
                        : widgetConfig['mileage-trend'].size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Tendance kilom\u00E9trique" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Kilom\u00E9trage quotidien sur 30 jours" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: mileageTrendData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "day", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            color: '#1F2937',
                                                        }, formatter: (value) => [`${value} km`, 'Kilométrage'] }), _jsx(Line, { type: "monotone", dataKey: "km", stroke: "#4361EE", dot: false, strokeWidth: 2, name: "Kilom\u00E9trage" })] }) }) })] })] }) })), widgetConfig['fleet-utilization'].visible && (_jsx("div", { className: `${widgetConfig['fleet-utilization'].size === 'expanded'
                        ? 'lg:col-span-2'
                        : widgetConfig['fleet-utilization'].size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Utilisation de la flotte" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "\u00C9tat des v\u00E9hicules" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: fleetUtilizationData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, value }) => `${name}: ${value}`, outerRadius: 100, fill: "#8884d8", dataKey: "value", children: fleetUtilizationData.map((entry, index) => (_jsx(Cell, { fill: entry.color }, `cell-${index}`))) }), _jsx(Tooltip, { formatter: (value) => `${value} véhicules`, contentStyle: {
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            color: '#1F2937',
                                                        } })] }) }) })] })] }) })), widgetConfig['speed-distribution'].visible && (_jsx("div", { className: `${widgetConfig['speed-distribution'].size === 'expanded'
                        ? 'lg:col-span-2'
                        : widgetConfig['speed-distribution'].size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Distribution des vitesses" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Nombre de v\u00E9hicules par plage de vitesse" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: speedDistributionData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "range", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            color: '#1F2937',
                                                        }, formatter: (value) => [`${value} véhicules`, 'Nombre'] }), _jsx(Bar, { dataKey: "count", fill: "#4361EE", radius: [8, 8, 0, 0] })] }) }) })] })] }) })), widgetConfig['alert-frequency'].visible && (_jsx("div", { className: `${widgetConfig['alert-frequency'].size === 'expanded'
                        ? 'lg:col-span-2'
                        : widgetConfig['alert-frequency'].size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Fr\u00E9quence des alertes" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Nombre d'alertes par jour (7 derniers jours)" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: alertFrequencyData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "day", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            color: '#1F2937',
                                                        }, formatter: (value) => [`${value} alertes`, 'Nombre'] }), _jsx(Bar, { dataKey: "count", fill: "#F59E0B", radius: [8, 8, 0, 0] })] }) }) })] })] }) })), widgetConfig['weekly-comparison'].visible && (_jsx("div", { className: `${widgetConfig['weekly-comparison'].size === 'expanded'
                        ? 'lg:col-span-2'
                        : widgetConfig['weekly-comparison'].size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Comparaison hebdomadaire" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Cette semaine vs semaine derni\u00E8re" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: [
                                                    { name: 'Km parcourus', current: 12450, previous: 11200 },
                                                    { name: 'Alertes', current: 23, previous: 31 },
                                                    { name: 'Heures actives', current: 856, previous: 790 },
                                                ], children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#E5E7EB" }), _jsx(XAxis, { dataKey: "name", stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#9CA3AF", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: {
                                                            backgroundColor: '#FFFFFF',
                                                            border: '1px solid #E5E7EB',
                                                            borderRadius: '8px',
                                                            color: '#1F2937',
                                                        } }), _jsx(Legend, { wrapperStyle: { color: '#6B7280' } }), _jsx(Bar, { dataKey: "current", fill: "#4361EE", radius: [8, 8, 0, 0], name: "Cette semaine" }), _jsx(Bar, { dataKey: "previous", fill: "#9CA3AF", radius: [8, 8, 0, 0], name: "Semaine derni\u00E8re" })] }) }) })] })] }) })), widgetConfig.heatmap.visible && (_jsx("div", { className: `${widgetConfig.heatmap.size === 'expanded'
                        ? 'w-full'
                        : widgetConfig.heatmap.size === 'normal'
                            ? 'lg:col-span-2'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity z-10", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Zones d'activit\u00E9 (Carte thermique)" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Densit\u00E9 de v\u00E9hicules autour de Nice" })] }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex gap-6 text-xs", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-red-500" }), _jsx("span", { className: "text-gray-500", children: "\u00C9lev\u00E9" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-amber-400" }), _jsx("span", { className: "text-gray-500", children: "Moyen" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-blue-500" }), _jsx("span", { className: "text-gray-500", children: "Faible" })] })] }), _jsx("div", { style: { height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #E5E7EB' }, children: _jsxs(MapContainer, { center: [43.7, 7.12], zoom: 12, style: { height: '100%', width: '100%' }, children: [_jsx(TileLayer, { url: TOMTOM_TILE_URL('basic'), attribution: '\u00A9 TomTom' }), heatmapData.map((marker, idx) => (_jsx(HeatmapMarker, { position: marker.position, density: marker.density }, idx)))] }) })] }) })] })] }) })), widgetConfig.departments.visible && (_jsx("div", { className: `${widgetConfig.departments.size === 'expanded'
                        ? 'w-full'
                        : widgetConfig.departments.size === 'normal'
                            ? 'w-full'
                            : ''}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "D\u00E9partements" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Statut et performance par d\u00E9partement" })] }), _jsxs(Dialog, { open: showNewDeptDialog, onOpenChange: setShowNewDeptDialog, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "gap-1 bg-blue-600 text-white hover:bg-blue-600/80", children: [_jsx(Plus, { size: 14 }), "Nouveau"] }) }), _jsxs(DialogContent, { className: "bg-white border border-gray-200", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Ajouter un d\u00E9partement" }), _jsx(DialogDescription, { className: "text-gray-500", children: "Entrez le nom du nouveau d\u00E9partement" })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Nom du d\u00E9partement", value: newDeptName, onChange: (e) => setNewDeptName(e.target.value), className: "w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600", onKeyDown: (e) => e.key === 'Enter' && addDepartment() }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { variant: "outline", onClick: () => setShowNewDeptDialog(false), className: "border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", children: "Annuler" }), _jsx(Button, { onClick: addDepartment, className: "bg-blue-600 text-white hover:bg-blue-600/80", children: "Ajouter" })] })] })] })] })] }) }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: departments.map((dept) => (_jsxs("div", { className: "p-4 rounded-lg border border-gray-200 hover:border-[#E5E7EB] transition-colors", children: [_jsx("div", { className: "flex items-start justify-between mb-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "rounded-lg bg-[rgba(59,130,246,0.1)] p-2", children: _jsx(Building2, { size: 16, className: "text-[#3B82F6]" }) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: dept.name }), _jsx("p", { className: "text-xs text-gray-500", children: "D\u00E9partement" })] })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 uppercase tracking-wide mb-1", children: "V\u00E9hicules" }), _jsx("p", { className: "text-2xl font-bold font-mono text-gray-900", children: dept.vehicleCount })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 uppercase tracking-wide mb-1", children: "Chauffeurs actifs" }), _jsx("p", { className: "text-2xl font-bold font-mono text-gray-900", children: dept.driverCount })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "text-xs font-medium text-gray-500", children: "Performance" }), _jsxs("p", { className: "text-xs font-bold text-gray-900", children: [dept.performanceScore, "%"] })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-100 overflow-hidden", children: _jsx("div", { className: `h-full transition-all ${dept.performanceScore >= 90
                                                                                ? 'bg-[#22C55E]'
                                                                                : dept.performanceScore >= 80
                                                                                    ? 'bg-amber-500'
                                                                                    : 'bg-red-500'}`, style: { width: `${dept.performanceScore}%` } }) })] })] })] }, dept.id))) }) })] })] }) })), _jsxs("div", { className: "grid gap-6 auto-rows-max md:grid-cols-2 lg:grid-cols-4", children: [widgetConfig['fleet-activity'].visible && (_jsx("div", { className: `${widgetConfig['fleet-activity'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['fleet-activity'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-3'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Activit\u00E9 de la flotte" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "V\u00E9hicules avec position GPS, tri\u00E9s par vitesse" })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "gap-1 text-xs text-blue-600 hover:bg-gray-100", onClick: () => navigate('/map'), children: ["Carte", _jsx(ChevronRight, { size: 14 })] })] }) }), _jsxs("div", { className: "px-4 md:px-6 py-4", children: [_jsx("div", { className: "space-y-2", children: topMoving.map((vehicle) => {
                                                            const isMoving = (vehicle.currentSpeed || 0) > 2;
                                                            return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-100 cursor-pointer transition-colors", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full flex-shrink-0 ${isMoving ? 'bg-[#22C55E]' : 'bg-[#9CA3AF]'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 truncate", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.plate })] }), _jsx("div", { className: "text-right flex-shrink-0", children: _jsxs("p", { className: "text-sm font-bold font-mono text-gray-900", children: [(vehicle.currentSpeed || 0).toFixed(0), ' ', _jsx("span", { className: "text-xs font-normal text-gray-500", children: "km/h" })] }) }), _jsx("div", { className: "text-right flex-shrink-0 min-w-20", children: _jsx("p", { className: "text-xs text-[#9CA3AF]", children: formatTimeAgo(vehicle.lastCommunication) }) }), _jsx(ChevronRight, { size: 14, className: "text-[#9CA3AF]" })] }, vehicle.id));
                                                        }) }), _jsx(Button, { variant: "outline", className: "mt-4 w-full text-sm border-gray-200 bg-gray-100 text-gray-900 hover:bg-[#F9FAFB]", onClick: () => navigate('/vehicles'), children: "Voir tous les v\u00E9hicules" })] })] })] }) })), widgetConfig.providers.visible && (_jsx("div", { className: `${widgetConfig.providers.size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig.providers.size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-1'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsxs("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: [_jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Fournisseurs GPS" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "R\u00E9partition par provider" })] }), _jsxs("div", { className: "px-4 md:px-6 py-4", children: [_jsx("div", { className: "space-y-3", children: Object.entries(stats.providers)
                                                            .sort(([, a], [, b]) => b - a)
                                                            .map(([name, count]) => {
                                                            const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                                            return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-sm mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-3 w-3 rounded-full ${providerColors[name] || 'bg-[#9CA3AF]'}` }), _jsx("span", { className: "font-medium text-gray-900", children: name })] }), _jsx("span", { className: "text-gray-500 font-medium", children: count })] }), _jsx("div", { className: "h-2 w-full rounded-full bg-gray-100", children: _jsx("div", { className: `h-2 rounded-full ${providerColors[name] || 'bg-[#9CA3AF]'} transition-all`, style: { width: `${pct}%` } }) })] }, name));
                                                        }) }), _jsx("div", { className: "mt-4 pt-3 border-t border-gray-200 text-center", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Vitesse max: ", _jsxs("span", { className: "font-bold text-gray-900", children: [stats.maxSpeed.toFixed(0), " km/h"] }), ' · ', "Moyenne: ", _jsxs("span", { className: "font-bold text-gray-900", children: [stats.avgSpeed.toFixed(0), " km/h"] })] }) })] })] })] }) })), widgetConfig['recent-updates'].visible && (_jsx("div", { className: `${widgetConfig['recent-updates'].size === 'expanded'
                                ? 'md:col-span-2 lg:col-span-4'
                                : widgetConfig['recent-updates'].size === 'normal'
                                    ? 'md:col-span-2 lg:col-span-1'
                                    : 'md:col-span-1 lg:col-span-1'}`, children: _jsxs("div", { className: "relative group", children: [_jsx("div", { className: "absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(GripHorizontal, { size: 16, className: "text-gray-500" }) }), _jsxs("div", { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx("div", { className: "px-4 md:px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "font-sans text-base font-bold text-gray-900", children: "Mises \u00E0 jour r\u00E9centes" }) }), _jsx("div", { className: "px-4 md:px-6 py-4", children: _jsx("div", { className: "space-y-2.5", children: recentlyUpdated.map((v) => (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx(Clock, { size: 12, className: "text-gray-500 flex-shrink-0" }), _jsx("span", { className: "font-medium text-gray-900 truncate flex-1", children: v.name }), _jsx("span", { className: "text-[#9CA3AF] flex-shrink-0", children: formatTimeAgo(v.lastCommunication) })] }, v.id))) }) })] })] }) }))] })] }) }));
}
//# sourceMappingURL=DashboardPage.js.map