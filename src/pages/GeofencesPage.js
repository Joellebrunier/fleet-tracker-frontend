import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
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
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff, Clock } from 'lucide-react';
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
};
const triggerOptions = [
    { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
    { value: GeofenceEvent.EXIT, label: 'Exit Only' },
    { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
];
const geofenceTemplates = [
    { name: 'Zone de dépôt', namePrefix: 'Dépôt', shape: { type: 'circle', radiusMeters: 200 }, color: '#3b82f6' },
    { name: 'Zone de livraison', namePrefix: 'Livraison', shape: { type: 'circle', radiusMeters: 500 }, color: '#10b981' },
    { name: 'Zone interdite', namePrefix: 'Interdite', shape: { type: 'polygon' }, color: '#ef4444' },
    { name: 'Zone de chantier', namePrefix: 'Chantier', shape: { type: 'rectangle' }, color: '#f97316' },
];
function getShapeIcon(type) {
    switch (type) {
        case 'circle':
            return _jsx(Circle, { size: 16 });
        case 'polygon':
            return _jsx(Pentagon, { size: 16 });
        case 'rectangle':
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
    return shape.type;
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
    const { data: geofencesData, isLoading } = useGeofences(page);
    const { data: stats } = useGeofenceStats();
    const createMutation = useCreateGeofence();
    const geofences = geofencesData?.data || [];
    const totalPages = geofencesData?.totalPages || 1;
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "G\u00E9ocl\u00F4tures" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Cr\u00E9er et g\u00E9rer les limites de localisation pour votre flotte" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "outline", className: "gap-2", onClick: () => setShowTemplates(!showTemplates), children: "Mod\u00E8les" }), showTemplates && (_jsx("div", { className: "absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10", children: _jsx("div", { className: "p-2 space-y-1", children: geofenceTemplates.map((template) => (_jsx("button", { onClick: () => {
                                                    openCreateModal();
                                                    applyTemplate(template);
                                                }, className: "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-sm", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 rounded-full", style: { backgroundColor: template.color } }), _jsx("span", { className: "font-medium", children: template.name })] }) }, template.name))) }) }))] }), _jsxs(Button, { className: "gap-2", onClick: openCreateModal, children: [_jsx(Plus, { size: 18 }), "Cr\u00E9er"] })] })] }), stats && (_jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total g\u00E9ocl\u00F4tures" }), _jsx("p", { className: "mt-1 text-2xl font-bold", children: filteredGeofences.length })] }), _jsx("div", { className: "rounded-full bg-blue-100 p-3", children: _jsx(MapPin, { size: 20, className: "text-blue-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Actives" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-green-600", children: filteredGeofences.filter((g) => g.isActive).length })] }), _jsx("div", { className: "rounded-full bg-green-100 p-3", children: _jsx(Eye, { size: 20, className: "text-green-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Alertes aujourd'hui" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-red-600", children: "0" })] }), _jsx("div", { className: "rounded-full bg-red-100 p-3", children: _jsx(EyeOff, { size: 20, className: "text-red-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "V\u00E9hicules surveill\u00E9s" }), _jsx("p", { className: "mt-1 text-2xl font-bold", children: filteredGeofences.reduce((sum, g) => sum + (g.vehicleCount || 0), 0) })] }), _jsx("div", { className: "rounded-full bg-purple-100 p-3", children: _jsx(MapPin, { size: 20, className: "text-purple-600" }) })] }) }) })] })), _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 18 }), _jsx(Input, { placeholder: "Rechercher les g\u00E9ocl\u00F4tures...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })] }), isLoading ? (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-48" }, i))) })) : filteredGeofences.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(MapPin, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-700", children: search ? 'Aucune géoclôture ne correspond à votre recherche' : 'Aucune géoclôture créée' }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: search
                                ? 'Essayez un terme de recherche différent'
                                : 'Cliquez sur "Créer" pour définir votre première zone' }), !search && (_jsxs(Button, { className: "mt-4 gap-2", onClick: openCreateModal, children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er votre premi\u00E8re g\u00E9ocl\u00F4ture"] }))] }) })) : (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: filteredGeofences.map((geofence) => (_jsxs(Card, { className: "cursor-pointer transition-shadow hover:shadow-md", onClick: () => openViewModal(geofence), children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1", children: [_jsx("div", { className: "rounded-lg p-2", style: {
                                                    backgroundColor: `${geofence.metadata?.color || '#3b82f6'}20`,
                                                    color: geofence.metadata?.color || '#3b82f6',
                                                }, children: getShapeIcon(geofence.shape.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx(CardTitle, { className: "text-base", children: geofence.name }), geofence.description && (_jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: geofence.description }))] })] }), _jsx(Badge, { variant: geofence.isActive ? 'default' : 'secondary', children: geofence.isActive ? 'Actif' : 'Inactif' })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Type" }), _jsx("p", { className: "font-medium capitalize", children: geofence.shape.type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "D\u00E9clencheur" }), _jsx("p", { className: "font-medium capitalize", children: geofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "D\u00E9tails" }), _jsx("p", { className: "font-medium text-xs", children: getShapeLabel(geofence.shape) })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [geofence.isTemporary && (_jsx(Badge, { className: "gap-1 bg-orange-500 text-white text-xs", children: "Temporaire" })), !geofence.isTemporary && (_jsx(Badge, { className: "gap-1 bg-blue-500 text-white text-xs", children: "Permanente" })), _jsx(Badge, { variant: "outline", className: "text-xs", children: getDayLabel(geofence.activeDays || [true, true, true, true, true, false, false]) }), geofence.activeHours && (_jsxs(Badge, { variant: "outline", className: "gap-1 text-xs", children: [_jsx(Clock, { size: 12 }), geofence.activeHours.from, " - ", geofence.activeHours.to] })), !geofence.activeHours && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "24h/24" }))] }), (geofence.violationCount ?? 0) > 0 && (_jsx("div", { className: "rounded-lg bg-red-50 px-3 py-2 text-sm", children: _jsxs("p", { className: "text-red-700", children: [_jsx("span", { className: "font-semibold", children: geofence.violationCount }), " violation", geofence.violationCount > 1 ? 's' : ''] }) })), (geofence.groupCount ?? 0) > 0 && (_jsxs("div", { className: "text-xs text-gray-600", children: [_jsx("span", { className: "font-medium", children: geofence.groupCount }), " groupe", geofence.groupCount > 1 ? 's' : '', " assign\u00E9", geofence.groupCount > 1 ? 's' : ''] })), (geofence.avgTimeInside || geofence.lastEntry) && (_jsxs("div", { className: "space-y-1 border-t border-gray-100 pt-3 text-xs", children: [geofence.avgTimeInside && (_jsxs("p", { className: "text-gray-600", children: ["Temps moyen: ", _jsx("span", { className: "font-medium", children: geofence.avgTimeInside })] })), geofence.lastEntry && (_jsxs("p", { className: "text-gray-600", children: ["Derni\u00E8re entr\u00E9e: ", _jsx("span", { className: "font-medium", children: geofence.lastEntry })] }))] })), _jsxs("div", { className: "flex items-center justify-between border-t border-gray-100 pt-3", children: [_jsxs("p", { className: "text-xs text-gray-400", children: ["Cr\u00E9\u00E9 ", formatDateTime(geofence.createdAt)] }), _jsxs("div", { className: "flex gap-1", onClick: (e) => e.stopPropagation(), children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", onClick: () => openEditModal(geofence), children: _jsx(Edit2, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-red-500 hover:text-red-700", onClick: () => setDeleteConfirmId(geofence.id), children: _jsx(Trash2, { size: 14 }) })] })] })] })] }, geofence.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Next" })] })] })), _jsx(Dialog, { open: modalMode === 'create' || modalMode === 'edit', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: modalMode === 'create' ? 'Créer une nouvelle géoclôture' : `Modifier: ${selectedGeofence?.name}` }), _jsx(DialogDescription, { children: modalMode === 'create'
                                        ? 'Dessinez une zone sur la carte et configurez les paramètres d\'alerte.'
                                        : 'Modifiez la forme de la géoclôture et les paramètres.' })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(GeofenceDrawMap, { initialShape: modalMode === 'edit' ? form.shape || undefined : undefined, onShapeChange: handleShapeChange }, modalMode), form.shape && (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700", children: [getShapeIcon(form.shape.type), _jsx("span", { children: getShapeLabel(form.shape) })] })), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Nom *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Exemple: Zone d'entrep\u00F4t, Site client..." })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Description" }), _jsx(Input, { value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Description facultative..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "\u00C9v\u00E9nement de d\u00E9clenchement" }), _jsx("select", { value: form.triggerEvent, onChange: (e) => setForm((prev) => ({ ...prev, triggerEvent: e.target.value })), className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: triggerOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Couleur de la zone" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: form.color, onChange: (e) => setForm((prev) => ({ ...prev, color: e.target.value })), className: "h-9 w-12 cursor-pointer rounded border border-gray-300" }), _jsx("span", { className: "text-sm text-gray-500", children: form.color })] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Param\u00E8tres d'alerte" }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.alertOnEntry, onChange: (e) => setForm((prev) => ({ ...prev, alertOnEntry: e.target.checked })), className: "rounded border-gray-300" }), "Alerte \u00E0 l'entr\u00E9e"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.alertOnExit, onChange: (e) => setForm((prev) => ({ ...prev, alertOnExit: e.target.checked })), className: "rounded border-gray-300" }), "Alerte \u00E0 la sortie"] })] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Jours actifs" }), _jsx("div", { className: "flex gap-2", children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (_jsx("button", { onClick: () => {
                                                            const newDays = [...form.activeDays];
                                                            newDays[idx] = !newDays[idx];
                                                            setForm((prev) => ({ ...prev, activeDays: newDays }));
                                                        }, className: `h-9 w-9 rounded-md border-2 text-xs font-medium transition-colors ${form.activeDays[idx]
                                                            ? 'border-blue-500 bg-blue-500 text-white'
                                                            : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`, children: day }, idx))) }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: getDayLabel(form.activeDays) })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Heures actives" }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: !!form.activeHours, onChange: (e) => {
                                                                    if (e.target.checked) {
                                                                        setForm((prev) => ({
                                                                            ...prev,
                                                                            activeHours: { from: '08:00', to: '18:00' },
                                                                        }));
                                                                    }
                                                                    else {
                                                                        setForm((prev) => ({ ...prev, activeHours: null }));
                                                                    }
                                                                }, className: "rounded border-gray-300" }), "Configurer une plage horaire"] }) }), form.activeHours && (_jsxs("div", { className: "mt-2 flex gap-2", children: [_jsx("input", { type: "time", value: form.activeHours.from, onChange: (e) => {
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    activeHours: {
                                                                        ...(prev.activeHours || { from: '', to: '' }),
                                                                        from: e.target.value,
                                                                    },
                                                                }));
                                                            }, className: "rounded-md border border-gray-300 px-2 py-1 text-sm" }), _jsx("span", { className: "text-sm text-gray-600", children: "\u00E0" }), _jsx("input", { type: "time", value: form.activeHours.to, onChange: (e) => {
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    activeHours: {
                                                                        ...(prev.activeHours || { from: '', to: '' }),
                                                                        to: e.target.value,
                                                                    },
                                                                }));
                                                            }, className: "rounded-md border border-gray-300 px-2 py-1 text-sm" })] }))] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Type de g\u00E9ocl\u00F4ture" }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "radio", checked: !form.isTemporary, onChange: () => setForm((prev) => ({ ...prev, isTemporary: false, temporaryUntil: undefined })), className: "rounded-full border-gray-300" }), "Permanente"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "radio", checked: form.isTemporary, onChange: () => setForm((prev) => ({ ...prev, isTemporary: true })), className: "rounded-full border-gray-300" }), "Temporaire"] })] }), form.isTemporary && (_jsxs("div", { className: "mt-2", children: [_jsx("label", { className: "mb-1 block text-xs font-medium text-gray-700", children: "Valide jusqu'\u00E0" }), _jsx("input", { type: "datetime-local", value: form.temporaryUntil || '', onChange: (e) => setForm((prev) => ({ ...prev, temporaryUntil: e.target.value })), className: "w-full rounded-md border border-gray-300 px-3 py-2 text-sm" })] }))] })] }), formError && (_jsx("div", { className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600", children: formError }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, children: "Annuler" }), _jsx(Button, { onClick: handleSubmit, disabled: createMutation.isPending, children: createMutation.isPending
                                        ? 'Enregistrement...'
                                        : modalMode === 'create'
                                            ? 'Créer une géoclôture'
                                            : 'Enregistrer les modifications' })] })] }) }), _jsx(Dialog, { open: modalMode === 'view', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedGeofence?.name }), _jsx(DialogDescription, { children: selectedGeofence?.description || 'Pas de description' })] }), selectedGeofence && (_jsxs("div", { className: "space-y-4", children: [_jsx(GeofenceDrawMap, { initialShape: selectedGeofence.shape, onShapeChange: () => { } }, `view-${selectedGeofence.id}`), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Statut" }), _jsx(Badge, { variant: selectedGeofence.isActive ? 'default' : 'secondary', children: selectedGeofence.isActive ? 'Actif' : 'Inactif' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Forme" }), _jsx("p", { className: "font-medium", children: getShapeLabel(selectedGeofence.shape) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "D\u00E9clencheur" }), _jsx("p", { className: "font-medium capitalize", children: selectedGeofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Cr\u00E9\u00E9" }), _jsx("p", { className: "font-medium", children: formatDateTime(selectedGeofence.createdAt) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Alerte \u00E0 l'entr\u00E9e" }), _jsx("p", { className: "font-medium", children: selectedGeofence.alertOnEntry ? 'Oui' : 'Non' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Alerte \u00E0 la sortie" }), _jsx("p", { className: "font-medium", children: selectedGeofence.alertOnExit ? 'Oui' : 'Non' })] })] })] })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, children: "Fermer" }), _jsx(Button, { onClick: () => {
                                        if (selectedGeofence) {
                                            closeModal();
                                            setTimeout(() => openEditModal(selectedGeofence), 100);
                                        }
                                    }, children: "Modifier la g\u00E9ocl\u00F4ture" })] })] }) }), _jsx(Dialog, { open: !!deleteConfirmId, onOpenChange: () => setDeleteConfirmId(null), children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Supprimer la g\u00E9ocl\u00F4ture" }), _jsx(DialogDescription, { children: "\u00CAtes-vous s\u00FBr de vouloir supprimer cette g\u00E9ocl\u00F4ture? Cette action ne peut pas \u00EAtre annul\u00E9e." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirmId(null), children: "Annuler" }), _jsx(Button, { variant: "destructive", className: "bg-red-600 hover:bg-red-700", onClick: async () => {
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