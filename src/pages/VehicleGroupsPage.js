import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Folder, FolderPlus, ChevronDown, ChevronRight, Hash, Search, Edit2, Trash2 } from 'lucide-react';
const COLOR_OPTIONS = [
    { value: 'bg-red-100 text-red-800 border-red-300', label: 'Red' },
    { value: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Orange' },
    { value: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Amber' },
    { value: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Yellow' },
    { value: 'bg-lime-100 text-lime-800 border-lime-300', label: 'Lime' },
    { value: 'bg-green-100 text-green-800 border-green-300', label: 'Green' },
    { value: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Emerald' },
    { value: 'bg-teal-100 text-teal-800 border-teal-300', label: 'Teal' },
    { value: 'bg-cyan-100 text-cyan-800 border-cyan-300', label: 'Cyan' },
    { value: 'bg-sky-100 text-sky-800 border-sky-300', label: 'Sky' },
    { value: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Blue' },
    { value: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Indigo' },
    { value: 'bg-violet-100 text-violet-800 border-violet-300', label: 'Violet' },
    { value: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Purple' },
    { value: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300', label: 'Fuchsia' },
    { value: 'bg-pink-100 text-pink-800 border-pink-300', label: 'Pink' },
    { value: 'bg-rose-100 text-rose-800 border-rose-300', label: 'Rose' },
    { value: 'bg-slate-100 text-slate-800 border-slate-300', label: 'Slate' },
];
export default function VehicleGroupsPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: COLOR_OPTIONS[10].value, // Blue default
    });
    const [selectedVehicleColor, setSelectedVehicleColor] = useState(COLOR_OPTIONS[10].value);
    // Fetch vehicle groups
    const { data: groups = [], isLoading, error } = useQuery({
        queryKey: ['vehicleGroups', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            const response = await apiClient.get(`/api/organizations/${organizationId}/vehicle-groups`);
            return response.data;
        },
        enabled: !!organizationId,
    });
    // Fetch vehicles for a specific group
    const { data: groupVehicles = {} } = useQuery({
        queryKey: ['groupVehicles', organizationId, expandedGroups],
        queryFn: async () => {
            if (!organizationId || expandedGroups.size === 0)
                return {};
            const vehicles = {};
            for (const groupId of expandedGroups) {
                try {
                    const response = await apiClient.get(`/api/organizations/${organizationId}/vehicle-groups/${groupId}/vehicles`);
                    vehicles[groupId] = response.data;
                }
                catch {
                    vehicles[groupId] = [];
                }
            }
            return vehicles;
        },
        enabled: !!organizationId && expandedGroups.size > 0,
    });
    // Create/Update group mutation
    const upsertMutation = useMutation({
        mutationFn: async (data) => {
            if (editingGroup) {
                return await apiClient.put(`/api/organizations/${organizationId}/vehicle-groups/${editingGroup.id}`, data);
            }
            return await apiClient.post(`/api/organizations/${organizationId}/vehicle-groups`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['vehicleGroups', organizationId],
            });
            handleCloseModal();
        },
    });
    // Delete group mutation
    const deleteMutation = useMutation({
        mutationFn: async (groupId) => {
            return await apiClient.delete(`/api/organizations/${organizationId}/vehicle-groups/${groupId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['vehicleGroups', organizationId],
            });
        },
    });
    const handleOpenModal = (group) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description || '',
                color: group.color || COLOR_OPTIONS[10].value,
                parentGroupId: group.parentGroupId,
            });
            setSelectedVehicleColor(group.color || COLOR_OPTIONS[10].value);
        }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
        setFormData({
            name: '',
            description: '',
            color: COLOR_OPTIONS[10].value,
        });
        setSelectedVehicleColor(COLOR_OPTIONS[10].value);
    };
    const handleFormChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);
    const handleColorSelect = (colorValue) => {
        setFormData((prev) => ({ ...prev, color: colorValue }));
        setSelectedVehicleColor(colorValue);
    };
    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            return;
        }
        await upsertMutation.mutateAsync({
            ...formData,
            description: formData.description.trim(),
        });
    };
    const handleDelete = async (groupId) => {
        if (confirm('Are you sure you want to delete this group?')) {
            await deleteMutation.mutateAsync(groupId);
        }
    };
    const toggleExpanded = (groupId) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
        }
        else {
            newExpanded.add(groupId);
        }
        setExpandedGroups(newExpanded);
    };
    // Filter groups
    const filteredGroups = groups.filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (group.description &&
                group.description.toLowerCase().includes(searchQuery.toLowerCase()));
        // Only show root groups (no parent) in main view
        return matchesSearch && !group.parentGroupId;
    });
    // Get child groups for a parent
    const getChildGroups = (parentId) => {
        return groups.filter((g) => g.parentGroupId === parentId);
    };
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900", children: "Vehicle Groups" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "Organize your fleet vehicles into groups and manage assignments" })] }), _jsxs(Button, { onClick: () => handleOpenModal(), className: "flex items-center gap-2", children: [_jsx(FolderPlus, { className: "h-4 w-4" }), "New Group"] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-slate-400" }), _jsx(Input, { placeholder: "Search groups by name or description...", className: "pl-10", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [...Array(4)].map((_, i) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-2/3" }) }), _jsx(CardContent, { children: _jsx(Skeleton, { className: "h-4 w-full" }) })] }, i))) })) : error ? (_jsx(Card, { className: "border-red-200 bg-red-50", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-red-800", children: "Failed to load vehicle groups" }) }) })) : filteredGroups.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Folder, { className: "mb-4 h-12 w-12 text-slate-300" }), _jsx("p", { className: "text-slate-600", children: searchQuery
                                ? 'No groups match your search'
                                : 'No vehicle groups yet. Create one to organize your fleet.' })] }) })) : (_jsx("div", { className: "space-y-4", children: filteredGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const childGroups = getChildGroups(group.id);
                    const vehicles = groupVehicles[group.id] || [];
                    return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Card, { className: "overflow-hidden transition-shadow hover:shadow-md", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [(childGroups.length > 0 || group.vehicleCount > 0) && (_jsx("button", { onClick: () => toggleExpanded(group.id), className: "mt-1 p-0 text-slate-600 hover:text-slate-900 flex-shrink-0", children: isExpanded ? (_jsx(ChevronDown, { className: "h-5 w-5" })) : (_jsx(ChevronRight, { className: "h-5 w-5" })) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Folder, { className: "h-5 w-5 text-slate-400 flex-shrink-0" }), _jsx(CardTitle, { className: "truncate", children: group.name })] }), group.description && (_jsx("p", { className: "text-sm text-slate-600 line-clamp-2", children: group.description }))] })] }), group.color && (_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: `h-8 w-8 rounded-full border-2 ${group.color.replace(/bg-|text-|border-/g, 'bg-').split(' ')[0]} ${group.color}` }) }))] }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Hash, { className: "h-4 w-4" }), _jsxs("span", { children: [group.vehicleCount, " vehicle", group.vehicleCount !== 1 ? 's' : ''] })] }), childGroups.length > 0 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Folder, { className: "h-4 w-4" }), _jsxs("span", { children: [childGroups.length, " subgroup", childGroups.length !== 1 ? 's' : ''] })] })), _jsxs("div", { className: "text-xs text-slate-500", children: ["Created ", new Date(group.createdAt).toLocaleDateString()] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleOpenModal(group), children: [_jsx(Edit2, { className: "h-4 w-4 mr-1" }), "Edit"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "text-red-600 hover:text-red-700", onClick: () => handleDelete(group.id), disabled: deleteMutation.isPending, children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Delete"] })] })] })] }), isExpanded && (_jsxs("div", { className: "ml-4 space-y-3 border-l-2 border-slate-200 pl-4", children: [childGroups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold text-slate-700 uppercase", children: "Subgroups" }), childGroups.map((childGroup) => (_jsx(Card, { className: "bg-slate-50", children: _jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx(Folder, { className: "h-4 w-4 text-slate-400 flex-shrink-0" }), _jsx("div", { className: "min-w-0", children: _jsx(CardTitle, { className: "text-sm truncate", children: childGroup.name }) })] }), _jsx(Badge, { variant: "secondary", className: "flex-shrink-0", children: childGroup.vehicleCount })] }) }) }, childGroup.id)))] })), group.vehicleCount > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold text-slate-700 uppercase", children: "Vehicles" }), vehicles.length > 0 ? (_jsx("div", { className: "space-y-2", children: vehicles.map((vehicle) => (_jsx(Card, { className: "bg-slate-50 overflow-hidden", children: _jsx(CardContent, { className: "pt-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "flex items-start justify-between gap-2", children: _jsx("div", { className: "min-w-0 flex-1", children: _jsx("p", { className: "font-medium text-slate-900 truncate", children: vehicle.name }) }) }), _jsxs("div", { className: "text-xs text-slate-600 space-y-0.5", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "VIN:" }), ' ', vehicle.vin] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Plate:" }), ' ', vehicle.licensePlate] })] })] }) }) }, vehicle.id))) })) : (_jsx("p", { className: "text-sm text-slate-500 italic", children: "No vehicles assigned yet" }))] }))] }))] }, group.id));
                }) })), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingGroup ? 'Edit Vehicle Group' : 'Create New Vehicle Group' }), _jsx(DialogDescription, { children: editingGroup
                                        ? 'Update group information and settings'
                                        : 'Create a new vehicle group to organize your fleet' })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Group Name" }), _jsx(Input, { value: formData.name, onChange: (e) => handleFormChange('name', e.target.value), placeholder: "e.g., Delivery Fleet, Service Vehicles" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Description" }), _jsx(Input, { value: formData.description, onChange: (e) => handleFormChange('description', e.target.value), placeholder: "Optional description for this group" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Color" }), _jsx("p", { className: "text-xs text-slate-600 mb-3", children: "Select a color to visually distinguish this group" }), _jsx("div", { className: "grid grid-cols-6 gap-2", children: COLOR_OPTIONS.map((color) => (_jsx("button", { onClick: () => handleColorSelect(color.value), className: `h-8 rounded border-2 transition-transform ${selectedVehicleColor === color.value
                                                    ? 'ring-2 ring-slate-400 scale-110 border-slate-600'
                                                    : 'border-transparent'} ${color.value}`, title: color.label }, color.value))) })] }), groups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Parent Group (Optional)" }), _jsxs("select", { value: formData.parentGroupId || '', onChange: (e) => handleFormChange('parentGroupId', e.target.value), className: "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "None (Root Group)" }), groups
                                                    .filter((g) => g.id !== editingGroup?.id)
                                                    .map((group) => (_jsx("option", { value: group.id, children: group.name }, group.id)))] })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleCloseModal, disabled: upsertMutation.isPending, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: upsertMutation.isPending, children: upsertMutation.isPending
                                        ? 'Saving...'
                                        : editingGroup
                                            ? 'Update Group'
                                            : 'Create Group' })] })] }) })] }));
}
//# sourceMappingURL=VehicleGroupsPage.js.map