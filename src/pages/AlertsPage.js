import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAlerts, useAlertStats, useBulkAcknowledgeAlerts, useAlertRules, useCreateAlertRule, } from '@/hooks/useAlerts';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import { AlertType, AlertSeverity, } from '@/types/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { AlertCircle, Check, Plus, Bell, BellOff, Settings, Zap, Search, ChevronRight, Shield, Gauge, MapPin, Clock, Battery, Wrench, Fuel, Activity, Trash2, TrendingUp, Save, } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// Alert type configuration for the rule builder
const alertTypeConfig = {
    [AlertType.OVERSPEED]: {
        label: 'Excès de vitesse',
        icon: _jsx(Gauge, { size: 18 }),
        description: 'Alerte quand le véhicule dépasse la limite de vitesse',
        fields: ['speedLimit'],
    },
    [AlertType.GEOFENCE_ENTRY]: {
        label: 'Entrée géoclôture',
        icon: _jsx(MapPin, { size: 18 }),
        description: 'Alerte quand le véhicule entre dans une zone géoclôture',
        fields: ['geofenceId'],
    },
    [AlertType.GEOFENCE_EXIT]: {
        label: 'Sortie géoclôture',
        icon: _jsx(MapPin, { size: 18 }),
        description: 'Alerte quand le véhicule quitte une zone géoclôture',
        fields: ['geofenceId'],
    },
    [AlertType.IDLE_TIMEOUT]: {
        label: 'Inactivité prolongée',
        icon: _jsx(Clock, { size: 18 }),
        description: 'Alerte quand le véhicule est inactif trop longtemps',
        fields: ['idleMinutes'],
    },
    [AlertType.OFFLINE]: {
        label: 'Hors ligne',
        icon: _jsx(BellOff, { size: 18 }),
        description: 'Alerte quand le véhicule se déconnecte',
        fields: ['offlineMinutes'],
    },
    [AlertType.LOW_BATTERY]: {
        label: 'Batterie faible',
        icon: _jsx(Battery, { size: 18 }),
        description: 'Alerte quand la batterie du tracker est faible',
        fields: ['batteryPercent'],
    },
    [AlertType.MAINTENANCE_DUE]: {
        label: 'Entretien prévu',
        icon: _jsx(Wrench, { size: 18 }),
        description: 'Alerte pour l\'entretien prévu',
        fields: ['kmThreshold'],
    },
    [AlertType.FUEL_ALERT]: {
        label: 'Alerte carburant',
        icon: _jsx(Fuel, { size: 18 }),
        description: 'Alerte en cas de variation soudaine du carburant',
        fields: ['fuelDropPercent'],
    },
    [AlertType.HARSH_ACCELERATION]: {
        label: 'Accélération brusque',
        icon: _jsx(Activity, { size: 18 }),
        description: 'Alerte lors d\'événements d\'accélération soudaine',
        fields: ['gForce'],
    },
    [AlertType.HARSH_BRAKING]: {
        label: 'Freinage brusque',
        icon: _jsx(Activity, { size: 18 }),
        description: 'Alerte lors d\'événements de freinage soudain',
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
    const [editingRuleId, setEditingRuleId] = useState(null);
    const [globalSilentHoursEnabled, setGlobalSilentHoursEnabled] = useState(false);
    const [globalSilentHoursFrom, setGlobalSilentHoursFrom] = useState('22:00');
    const [globalSilentHoursTo, setGlobalSilentHoursTo] = useState('06:00');
    const [savingNotes, setSavingNotes] = useState({});
    const [savingAssignment, setSavingAssignment] = useState({});
    const [groupBy, setGroupBy] = useState('none');
    const [quickFilterSeverity, setQuickFilterSeverity] = useState('all');
    const [quickFilterTime, setQuickFilterTime] = useState('all');
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status });
    const { data: stats } = useAlertStats();
    const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts();
    const { data: rules, isLoading: rulesLoading } = useAlertRules();
    const createRuleMutation = useCreateAlertRule();
    const alerts = alertsData?.data || [];
    const totalPages = alertsData?.totalPages || 1;
    const filteredAlerts = alerts.filter((a) => {
        // Keyword search filter - search by vehicle name, alert type, and message
        if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch = a.title.toLowerCase().includes(searchLower) ||
                a.message.toLowerCase().includes(searchLower) ||
                (a.vehicleName && a.vehicleName.toLowerCase().includes(searchLower));
            if (!matchesSearch)
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
        // Quick filter: severity (Critical only)
        if (quickFilterSeverity !== 'all' && a.severity !== quickFilterSeverity) {
            return false;
        }
        // Quick filter: time period
        if (quickFilterTime !== 'all') {
            const alertDate = new Date(a.createdAt);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (quickFilterTime === 'today' && alertDate < today) {
                return false;
            }
            else if (quickFilterTime === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (alertDate < weekAgo)
                    return false;
            }
        }
        return true;
    });
    // Group alerts based on selected grouping option
    const groupedAlerts = (() => {
        if (groupBy === 'none') {
            return { 'Toutes les alertes': filteredAlerts };
        }
        const groups = {};
        if (groupBy === 'type') {
            filteredAlerts.forEach((alert) => {
                const typeLabel = alertTypeConfig[alert.type]?.label || alert.type;
                if (!groups[typeLabel])
                    groups[typeLabel] = [];
                groups[typeLabel].push(alert);
            });
        }
        else if (groupBy === 'vehicle') {
            filteredAlerts.forEach((alert) => {
                const vehicleLabel = alert.vehicleName || 'Non attribué';
                if (!groups[vehicleLabel])
                    groups[vehicleLabel] = [];
                groups[vehicleLabel].push(alert);
            });
        }
        else if (groupBy === 'severity') {
            filteredAlerts.forEach((alert) => {
                const severityLabel = alert.severity;
                if (!groups[severityLabel])
                    groups[severityLabel] = [];
                groups[severityLabel].push(alert);
            });
        }
        return groups;
    })();
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
        setEditingRuleId(null);
        setShowRuleModal(true);
    };
    const handleSaveAlertNote = async (alertId, note) => {
        if (!organizationId)
            return;
        setSavingNotes((prev) => ({ ...prev, [alertId]: true }));
        try {
            await axios.put(`/api/organizations/${organizationId}/alerts/${alertId}`, { note });
            setAlertNotes((prev) => ({ ...prev, [alertId]: note }));
            setShowNoteForm(false);
        }
        catch (err) {
            console.error('Failed to save alert note:', err);
        }
        finally {
            setSavingNotes((prev) => ({ ...prev, [alertId]: false }));
        }
    };
    const handleSaveAlertAssignment = async (alertId, role) => {
        if (!organizationId)
            return;
        setSavingAssignment((prev) => ({ ...prev, [alertId]: true }));
        try {
            await axios.put(`/api/organizations/${organizationId}/alerts/${alertId}`, { assignedRole: role });
            setAlertAssignments((prev) => ({ ...prev, [alertId]: role }));
            setShowAssignDropdown(false);
        }
        catch (err) {
            console.error('Failed to save alert assignment:', err);
        }
        finally {
            setSavingAssignment((prev) => ({ ...prev, [alertId]: false }));
        }
    };
    const handleMarkAlertResolved = async (alertId) => {
        if (!organizationId)
            return;
        setSavingAssignment((prev) => ({ ...prev, [alertId]: true }));
        try {
            await axios.patch(`/api/organizations/${organizationId}/alerts/${alertId}`, { status: 'resolved' });
            window.location.reload();
        }
        catch (err) {
            console.error('Failed to mark alert as resolved:', err);
        }
        finally {
            setSavingAssignment((prev) => ({ ...prev, [alertId]: false }));
        }
    };
    const handleEditRule = (rule) => {
        const condition = rule.condition;
        setRuleForm({
            name: rule.name,
            description: rule.description || '',
            type: rule.type,
            severity: rule.severity,
            conditionValue: String(condition?.value || ''),
            conditionDuration: String(condition?.duration || ''),
            actions: rule.actions || [],
            enabled: rule.enabled,
            escalationEnabled: rule.escalationEnabled || false,
            escalationDelay: rule.escalationDelay || '15min',
            escalationTarget: rule.escalationTarget || 'Manager',
            parentRuleId: rule.parentRuleId,
            silentHoursEnabled: rule.silentHoursEnabled || false,
            silentHoursFrom: rule.silentHoursFrom || '22:00',
            silentHoursTo: rule.silentHoursTo || '06:00',
            silentHoursDays: rule.silentHoursDays || [true, true, true, true, true, true, true],
            notificationChannels: rule.notificationChannels || {
                email: true,
                pushMobile: false,
                whatsapp: false,
                sms: true,
            },
        });
        setEditingRuleId(rule.id);
        setRuleStep(0);
        setFormError('');
        setShowRuleModal(true);
    };
    const handleDeleteRule = async (ruleId) => {
        if (!organizationId)
            return;
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?'))
            return;
        try {
            await axios.delete(`/api/organizations/${organizationId}/alerts/rules/${ruleId}`);
            window.location.reload();
        }
        catch (err) {
            console.error('Failed to delete rule:', err);
        }
    };
    const handleSaveGlobalSilentHours = async () => {
        if (!organizationId)
            return;
        try {
            await axios.put(`/api/organizations/${organizationId}/alerts/settings`, {
                globalSilentHours: {
                    enabled: globalSilentHoursEnabled,
                    from: globalSilentHoursFrom,
                    to: globalSilentHoursTo,
                },
            });
        }
        catch (err) {
            console.error('Failed to save global silent hours:', err);
        }
    };
    const handleCreateRule = async () => {
        setFormError('');
        if (!ruleForm.name.trim()) {
            setFormError('Le nom de la règle est requis');
            return;
        }
        if (!ruleForm.type) {
            setFormError('Veuillez sélectionner un type d\'alerte');
            return;
        }
        const condition = {
            field: ruleForm.type === AlertType.OVERSPEED ? 'speed' : ruleForm.type,
            operator: 'greater_than',
            value: parseFloat(ruleForm.conditionValue) || 0,
            duration: parseInt(ruleForm.conditionDuration) || undefined,
        };
        try {
            const ruleData = {
                name: ruleForm.name.trim(),
                description: ruleForm.description.trim() || undefined,
                type: ruleForm.type,
                severity: ruleForm.severity,
                condition,
                actions: ruleForm.actions.length > 0 ? ruleForm.actions : [{ type: 'push', target: 'all' }],
                enabled: ruleForm.enabled,
                escalationEnabled: ruleForm.escalationEnabled,
                escalationDelay: ruleForm.escalationDelay,
                escalationTarget: ruleForm.escalationTarget,
                silentHoursEnabled: ruleForm.silentHoursEnabled,
                silentHoursFrom: ruleForm.silentHoursFrom,
                silentHoursTo: ruleForm.silentHoursTo,
                silentHoursDays: ruleForm.silentHoursDays,
                parentRuleId: ruleForm.parentRuleId,
            };
            if (editingRuleId) {
                await axios.put(`/api/organizations/${organizationId}/alerts/rules/${editingRuleId}`, ruleData);
            }
            else {
                await createRuleMutation.mutateAsync(ruleData);
            }
            setShowRuleModal(false);
            setEditingRuleId(null);
            window.location.reload();
        }
        catch (err) {
            setFormError(err.response?.data?.message || (editingRuleId ? 'Échec de la modification de la règle' : 'Échec de la création de la règle'));
        }
    };
    const getSeverityBadgeClass = (severity) => {
        switch (severity) {
            case 'critical':
                return 'bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A] border-[#FF4D6A] border-opacity-30';
            case 'high':
                return 'bg-[#FFB547] bg-opacity-20 text-[#FFB547] border-[#FFB547] border-opacity-30';
            case 'medium':
                return 'bg-[#00E5CC] bg-opacity-20 text-[#00E5CC] border-[#00E5CC] border-opacity-30';
            case 'low':
                return 'bg-[#6B6B80] bg-opacity-20 text-[#6B6B80] border-[#6B6B80] border-opacity-30';
            default:
                return 'bg-[#1F1F2E] text-[#F0F0F5] border-[#2A2A3D]';
        }
    };
    const getPriorityDot = (type) => {
        if (['OVERSPEED', 'ACCIDENT'].includes(type)) {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full mr-2", style: { backgroundColor: '#FF4D6A' } });
        }
        else if (['GEOFENCE_ENTRY', 'GEOFENCE_EXIT', 'LOW_BATTERY'].includes(type)) {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full mr-2", style: { backgroundColor: '#FFB547' } });
        }
        else {
            return _jsx("span", { className: "inline-block w-2 h-2 rounded-full mr-2", style: { backgroundColor: '#00E5CC' } });
        }
    };
    const [trendData, setTrendData] = useState([
        { name: 'Lun', alerts: 12 },
        { name: 'Mar', alerts: 19 },
        { name: 'Mer', alerts: 15 },
        { name: 'Jeu', alerts: 25 },
        { name: 'Ven', alerts: 18 },
        { name: 'Sam', alerts: 10 },
        { name: 'Dim', alerts: 8 },
    ]);
    const [trendsLoading, setTrendsLoading] = useState(false);
    useEffect(() => {
        const fetchTrendsData = async () => {
            if (!organizationId)
                return;
            setTrendsLoading(true);
            try {
                const response = await axios.get(`/api/organizations/${organizationId}/alerts/statistics`);
                if (response.data?.trendData && Array.isArray(response.data.trendData)) {
                    setTrendData(response.data.trendData);
                }
            }
            catch (err) {
                console.error('Failed to fetch trends data, using generated data:', err);
            }
            finally {
                setTrendsLoading(false);
            }
        };
        fetchTrendsData();
    }, [organizationId]);
    const assignmentOptions = ['Admin', 'Manager', 'Opérateur'];
    return (_jsxs("div", { className: "space-y-6", style: { backgroundColor: '#0A0A0F' }, children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold font-syne", style: { color: '#F0F0F5' }, children: "Alertes" }), _jsx("p", { className: "mt-1", style: { color: '#6B6B80' }, children: "Surveiller et g\u00E9rer les alertes et les r\u00E8gles de la flotte" })] }), _jsxs("div", { className: "flex gap-2", children: [selectedAlerts.length > 0 && (_jsxs(Button, { variant: "outline", className: "gap-2", onClick: handleBulkAcknowledge, style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: [_jsx(Check, { size: 16 }), "Reconna\u00EEtre (", selectedAlerts.length, ")"] })), _jsxs(Button, { className: "gap-2", onClick: openRuleCreator, style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er une r\u00E8gle"] })] })] }), stats ? (_jsxs("div", { className: "grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6", children: [_jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs", style: { color: '#6B6B80' }, children: "Total" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#F0F0F5' }, children: stats.total })] }), _jsx(Bell, { size: 18, style: { color: '#6B6B80' } })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs", style: { color: '#6B6B80' }, children: "Non reconnus" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#FFB547' }, children: stats.unacknowledged })] }), _jsx(AlertCircle, { size: 18, style: { color: '#FFB547' } })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium", style: { color: '#FF4D6A' }, children: "Critical" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#FF4D6A' }, children: stats.critical })] }), _jsx(Shield, { size: 18, style: { color: '#FF4D6A' } })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium", style: { color: '#FFB547' }, children: "High" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#FFB547' }, children: stats.high })] }), _jsx(Zap, { size: 18, style: { color: '#FFB547' } })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium", style: { color: '#00E5CC' }, children: "Medium" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#00E5CC' }, children: stats.medium })] }), _jsx(Activity, { size: 18, style: { color: '#00E5CC' } })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-4 pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium", style: { color: '#6B6B80' }, children: "Low / Info" }), _jsx("p", { className: "text-xl font-bold font-syne", style: { color: '#6B6B80' }, children: stats.low + stats.info })] }), _jsx(Bell, { size: 18, style: { color: '#6B6B80' } })] }) }) })] })) : (_jsx(Skeleton, { className: "h-20" })), _jsxs("div", { className: "flex gap-1 rounded-lg p-1", style: { backgroundColor: '#12121A' }, children: [_jsxs("button", { onClick: () => setTab('alerts'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`, style: {
                            backgroundColor: tab === 'alerts' ? '#1A1A25' : 'transparent',
                            color: tab === 'alerts' ? '#F0F0F5' : '#6B6B80',
                            borderBottom: tab === 'alerts' ? '2px solid #00E5CC' : 'none',
                        }, children: ["Alertes (", stats?.total || 0, ")"] }), _jsx("button", { onClick: () => setTab('trends'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`, style: {
                            backgroundColor: tab === 'trends' ? '#1A1A25' : 'transparent',
                            color: tab === 'trends' ? '#F0F0F5' : '#6B6B80',
                            borderBottom: tab === 'trends' ? '2px solid #00E5CC' : 'none',
                        }, children: "Tendances" }), _jsxs("button", { onClick: () => setTab('rules'), className: `flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors`, style: {
                            backgroundColor: tab === 'rules' ? '#1A1A25' : 'transparent',
                            color: tab === 'rules' ? '#F0F0F5' : '#6B6B80',
                            borderBottom: tab === 'rules' ? '2px solid #00E5CC' : 'none',
                        }, children: ["R\u00E8gles (", rules?.length || 0, ")"] })] }), tab === 'alerts' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2", size: 16, style: { color: '#44445A' } }), _jsx(Input, { placeholder: "Rechercher les alertes...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-9", style: {
                                                    backgroundColor: '#12121A',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                } })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'unacknowledged', 'acknowledged', 'resolved'].map((s) => (_jsx("button", { onClick: () => {
                                                setStatus(s === 'all' ? undefined : s);
                                                setPage(1);
                                            }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                backgroundColor: (s === 'all' && !status) || status === s ? '#1A1A25' : '#12121A',
                                                color: (s === 'all' && !status) || status === s ? '#00E5CC' : '#6B6B80',
                                                borderColor: '#1F1F2E',
                                                border: '1px solid',
                                            }, children: s === 'all' ? 'Tout' : s === 'unacknowledged' ? 'Actif' : s === 'acknowledged' ? 'Reconnu' : 'Résolu' }, s))) })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium mb-1", style: { color: '#F0F0F5' }, children: "De" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => {
                                                    setDateFrom(e.target.value);
                                                    setPage(1);
                                                }, className: "w-full", style: {
                                                    backgroundColor: '#12121A',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                } })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "block text-xs font-medium mb-1", style: { color: '#F0F0F5' }, children: "\u00C0" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => {
                                                    setDateTo(e.target.value);
                                                    setPage(1);
                                                }, className: "w-full", style: {
                                                    backgroundColor: '#12121A',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                } })] }), (dateFrom || dateTo) && (_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                                            setDateFrom('');
                                            setDateTo('');
                                            setPage(1);
                                        }, style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: "R\u00E9initialiser" }))] }), _jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => {
                                                    setQuickFilterTime('all');
                                                    setQuickFilterSeverity('all');
                                                    setPage(1);
                                                }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                    backgroundColor: quickFilterTime === 'all' && quickFilterSeverity === 'all' ? '#00E5CC' : '#12121A',
                                                    color: quickFilterTime === 'all' && quickFilterSeverity === 'all' ? '#0A0A0F' : '#6B6B80',
                                                    borderColor: '#1F1F2E',
                                                    border: '1px solid',
                                                }, children: "R\u00E9initialiser filtres" }), _jsx("button", { onClick: () => {
                                                    setQuickFilterTime('today');
                                                    setPage(1);
                                                }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                    backgroundColor: quickFilterTime === 'today' ? '#00E5CC' : '#12121A',
                                                    color: quickFilterTime === 'today' ? '#0A0A0F' : '#6B6B80',
                                                    borderColor: '#1F1F2E',
                                                    border: '1px solid',
                                                }, children: "Aujourd'hui" }), _jsx("button", { onClick: () => {
                                                    setQuickFilterTime('week');
                                                    setPage(1);
                                                }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                    backgroundColor: quickFilterTime === 'week' ? '#00E5CC' : '#12121A',
                                                    color: quickFilterTime === 'week' ? '#0A0A0F' : '#6B6B80',
                                                    borderColor: '#1F1F2E',
                                                    border: '1px solid',
                                                }, children: "Cette semaine" }), _jsx("button", { onClick: () => {
                                                    setQuickFilterSeverity(quickFilterSeverity === AlertSeverity.CRITICAL ? 'all' : AlertSeverity.CRITICAL);
                                                    setPage(1);
                                                }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                    backgroundColor: quickFilterSeverity === AlertSeverity.CRITICAL ? '#FF4D6A' : '#12121A',
                                                    color: quickFilterSeverity === AlertSeverity.CRITICAL ? '#F0F0F5' : '#6B6B80',
                                                    borderColor: '#1F1F2E',
                                                    border: '1px solid',
                                                }, children: "Critique uniquement" }), _jsx("button", { onClick: () => {
                                                    setStatus('unacknowledged');
                                                    setPage(1);
                                                }, className: `rounded-lg px-3 py-1.5 text-xs font-medium transition-colors`, style: {
                                                    backgroundColor: status === 'unacknowledged' ? '#FFB547' : '#12121A',
                                                    color: status === 'unacknowledged' ? '#0A0A0F' : '#6B6B80',
                                                    borderColor: '#1F1F2E',
                                                    border: '1px solid',
                                                }, children: "Non acquitt\u00E9es" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("label", { className: "text-xs font-medium", style: { color: '#F0F0F5' }, children: "Grouper par:" }), _jsxs("select", { value: groupBy, onChange: (e) => setGroupBy(e.target.value), style: {
                                                    backgroundColor: '#12121A',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                    border: '1px solid',
                                                }, className: "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", children: [_jsx("option", { value: "none", children: "Aucun" }), _jsx("option", { value: "type", children: "Type" }), _jsx("option", { value: "vehicle", children: "V\u00E9hicule" }), _jsx("option", { value: "severity", children: "S\u00E9v\u00E9rit\u00E9" })] })] })] })] }), isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-20" }, i))) })) : filteredAlerts.length === 0 ? (_jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(Bell, { className: "mx-auto mb-4", size: 48, style: { color: '#44445A' } }), _jsx("h3", { className: "text-lg font-medium font-syne", style: { color: '#F0F0F5' }, children: "Aucune alerte trouv\u00E9e" }), _jsx("p", { className: "mt-1 text-sm", style: { color: '#6B6B80' }, children: search ? 'Essayez un terme de recherche différent' : 'Tout clair ! Aucune alerte active.' })] }) })) : (_jsx("div", { className: "space-y-4", children: Object.entries(groupedAlerts).map(([groupTitle, groupAlerts]) => (_jsxs("div", { children: [groupBy !== 'none' && (_jsxs("h4", { className: "text-sm font-semibold mb-2 px-1", style: { color: '#F0F0F5' }, children: [groupTitle, " (", groupAlerts.length, ")"] })), _jsx("div", { className: "space-y-2", children: groupAlerts.map((alert) => (_jsx(Card, { className: `transition-all cursor-pointer`, style: {
                                            backgroundColor: '#12121A',
                                            borderColor: selectedAlerts.includes(alert.id) ? '#00E5CC' : selectedAlertId === alert.id ? '#00E5CC' : '#1F1F2E',
                                            borderWidth: '1px',
                                        }, onClick: () => {
                                            setSelectedAlertId(selectedAlertId === alert.id ? null : alert.id);
                                            setShowNoteForm(false);
                                            setShowAssignDropdown(false);
                                        }, children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("input", { type: "checkbox", checked: selectedAlerts.includes(alert.id), onChange: () => handleSelectAlert(alert.id), style: {
                                                            accentColor: '#00E5CC',
                                                            marginTop: '4px',
                                                        }, onClick: (e) => e.stopPropagation() }), _jsxs("div", { className: `rounded-lg p-2 ${getSeverityBadgeClass(alert.severity)}`, children: [getPriorityDot(alert.type), _jsx(AlertCircle, { size: 16 })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-medium font-syne", style: { color: '#F0F0F5' }, children: alert.title }), _jsx("p", { className: "mt-0.5 text-sm line-clamp-1", style: { color: '#6B6B80' }, children: alert.message })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(alert.severity)}`, children: alert.severity }), alert.status === 'resolved' ? (_jsxs(Badge, { style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, className: "text-xs", children: [_jsx(Check, { size: 12, className: "mr-1" }), "R\u00E9solu"] })) : alert.isAcknowledged ? (_jsxs(Badge, { variant: "secondary", className: "text-xs", style: { backgroundColor: '#1A1A25', color: '#F0F0F5', borderColor: '#1F1F2E' }, children: [_jsx(Check, { size: 12, className: "mr-1" }), "Reconnu"] })) : (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-7 gap-1 text-xs", style: { color: '#00E5CC' }, onClick: () => bulkAcknowledge([alert.id]), children: [_jsx(Check, { size: 12 }), "Reconna\u00EEtre"] }))] })] }), _jsx("p", { className: "mt-1 text-xs", style: { color: '#44445A' }, children: formatTimeAgo(alert.createdAt) }), selectedAlertId === alert.id && (_jsxs("div", { className: "mt-3 space-y-3 border-t pt-3", style: { borderColor: '#1F1F2E' }, children: [alertAssignments[alert.id] && (_jsxs("div", { className: "text-xs", children: [_jsx("span", { style: { color: '#6B6B80' }, children: "Assign\u00E9 \u00E0: " }), _jsx(Badge, { variant: "outline", className: "ml-1", style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: alertAssignments[alert.id] })] })), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(Button, { size: "sm", variant: "outline", className: "gap-1 text-xs", style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowAssignDropdown(!showAssignDropdown);
                                                                                }, children: "Assigner" }), _jsx(Button, { size: "sm", variant: "outline", className: "gap-1 text-xs", style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    setShowNoteForm(!showNoteForm);
                                                                                    setNoteInput(alertNotes[alert.id] || '');
                                                                                }, children: "Notes" }), alert.status !== 'resolved' && (_jsxs(Button, { size: "sm", variant: "outline", className: "gap-1 text-xs", style: { borderColor: '#00E5CC', color: '#00E5CC' }, onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    handleMarkAlertResolved(alert.id);
                                                                                }, disabled: savingAssignment[alert.id], children: [_jsx(Check, { size: 12 }), "Marquer r\u00E9solu"] }))] }), showAssignDropdown && (_jsx("div", { className: "flex gap-1 flex-wrap", children: assignmentOptions.map((opt) => (_jsx(Badge, { variant: "secondary", className: "cursor-pointer opacity-70 hover:opacity-100", style: { backgroundColor: '#1A1A25', color: '#F0F0F5', borderColor: '#1F1F2E' }, onClick: (e) => {
                                                                                e.stopPropagation();
                                                                                handleSaveAlertAssignment(alert.id, opt);
                                                                            }, children: savingAssignment[alert.id] ? '...' : opt }, opt))) })), showNoteForm && (_jsxs("div", { className: "space-y-2", children: [_jsx("textarea", { placeholder: "Ajouter une note...", value: noteInput, onChange: (e) => setNoteInput(e.target.value), onClick: (e) => e.stopPropagation(), className: "w-full text-xs p-2 rounded resize-none", style: {
                                                                                    backgroundColor: '#1A1A25',
                                                                                    borderColor: '#1F1F2E',
                                                                                    color: '#F0F0F5',
                                                                                    border: '1px solid',
                                                                                }, rows: 2 }), _jsxs(Button, { size: "sm", className: "gap-1 text-xs w-full", style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, disabled: savingNotes[alert.id], onClick: (e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSaveAlertNote(alert.id, noteInput);
                                                                                }, children: [_jsx(Save, { size: 12 }), savingNotes[alert.id] ? 'Enregistrement...' : 'Enregistrer'] })] })), alertNotes[alert.id] && (_jsxs("div", { className: "text-xs p-2 rounded", style: { backgroundColor: '#1A1A25', borderColor: '#1F1F2E', border: '1px solid' }, children: [_jsx("p", { className: "font-medium", style: { color: '#F0F0F5' }, children: "Note:" }), _jsx("p", { className: "mt-1", style: { color: '#6B6B80' }, children: alertNotes[alert.id] })] }))] }))] })] }) }) }, alert.id))) })] }, groupTitle))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm", style: { color: '#6B6B80' }, children: ["Page ", page, " sur ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: "Pr\u00E9c\u00E9dent" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: "Suivant" })] })] }))] })), tab === 'trends' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm", style: { color: '#6B6B80' }, children: "Alertes cette semaine" }), _jsx("p", { className: "mt-2 text-2xl font-bold font-syne", style: { color: '#F0F0F5' }, children: "87" })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm", style: { color: '#6B6B80' }, children: "Alertes ce mois" }), _jsx("p", { className: "mt-2 text-2xl font-bold font-syne", style: { color: '#F0F0F5' }, children: "342" })] }) }) }), _jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { children: [_jsx("p", { className: "text-sm", style: { color: '#6B6B80' }, children: "Type le plus fr\u00E9quent" }), _jsx("p", { className: "mt-2 text-lg font-bold font-syne", style: { color: '#FFB547' }, children: "Overspeed" })] }) }) })] }), _jsxs(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 font-syne", style: { color: '#F0F0F5' }, children: [_jsx(TrendingUp, { size: 20 }), "Fr\u00E9quence des alertes - 7 derniers jours"] }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: trendData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorAlerts", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#00E5CC", stopOpacity: 0.8 }), _jsx("stop", { offset: "95%", stopColor: "#00E5CC", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#1F1F2E" }), _jsx(XAxis, { dataKey: "name", stroke: "#6B6B80" }), _jsx(YAxis, { stroke: "#6B6B80" }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#1A1A25', borderColor: '#1F1F2E' } }), _jsx(Area, { type: "monotone", dataKey: "alerts", stroke: "#00E5CC", fillOpacity: 1, fill: "url(#colorAlerts)" })] }) }) })] })] })), tab === 'rules' && (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid', backgroundImage: 'linear-gradient(135deg, rgba(0, 229, 204, 0.1) 0%, rgba(0, 229, 204, 0.05) 100%)' }, children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-base font-syne", style: { color: '#00E5CC' }, children: [_jsx(Clock, { size: 18 }), "Heures silencieuses"] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "silentEnabled", checked: globalSilentHoursEnabled, onChange: (e) => {
                                                    setGlobalSilentHoursEnabled(e.target.checked);
                                                    handleSaveGlobalSilentHours();
                                                }, style: { accentColor: '#00E5CC' } }), _jsx("label", { htmlFor: "silentEnabled", className: "text-sm font-medium", style: { color: '#F0F0F5' }, children: "Activer les heures silencieuses globales" })] }), _jsx("p", { className: "text-xs", style: { color: '#6B6B80' }, children: "Les alertes non-critiques seront mises en attente pendant cette p\u00E9riode" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("span", { className: "text-sm", style: { color: '#6B6B80' }, children: "De" }), _jsx("input", { type: "time", value: globalSilentHoursFrom, onChange: (e) => {
                                                    setGlobalSilentHoursFrom(e.target.value);
                                                }, onBlur: handleSaveGlobalSilentHours, style: {
                                                    backgroundColor: '#1A1A25',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                    border: '1px solid',
                                                }, className: "rounded-md px-2 py-1 text-sm" }), _jsx("span", { className: "text-sm", style: { color: '#6B6B80' }, children: "\u00E0" }), _jsx("input", { type: "time", value: globalSilentHoursTo, onChange: (e) => {
                                                    setGlobalSilentHoursTo(e.target.value);
                                                }, onBlur: handleSaveGlobalSilentHours, style: {
                                                    backgroundColor: '#1A1A25',
                                                    borderColor: '#1F1F2E',
                                                    color: '#F0F0F5',
                                                    border: '1px solid',
                                                }, className: "rounded-md px-2 py-1 text-sm" })] })] })] }), rulesLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => (_jsx(Skeleton, { className: "h-24" }, i))) })) : !rules || rules.length === 0 ? (_jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(Settings, { className: "mx-auto mb-4", size: 48, style: { color: '#44445A' } }), _jsx("h3", { className: "text-lg font-medium font-syne", style: { color: '#F0F0F5' }, children: "Aucune r\u00E8gle d'alerte configur\u00E9e" }), _jsx("p", { className: "mt-1 text-sm", style: { color: '#6B6B80' }, children: "Cr\u00E9ez des r\u00E8gles pour g\u00E9n\u00E9rer automatiquement des alertes en fonction des conditions des v\u00E9hicules." }), _jsxs(Button, { className: "mt-4 gap-2", onClick: openRuleCreator, style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er votre premi\u00E8re r\u00E8gle"] })] }) })) : (_jsx("div", { className: "space-y-3", children: rules.map((rule) => {
                            const typeConf = alertTypeConfig[rule.type];
                            return (_jsx(Card, { style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `rounded-lg p-2.5`, style: {
                                                    backgroundColor: rule.enabled ? 'rgba(0, 229, 204, 0.2)' : 'rgba(68, 68, 90, 0.2)',
                                                    color: rule.enabled ? '#00E5CC' : '#44445A',
                                                }, children: typeConf?.icon || _jsx(Bell, { size: 18 }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-medium font-syne", style: { color: '#F0F0F5' }, children: rule.name }), _jsx(Badge, { variant: !disabledRules.has(rule.id) && rule.enabled ? 'default' : 'secondary', style: { backgroundColor: !disabledRules.has(rule.id) && rule.enabled ? '#00E5CC' : '#1A1A25', color: !disabledRules.has(rule.id) && rule.enabled ? '#0A0A0F' : '#F0F0F5' }, children: !disabledRules.has(rule.id) && rule.enabled ? 'Actif' : 'Désactivé' }), _jsx("span", { className: `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getSeverityBadgeClass(rule.severity)}`, children: rule.severity })] }), _jsx("p", { className: "mt-0.5 text-sm", style: { color: '#6B6B80' }, children: rule.description || typeConf?.description || rule.type }), rule.escalationEnabled && (_jsxs("p", { className: "mt-1 text-xs", style: { color: '#FFB547' }, children: [_jsx("span", { className: "font-medium", children: "Escalade:" }), " ", rule.escalationDelay, " \u2192 ", rule.escalationTarget] })), rule.parentRuleId && (_jsxs("p", { className: "mt-1 text-xs", style: { color: '#00E5CC' }, children: [_jsx("span", { className: "font-medium", children: "D\u00E9pend de:" }), " R\u00E8gle parente"] }))] }), _jsxs("div", { className: "flex gap-1 items-center", children: [_jsx("button", { onClick: () => {
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
                                                        }, className: `h-8 w-12 rounded-full transition-colors`, style: {
                                                            backgroundColor: disabledRules.has(rule.id)
                                                                ? '#44445A'
                                                                : '#00E5CC',
                                                        } }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", style: { color: '#6B6B80' }, onClick: () => handleEditRule(rule), children: _jsx(Settings, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", style: { color: '#FF4D6A' }, onClick: () => handleDeleteRule(rule.id), children: _jsx(Trash2, { size: 14 }) })] })] }) }) }, rule.id));
                        }) }))] })), _jsx(Dialog, { open: showRuleModal, onOpenChange: () => {
                    setShowRuleModal(false);
                    setEditingRuleId(null);
                }, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[85vh] overflow-y-auto", style: { backgroundColor: '#12121A', borderColor: '#1F1F2E', border: '1px solid' }, children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { style: { color: '#F0F0F5', fontFamily: 'Syne' }, children: editingRuleId ? 'Modifier la règle d\'alerte' : 'Créer une règle d\'alerte' }), _jsx(DialogDescription, { style: { color: '#6B6B80' }, children: ruleStep === 0
                                        ? 'Étape 1 : Choisir un type d\'alerte'
                                        : ruleStep === 1
                                            ? 'Étape 2 : Configurer la règle'
                                            : ruleStep === 2
                                                ? 'Étape 3 : Définir les actions de notification'
                                                : 'Étape 4 : Configuration avancée' })] }), _jsx("div", { className: "flex items-center gap-2 mb-2", children: [0, 1, 2, 3].map((step) => (_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("div", { className: `h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium`, style: {
                                            backgroundColor: step < ruleStep ? '#00E5CC' : step === ruleStep ? '#1A1A25' : '#44445A',
                                            color: step < ruleStep ? '#0A0A0F' : '#F0F0F5',
                                            border: step === ruleStep ? '2px solid #00E5CC' : 'none',
                                        }, children: step < ruleStep ? _jsx(Check, { size: 14 }) : step + 1 }), step < 3 && (_jsx("div", { className: `flex-1 h-0.5`, style: { backgroundColor: step < ruleStep ? '#00E5CC' : '#1F1F2E' } }))] }, step))) }), ruleStep === 0 && (_jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: Object.entries(alertTypeConfig).map(([type, config]) => (_jsxs("button", { onClick: () => {
                                    setRuleForm((prev) => ({
                                        ...prev,
                                        type: type,
                                        name: prev.name || config.label + ' Alert',
                                    }));
                                    setRuleStep(1);
                                }, className: `flex items-start gap-3 rounded-lg border p-3 text-left transition-colors`, style: {
                                    borderColor: ruleForm.type === type ? '#00E5CC' : '#1F1F2E',
                                    backgroundColor: ruleForm.type === type ? 'rgba(0, 229, 204, 0.1)' : '#1A1A25',
                                }, children: [_jsx("div", { className: "rounded-lg p-2", style: { backgroundColor: '#44445A', color: '#6B6B80' }, children: config.icon }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm", style: { color: '#F0F0F5' }, children: config.label }), _jsx("p", { className: "text-xs mt-0.5", style: { color: '#6B6B80' }, children: config.description })] })] }, type))) })), ruleStep === 1 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", style: { color: '#F0F0F5' }, children: "Nom de la r\u00E8gle *" }), _jsx(Input, { value: ruleForm.name, onChange: (e) => setRuleForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Ex. Alerte de vitesse sur autoroute", style: {
                                                backgroundColor: '#1A1A25',
                                                borderColor: '#1F1F2E',
                                                color: '#F0F0F5',
                                            } })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", style: { color: '#F0F0F5' }, children: "Description" }), _jsx(Input, { value: ruleForm.description, onChange: (e) => setRuleForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Description facultative...", style: {
                                                backgroundColor: '#1A1A25',
                                                borderColor: '#1F1F2E',
                                                color: '#F0F0F5',
                                            } })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", style: { color: '#F0F0F5' }, children: "Gravit\u00E9" }), _jsx("div", { className: "flex flex-wrap gap-2", children: severityOptions.map((opt) => (_jsx("button", { onClick: () => setRuleForm((prev) => ({ ...prev, severity: opt.value })), className: `rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors`, style: {
                                                    borderColor: ruleForm.severity === opt.value ? '#00E5CC' : '#1F1F2E',
                                                    backgroundColor: ruleForm.severity === opt.value ? 'rgba(0, 229, 204, 0.15)' : 'transparent',
                                                    color: ruleForm.severity === opt.value ? '#F0F0F5' : '#6B6B80',
                                                }, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", style: { color: '#F0F0F5' }, children: "Valeur de seuil" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", value: ruleForm.conditionValue, onChange: (e) => setRuleForm((prev) => ({ ...prev, conditionValue: e.target.value })), placeholder: ruleForm.type === AlertType.OVERSPEED
                                                        ? 'Limite de vitesse (km/h)'
                                                        : ruleForm.type === AlertType.IDLE_TIMEOUT
                                                            ? 'Minutes'
                                                            : ruleForm.type === AlertType.LOW_BATTERY
                                                                ? 'Batterie %'
                                                                : 'Valeur', className: "flex-1", style: {
                                                        backgroundColor: '#1A1A25',
                                                        borderColor: '#1F1F2E',
                                                        color: '#F0F0F5',
                                                    } }), _jsx(Input, { type: "number", value: ruleForm.conditionDuration, onChange: (e) => setRuleForm((prev) => ({ ...prev, conditionDuration: e.target.value })), placeholder: "Dur\u00E9e (secondes)", className: "flex-1", style: {
                                                        backgroundColor: '#1A1A25',
                                                        borderColor: '#1F1F2E',
                                                        color: '#F0F0F5',
                                                    } })] }), _jsx("p", { className: "mt-1 text-xs", style: { color: '#6B6B80' }, children: "Dur\u00E9e : combien de temps la condition doit \u00EAtre respect\u00E9e avant le d\u00E9clenchement" })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.enabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, enabled: e.target.checked })), style: { accentColor: '#00E5CC' } }), "Activer la r\u00E8gle imm\u00E9diatement"] })] })), ruleStep === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm", style: { color: '#6B6B80' }, children: "Choisissez comment \u00EAtre averti lorsque cette r\u00E8gle se d\u00E9clenche :" }), ['push', 'email', 'sms', 'webhook'].map((actionType) => {
                                    const isSelected = ruleForm.actions.some((a) => a.type === actionType);
                                    return (_jsxs("label", { className: `flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors`, style: {
                                            borderColor: isSelected ? '#00E5CC' : '#1F1F2E',
                                            backgroundColor: isSelected ? 'rgba(0, 229, 204, 0.1)' : 'transparent',
                                        }, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => {
                                                    setRuleForm((prev) => ({
                                                        ...prev,
                                                        actions: isSelected
                                                            ? prev.actions.filter((a) => a.type !== actionType)
                                                            : [
                                                                ...prev.actions,
                                                                { type: actionType, target: 'all' },
                                                            ],
                                                    }));
                                                }, style: { accentColor: '#00E5CC' } }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-sm capitalize", style: { color: '#F0F0F5' }, children: actionType === 'push'
                                                            ? 'Notification Push'
                                                            : actionType === 'email'
                                                                ? 'Notification Email'
                                                                : actionType === 'sms'
                                                                    ? 'Notification SMS'
                                                                    : 'Webhook' }), _jsx("p", { className: "text-xs", style: { color: '#6B6B80' }, children: actionType === 'push'
                                                            ? 'Notification in-app pour tous les membres de l\'équipe'
                                                            : actionType === 'email'
                                                                ? 'Envoyer un email aux destinataires configurés'
                                                                : actionType === 'sms'
                                                                    ? 'Envoyer un SMS aux numéros de téléphone configurés'
                                                                    : 'Appeler l\'URL webhook externe' })] })] }, actionType));
                                })] })), ruleStep === 3 && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "rounded-lg border p-4", style: { borderColor: '#1F1F2E' }, children: [_jsx("h4", { className: "font-medium text-sm mb-3", style: { color: '#F0F0F5' }, children: "Canaux de notification" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.email, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, email: e.target.checked },
                                                            })), style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "Email" }), _jsx("span", { className: "ml-auto text-xs", style: { color: '#00E5CC' }, children: "\u2705" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.pushMobile, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, pushMobile: e.target.checked },
                                                            })), style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "Push mobile" }), _jsx("span", { className: "ml-auto text-xs", style: { color: '#FFB547' }, children: "\u26A0\uFE0F Non configur\u00E9" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm opacity-50", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", disabled: true, style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "WhatsApp" }), _jsx("span", { className: "ml-auto text-xs", style: { color: '#FF4D6A' }, children: "\u274C Non disponible" })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.notificationChannels.sms, onChange: (e) => setRuleForm((prev) => ({
                                                                ...prev,
                                                                notificationChannels: { ...prev.notificationChannels, sms: e.target.checked },
                                                            })), style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "SMS" }), _jsx("span", { className: "ml-auto text-xs", style: { color: '#00E5CC' }, children: "\u2705" })] })] })] }), _jsxs("div", { className: "rounded-lg border p-4", style: { borderColor: '#1F1F2E' }, children: [_jsx("h4", { className: "font-medium text-sm mb-3", style: { color: '#F0F0F5' }, children: "Escalade" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.escalationEnabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, escalationEnabled: e.target.checked })), style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "Activer l'escalade automatique" })] }), ruleForm.escalationEnabled && (_jsxs("div", { className: "ml-6 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "D\u00E9lai avant escalade" }), _jsxs("select", { value: ruleForm.escalationDelay, onChange: (e) => setRuleForm((prev) => ({
                                                                        ...prev,
                                                                        escalationDelay: e.target.value,
                                                                    })), style: {
                                                                        width: '100%',
                                                                        backgroundColor: '#1A1A25',
                                                                        borderColor: '#1F1F2E',
                                                                        color: '#F0F0F5',
                                                                        border: '1px solid',
                                                                    }, className: "rounded-md px-2 py-1 text-sm", children: [_jsx("option", { value: "5min", children: "5 minutes" }), _jsx("option", { value: "15min", children: "15 minutes" }), _jsx("option", { value: "30min", children: "30 minutes" }), _jsx("option", { value: "1h", children: "1 heure" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "Escalader vers" }), _jsxs("select", { value: ruleForm.escalationTarget, onChange: (e) => setRuleForm((prev) => ({
                                                                        ...prev,
                                                                        escalationTarget: e.target.value,
                                                                    })), style: {
                                                                        width: '100%',
                                                                        backgroundColor: '#1A1A25',
                                                                        borderColor: '#1F1F2E',
                                                                        color: '#F0F0F5',
                                                                        border: '1px solid',
                                                                    }, className: "rounded-md px-2 py-1 text-sm", children: [_jsx("option", { value: "Manager", children: "Manager" }), _jsx("option", { value: "Admin", children: "Admin" }), _jsx("option", { value: "Super Admin", children: "Super Admin" })] })] })] }))] })] }), _jsxs("div", { className: "rounded-lg border p-4", style: { borderColor: '#1F1F2E' }, children: [_jsx("h4", { className: "font-medium text-sm mb-3", style: { color: '#F0F0F5' }, children: "Heures silencieuses" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", style: { color: '#F0F0F5' }, children: [_jsx("input", { type: "checkbox", checked: ruleForm.silentHoursEnabled, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursEnabled: e.target.checked })), style: { accentColor: '#00E5CC' } }), _jsx("span", { children: "Activer les heures silencieuses" })] }), ruleForm.silentHoursEnabled && (_jsxs("div", { className: "ml-6 space-y-3", children: [_jsxs("div", { className: "flex gap-2 items-end", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "De" }), _jsx("input", { type: "time", value: ruleForm.silentHoursFrom, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursFrom: e.target.value })), style: {
                                                                                backgroundColor: '#1A1A25',
                                                                                borderColor: '#1F1F2E',
                                                                                color: '#F0F0F5',
                                                                                border: '1px solid',
                                                                            }, className: "rounded-md px-2 py-1 text-sm" })] }), _jsx("span", { style: { color: '#44445A' }, children: "\u00E0" }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "\u00C0" }), _jsx("input", { type: "time", value: ruleForm.silentHoursTo, onChange: (e) => setRuleForm((prev) => ({ ...prev, silentHoursTo: e.target.value })), style: {
                                                                                backgroundColor: '#1A1A25',
                                                                                borderColor: '#1F1F2E',
                                                                                color: '#F0F0F5',
                                                                                border: '1px solid',
                                                                            }, className: "rounded-md px-2 py-1 text-sm" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "Jours applicables" }), _jsx("div", { className: "flex gap-2", children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (_jsx("button", { onClick: () => {
                                                                            const newDays = [...ruleForm.silentHoursDays];
                                                                            newDays[idx] = !newDays[idx];
                                                                            setRuleForm((prev) => ({ ...prev, silentHoursDays: newDays }));
                                                                        }, className: `h-8 w-8 rounded-md border text-xs font-medium transition-colors`, style: {
                                                                            borderColor: ruleForm.silentHoursDays[idx] ? '#00E5CC' : '#1F1F2E',
                                                                            backgroundColor: ruleForm.silentHoursDays[idx] ? '#00E5CC' : 'transparent',
                                                                            color: ruleForm.silentHoursDays[idx] ? '#0A0A0F' : '#6B6B80',
                                                                        }, children: day }, idx))) })] })] }))] })] }), _jsxs("div", { className: "rounded-lg border p-4", style: { borderColor: '#1F1F2E' }, children: [_jsx("h4", { className: "font-medium text-sm mb-3", style: { color: '#F0F0F5' }, children: "D\u00E9pendances" }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-xs font-medium", style: { color: '#F0F0F5' }, children: "Alerte parente (optionnel)" }), _jsxs("select", { value: ruleForm.parentRuleId || '', onChange: (e) => setRuleForm((prev) => ({
                                                        ...prev,
                                                        parentRuleId: e.target.value || undefined,
                                                    })), style: {
                                                        width: '100%',
                                                        backgroundColor: '#1A1A25',
                                                        borderColor: '#1F1F2E',
                                                        color: '#F0F0F5',
                                                        border: '1px solid',
                                                    }, className: "rounded-md px-2 py-1 text-sm", children: [_jsx("option", { value: "", children: "Aucune d\u00E9pendance" }), rules?.map((rule) => (_jsx("option", { value: rule.id, children: rule.name }, rule.id)))] }), _jsx("p", { className: "mt-1 text-xs", style: { color: '#6B6B80' }, children: "Cette alerte ne se d\u00E9clenchera que si l'alerte parente est active" })] })] })] })), formError && (_jsx("div", { className: "rounded-lg border p-4", style: { borderColor: '#FF4D6A', backgroundColor: 'rgba(255, 77, 106, 0.1)', color: '#FF4D6A' }, children: formError })), _jsxs(DialogFooter, { children: [ruleStep > 0 && (_jsx(Button, { variant: "outline", onClick: () => setRuleStep((s) => s - 1), style: { borderColor: '#1F1F2E', color: '#F0F0F5' }, children: "Retour" })), ruleStep < 3 ? (_jsxs(Button, { onClick: () => {
                                        if (ruleStep === 0 && !ruleForm.type) {
                                            setFormError('Veuillez sélectionner un type d\'alerte');
                                            return;
                                        }
                                        setFormError('');
                                        setRuleStep((s) => s + 1);
                                    }, style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, children: ["Suivant", _jsx(ChevronRight, { size: 16, className: "ml-1" })] })) : (_jsx(Button, { onClick: handleCreateRule, disabled: createRuleMutation.isPending, style: { backgroundColor: '#00E5CC', color: '#0A0A0F' }, children: createRuleMutation.isPending ? (editingRuleId ? 'Modification...' : 'Création...') : (editingRuleId ? 'Modifier la règle' : 'Créer une règle') }))] })] }) })] }));
}
//# sourceMappingURL=AlertsPage.js.map