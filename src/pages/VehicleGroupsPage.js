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
import { Folder, FolderPlus, ChevronDown, ChevronRight, Hash, Search, Edit2, Trash2, Lock, Users, GripVertical } from 'lucide-react';
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
const DARK_COLOR_OPTIONS = [
    { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Red' },
    { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Orange' },
    { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Amber' },
    { value: 'bg-[rgba(255,181,71,0.12)] text-[#FFB547]', label: 'Yellow' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Lime' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Green' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Emerald' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Teal' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Cyan' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Sky' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Blue' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Indigo' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Violet' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Purple' },
    { value: 'bg-[rgba(0,229,204,0.12)] text-[#00E5CC]', label: 'Fuchsia' },
    { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Pink' },
    { value: 'bg-[rgba(255,77,106,0.12)] text-[#FF4D6A]', label: 'Rose' },
    { value: 'bg-[rgba(107,107,128,0.12)] text-[#6B6B80]', label: 'Slate' },
];
export default function VehicleGroupsPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [selectedGroupForPermissions, setSelectedGroupForPermissions] = useState(null);
    const [selectedGroupForBulkAssign, setSelectedGroupForBulkAssign] = useState(null);
    const [bulkAssignVehicleIds, setBulkAssignVehicleIds] = useState(new Set());
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: DARK_COLOR_OPTIONS[10].value,
    });
    const [selectedVehicleColor, setSelectedVehicleColor] = useState(DARK_COLOR_OPTIONS[10].value);
    const [permissions, setPermissions] = useState({
        admin: false,
        manager: false,
        operator: false,
    });
    const [groupStats, setGroupStats] = useState({});
    const [draggedGroupId, setDraggedGroupId] = useState(null);
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
    // Bulk assign vehicles mutation
    const bulkAssignMutation = useMutation({
        mutationFn: async (data) => {
            const promises = data.vehicleIds.map(vehicleId => apiClient.patch(`/api/organizations/${organizationId}/vehicles/${vehicleId}`, { vehicleGroupId: data.groupId }));
            return Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['groupVehicles', organizationId],
            });
            setBulkAssignVehicleIds(new Set());
            setSelectedGroupForBulkAssign(null);
        },
    });
    const handleOpenModal = (group) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name,
                description: group.description || '',
                color: group.color || DARK_COLOR_OPTIONS[10].value,
                parentGroupId: group.parentGroupId,
            });
            setSelectedVehicleColor(group.color || DARK_COLOR_OPTIONS[10].value);
        }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
        setFormData({
            name: '',
            description: '',
            color: DARK_COLOR_OPTIONS[10].value,
        });
        setSelectedVehicleColor(DARK_COLOR_OPTIONS[10].value);
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
        if (confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
            await deleteMutation.mutateAsync(groupId);
        }
    };
    const handleBulkAssignVehicles = async () => {
        if (!selectedGroupForBulkAssign || bulkAssignVehicleIds.size === 0)
            return;
        await bulkAssignMutation.mutateAsync({
            groupId: selectedGroupForBulkAssign,
            vehicleIds: Array.from(bulkAssignVehicleIds),
        });
    };
    const toggleExpandedGroup = (groupId) => {
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
    // Calculate mock statistics for a group
    const getGroupStats = (groupId) => {
        if (groupStats[groupId])
            return groupStats[groupId];
        return {
            totalKmToday: Math.floor(Math.random() * 500),
            activeVehicles: Math.floor(Math.random() * 10),
            alertCount: Math.floor(Math.random() * 5),
            avgSpeed: Math.floor(Math.random() * 80 + 20),
        };
    };
    return (_jsxs("div", { className: "space-y-6 p-6 bg-[#0A0A0F] min-h-screen", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Groupes de v\u00E9hicules" }), _jsx("p", { className: "mt-1 text-sm text-[#6B6B80]", children: "Organisez les v\u00E9hicules de votre flotte en groupes hi\u00E9rarchiques et g\u00E9rez les attributions" })] }), _jsxs(Button, { onClick: () => handleOpenModal(), className: "flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: [_jsx(FolderPlus, { className: "h-4 w-4" }), "Nouveau groupe"] })] }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-[#6B6B80]" }), _jsx(Input, { placeholder: "Rechercher des groupes...", className: "pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), isLoading ? (_jsx("div", { className: "space-y-4", children: [...Array(4)].map((_, i) => (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-2/3 bg-[#1A1A25]" }) }), _jsx(CardContent, { children: _jsx(Skeleton, { className: "h-4 w-full bg-[#1A1A25]" }) })] }, i))) })) : error ? (_jsx(Card, { className: "border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-[#FF4D6A]", children: "Failed to load vehicle groups" }) }) })) : filteredGroups.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Folder, { className: "mb-4 h-12 w-12 text-[#44445A]" }), _jsx("p", { className: "text-[#6B6B80]", children: searchQuery
                                ? 'Aucun groupe ne correspond à votre recherche'
                                : 'Aucun groupe de véhicules. Créez-en un pour organiser votre flotte.' })] }) })) : (_jsx("div", { className: "space-y-4", children: filteredGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const childGroups = getChildGroups(group.id);
                    const vehicles = groupVehicles[group.id] || [];
                    const stats = getGroupStats(group.id);
                    return (_jsxs("div", { className: "space-y-2", children: [_jsxs(Card, { className: "overflow-hidden transition-shadow hover:shadow-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex items-start gap-3 flex-1 min-w-0", children: [_jsx("button", { onMouseDown: () => setDraggedGroupId(group.id), className: "mt-1 p-0 text-[#6B6B80] hover:text-[#F0F0F5] cursor-grab active:cursor-grabbing flex-shrink-0", children: _jsx(GripVertical, { className: "h-5 w-5" }) }), (childGroups.length > 0 || group.vehicleCount > 0) && (_jsx("button", { onClick: () => toggleExpandedGroup(group.id), className: "mt-1 p-0 text-[#6B6B80] hover:text-[#F0F0F5] flex-shrink-0", children: isExpanded ? (_jsx(ChevronDown, { className: "h-5 w-5" })) : (_jsx(ChevronRight, { className: "h-5 w-5" })) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Folder, { className: "h-5 w-5 text-[#44445A] flex-shrink-0" }), _jsx(CardTitle, { className: "truncate font-syne text-[#F0F0F5]", children: group.name })] }), group.description && (_jsx("p", { className: "text-sm text-[#6B6B80] line-clamp-2", children: group.description }))] })] }), group.color && (_jsx("div", { className: "flex-shrink-0", children: _jsx("div", { className: `h-8 w-8 rounded-full border-2 border-[#1F1F2E] ${DARK_COLOR_OPTIONS[10].value}` }) }))] }) }), _jsxs(CardContent, { className: "pt-0", children: [_jsxs("div", { className: "grid grid-cols-4 gap-2 mb-4 p-3 bg-[#0A0A0F] rounded-[8px] border border-[#1F1F2E]", children: [_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Km aujourd'hui" }), _jsx("p", { className: "text-sm font-semibold text-[#00E5CC]", children: stats.totalKmToday })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Actifs" }), _jsx("p", { className: "text-sm font-semibold text-[#00E5CC]", children: stats.activeVehicles })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Alertes" }), _jsx("p", { className: "text-sm font-semibold text-[#FF4D6A]", children: stats.alertCount })] }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Vit. moy." }), _jsxs("p", { className: "text-sm font-semibold text-[#FFB547]", children: [stats.avgSpeed, " km/h"] })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3 text-sm text-[#6B6B80] mb-4", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Hash, { className: "h-4 w-4" }), _jsxs("span", { children: [group.vehicleCount, " v\u00E9hicule", group.vehicleCount !== 1 ? 's' : ''] })] }), childGroups.length > 0 && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Folder, { className: "h-4 w-4" }), _jsxs("span", { children: [childGroups.length, " sous-groupe", childGroups.length !== 1 ? 's' : ''] })] })), _jsxs("div", { className: "text-xs text-[#44445A]", children: ["Cr\u00E9\u00E9 le ", new Date(group.createdAt).toLocaleDateString('fr-FR')] })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleOpenModal(group), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: [_jsx(Edit2, { className: "h-4 w-4 mr-1" }), "Modifier"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSelectedGroupForPermissions(group), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: [_jsx(Lock, { className: "h-4 w-4 mr-1" }), "Permissions"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSelectedGroupForBulkAssign(group.id), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: [_jsx(Users, { className: "h-4 w-4 mr-1" }), "Ajouter v\u00E9hicules"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#FF4D6A] hover:bg-[#2A2A3D]", onClick: () => handleDelete(group.id), disabled: deleteMutation.isPending, children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Supprimer"] })] })] })] }), isExpanded && (_jsxs("div", { className: "ml-4 space-y-3 border-l-2 border-[#1F1F2E] pl-4", children: [childGroups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold text-[#6B6B80] uppercase", children: "Sous-groupes" }), childGroups.map((childGroup) => (_jsx(Card, { className: "bg-[#0A0A0F] border border-[#1F1F2E] rounded-[12px]", children: _jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx(Folder, { className: "h-4 w-4 text-[#44445A] flex-shrink-0" }), _jsx("div", { className: "min-w-0", children: _jsx(CardTitle, { className: "text-sm truncate font-syne text-[#F0F0F5]", children: childGroup.name }) })] }), _jsx(Badge, { variant: "secondary", className: "flex-shrink-0 bg-[rgba(0,229,204,0.12)] text-[#00E5CC]", children: childGroup.vehicleCount })] }) }) }, childGroup.id)))] })), group.vehicleCount > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-xs font-semibold text-[#6B6B80] uppercase", children: "V\u00E9hicules" }), vehicles.length > 0 ? (_jsx("div", { className: "space-y-2", children: vehicles.map((vehicle) => (_jsx(Card, { className: "bg-[#0A0A0F] border border-[#1F1F2E] rounded-[12px] overflow-hidden", children: _jsx(CardContent, { className: "pt-3", children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "flex items-start justify-between gap-2", children: _jsx("div", { className: "min-w-0 flex-1", children: _jsx("p", { className: "font-medium text-[#F0F0F5] truncate", children: vehicle.name }) }) }), _jsxs("div", { className: "text-xs text-[#6B6B80] space-y-0.5", children: [_jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "VIN:" }), ' ', vehicle.vin] }), _jsxs("div", { children: [_jsx("span", { className: "font-semibold", children: "Immatriculation:" }), ' ', vehicle.licensePlate] })] })] }) }) }, vehicle.id))) })) : (_jsx("p", { className: "text-sm text-[#44445A] italic", children: "Aucun v\u00E9hicule assign\u00E9 pour le moment" }))] }))] }))] }, group.id));
                }) })), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: editingGroup ? 'Modifier le groupe de véhicules' : 'Créer un nouveau groupe de véhicules' }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: editingGroup
                                        ? 'Mettez à jour les informations et paramètres du groupe'
                                        : 'Créez un nouveau groupe de véhicules pour organiser votre flotte' })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Nom du groupe" }), _jsx(Input, { value: formData.name, onChange: (e) => handleFormChange('name', e.target.value), placeholder: "Ex: Flotte de livraison, V\u00E9hicules de service", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Description" }), _jsx(Input, { value: formData.description, onChange: (e) => handleFormChange('description', e.target.value), placeholder: "Description optionnelle pour ce groupe", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Couleur" }), _jsx("p", { className: "text-xs text-[#6B6B80] mb-3", children: "Choisissez une couleur pour distinguer visuellement ce groupe" }), _jsx("div", { className: "grid grid-cols-6 gap-2", children: DARK_COLOR_OPTIONS.map((color, idx) => (_jsx("button", { onClick: () => handleColorSelect(color.value), className: `h-8 rounded border-2 transition-transform ${selectedVehicleColor === color.value
                                                    ? 'ring-2 ring-[#00E5CC] scale-110 border-[#00E5CC]'
                                                    : 'border-[#1F1F2E]'} ${color.value}`, title: color.label }, idx))) })] }), groups.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Groupe parent (Optionnel)" }), _jsxs("select", { value: formData.parentGroupId || '', onChange: (e) => handleFormChange('parentGroupId', e.target.value), className: "w-full rounded-[8px] border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]", children: [_jsx("option", { value: "", children: "Aucun (Groupe racine)" }), groups
                                                    .filter((g) => g.id !== editingGroup?.id)
                                                    .map((group) => (_jsx("option", { value: group.id, children: group.name }, group.id)))] })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleCloseModal, disabled: upsertMutation.isPending, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleSubmit, disabled: upsertMutation.isPending, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: upsertMutation.isPending
                                        ? 'Enregistrement...'
                                        : editingGroup
                                            ? 'Mettre à jour le groupe'
                                            : 'Créer le groupe' })] })] }) }), _jsx(Dialog, { open: !!selectedGroupForPermissions, onOpenChange: () => setSelectedGroupForPermissions(null), children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Permissions du groupe" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: selectedGroupForPermissions?.name })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsx("p", { className: "text-sm text-[#F0F0F5]", children: "R\u00F4les autoris\u00E9s \u00E0 acc\u00E9der \u00E0 ce groupe:" }), _jsx("div", { className: "space-y-3", children: [
                                        { key: 'admin', label: 'Administrateur' },
                                        { key: 'manager', label: 'Responsable' },
                                        { key: 'operator', label: 'Opérateur' },
                                    ].map(role => (_jsxs("label", { className: "flex items-center gap-3 cursor-pointer p-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-[8px] hover:border-[#00E5CC] transition-colors", children: [_jsx("input", { type: "checkbox", checked: permissions[role.key], onChange: (e) => setPermissions({
                                                    ...permissions,
                                                    [role.key]: e.target.checked,
                                                }), className: "rounded" }), _jsx("span", { className: "text-[#F0F0F5]", children: role.label })] }, role.key))) })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setSelectedGroupForPermissions(null), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Fermer" }), _jsx(Button, { onClick: () => setSelectedGroupForPermissions(null), className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: "Enregistrer" })] })] }) }), _jsx(Dialog, { open: !!selectedGroupForBulkAssign, onOpenChange: () => setSelectedGroupForBulkAssign(null), children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Ajouter des v\u00E9hicules au groupe" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "S\u00E9lectionnez les v\u00E9hicules \u00E0 ajouter au groupe" })] }), _jsx("div", { className: "space-y-4 py-4 max-h-[60vh] overflow-y-auto", children: _jsx("div", { className: "space-y-2", children: groups.find(g => g.id === selectedGroupForBulkAssign)?.id && (_jsx("div", { className: "grid grid-cols-1 gap-2", children: [...Array(5)].map((_, i) => (_jsxs("label", { className: "flex items-center gap-3 cursor-pointer p-3 bg-[#0A0A0F] border border-[#1F1F2E] rounded-[8px] hover:border-[#00E5CC] transition-colors", children: [_jsx("input", { type: "checkbox", checked: bulkAssignVehicleIds.has(`vehicle-${i}`), onChange: (e) => {
                                                    const newIds = new Set(bulkAssignVehicleIds);
                                                    if (e.target.checked) {
                                                        newIds.add(`vehicle-${i}`);
                                                    }
                                                    else {
                                                        newIds.delete(`vehicle-${i}`);
                                                    }
                                                    setBulkAssignVehicleIds(newIds);
                                                }, className: "rounded" }), _jsxs("span", { className: "text-[#F0F0F5]", children: ["V\u00E9hicule ", i + 1] })] }, i))) })) }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setSelectedGroupForBulkAssign(null), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleBulkAssignVehicles, disabled: bulkAssignMutation.isPending || bulkAssignVehicleIds.size === 0, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: bulkAssignMutation.isPending
                                        ? 'Assignation...'
                                        : `Ajouter ${bulkAssignVehicleIds.size} véhicule(s)` })] })] }) })] }));
}
//# sourceMappingURL=VehicleGroupsPage.js.map