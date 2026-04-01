import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAlerts, useAlertStats, useBulkAcknowledgeAlerts, useAlertRules, useCreateAlertRule, } from '@/hooks/useAlerts';
import { AlertType, AlertSeverity, } from '@/types/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { AlertCircle, Check, Plus, Bell, BellOff, Settings, Zap, Search, ChevronRight, Shield, Gauge, MapPin, Clock, Battery, Wrench, Fuel, Activity, Trash2, TrendingUp, Save, } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Alert type configuration for the rule builder
const alertTypeConfig = {
    [AlertType.OVERSPEED]: {
        label: 'Overspeed',
        icon: _jsx(Gauge, { size: 18 }),
        description: 'Alert when vehicle exceeds speed limit',
        fields: ['speedLimit'],
    },
    [AlertType.GEOFENCE_ENTRY]: {
        label: 'Geofence Entry',
        icon: _jsx(MapPin, { size: 18 }),
        description: 'Alert when vehicle enters a geofence zone',
        fields: ['geofenceId'],
    },
    [AlertType.GEOFENCE_EXIT]: {
        label: 'Geofence Exit',
        icon: _jsx(MapPin, { size: 18 }),
        description: 'Alert when vehicle exits a geofence zone',
        fields: ['geofenceId'],
    },
    [AlertType.IDLE_TIMEOUT]: {
        label: 'Idle Timeout',
        icon: _jsx(Clock, { size: 18 }),
        description: 'Alert when vehicle is idle for too long',
        fields: ['idleMinutes'],
    },
    [AlertType.OFFLINE]: {
        label: 'Offline',
        icon: _jsx(BellOff, { size: 18 }),
        description: 'Alert when vehicle goes offline',
        fields: ['offlineMinutes'],
    },
    [AlertType.LOW_BATTERY]: {
        label: 'Low Battery',
        icon: _jsx(Battery, { size: 18 }),
        description: 'Alert when tracker battery is low',
        fields: ['batteryPercent'],
    },
    [AlertType.MAINTENANCE_DUE]: {
        label: 'Maintenance Due',
        icon: _jsx(Wrench, { size: 18 }),
        description: 'Alert for scheduled maintenance',
        fields: ['kmThreshold'],
    },
    [AlertType.FUEL_ALERT]: {
        label: 'Fuel Alert',
        icon: _jsx(Fuel, { size: 18 }),
        description: 'Alert on sudden fuel level changes',
        fields: ['fuelDropPercent'],
    },
    [AlertType.HARSH_ACCELERATION]: {
        label: 'Harsh Acceleration',
        icon: _jsx(Activity, { size: 18 }),
        description: 'Alert on sudden acceleration events',
        fields: ['gForce'],
    },
    [AlertType.HARSH_BRAKING]: {
        label: 'Harsh Braking',
        icon: _jsx(Activity, { size: 18 }),
        description: 'Alert on sudden braking events',
        fields: ['gForce'],
    },
};
const severityOptions = [
    { value: AlertSeverity.CRITICAL, label: 'Critical', color: 'text-red-600' },
    { value: AlertSeverity.HIGH, label: 'High', color: 'text-orange-600' },
    { value: AlertSeverity.MEDIUM, label: 'Medium', color: 'text-yellow-600' },
    { value: AlertSeverity.LOW, label: 'Low', color: 'text-blue-600' },
    { value: AlertSeverity.INFO, label: 'Info', color: 'text-gray-600' },
];
const defaultRuleForm = {
    name: '',
    description: '',
    type: '',
    severity: AlertSeverity.MEDIUM,
    conditionValue: '',
    conditionDuration: '',
    actions: [],
    enabled: true,
    escalationEnabled: false,
    escalationDelay: '15min',
    escalationTarget: 'Manager',
    parentRuleId: undefined,
    silentHoursEnabled: false,
    silentHoursFrom: '22:00',
    silentHoursTo: '06:00',
    silentHoursDays: [true, true, true, true, true, true, true],
    notificationChannels: {
        email: true,
        pushMobile: false,
        whatsapp: false,
        sms: true,
    },
};
export default function AlertsPage() {
    const [tab, setTab] = useState('alerts');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('unacknowledged');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedAlerts, setSelectedAlerts] = useState([]);
    const [showRuleModal, setShowRuleModal] = useState(false);
    const [ruleForm, setRuleForm] = useState(defaultRuleForm);
    const [ruleStep, setRuleStep] = useState(0);
    const [formError, setFormError] = useState('');
    const [disabledRules, setDisabledRules] = useState(new Set());
    const [selectedAlertId, setSelectedAlertId] = useState(null);
    const [alertNotes, setAlertNotes] = useState({});
    const [alertAssignments, setAlertAssignments] = useState({});
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [showAssignDropdown, setShowAssignDropdown] = useState(false);
    const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status });
    const { data: stats } = useAlertStats();
    const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts();
    const { data: rules, isLoading: rulesLoading } = useAlertRules();
    const createRuleMutation = useCreateAlertRule();
    const alerts = alertsData?.data || [];
    const totalPages = alertsData?.totalPages || 1;
    const filteredAlerts = alerts.filter((a) => {
        // Keyword search filter
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.message.toLowerCase().includes(search.toLowerCase())) {
            return false;
        }
        // Date range filter
        if (dateFrom || dateTo) {
            const alertDate = new Date(a.createdAt);
            if (dateFrom && alertDate < new Date(dateFrom))
                return false;
            if (dateTo) {
                const endOfDay = new Date(dateTo);
                endOfDay.setHours(23, 59, 59, 999);
                if (alertDate > endOfDay)
                    return false;
            }
        }
        return true;
    });
    const handleSelectAlert = (id) => {
        setSelectedAlerts((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
    };
    const handleBulkAcknowledge = () => {
        if (selectedAlerts.length > 0) {
            bulkAcknowledge(selectedAlerts);
            setSelectedAlerts([]);
        }
    };
    const openRuleCreator = () => {
        setRuleForm(defaultRuleForm);
        setRuleStep(0);
        setFormError('');
        setShowRuleModal(true);
    };
    const handleCreateRule = async () => {
        setFormError('');
        if (!ruleForm.name.trim()) {
            setFormError('Rule name is required');
            return;
        }
        if (!ruleForm.type) {
            setFormError('Please select an alert type');
            return;
        }
        const condition = {
            field: ruleForm.type === AlertType.OVERSPEED ? 'speed' : ruleForm.type,
            operator: 'greater_than',
            value: parseFloat(ruleForm.conditionValue) || 0,
            duration: parseInt(ruleForm.conditionDuration) || undefined,
        };
        try {
            await createRuleMutation.mutateAsync({
                name: ruleForm.name.trim(),
                description: ruleForm.description.trim() || undefined,
                type: ruleForm.type,
                severity: ruleForm.severity,
                condition,
                actions: ruleForm.actions.length > 0 ? ruleForm.actions : [{ type: 'push', target: 'all' }],
                enabled: ruleForm.enabled,
            });
            setShowRuleModal(false);
        }
        catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create rule');
        }
    };
    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'low':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    const getPriorityDot = (type) => {
        if (['OVERSPEED', 'ACCIDENT'].includes(type)) {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-red-600 mr-2" });
        }
        else if (['GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY'].includes(type)) {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2" });
        }
        else {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-blue-600 mr-2" });
        }
    };
    const trendData = [
        { name: 'Lun', alerts: 12 },
        { name: 'Mar', alerts: 19 },
        { name: 'Mer', alerts: 15 },
        { name: 'Jeu', alerts: 25 },
        { name: 'Ven', alerts: 18 },
        { name: 'Sam', alerts: 10 },
        { name: 'Dim', alerts: 8 },
    ];
    const assignmentOptions = ['Admin', 'Manager', 'Opérateur'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Alertes" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Surveiller et g\u00E9rer les alertes et les r\u00E8gles de la flotte" })] }), _jsxs("div", { className: "flex gap-2", children: [selectedAlerts.length > 0 && (_jsxs(Button, { variant: "outline", className: "gap-2", onClick: handleBulkAcknowledge, children: [_jsx(Check, { size: 16 }), "Reconna\u00EEtre (", selectedAlerts.length, ")"] })), _jsxs(Button, { className: "gap-2", onClick: openRuleCreator, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er une r\u00E8gle"] })] })] }), stats ? (_jsxs("div", { className: "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Total" }), _jsx("p", { className: "text-xl font-bold", children: stats.total })] }), _jsx(Bell, { size: 18, className: "text-gray-400" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Non reconnus" }), _jsx("p", { className: "text-xl font-bold text-amber-600", children: stats.unacknowledged })] }), _jsx(AlertCircle, { size: 18, className: "text-amber-400" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-red-600 font-medium", children: "Critical" }), _jsx("p", { className: "text-xl font-bold text-red-600", children: stats.critical })] }), _jsx(Shield, { size: 18, className: "text-red-400" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-orange-600 font-medium", children: "High" }), _jsx("p", { className: "text-xl font-bold text-orange-600", children: stats.high })] }), _jsx(Zap, { size: 18, className: "text-orange-400" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-yellow-600 font-medium", children: "Medium" }), _jsx("p", { className: "text-xl font-bold text-yellow-600", children: stats.medium })] }), _jsx(Activity, { size: 18, className: "text-yellow-400" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-blue-600 font-medium", children: "Low / Info" }), _jsx("p", { className: "text-xl font-bold text-blue-600", children: stats.low + stats.info })] }), _jsx(Bell, { size: 18, className: "text-blue-400" })] }) }) })] })) : (_jsx(Skeleton, { className: "h-20" })), _jsxs("div", { className: "flex gap-1 rounded-lg bg-gray-100 p-1", children: [_jsxs("button", { onClick: () => setTab('alerts'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'alerts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`, children: ["Alertes (", stats?.total || 0, ")"] }), _jsx("button", { onClick: () => setTab('trends'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'trends' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`, children: "Tendances" }), _jsxs("button", { onClick: () => setTab('rules'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === 'rules' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`, children: ["R\u00E8gles (", rules?.length || 0, ")"] })] }), tab === 'alerts' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 16 }), _jsx(Input, { placeholder: "Rechercher les alertes...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-9" })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'unacknowledged', 'acknowledged'].map((s) => (_jsx("button", { onClick: () => {
                                                setStatus(s === 'all' ? undefined : s);
                                                setPage(1);
                                            }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${(s === 'all' && !status) || status === s
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`, children: s === 'all' ? 'Tout' : s === 'unacknowledged' ? 'Actif' : 'Reconnu' }, s))) })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "De" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => {
                                                    setDateFrom(e.target.value);
                                                    setPage(1);
                                                }, className: "w-full" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "\u00C0" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => {
                                                    setDateTo(e.target.value);
                                                    setPage(1);
                                                }, className: "w-full" })] }), (dateFrom || dateTo) && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                            setDateFrom('');
                                            setDateTo('');
                                            setPage(1);
                                        }, children: "R\u00E9initialiser" }))] })] }), isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-20" }, i))) })) : filteredAlerts.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(Bell, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-700", children: "Aucune alerte trouv\u00E9e" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: search ? 'Essayez un terme de recherche différent' : 'Tout clair ! Aucune alerte active.' })] }) })) : (_jsx("div", { className: "space-y-2", children: filteredAlerts.map((alert) => (_jsx(Card, { className: `transition-all cursor-pointer ${selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-400' : ''} ${selectedAlertId === alert.id ? 'ring-2 ring-green-400' : ''}`, onClick: () => {
                                setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id);
                                setShowNoteForm(false);
                                setShowAssignDropdown(false);
                            }, children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("input", { type: "checkbox", checked: selectedAlerts.includes(alert.id), onChange: () => handleSelectAlert(alert.id), className: "mt-1 rounded border-gray-300", onClick: (e) => e.stopPropagation() }), _jsxs("div", { className: `rounded-lg p-2 ${getSeverityBadgeClass(alert.severity)}`, children: [getPriorityDot(alert.type), _jsx(AlertCircle, { size: 16 })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium text-gray-900", children: alert.title }), _jsx("p", { className: "mt-0.5 text-sm text-gray-600 line-clamp-1", children: alert.message })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(alert.severity)}`, children: alert.severity }), alert.isAcknowledged ? (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Check, { size: 12, className: "mr-1" }), "Reconnu"] })) : (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1 text-xs", onClick: () => bulkAcknowledge([alert.id]), children: [_jsx(Check, { size: 12 }), "Reconna\u00EEtre"] }))] })] }), _jsx("p", { className: "mt-1 text-xs text-gray-400", children: formatDateTime(alert.createdAt) }), selectedAlertId === alert.id && (_jsxs("div", { className: "mt-3 space-y-3 border-t border-gray-100 pt-3", children: [alertAssignments[alert.id] && (_jsxs("div", { className: "text-xs", children: [_jsx("span", { className: "text-gray-600", children: "Assign\u00E9 \u00E0: " }), _jsx(Badge, { variant: "outline", className: "ml-1", children: alertAssignments[alert.id] })] })), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", className: "gap-1 text-xs", onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        setShowAssignDropdown(!showAssignDropdown);
                                                                    }, children: "Assigner" }), _jsx(Button, { size: "sm", variant: "outline", className: "gap-1 text-xs", onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        setShowNoteForm(!showNoteForm);
                                                                        setNoteInput(alertNotes[alert.id] || '');
                                                                    }, children: "Notes" })] }), showAssignDropdown && (_jsx("div", { className: "flex gap-1 flex-wrap", children: assignmentOptions.map((opt) => (_jsx(Badge, { variant: "secondary", className: "cursor-pointer", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setAlertAssignments({
                                                                        ...alertAssignments,
                                                                        [alert.id]: opt,
                                                                    });
                                                                    setShowAssignDropdown(false);
                                                                }, children: opt }, opt))) })), showNoteForm && (_jsxs("div", { className: "space-y-2", children: [_jsx("textarea", { placeholder: "Ajouter une note...", value: noteInput, onChange: (e) => setNoteInput(e.target.value), onClick: (e) => e.stopPropagation(), className: "w-full text-xs p-2 border border-gray-300 rounded resize-none", rows: 2 }), _jsxs(Button, { size: "sm", className: "gap-1 text-xs w-full", onClick: (e) => {
                                                                        e.stopPropagation();
                                                                        setAlertNotes({
                                                                            ...alertNotes,
                                                                            [alert.id]: noteInput,
                                                                        });
                                                                        setShowNoteForm(false);
                                                                    }, children: [_jsx(Save, { size: 12 }), "Enregistrer"] })] })), alertNotes[alert.id] && (_jsxs("div", { className: "text-xs bg-gray-50 p-2 rounded border border-gray-200", children: [_jsx("p", { className: "font-medium text-gray-700", children: "Note:" }), _jsx("p", { className: "text-gray-600 mt-1", children: alertNotes[alert.id] })] }))] }))] })] }) }) }, alert.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " sur ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Pr\u00E9c\u00E9dent" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Suivant" })] })] }))] })), tab === 'trends' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Alertes cette semaine" }), _jsx("p", { className: "mt-2 text-2xl font-bold", children: "87" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Alertes ce mois" }), _jsx("p", { className: "mt-2 text-2xl font-bold", children: "342" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Type le plus fr\u00E9quent" }), _jsx("p", { className: "mt-2 text-lg font-bold text-orange-600", children: "Overspeed" })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(TrendingUp, { size: 20 }), "Fr\u00E9quence des alertes - 7 derniers jours"] }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: trendData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorAlerts", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Area, { type: "monotone", dataKey: "alerts", stroke: "#3b82f6", fillOpacity: 1, fill: "url(#colorAlerts)" })] }) }) })] })] })), tab === 'rules' && (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base", children: [_jsx(Clock, { size: 18, className: "text-blue-600" }), "Heures silencieuses"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "silentEnabled", defaultChecked: false, className: "rounded border-gray-300" }), _jsx("label", { htmlFor: "silentEnabled", className: "text-sm font-medium text-gray-700", children: "Activer les heures silencieuses globales" })] }), _jsx("p", { className: "text-xs text-gray-600", children: "Les alertes non-critiques seront mises en attente pendant cette p\u00E9riode" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "De" }), _jsx("input", { type: "time", defaultValue: "22:00", className: "rounded-md border border-gray-300 px-2 py-1 text-sm" }), _jsx("span", { className: "text-sm text-gray-600", children: "\u00E0" }), _jsx("input", { type: "time", defaultValue: "06:00", className: "rounded-md border border-gray-300 px-2 py-1 text-sm" })] })] })] }), rulesLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => (_jsx(Skeleton, { className: "h-24" }, i))) })) : !rules || rules.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(Settings, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-700", children: "Aucune r\u00E8gle d'alerte configur\u00E9e" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Cr\u00E9ez des r\u00E8gles pour g\u00E9n\u00E9rer automatiquement des alertes en fonction des conditions des v\u00E9hicules." }), _jsxs(Button, { className: "mt-4 gap-2", onClick: openRuleCreator, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er votre premi\u00E8re r\u00E8gle"] })] }) })) : (_jsx("div", { className: "space-y-3", children: rules.map((rule) => {
                            const typeConf = alertTypeConfig[rule.type];
                            return (_jsx(Card, { children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `rounded-lg p-2.5 ${rule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`, children: typeConf?.icon || _jsx(Bell, { size: 18 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium text-gray-900", children: rule.name }), _jsx(Badge, { variant: !disabledRules.has(rule.id) && rule.enabled ? 'default' : 'secondary', children: !disabledRules.has(rule.id) && rule.enabled ? 'Actif' : 'Désactivé' }), _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(rule.severity)}`, children: rule.severity })] }), _jsx("p", { className: "mt-0.5 text-sm text-gray-500", children: rule.description || typeConf?.description || rule.type }), rule.escalationEnabled && (_jsxs("p", { className: "mt-1 text-xs text-orange-600", children: [_jsx("span", { className: "font-medium", children: "Escalade:" }), " ", rule.escalationDelay, " \u2192 ", rule.escalationTarget] })), rule.parentRuleId && (_jsxs("p", { className: "mt-1 text-xs text-purple-600", children: [_jsx("span", { className: "font-medium", children: "D\u00E9pend de:" }), " R\u00E8gle parente"] }))] }), _jsxs("div", { className: "flex gap-1 items-center", children: [_jsx("button", { onClick: () => {
                                                            setDisabledRules((prev) => {
                                                                const next = new Set(prev);
                                                                if (next.has(rule.id)) {
                                                                    next.delete(rule.id);
                                                                }
                                                                else {
                                                                    next.add(rule.id);
                                                                }
                                                                return next;
                                                            });
                                                        }, className: `h-8 w-12 rounded-full transition-colors ${disabledRules.has(rule.id)
                                                            ? 'bg-gray-300'
                                                            : 'bg-blue-500'}` }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(Settings, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-red-500", children: _jsx(Trash2, { size: 14 }) })] })] }) }) }, rule.id));
                        }) }))] })), _jsx(Dialog, { open: showRuleModal, onOpenChange: () => setShowRuleModal(false), children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Cr\u00E9er une r\u00E8gle d'alerte" }), _jsx(DialogDescription, { children: ruleStep === 0
                                        ? 'Étape 1 : Choisir un type d\'alerte'
                                        : ruleStep === 1
                                            ? 'Étape 2 : Configurer la règle'
                                            : ruleStep === 2
                                                ? 'Étape 3 : Définir les actions de notification'
                                                : 'Étape 4 : Configuration avancée' })] }), _jsx("div", { className: "flex items-center gap-2 mb-2", children: [0, 1, 2, 3].map((step) => (_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step < ruleStep
                                            ? 'bg-green-100 text-green-600'
                                            : step === ruleStep
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-400'}`, children: step < ruleStep ? _jsx(Check, { size: 14 }) : step + 1 }), step < 3 && (_jsx("div", { className: `flex-1 h-0.5 ${step < ruleStep ? 'bg-green-300' : 'bg-gray-200'}` }))] }, step))) }), ruleStep === 0 && (_jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: Object.entries(alertTypeConfig).map(([type, config]) => (_jsxs("button", { onClick: () => {
                                    setRuleForm((prev) => ({
                                        ...prev,
                                        type: type,
                                        name: prev.name || config.label + ' Alert',
                                    }));
                                    setRuleStep(1);
                                }, className: `flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 ${ruleForm.type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`, children: [_jsx("div", { className: "rounded-lg bg-gray-100 p-2 text-gray-600", children: config.icon }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm text-gray-900", children: config.label }), _jsx("p", { className: "text-xs text-gray-500 mt-0.5", children: config.description })] })] }, type))) })), ruleStep === 1 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Nom de la r\u00E8gle *" }), _jsx(Input, { value: ruleForm.name, onChange: (e) => setRuleForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Ex. Alerte de vitesse sur autoroute" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Description" }), _jsx(Input, { value: ruleForm.description, onChange: (e) => setRuleForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Description facultative..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Gravit\u00E9" }), _jsx("div", { className: "flex flex-wrap gap-2", children: severityOptions.map((opt) => (_jsx("button", { onClick: () => setRuleForm((prev) => ({ ...prev, severity: opt.value })), className: `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${ruleForm.severity === opt.value
                                                    ? `${getSeverityBadgeClass(opt.value)}`
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Valeur de seuil" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", value: ruleForm.conditionValue, onChange: (e) => setRuleForm((prev) => ({ ...prev, conditionValue: e.target.value })), placeholder: ruleForm.type === AlertType.OVERSPEED
                                                        ? 'Limite de vitesse (km/h)'
                                                        : ruleForm.type === AlertType.IDLE_TIMEOUT
                                                            ? 'Minutes'
                                                            : ruleForm.type === AlertType.LOW_BATTERY
                                                                ? 'Batterie %'
                                                                : 'Valeur', className: "flex-1" }), _jsx(Input, { type: "number", value: ruleForm.conditionDuration, onChange: (e) => setRuleForm((prev) => ({ ...prev, conditionDuration: e.target.value })), placeholder: "Dur\u00E9e (secondes)", className: "flex-1" })] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Dur\u00E9e : combien de temps la condition doit \u00EAtre respect\u00E9e avant le d\u00E9clenchement" })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.enabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.checked })), className: "rounded border-gray-300" }), "Activer la r\u00E8gle imm\u00E9diatement"] })] })), ruleStep === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Choisissez comment \u00EAtre averti lorsque cette r\u00E8gle se d\u00E9clenche :" }), ['push', 'email', 'sms', 'webhook'].map((actionType) => {
                                    const isSelected = ruleForm.actions.some((a) => a.type === actionType);
                                    return (_jsxs("label", { className: `flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => {
                                                    setRuleForm((prev) => ({
                                                        ...prev,
                                                        actions: isSelected
                                                            ? prev.actions.filter((a) => a.type !== actionType)
                                                            : [
                                                                ...prev.actions,
                                                                { type: actionType, target: 'all' },
                                                            ],
                                                    }));
                                                }, className: "rounded border-gray-300" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm capitalize", children: actionType === 'push'
                                                            ? 'Notification Push'
                                                            : actionType === 'email'
                                                                ? 'Notification Email'
                                                                : actionType === 'sms'
                                                                    ? 'Notification SMS'
                                                                    : 'Webhook' }), _jsx("p", { className: "text-xs text-gray-500", children: actionType === 'push'
                                                            ? 'Notification in-app pour tous les membres de l\'équipe'
                                                            : actionType === 'email'
                                                                ? 'Envoyer un email aux destinataires configurés'
                                                                : actionType === 'sms'
                                                                    ? 'Envoyer un SMS aux numéros de téléphone configurés'
                                                                    : 'Appeler l\'URL webhook externe' })] })] }, actionType));
                                })] })), ruleStep === 3 && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("h4", { className: "font-medium text-sm mb-3 text-gray-900", children: "Canaux de notification" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.email, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, email: e.target.checked },
                                                            })), className: "rounded border-gray-300" }), _jsx("span", { children: "Email" }), _jsx("span", { className: "ml-auto text-xs text-green-600", children: "\u2705" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.pushMobile, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, pushMobile: e.target.checked },
                                                            })), className: "rounded border-gray-300" }), _jsx("span", { children: "Push mobile" }), _jsx("span", { className: "ml-auto text-xs text-yellow-600", children: "\u26A0\uFE0F Non configur\u00E9" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm opacity-50", children: [_jsx("input", { type: "checkbox", disabled: true, className: "rounded border-gray-300" }), _jsx("span", { children: "WhatsApp" }), _jsx("span", { className: "ml-auto text-xs text-red-600", children: "\u274C Non disponible" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.sms, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, sms: e.target.checked },
                                                            })), className: "rounded border-gray-300" }), _jsx("span", { children: "SMS" }), _jsx("span", { className: "ml-auto text-xs text-green-600", children: "\u2705" })] })] })] }), _jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("h4", { className: "font-medium text-sm mb-3 text-gray-900", children: "Escalade" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.escalationEnabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, escalationEnabled: e.target.checked })), className: "rounded border-gray-300" }), _jsx("span", { children: "Activer l'escalade automatique" })] }), ruleForm.escalationEnabled && (_jsxs("div", { className: "ml-6 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "D\u00E9lai avant escalade" }), _jsxs("select", { value: ruleForm.escalationDelay, onChange: (e) => setRuleForm((prev) => ({
                                                                        ...prev,
                                                                        escalationDelay: e.target.value,
                                                                    })), className: "w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm", children: [_jsx("option", { value: "5min", children: "5 minutes" }), _jsx("option", { value: "15min", children: "15 minutes" }), _jsx("option", { value: "30min", children: "30 minutes" }), _jsx("option", { value: "1h", children: "1 heure" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "Escalader vers" }), _jsxs("select", { value: ruleForm.escalationTarget, onChange: (e) => setRuleForm((prev) => ({
                                                                        ...prev,
                                                                        escalationTarget: e.target.value,
                                                                    })), className: "w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm", children: [_jsx("option", { value: "Manager", children: "Manager" }), _jsx("option", { value: "Admin", children: "Admin" }), _jsx("option", { value: "Super Admin", children: "Super Admin" })] })] })] }))] })] }), _jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("h4", { className: "font-medium text-sm mb-3 text-gray-900", children: "Heures silencieuses" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: ruleForm.silentHoursEnabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursEnabled: e.target.checked })), className: "rounded border-gray-300" }), _jsx("span", { children: "Activer les heures silencieuses" })] }), ruleForm.silentHoursEnabled && (_jsxs("div", { className: "ml-6 space-y-3", children: [_jsxs("div", { className: "flex gap-2 items-end", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "De" }), _jsx("input", { type: "time", value: ruleForm.silentHoursFrom, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursFrom: e.target.value })), className: "rounded-md border border-gray-300 px-2 py-1 text-sm" })] }), _jsx("span", { className: "text-gray-400", children: "\u00E0" }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "\u00C0" }), _jsx("input", { type: "time", value: ruleForm.silentHoursTo, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursTo: e.target.value })), className: "rounded-md border border-gray-300 px-2 py-1 text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-xs font-medium text-gray-700", children: "Jours applicables" }), _jsx("div", { className: "flex gap-2", children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (_jsx("button", { onClick: () => {
                                                                            const newDays = [...ruleForm.silentHoursDays];
                                                                            newDays[idx] = !newDays[idx];
                                                                            setRuleForm((prev) => ({ ...prev, silentHoursDays: newDays }));
                                                                        }, className: `h-8 w-8 rounded-md border text-xs font-medium transition-colors ${ruleForm.silentHoursDays[idx]
                                                                            ? 'border-blue-500 bg-blue-500 text-white'
                                                                            : 'border-gray-300 bg-white text-gray-600'}`, children: day }, idx))) })] })] }))] })] }), _jsxs("div", { className: "rounded-lg border border-gray-200 p-4", children: [_jsx("h4", { className: "font-medium text-sm mb-3 text-gray-900", children: "D\u00E9pendances" }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "Alerte parente (optionnel)" }), _jsxs("select", { value: ruleForm.parentRuleId || '', onChange: (e) => setRuleForm((prev) => ({
                                                        ...prev,
                                                        parentRuleId: e.target.value || undefined,
                                                    })), className: "w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm", children: [_jsx("option", { value: "", children: "Aucune d\u00E9pendance" }), rules?.map((rule) => (_jsx("option", { value: rule.id, children: rule.name }, rule.id)))] }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "Cette alerte ne se d\u00E9clenchera que si l'alerte parente est active" })] })] })] })), formError && (_jsx("div", { className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600", children: formError })), _jsxs(DialogFooter, { children: [ruleStep > 0 && (_jsx(Button, { variant: "outline", onClick: () => setRuleStep((s) => s - 1), children: "Retour" })), ruleStep < 3 ? (_jsxs(Button, { onClick: () => {
                                        if (ruleStep === 0 && !ruleForm.type) {
                                            setFormError('Veuillez sélectionner un type d\'alerte');
                                            return;
                                        }
                                        setFormError('');
                                        setRuleStep((s) => s + 1);
                                    }, children: ["Suivant", _jsx(ChevronRight, { size: 16, className: "ml-1" })] })) : (_jsx(Button, { onClick: handleCreateRule, disabled: createRuleMutation.isPending, children: createRuleMutation.isPending ? 'Création...' : 'Créer une règle' }))] })] }) })] }));
}
//# sourceMappingURL=AlertsPage.js.map