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
import { MapPin, Plus, Trash2, Edit2, Search, Circle, Pentagon, Square, Eye, EyeOff } from 'lucide-react';
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
};
const triggerOptions = [
    { value: GeofenceEvent.ENTRY, label: 'Entry Only' },
    { value: GeofenceEvent.EXIT, label: 'Exit Only' },
    { value: GeofenceEvent.BOTH, label: 'Entry & Exit' },
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
        setModalMode('create');
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Geofences" }), _jsx("p", { className: "mt-1 text-gray-600", children: "Create and manage location boundaries for your fleet" })] }), _jsxs(Button, { className: "gap-2", onClick: openCreateModal, children: [_jsx(Plus, { size: 18 }), "Create Geofence"] })] }), stats && (_jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total Zones" }), _jsx("p", { className: "mt-1 text-2xl font-bold", children: stats.total })] }), _jsx("div", { className: "rounded-full bg-blue-100 p-3", children: _jsx(MapPin, { size: 20, className: "text-blue-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Active" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-green-600", children: stats.active })] }), _jsx("div", { className: "rounded-full bg-green-100 p-3", children: _jsx(Eye, { size: 20, className: "text-green-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Violations Today" }), _jsx("p", { className: "mt-1 text-2xl font-bold text-red-600", children: stats.violations })] }), _jsx("div", { className: "rounded-full bg-red-100 p-3", children: _jsx(EyeOff, { size: 20, className: "text-red-600" }) })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Vehicles Assigned" }), _jsx("p", { className: "mt-1 text-2xl font-bold", children: stats.vehiclesAssigned })] }), _jsx("div", { className: "rounded-full bg-purple-100 p-3", children: _jsx(MapPin, { size: 20, className: "text-purple-600" }) })] }) }) })] })), _jsxs("div", { className: "relative max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 18 }), _jsx(Input, { placeholder: "Search geofences...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-10" })] }), isLoading ? (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: [...Array(4)].map((_, i) => (_jsx(Skeleton, { className: "h-48" }, i))) })) : filteredGeofences.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "py-12", children: [_jsx(MapPin, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-700", children: search ? 'No geofences match your search' : 'No geofences created yet' }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: search
                                ? 'Try a different search term'
                                : 'Click "Create Geofence" to define your first zone' }), !search && (_jsxs(Button, { className: "mt-4 gap-2", onClick: openCreateModal, children: [_jsx(Plus, { size: 16 }), "Create Your First Geofence"] }))] }) })) : (_jsx("div", { className: "grid gap-4 lg:grid-cols-2", children: filteredGeofences.map((geofence) => (_jsxs(Card, { className: "cursor-pointer transition-shadow hover:shadow-md", onClick: () => openViewModal(geofence), children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "rounded-lg p-2", style: {
                                                    backgroundColor: `${geofence.metadata?.color || '#3b82f6'}20`,
                                                    color: geofence.metadata?.color || '#3b82f6',
                                                }, children: getShapeIcon(geofence.shape.type) }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: geofence.name }), geofence.description && (_jsx("p", { className: "mt-0.5 text-xs text-gray-500", children: geofence.description }))] })] }), _jsx(Badge, { variant: geofence.isActive ? 'default' : 'secondary', children: geofence.isActive ? 'Active' : 'Inactive' })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-3 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Type" }), _jsx("p", { className: "font-medium capitalize", children: geofence.shape.type })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Trigger" }), _jsx("p", { className: "font-medium capitalize", children: geofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Details" }), _jsx("p", { className: "font-medium text-xs", children: getShapeLabel(geofence.shape) })] })] }), _jsxs("div", { className: "flex items-center justify-between border-t border-gray-100 pt-3", children: [_jsxs("p", { className: "text-xs text-gray-400", children: ["Created ", formatDateTime(geofence.createdAt)] }), _jsxs("div", { className: "flex gap-1", onClick: (e) => e.stopPropagation(), children: [_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", onClick: () => openEditModal(geofence), children: _jsx(Edit2, { size: 14 }) }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-red-500 hover:text-red-700", onClick: () => setDeleteConfirmId(geofence.id), children: _jsx(Trash2, { size: 14 }) })] })] })] })] }, geofence.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Next" })] })] })), _jsx(Dialog, { open: modalMode === 'create' || modalMode === 'edit', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: modalMode === 'create' ? 'Create New Geofence' : `Edit: ${selectedGeofence?.name}` }), _jsx(DialogDescription, { children: modalMode === 'create'
                                        ? 'Draw a zone on the map and configure alert settings.'
                                        : 'Modify the geofence shape and settings.' })] }), _jsxs("div", { className: "space-y-5", children: [_jsx(GeofenceDrawMap, { initialShape: modalMode === 'edit' ? form.shape || undefined : undefined, onShapeChange: handleShapeChange }, modalMode), form.shape && (_jsxs("div", { className: "flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700", children: [getShapeIcon(form.shape.type), _jsx("span", { children: getShapeLabel(form.shape) })] })), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Name *" }), _jsx(Input, { value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "e.g. Warehouse Zone, Client Site..." })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Description" }), _jsx(Input, { value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Optional description..." })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Trigger Event" }), _jsx("select", { value: form.triggerEvent, onChange: (e) => setForm((prev) => ({ ...prev, triggerEvent: e.target.value })), className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: triggerOptions.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium text-gray-700", children: "Zone Color" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "color", value: form.color, onChange: (e) => setForm((prev) => ({ ...prev, color: e.target.value })), className: "h-9 w-12 cursor-pointer rounded border border-gray-300" }), _jsx("span", { className: "text-sm text-gray-500", children: form.color })] })] }), _jsxs("div", { className: "sm:col-span-2", children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Alert Settings" }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.alertOnEntry, onChange: (e) => setForm((prev) => ({ ...prev, alertOnEntry: e.target.checked })), className: "rounded border-gray-300" }), "Alert on entry"] }), _jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: form.alertOnExit, onChange: (e) => setForm((prev) => ({ ...prev, alertOnExit: e.target.checked })), className: "rounded border-gray-300" }), "Alert on exit"] })] })] })] }), formError && (_jsx("div", { className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600", children: formError }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: createMutation.isPending, children: createMutation.isPending
                                        ? 'Saving...'
                                        : modalMode === 'create'
                                            ? 'Create Geofence'
                                            : 'Save Changes' })] })] }) }), _jsx(Dialog, { open: modalMode === 'view', onOpenChange: () => closeModal(), children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedGeofence?.name }), _jsx(DialogDescription, { children: selectedGeofence?.description || 'No description' })] }), selectedGeofence && (_jsxs("div", { className: "space-y-4", children: [_jsx(GeofenceDrawMap, { initialShape: selectedGeofence.shape, onShapeChange: () => { } }, `view-${selectedGeofence.id}`), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Status" }), _jsx(Badge, { variant: selectedGeofence.isActive ? 'default' : 'secondary', children: selectedGeofence.isActive ? 'Active' : 'Inactive' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Shape" }), _jsx("p", { className: "font-medium", children: getShapeLabel(selectedGeofence.shape) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Trigger" }), _jsx("p", { className: "font-medium capitalize", children: selectedGeofence.triggerEvent })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Created" }), _jsx("p", { className: "font-medium", children: formatDateTime(selectedGeofence.createdAt) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Alert on Entry" }), _jsx("p", { className: "font-medium", children: selectedGeofence.alertOnEntry ? 'Yes' : 'No' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Alert on Exit" }), _jsx("p", { className: "font-medium", children: selectedGeofence.alertOnExit ? 'Yes' : 'No' })] })] })] })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: closeModal, children: "Close" }), _jsx(Button, { onClick: () => {
                                        if (selectedGeofence) {
                                            closeModal();
                                            setTimeout(() => openEditModal(selectedGeofence), 100);
                                        }
                                    }, children: "Edit Geofence" })] })] }) }), _jsx(Dialog, { open: !!deleteConfirmId, onOpenChange: () => setDeleteConfirmId(null), children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Delete Geofence" }), _jsx(DialogDescription, { children: "Are you sure you want to delete this geofence? This action cannot be undone." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirmId(null), children: "Cancel" }), _jsx(Button, { variant: "destructive", className: "bg-red-600 hover:bg-red-700", onClick: async () => {
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
                                    }, children: "Delete" })] })] }) })] }));
}
//# sourceMappingURL=GeofencesPage.js.map