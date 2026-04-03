import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGeofences, useGeofenceStats, useCreateGeofence } from '@/hooks/useGeofences';
import { GeofenceEvent } from '@/types/geofence';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff, Clock, X, AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import GeofenceDrawMap from '@/components/geofences/GeofenceDrawMap';
const defaultForm = {
    name: '',
    description: '',
    shape: null,
    triggerEvent: GeofenceEvent.BOTH,
    alertOnEntry: true,
    alertOnExit: true,
    notifyUsers: [],
    color: '#3b82f6',
    activeDays: [true, true, true, true, true, false, false],
    activeHours: null,
    isTemporary: false,
    temporaryUntil: undefined,
    assignedVehicleIds: [],
    priority: 'Moyen',
    timeRulesEnabled: false,
    businessDaysOnly: false,
};
const triggerOptions = [
    { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
    { value: GeofenceEvent.EXIT, label: 'Exit Only' },
    { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
];
const priorityOptions = ['Critique', 'Élevé', 'Moyen', 'Faible'];
const geofenceTemplates = [
    { name: 'Zone industrielle', namePrefix: 'Industrielle', shape: { type: 'circle', radiusMeters: 500 }, color: '#FFB547' },
    { name: 'Station-service', namePrefix: 'Station', shape: { type: 'circle', radiusMeters: 50 }, color: '#00E5CC' },
    { name: 'Parking', namePrefix: 'Parking', shape: { type: 'circle', radiusMeters: 100 }, color: '#6B6B80' },
    { name: 'Entrepôt', namePrefix: 'Entrepôt', shape: { type: 'route', waypoints: [], bufferMeters: 150 }, color: '#FF4D6A' },
    { name: 'Zone de livraison', namePrefix: 'Livraison', shape: { type: 'circle', radiusMeters: 75 }, color: '#00E5CC' },
    { name: 'Zone de dépôt', namePrefix: 'Dépôt', shape: { type: 'circle', radiusMeters: 200 }, color: '#3b82f6' },
    { name: 'Zone interdite', namePrefix: 'Interdite', shape: { type: 'polygon', points: [] }, color: '#ef4444' },
    { name: 'Zone de chantier', namePrefix: 'Chantier', shape: { type: 'route', waypoints: [], bufferMeters: 100 }, color: '#f97316' },
];
function getShapeIcon(type) {
    switch (type) {
        case 'circle':
            return _jsx(Circle, { size: 16 });
        case 'polygon':
            return _jsx(Pentagon, { size: 16 });
        case 'route':
            return _jsx(Square, { size: 16 });
        default:
            return _jsx(MapPin, { size: 16 });
    }
}
function getShapeLabel(shape) {
    if (shape.type === 'circle') {
        return `Circle (${shape.radiusMeters}m radius)`;
    }
    else if (shape.type === 'polygon') {
        return `Polygon (${shape.points.length} points)`;
    }
    else if (shape.type === 'route') {
        return `Route (${shape.waypoints?.length || 0} waypoints)`;
    }
    return shape.type;
}
function getPriorityColor(priority) {
    switch (priority) {
        case 'Critique':
            return '#FF4D6A';
        case 'Élevé':
            return '#FFB547';
        case 'Moyen':
            return '#00E5CC';
        case 'Faible':
            return '#6B6B80';
        default:
            return '#00E5CC';
    }
}
function getDayLabel(activeDays) {
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const indices = activeDays.map((d, i) => (d ? days[i] : null)).filter(Boolean);
    if (indices.length === 0)
        return 'Aucun jour';
    if (indices.length === 7)
        return 'Tous les jours';
    if (indices.length === 5 && activeDays[0] && activeDays[1] && activeDays[2] && activeDays[3] && activeDays[4]) {
        return 'Jours ouvrables';
    }
    if (indices.length === 2 && activeDays[5] && activeDays[6]) {
        return 'Week-end';
    }
    return indices.join('/');
}
function getVehiclesInsideCount(geofence) {
    return geofence.vehiclesInside?.length || 0;
}
export default function GeofencesPage() {
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState(null);
    const [selectedGeofence, setSelectedGeofence] = useState(null);
    const [form, setForm] = useState(defaultForm);
    const [formError, setFormError] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [showTemplates, setShowTemplates] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [violations, setViolations] = useState([]);
    const [violationsLoading, setViolationsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const { data: geofencesData, isLoading } = useGeofences(page);
    const { data: stats } = useGeofenceStats();
    const createMutation = useCreateGeofence();
    const geofences = geofencesData?.data || [];
    const totalPages = geofencesData?.totalPages || 1;
    // Load vehicles
    useEffect(() => {
        if (orgId && (modalMode === 'create' || modalMode === 'edit')) {
            const loadVehicles = async () => {
                setVehiclesLoading(true);
                try {
                    const response = await apiClient.get(`/api/organizations/${orgId}/vehicles`);
                    setVehicles(response.data || []);
                }
                catch {
                    setVehicles([]);
                }
                finally {
                    setVehiclesLoading(false);
                }
            };
            loadVehicles();
        }
    }, [orgId, modalMode]);
    // Load violations for view modal
    useEffect(() => {
        if (orgId && selectedGeofence && modalMode === 'view') {
            const loadViolations = async () => {
                setViolationsLoading(true);
                try {
                    const response = await apiClient.get(`/api/organizations/${orgId}/alerts?type=geofence_entry,geofence_exit&geofenceId=${selectedGeofence.id}`);
                    setViolations((response.data || []).slice(0, 50)); // Show last 50
                }
                catch {
                    setViolations([]);
                }
                finally {
                    setViolationsLoading(false);
                }
            };
            loadViolations();
        }
    }, [orgId, selectedGeofence, modalMode]);
    const filteredGeofences = search
        ? geofences.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.description?.toLowerCase().includes(search.toLowerCase()))
        : geofences;
    const openCreateModal = useCallback(() => {
        setForm(defaultForm);
        setFormError('');
        setSelectedGeofence(null);
        setShowTemplates(false);
        setModalMode('create');
    }, []);
    const applyTemplate = useCallback((template) => {
        setForm((prev) => ({
            ...prev,
            name: `${template.namePrefix} - `,
            color: template.color,
        }));
        setShowTemplates(false);
    }, []);
    const openEditModal = useCallback((geofence) => {
        setForm({
            name: geofence.name,
            description: geofence.description || '',
            shape: geofence.shape,
            triggerEvent: geofence.triggerEvent,
            alertOnEntry: geofence.alertOnEntry,
            alertOnExit: geofence.alertOnExit,
            notifyUsers: geofence.notifyUsers,
            color: geofence.metadata?.color || '#3b82f6',
            activeDays: geofence.activeDays || [true, true, true, true, true, false, false],
            activeHours: geofence.activeHours || null,
            isTemporary: geofence.isTemporary || false,
            temporaryUntil: geofence.temporaryUntil,
            assignedVehicleIds: geofence.assignedVehicleIds || [],
            priority: geofence.priority || 'Moyen',
            timeRulesEnabled: !!(geofence.activeHours || geofence.activeDays),
            businessDaysOnly: geofence.businessDaysOnly || false,
        });
        setFormError('');
        setSelectedGeofence(geofence);
        setModalMode('edit');
    }, []);
    const openViewModal = useCallback((geofence) => {
        setSelectedGeofence(geofence);
        setModalMode('view');
    }, []);
    const closeModal = useCallback(() => {
        setModalMode(null);
        setSelectedGeofence(null);
        setForm(defaultForm);
        setFormError('');
        setActiveTab('details');
        setViolations([]);
    }, []);
    const handleShapeChange = useCallback((shape) => {
        setForm((prev) => ({ ...prev, shape }));
    }, []);
    const handleSubmit = async () => {
        setFormError('');
        if (!form.name.trim()) {
            setFormError('Geofence name is required');
            return;
        }
        if (!form.shape) {
            setFormError('Please draw a shape on the map');
            return;
        }
        const data = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            shape: form.shape,
            triggerEvent: form.triggerEvent,
            alertOnEntry: form.alertOnEntry,
            alertOnExit: form.alertOnExit,
            notifyUsers: form.notifyUsers,
        };
        try {
            if (modalMode === 'create') {
                await createMutation.mutateAsync(data);
            }
            // Edit would use useUpdateGeofence — same pattern
            closeModal();
        }
        catch (err) {
            setFormError(err.response?.data?.message || 'Failed to save geofence');
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5]", children: "G\u00E9ocl\u00F4tures" }), _jsx("p", { className: "mt-1 text-[#6B6B80]", children: "Cr\u00E9er et g\u00E9rer les limites de localisation pour votre flotte" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "outline", className: "gap-2 border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setShowTemplates(!showTemplates), children: "Mod\u00E8les" }), showTemplates && (_jsx("div", { className: "absolute right-0 mt-1 w-64 bg-[#12121A] rounded-lg shadow-lg border border-[#1F1F2E] z-10", children: _jsx("div", { className: "p-2 space-y-1", children: geofenceTemplates.map((template) => (_jsx("button", { onClick: () => {
                                                    openCreateModal();
                                                    applyTemplate(template);
                                                }, className: "w-full text-left px-3 py-2 rounded-md hover:bg-[#1A1A25] text-sm text-[#F0F0F5]", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: template.color } }), _jsx("span", { className: "font-medium", children: template.name })] }) }, template.name))) }) }))] }), _jsxs(Button, { className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]", onClick: openCreateModal, children: [_jsx(Plus, { size: 18 }), "Cr\u00E9er"] })] })] }), stats && (_jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Total g\u00E9ocl\u00F4tures" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-[#F0F0F5]", children: filteredGeofences.length })] }), _jsx("div", { className: "rounded-full bg-[#00E5CC]/10 p-3", children: _jsx(MapPin, { size: 20, className: "text-[#00E5CC]" }) })] }) }) }), _jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Actives" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-[#00E5CC]", children: filteredGeofences.filter((g) => g.isActive).length })] }), _jsx("div", { className: "rounded-full bg-[#00E5CC]/10 p-3", children: _jsx(Eye, { size: 20, className: "text-[#00E5CC]" }) })] }) }) }), _jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Alertes aujourd'hui" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-[#FF4D6A]", children: "0" })] }), _jsx("div", { className: "rounded-full bg-[#FF4D6A]/10 p-3", children: _jsx(EyeOff, { size: 20, className: "text-[#FF4D6A]" }) })] }) }) }), _jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-[#6B6B80]", children: "V\u00E9hicules surveill\u00E9s" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-[#F0F0F5]", children: filteredGeofences.reduce((sum, g) => sum + (g.vehicleCount || 0), 0) })] }), _jsx("div", { className: "rounded-full bg-[#6B6B80]/10 p-3", children: _jsx(MapPin, { size: 20, className: "text-[#6B6B80]" }) })] }) }) })] })), _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[#44445A]", size: 18 }), _jsx(Input, { placeholder: "Rechercher les g\u00E9ocl\u00F4tures...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]" })] }), isLoading ? (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-48 bg-[#12121A]" }, i))) })) : filteredGeofences.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E] text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(MapPin, { className: "mx-auto mb-4 text-[#44445A]", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-[#F0F0F5]", children: search ? 'Aucune géoclôture ne correspond à votre recherche' : 'Aucune géoclôture créée' }), _jsx("p", { className: "mt-2 text-sm text-[#6B6B80]", children: search
                                ? 'Essayez un terme de recherche différent'
                                : 'Cliquez sur "Créer" pour définir votre première zone' }), !search && (_jsxs(Button, { className: "mt-4 gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]", onClick: openCreateModal, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er votre premi\u00E8re g\u00E9ocl\u00F4ture"] }))] }) })) : (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: filteredGeofences.map((geofence) => (_jsxs(Card, { className: "bg-[#12121A] border-[#1F1F2E] cursor-pointer transition-all hover:border-[#2A2A3D] hover:shadow-lg", onClick: () => openViewModal(geofence), children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("div", { className: "rounded-lg p-2", style: {
                                                    backgroundColor: `${geofence.metadata?.color || '#3b82f6'}20`,
                                                    color: geofence.metadata?.color || '#3b82f6',
                                                }, children: getShapeIcon(geofence.shape?.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(CardTitle, { className: "text-base text-[#F0F0F5]", children: geofence.name }), geofence.description && (_jsx("p", { className: "mt-0.5 text-xs text-[#6B6B80]", children: geofence.description }))] })] }), _jsxs("div", { className: "flex gap-2 flex-col", children: [_jsx(Badge, { variant: geofence.isActive ? 'default' : 'secondary', className: "bg-[#00E5CC] text-[#0A0A0F]", children: geofence.isActive ? 'Actif' : 'Inactif' }), (geofence.priority || 'Moyen') && (_jsx(Badge, { className: "text-white text-xs", style: { backgroundColor: getPriorityColor(geofence.priority || 'Moyen') }, children: geofence.priority || 'Moyen' }))] })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Type" }), _jsx("p", { className: "font-medium capitalize text-[#F0F0F5]", children: geofence.shape?.type || 'N/A' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "D\u00E9clencheur" }), _jsx("p", { className: "font-medium capitalize text-[#F0F0F5]", children: geofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "D\u00E9tails" }), _jsx("p", { className: "font-medium text-xs text-[#F0F0F5]", children: geofence.shape ? getShapeLabel(geofence.shape) : 'N/A' })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [geofence.isTemporary && (_jsx(Badge, { className: "gap-1 bg-[#FFB547] text-[#0A0A0F] text-xs", children: "Temporaire" })), !geofence.isTemporary && (_jsx(Badge, { className: "gap-1 bg-[#00E5CC] text-[#0A0A0F] text-xs", children: "Permanente" })), _jsx(Badge, { variant: "outline", className: "text-xs border-[#1F1F2E] text-[#F0F0F5]", children: getDayLabel(geofence.activeDays || [true, true, true, true, true, false, false]) }), geofence.activeHours && (_jsxs(Badge, { variant: "outline", className: "gap-1 text-xs border-[#1F1F2E] text-[#F0F0F5]", children: [_jsx(Clock, { size: 12 }), geofence.activeHours.from, " - ", geofence.activeHours.to] })), !geofence.activeHours && (_jsx(Badge, { variant: "outline", className: "text-xs border-[#1F1F2E] text-[#F0F0F5]", children: "24h/24" }))] }), _jsxs("div", { className: "space-y-1 border-t border-[#1F1F2E] pt-3 text-xs", children: [_jsxs("p", { className: "text-[#6B6B80]", children: ["Temps moyen \u00E0 l'int\u00E9rieur: ", _jsx("span", { className: "font-medium text-[#F0F0F5]", children: "2h 15min" })] }), _jsxs("p", { className: "text-[#6B6B80]", children: ["Nombre d'entr\u00E9es aujourd'hui: ", _jsx("span", { className: "font-medium text-[#F0F0F5]", children: "12" })] })] }), (geofence.violationCount ?? 0) > 0 && (_jsx("div", { className: "rounded-lg bg-[#FF4D6A]/10 px-3 py-2 text-sm", children: _jsxs("p", { className: "text-[#FF4D6A]", children: [_jsx("span", { className: "font-semibold", children: geofence.violationCount }), " violation", geofence.violationCount > 1 ? 's' : ''] }) })), getVehiclesInsideCount(geofence) > 0 && (_jsxs("div", { className: "rounded-lg bg-[#00E5CC]/10 px-3 py-2 flex items-center gap-2 text-sm", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse" }), _jsxs("span", { className: "text-[#00E5CC]", children: [_jsx("span", { className: "font-semibold", children: getVehiclesInsideCount(geofence) }), " v\u00E9hicule", getVehiclesInsideCount(geofence) > 1 ? 's' : '', " \u00E0 l'int\u00E9rieur"] })] })), (geofence.groupCount ?? 0) > 0 && (_jsxs("div", { className: "text-xs text-[#6B6B80]", children: [_jsx("span", { className: "font-medium", children: geofence.groupCount }), " groupe", geofence.groupCount > 1 ? 's' : '', " assign\u00E9", geofence.groupCount > 1 ? 's' : ''] })), (geofence.assignedVehicleIds?.length ?? 0) > 0 && (_jsxs("div", { className: "text-xs text-[#6B6B80]", children: [_jsx("span", { className: "font-medium", children: geofence.assignedVehicleIds.length }), " v\u00E9hicule", geofence.assignedVehicleIds.length > 1 ? 's' : '', " assign\u00E9", geofence.assignedVehicleIds.length > 1 ? 's' : ''] })), _jsxs("div", { className: "flex items-center justify-between border-t border-[#1F1F2E] pt-3", children: [_jsxs("p", { className: "text-xs text-[#44445A]", children: ["Cr\u00E9\u00E9 ", formatDateTime(geofence.createdAt)] }), _jsxs("div", { className: "flex gap-1", onClick: (e) => e.stopPropagation(), children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-[#6B6B80] hover:text-[#F0F0F5] hover:bg-[#1A1A25]", onClick: () => openEditModal(geofence), children: _jsx(Edit2, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#1A1A25]", onClick: () => setDeleteConfirmId(geofence.id), children: _jsx(Trash2, { size: 14 }) })] })] })] })] }, geofence.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-[#6B6B80]", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", className: "border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", className: "border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Next" })] })] })), _jsx(Dialog, { open: modalMode === 'create' || modalMode === 'edit', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: modalMode === 'create' ? 'Créer une nouvelle géoclôture' : `Modifier: ${selectedGeofence?.name}` }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: modalMode === 'create'
                                        ? 'Dessinez une zone sur la carte et configurez les paramètres d\'alerte.'
                                        : 'Modifiez la forme de la géoclôture et les paramètres.' })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(GeofenceDrawMap, { initialShape: modalMode === 'edit' ? form.shape || undefined : undefined, onShapeChange: handleShapeChange }, modalMode), form.shape && (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-[#00E5CC]/10 px-3 py-2 text-sm text-[#00E5CC] border border-[#00E5CC]/20", children: [getShapeIcon(form.shape.type), _jsx("span", { children: getShapeLabel(form.shape) })] })), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-[#F0F0F5]", children: "Nom *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Exemple: Zone d'entrep\u00F4t, Site client...", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]" })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-[#F0F0F5]", children: "Description" }), _jsx(Input, { value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Description facultative...", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:ring-[#00E5CC]" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-[#F0F0F5]", children: "Priorit\u00E9" }), _jsx("select", { value: form.priority, onChange: (e) => setForm((prev) => ({ ...prev, priority: e.target.value })), className: "w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]", children: priorityOptions.map((opt) => (_jsx("option", { value: opt, className: "bg-[#12121A]", children: opt }, opt))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-[#F0F0F5]", children: "\u00C9v\u00E9nement de d\u00E9clenchement" }), _jsx("select", { value: form.triggerEvent, onChange: (e) => setForm((prev) => ({ ...prev, triggerEvent: e.target.value })), className: "w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]", children: triggerOptions.map((opt) => (_jsx("option", { value: opt.value, className: "bg-[#12121A]", children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-[#F0F0F5]", children: "Couleur de la zone" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: form.color, onChange: (e) => setForm((prev) => ({ ...prev, color: e.target.value })), className: "h-9 w-12 cursor-pointer rounded border border-[#1F1F2E] bg-[#0A0A0F]" }), _jsx("span", { className: "text-sm text-[#6B6B80]", children: form.color })] }), _jsx("div", { className: "flex gap-2", children: ['#FF0000', '#FF6600', '#FFCC00', '#00CC00', '#0066FF', '#9933FF', '#FF0099', '#666666'].map((color) => (_jsx("button", { onClick: () => setForm((prev) => ({ ...prev, color })), className: `h-7 w-7 rounded border-2 transition-all ${form.color.toUpperCase() === color
                                                                    ? 'border-[#F0F0F5] shadow-md'
                                                                    : 'border-[#1F1F2E] hover:border-[#2A2A3D]'}`, style: { backgroundColor: color }, title: color }, color))) })] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Param\u00E8tres d'alerte" }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "checkbox", checked: form.alertOnEntry, onChange: (e) => setForm((prev) => ({ ...prev, alertOnEntry: e.target.checked })), className: "rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Alerte \u00E0 l'entr\u00E9e"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "checkbox", checked: form.alertOnExit, onChange: (e) => setForm((prev) => ({ ...prev, alertOnExit: e.target.checked })), className: "rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Alerte \u00E0 la sortie"] })] })] }), _jsx("div", { className: "sm:col-span-2", children: _jsxs("div", { className: "space-y-3 border border-[#1F1F2E] rounded-lg p-4 bg-[#0A0A0F]/50", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "R\u00E8gles temporelles" }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "checkbox", checked: form.timeRulesEnabled, onChange: (e) => setForm((prev) => ({ ...prev, timeRulesEnabled: e.target.checked })), className: "rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Actif uniquement pendant certaines heures"] })] }), form.timeRulesEnabled && (_jsxs("div", { className: "space-y-4 mt-4 border-t border-[#1F1F2E] pt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-xs font-medium text-[#F0F0F5]", children: "Plage horaire" }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("input", { type: "time", value: form.activeHours?.from || '08:00', onChange: (e) => {
                                                                                    setForm((prev) => ({
                                                                                        ...prev,
                                                                                        activeHours: {
                                                                                            from: e.target.value,
                                                                                            to: prev.activeHours?.to || '18:00',
                                                                                        },
                                                                                    }));
                                                                                }, className: "rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-2 py-1 text-sm text-[#F0F0F5] focus:border-[#00E5CC]" }), _jsx("span", { className: "text-sm text-[#6B6B80]", children: "\u00E0" }), _jsx("input", { type: "time", value: form.activeHours?.to || '18:00', onChange: (e) => {
                                                                                    setForm((prev) => ({
                                                                                        ...prev,
                                                                                        activeHours: {
                                                                                            from: prev.activeHours?.from || '08:00',
                                                                                            to: e.target.value,
                                                                                        },
                                                                                    }));
                                                                                }, className: "rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-2 py-1 text-sm text-[#F0F0F5] focus:border-[#00E5CC]" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-xs font-medium text-[#F0F0F5]", children: "Jours actifs" }), _jsx("div", { className: "flex gap-1", children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (_jsx("button", { onClick: () => {
                                                                                const newDays = [...form.activeDays];
                                                                                newDays[idx] = !newDays[idx];
                                                                                setForm((prev) => ({ ...prev, activeDays: newDays }));
                                                                            }, className: `h-8 w-8 rounded-[6px] border-2 text-xs font-medium transition-colors ${form.activeDays[idx]
                                                                                ? 'border-[#00E5CC] bg-[#00E5CC] text-[#0A0A0F]'
                                                                                : 'border-[#1F1F2E] bg-[#0A0A0F] text-[#6B6B80] hover:border-[#2A2A3D]'}`, children: day }, idx))) }), _jsx("p", { className: "mt-1 text-xs text-[#6B6B80]", children: getDayLabel(form.activeDays) })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "checkbox", checked: form.businessDaysOnly, onChange: (e) => setForm((prev) => {
                                                                            if (e.target.checked) {
                                                                                return {
                                                                                    ...prev,
                                                                                    businessDaysOnly: true,
                                                                                    activeDays: [true, true, true, true, true, false, false],
                                                                                };
                                                                            }
                                                                            else {
                                                                                return { ...prev, businessDaysOnly: false };
                                                                            }
                                                                        }), className: "rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Jours ouvrables uniquement (lun-ven)"] })] }))] }) }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Type de g\u00E9ocl\u00F4ture" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "radio", checked: !form.isTemporary, onChange: () => setForm((prev) => ({ ...prev, isTemporary: false, temporaryUntil: undefined })), className: "rounded-full border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Permanente"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-[#F0F0F5]", children: [_jsx("input", { type: "radio", checked: form.isTemporary, onChange: () => setForm((prev) => ({ ...prev, isTemporary: true })), className: "rounded-full border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), "Temporaire"] })] }), form.isTemporary && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-[#F0F0F5]", children: "Valide jusqu'\u00E0" }), _jsx("input", { type: "datetime-local", value: form.temporaryUntil || '', onChange: (e) => setForm((prev) => ({ ...prev, temporaryUntil: e.target.value })), className: "w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC]" })] }))] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Assigner des v\u00E9hicules" }), _jsxs("div", { className: "space-y-2", children: [vehiclesLoading ? (_jsx("div", { className: "text-sm text-[#6B6B80]", children: "Chargement des v\u00E9hicules..." })) : vehicles.length === 0 ? (_jsx("div", { className: "text-sm text-[#6B6B80]", children: "Aucun v\u00E9hicule disponible" })) : (_jsx("div", { className: "max-h-40 overflow-y-auto rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F]", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-2 px-3 py-2 hover:bg-[#1A1A25] cursor-pointer border-b border-[#1F1F2E] last:border-b-0 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.assignedVehicleIds.includes(vehicle.id), onChange: (e) => {
                                                                            if (e.target.checked) {
                                                                                setForm((prev) => ({
                                                                                    ...prev,
                                                                                    assignedVehicleIds: [...prev.assignedVehicleIds, vehicle.id],
                                                                                }));
                                                                            }
                                                                            else {
                                                                                setForm((prev) => ({
                                                                                    ...prev,
                                                                                    assignedVehicleIds: prev.assignedVehicleIds.filter((id) => id !== vehicle.id),
                                                                                }));
                                                                            }
                                                                        }, className: "rounded border-[#1F1F2E] bg-[#0A0A0F] accent-[#00E5CC]" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: vehicle.name }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.registration })] })] }, vehicle.id))) })), form.assignedVehicleIds.length > 0 && (_jsxs("div", { className: "mt-2 space-y-1", children: [_jsxs("p", { className: "text-xs font-medium text-[#F0F0F5]", children: ["Assign\u00E9s (", form.assignedVehicleIds.length, "):"] }), _jsx("div", { className: "flex flex-wrap gap-1", children: form.assignedVehicleIds.map((vehicleId) => {
                                                                        const vehicle = vehicles.find((v) => v.id === vehicleId);
                                                                        return (_jsxs(Badge, { variant: "secondary", className: "gap-1 text-xs bg-[#1A1A25] text-[#F0F0F5]", children: [vehicle?.name, _jsx("button", { onClick: () => {
                                                                                        setForm((prev) => ({
                                                                                            ...prev,
                                                                                            assignedVehicleIds: prev.assignedVehicleIds.filter((id) => id !== vehicleId),
                                                                                        }));
                                                                                    }, className: "ml-1", children: _jsx(X, { size: 12 }) })] }, vehicleId));
                                                                    }) })] }))] })] })] }), formError && (_jsx("div", { className: "rounded-[12px] border border-[#FF4D6A]/30 bg-[#FF4D6A]/10 px-4 py-3 text-sm text-[#FF4D6A]", children: formError }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, className: "border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleSubmit, disabled: createMutation.isPending, className: "bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]", children: createMutation.isPending
                                        ? 'Enregistrement...'
                                        : modalMode === 'create'
                                            ? 'Créer une géoclôture'
                                            : 'Enregistrer les modifications' })] })] }) }), _jsx(Dialog, { open: modalMode === 'view', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: selectedGeofence?.name }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: selectedGeofence?.description || 'Pas de description' })] }), selectedGeofence && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex gap-4 border-b border-[#1F1F2E]", children: [_jsx("button", { onClick: () => setActiveTab('details'), className: `pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'details'
                                                ? 'border-b-2 border-[#00E5CC] text-[#00E5CC]'
                                                : 'text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "D\u00E9tails" }), _jsxs("button", { onClick: () => setActiveTab('violations'), className: `pb-2 px-1 text-sm font-medium transition-colors flex items-center gap-1 ${activeTab === 'violations'
                                                ? 'border-b-2 border-[#00E5CC] text-[#00E5CC]'
                                                : 'text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: [_jsx(AlertTriangle, { size: 14 }), "Violations"] })] }), activeTab === 'details' && (_jsxs("div", { className: "space-y-4", children: [_jsx(GeofenceDrawMap, { initialShape: selectedGeofence.shape, onShapeChange: () => { } }, `view-${selectedGeofence.id}`), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Statut" }), _jsx(Badge, { variant: selectedGeofence.isActive ? 'default' : 'secondary', className: "bg-[#00E5CC] text-[#0A0A0F]", children: selectedGeofence.isActive ? 'Actif' : 'Inactif' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Priorit\u00E9" }), _jsx(Badge, { className: "text-white text-xs", style: { backgroundColor: getPriorityColor(selectedGeofence.priority || 'Moyen') }, children: selectedGeofence.priority || 'Moyen' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Forme" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: getShapeLabel(selectedGeofence.shape) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "D\u00E9clencheur" }), _jsx("p", { className: "font-medium capitalize text-[#F0F0F5]", children: selectedGeofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Cr\u00E9\u00E9" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: formatDateTime(selectedGeofence.createdAt) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Type" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: selectedGeofence.isTemporary ? 'Temporaire' : 'Permanente' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Alerte \u00E0 l'entr\u00E9e" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: selectedGeofence.alertOnEntry ? 'Oui' : 'Non' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Alerte \u00E0 la sortie" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: selectedGeofence.alertOnExit ? 'Oui' : 'Non' })] }), getVehiclesInsideCount(selectedGeofence) > 0 && (_jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "V\u00E9hicules \u00E0 l'int\u00E9rieur" }), _jsx("p", { className: "font-medium text-[#00E5CC]", children: getVehiclesInsideCount(selectedGeofence) })] }))] }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-4 space-y-3", children: [_jsx("h4", { className: "text-sm font-medium text-[#F0F0F5]", children: "Statistiques temporelles" }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "rounded-lg bg-[#00E5CC]/10 p-3 border border-[#00E5CC]/20", children: [_jsx("p", { className: "text-[#6B6B80] text-xs", children: "Temps moyen \u00E0 l'int\u00E9rieur" }), _jsx("p", { className: "font-medium text-[#F0F0F5] mt-1", children: "2h 15min" })] }), _jsxs("div", { className: "rounded-lg bg-[#FFB547]/10 p-3 border border-[#FFB547]/20", children: [_jsx("p", { className: "text-[#6B6B80] text-xs", children: "Entr\u00E9es aujourd'hui" }), _jsx("p", { className: "font-medium text-[#F0F0F5] mt-1", children: "12" })] })] })] })] })), activeTab === 'violations' && (_jsx("div", { className: "space-y-3", children: violationsLoading ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx("div", { className: "text-[#6B6B80]", children: "Chargement des violations..." }) })) : violations.length === 0 ? (_jsxs("div", { className: "rounded-lg bg-[#1A1A25] px-4 py-6 text-center border border-[#1F1F2E]", children: [_jsx(AlertTriangle, { className: "mx-auto mb-2 text-[#44445A]", size: 24 }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Aucune violation enregistr\u00E9e" })] })) : (_jsxs("div", { className: "max-h-96 overflow-y-auto space-y-2", children: [_jsxs("div", { className: "grid grid-cols-5 gap-3 text-xs font-medium text-[#6B6B80] px-3 py-2 border-b border-[#1F1F2E]", children: [_jsx("div", { children: "Type" }), _jsx("div", { children: "V\u00E9hicule" }), _jsx("div", { children: "Entr\u00E9e" }), _jsx("div", { children: "Sortie" }), _jsx("div", { children: "Dur\u00E9e" })] }), violations.map((violation, idx) => (_jsxs("div", { className: `grid grid-cols-5 gap-3 text-xs rounded-lg px-3 py-3 items-center border ${violation.type === 'entry'
                                                    ? 'bg-[#00E5CC]/10 border-[#00E5CC]/30'
                                                    : 'bg-[#FFB547]/10 border-[#FFB547]/30'}`, children: [_jsx(Badge, { className: `w-fit text-xs ${violation.type === 'entry'
                                                            ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                                            : 'bg-[#FFB547] text-[#0A0A0F]'}`, children: violation.type === 'entry' ? 'Entrée' : 'Sortie' }), _jsx("div", { className: "font-medium text-[#F0F0F5]", children: violation.vehicleName }), _jsx("div", { className: "text-[#6B6B80]", children: formatDateTime(violation.timestamp) }), _jsx("div", { className: "text-[#6B6B80]", children: idx < violations.length - 1 && violations[idx + 1].type === 'exit'
                                                            ? formatDateTime(violations[idx + 1].timestamp)
                                                            : '-' }), _jsx("div", { className: "text-[#6B6B80] font-medium", children: violation.duration ? `${violation.duration}min` : '-' })] }, violation.id)))] })) }))] })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, className: "border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", children: "Fermer" }), _jsx(Button, { onClick: () => {
                                        if (selectedGeofence) {
                                            closeModal();
                                            setTimeout(() => openEditModal(selectedGeofence), 100);
                                        }
                                    }, className: "bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4BB]", children: "Modifier la g\u00E9ocl\u00F4ture" })] })] }) }), _jsx(Dialog, { open: !!deleteConfirmId, onOpenChange: () => setDeleteConfirmId(null), children: _jsxs(DialogContent, { className: "max-w-sm bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: "Supprimer la g\u00E9ocl\u00F4ture" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "\u00CAtes-vous s\u00FBr de vouloir supprimer cette g\u00E9ocl\u00F4ture? Cette action ne peut pas \u00EAtre annul\u00E9e." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirmId(null), className: "border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { variant: "destructive", className: "bg-[#FF4D6A] hover:bg-[#E63A56] text-white", onClick: async () => {
                                        if (deleteConfirmId) {
                                            try {
                                                await apiClient.delete(API_ROUTES.GEOFENCE_DETAIL(orgId, deleteConfirmId));
                                                queryClient.invalidateQueries({ queryKey: ['geofences'] });
                                            }
                                            catch {
                                                // Silently handle
                                            }
                                        }
                                        setDeleteConfirmId(null);
                                    }, children: "Supprimer" })] })] }) })] }));
}
//# sourceMappingURL=GeofencesPage.js.map