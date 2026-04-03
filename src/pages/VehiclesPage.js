import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useVehicleGroups } from '@/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Download, Trash2, Edit2, FileDown, LayoutGrid, List } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { formatSpeed, formatTimeAgo } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
export default function VehiclesPage() {
    const navigate = useNavigate();
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const [activeTab, setActiveTab] = useState('vehicles');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [viewMode, setViewMode] = useState('list');
    // Modal and form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        plate: '',
        vin: '',
        type: 'voiture',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        notes: '',
        driverId: '',
    });
    const { data: vehiclesData, isLoading } = useVehicles({
        page,
        limit: 20,
        status: selectedStatus,
        search: searchTerm,
        type: selectedType || undefined,
        source: selectedSource || undefined,
    });
    const { data: groupsData, isLoading: groupsLoading } = useVehicleGroups();
    // Mutation hooks
    const createVehicle = useCreateVehicle();
    const updateVehicleMutation = useUpdateVehicle(editingVehicle?.id || '');
    const deleteVehicleMutation = useDeleteVehicle(deleteConfirmId || '');
    const allVehicles = vehiclesData?.data || [];
    const groups = groupsData || [];
    // Client-side filtering for type and source (backend may not support these params)
    const vehicles = allVehicles.filter((v) => {
        if (selectedType && v.type !== selectedType)
            return false;
        if (selectedSource) {
            const source = (v.metadata?.source || '').toLowerCase();
            if (source !== selectedSource.toLowerCase())
                return false;
        }
        if (selectedGroup && v.metadata?.groupId !== selectedGroup)
            return false;
        return true;
    });
    const totalPages = vehiclesData?.totalPages || 1;
    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case VehicleStatus.ACTIVE:
                return 'default';
            case VehicleStatus.OFFLINE:
                return 'destructive';
            case VehicleStatus.IDLE:
                return 'secondary';
            default:
                return 'outline';
        }
    };
    const toggleSelectVehicle = (vehicleId) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(vehicleId)) {
            newSelection.delete(vehicleId);
        }
        else {
            newSelection.add(vehicleId);
        }
        setSelectedIds(newSelection);
    };
    const toggleSelectAll = (checked) => {
        if (checked) {
            const allIds = new Set(vehicles.map(v => v.id));
            setSelectedIds(allIds);
        }
        else {
            setSelectedIds(new Set());
        }
    };
    const exportToCSV = () => {
        const headers = ['Nom', 'Plaque', 'Type', 'VIN', 'Statut', 'Vitesse', 'Dernière comm'];
        const rows = vehicles.map(v => [
            v.name,
            v.plate,
            v.type || '-',
            v.vin || '-',
            v.status,
            formatSpeed(v.currentSpeed),
            formatTimeAgo(v.lastCommunication)
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportConducteursCSV = async () => {
        try {
            const response = await apiClient.get(`/api/organizations/${organizationId}/conducteurs`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `conducteurs_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            URL.revokeObjectURL(url);
        }
        catch (error) {
            console.error('Erreur lors de l\'export des conducteurs:', error);
        }
    };
    const openCreateModal = () => {
        setEditingVehicle(null);
        setFormData({ name: '', plate: '', vin: '', type: 'voiture', brand: '', model: '', year: new Date().getFullYear(), notes: '', driverId: '' });
        setIsModalOpen(true);
    };
    const openEditModal = (vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            name: vehicle.name || '',
            plate: vehicle.plate || '',
            vin: vehicle.vin || '',
            type: vehicle.type || 'car',
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            year: vehicle.year || new Date().getFullYear(),
            notes: vehicle.metadata?.notes || '',
            driverId: vehicle.driverId || '',
        });
        setIsModalOpen(true);
    };
    const handleSubmitVehicle = async () => {
        if (!formData.name || !formData.plate)
            return;
        const payload = {
            name: formData.name,
            registrationNumber: formData.plate,
            vin: formData.vin,
            type: formData.type,
            manufacturer: formData.brand,
            model: formData.model,
            year: formData.year || undefined,
            driverId: formData.driverId || undefined,
            features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
        };
        if (editingVehicle) {
            await updateVehicleMutation.mutateAsync(payload);
        }
        else {
            await createVehicle.mutateAsync(payload);
        }
        setIsModalOpen(false);
        setEditingVehicle(null);
    };
    const handleDeleteVehicle = async () => {
        if (!deleteConfirmId)
            return;
        await deleteVehicleMutation.mutateAsync();
        setDeleteConfirmId(null);
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteConfirmId); return n; });
    };
    return (_jsxs("div", { className: "space-y-6 bg-[#0A0A0F] min-h-screen p-6", children: [_jsx("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Catalogue V\u00E9hicules" }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: "Gestion de la flotte Mat\u00E9riel Tech+" })] }) }), _jsx("div", { className: "border-b border-[#1F1F2E]", children: _jsxs("div", { className: "flex gap-8", children: [_jsxs("button", { onClick: () => setActiveTab('vehicles'), className: `py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'vehicles'
                                ? 'border-[#00E5CC] text-[#00E5CC]'
                                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: ["V\u00C9HICULES (", vehicles.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('groups'), className: `py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'groups'
                                ? 'border-[#00E5CC] text-[#00E5CC]'
                                : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: ["GROUPES (", groups.length, ")"] })] }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", onClick: exportToCSV, children: [_jsx(FileDown, { size: 16 }), "V\u00C9HICULES CSV"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", onClick: exportConducteursCSV, children: [_jsx(FileDown, { size: 16 }), "CONDUCTEURS CSV"] }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "R\u00D4LES" }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "AUDIT" }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "ATTRIBUTION" })] }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-[#44445A]", size: 18 }), _jsx(Input, { type: "search", placeholder: "Rechercher par nom ou immatriculation...", value: searchTerm, onChange: (e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }, className: "pl-10 bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] }) }), _jsxs("select", { value: selectedType, onChange: (e) => {
                            setSelectedType(e.target.value);
                            setPage(1);
                        }, className: "rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "", children: "Tous types" }), _jsx("option", { value: "voiture", children: "Voiture" }), _jsx("option", { value: "camion", children: "Camion" }), _jsx("option", { value: "utilitaire", children: "V\u00E9hicule utilitaire" }), _jsx("option", { value: "engin", children: "Engin de chantier" }), _jsx("option", { value: "moto", children: "Moto" }), _jsx("option", { value: "bateau", children: "Bateau" }), _jsx("option", { value: "divers", children: "Divers" })] }), _jsxs("select", { value: selectedGroup, onChange: (e) => {
                            setSelectedGroup(e.target.value);
                            setPage(1);
                        }, className: "rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "", children: "Filtrer par groupe" }), groups.map(group => (_jsx("option", { value: group.id, children: group.name }, group.id)))] }), _jsxs("select", { value: selectedSource, onChange: (e) => {
                            setSelectedSource(e.target.value);
                            setPage(1);
                        }, className: "rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "", children: "Toutes sources" }), _jsx("option", { value: "echoes", children: "ECHOES" }), _jsx("option", { value: "ubiwan", children: "UBIWAN" }), _jsx("option", { value: "keeptrace", children: "KEEPTRACE" })] }), _jsxs("select", { value: selectedStatus, onChange: (e) => {
                            setSelectedStatus(e.target.value);
                            setPage(1);
                        }, className: "rounded-[12px] border border-[#1F1F2E] bg-[#12121A] px-4 py-2 text-sm font-medium text-[#F0F0F5] hover:bg-[#1A1A25]", children: [_jsx("option", { value: "", children: "Tous statuts" }), _jsx("option", { value: "active", children: "ACTIF" }), _jsx("option", { value: "offline", children: "HORS LIGNE" })] }), _jsxs("div", { className: "text-sm font-medium text-[#F0F0F5]", children: [vehicles.length, " r\u00E9sultat", vehicles.length !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", className: "gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]", onClick: () => setViewMode('list'), children: _jsx(List, { size: 16 }) }), _jsx(Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", className: "gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]", onClick: () => setViewMode('grid'), children: _jsx(LayoutGrid, { size: 16 }) })] }), _jsxs(Button, { className: "gap-2 bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold", onClick: openCreateModal, children: [_jsx(Plus, { size: 18 }), "AJOUTER UN TRACEUR"] })] }), activeTab === 'vehicles' && (_jsxs(_Fragment, { children: [isLoading ? (_jsx("div", { className: viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2', children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: `${viewMode === 'grid' ? 'h-48' : 'h-12'} bg-[#12121A]` }, i))) })) : vehicles.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E] text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-[#F0F0F5]", children: "Aucun v\u00E9hicule trouv\u00E9" }) }) })) : viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: vehicles.map((vehicle) => (_jsxs(Card, { className: "bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx(CardTitle, { className: "text-[#F0F0F5] cursor-pointer hover:text-[#00E5CC] transition-colors font-syne", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.name }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: vehicle.plate || 'N/A' })] }), _jsx("input", { type: "checkbox", checked: selectedIds.has(vehicle.id), onChange: () => toggleSelectVehicle(vehicle.id), className: "rounded" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "Type" }), _jsxs("p", { className: "font-medium text-[#F0F0F5] font-mono", children: [vehicle.type === 'voiture' && 'Voiture', vehicle.type === 'camion' && 'Camion', vehicle.type === 'utilitaire' && 'Utilitaire', vehicle.type === 'engin' && 'Engin', vehicle.type === 'moto' && 'Moto', vehicle.type === 'bateau' && 'Bateau', vehicle.type === 'divers' && 'Divers', !['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type || '') && (vehicle.type || 'N/A')] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[#6B6B80]", children: "VIN" }), _jsx("p", { className: "font-medium text-[#F0F0F5] truncate font-mono", children: vehicle.vin ? vehicle.vin.substring(0, 8) : 'N/A' })] })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Badge, { variant: vehicle.status === 'active' ? 'default' : 'destructive', className: vehicle.status === 'active' ? 'bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]' : 'bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]', children: vehicle.status === 'active' ? 'ACTIF' : 'HORS LIGNE' }), _jsx("span", { className: "text-xs text-[#44445A]", children: vehicle.metadata?.source || 'ECHOES' })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]", onClick: () => openEditModal(vehicle), children: [_jsx(Edit2, { size: 14 }), "\u00C9diter"] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]", onClick: () => setDeleteConfirmId(vehicle.id), children: _jsx(Trash2, { size: 14 }) })] })] })] }, vehicle.id))) })) : (_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E] bg-[#0A0A0F]", children: [_jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-[#F0F0F5] w-12", children: _jsx("input", { type: "checkbox", checked: selectedIds.size === vehicles.length && vehicles.length > 0, onChange: (e) => toggleSelectAll(e.target.checked), className: "rounded" }) }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "NOM" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "VIN" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "PLAQUE" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "CAT\u00C9GORIE" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "\u00C9TAT" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "DISPONIBILIT\u00C9" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "SOURCE" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#F0F0F5]", children: "ACTIONS" })] }) }), _jsx("tbody", { className: "divide-y divide-[#1F1F2E]", children: vehicles.map((vehicle) => (_jsxs("tr", { className: "hover:bg-[#1A1A25] transition-colors", children: [_jsx("td", { className: "px-4 py-4 text-sm font-medium text-[#F0F0F5] w-12", children: _jsx("input", { type: "checkbox", checked: selectedIds.has(vehicle.id), onChange: () => toggleSelectVehicle(vehicle.id), className: "rounded" }) }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-[#F0F0F5]", children: _jsx("button", { onClick: () => navigate(`/vehicles/${vehicle.id}`), className: "hover:text-[#00E5CC] hover:underline transition-colors", children: vehicle.name }) }), _jsx("td", { className: "px-6 py-4 text-sm text-[#F0F0F5] font-mono", children: vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-[#F0F0F5] font-mono", children: vehicle.plate || '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-[#F0F0F5] capitalize", children: vehicle.type ? (_jsxs(_Fragment, { children: [vehicle.type === 'voiture' && 'Voiture', vehicle.type === 'camion' && 'Camion', vehicle.type === 'utilitaire' && 'Véhicule utilitaire', vehicle.type === 'engin' && 'Engin de chantier', vehicle.type === 'moto' && 'Moto', vehicle.type === 'bateau' && 'Bateau', vehicle.type === 'divers' && 'Divers', !['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type) && vehicle.type] })) : '—' }), _jsx("td", { className: "px-6 py-4 text-sm", children: vehicle.status === 'active' ? (_jsx("span", { className: "text-[#00E5CC] font-semibold", children: "ACTIF" })) : (_jsx("span", { className: "text-[#6B6B80] font-semibold", children: "HORS LIGNE" })) }), _jsx("td", { className: "px-6 py-4 text-sm", children: vehicle.status === 'active' ? (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00E5CC] bg-opacity-20 text-[#00E5CC]", children: "Disponible" })) : vehicle.status === 'maintenance' ? (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFB547] bg-opacity-20 text-[#FFB547]", children: "En maintenance" })) : (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF4D6A] bg-opacity-20 text-[#FF4D6A]", children: "Indisponible" })) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: "text-[#00E5CC] font-semibold", children: vehicle.metadata?.source || 'ECHOES' }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    openEditModal(vehicle);
                                                                }, title: "Modifier", className: "text-[#F0F0F5] hover:text-[#00E5CC]", children: _jsx(Edit2, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmId(vehicle.id);
                                                                }, title: "Supprimer", className: "text-[#F0F0F5] hover:text-[#FF4D6A]", children: _jsx(Trash2, { size: 16 }) })] }) })] }, vehicle.id))) })] }) }) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-[#F0F0F5]", children: ["Page ", page, " sur ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "Pr\u00E9c\u00E9dent" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: "text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "Suivant" })] })] }))] })), activeTab === 'groups' && (_jsx(_Fragment, { children: groupsLoading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [...Array(3)].map((_, i) => (_jsx(Skeleton, { className: "h-48 bg-[#12121A]" }, i))) })) : groups.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E] text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-[#F0F0F5]", children: "Aucun groupe configur\u00E9" }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: groups.map((group) => (_jsxs(Card, { className: "bg-[#12121A] border-[#1F1F2E] hover:border-[#2A2A3D] transition-all", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-[#F0F0F5] font-syne", children: group.name }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-2", children: group.description || 'Pas de description' })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs(Badge, { variant: "secondary", className: "bg-[#1A1A25] text-[#F0F0F5] border-[#1F1F2E]", children: [group.vehicleCount || 0, " v\u00E9hicules"] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 gap-2 bg-[#1A1A25] border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1E1E2A]", children: [_jsx(Edit2, { size: 14 }), "\u00C9diter"] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-[#FF4D6A] hover:text-[#FF4D6A] hover:bg-[#FF4D6A] hover:bg-opacity-10 bg-[#1A1A25] border-[#1F1F2E]", children: _jsx(Trash2, { size: 14 }) })] })] })] }, group.id))) })) })), selectedIds.size > 0 && (_jsxs("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#12121A] border border-[#1F1F2E] rounded-[12px] shadow-lg p-4 flex items-center gap-4", children: [_jsxs("span", { className: "text-sm font-medium text-[#F0F0F5]", children: [selectedIds.size, " v\u00E9hicules s\u00E9lectionn\u00E9s"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: exportToCSV, className: "gap-2 text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: [_jsx(Download, { size: 16 }), "Exporter"] }), _jsxs(Button, { variant: "destructive", size: "sm", onClick: () => {
                            if (confirm('Supprimer ' + selectedIds.size + ' véhicules ?')) {
                                selectedIds.forEach(id => apiClient.delete(`/api/organizations/${organizationId}/vehicles/${id}`));
                                setSelectedIds(new Set());
                            }
                        }, className: "gap-2 bg-[#FF4D6A] hover:bg-[#E63D5C] text-white", children: [_jsx(Trash2, { size: 16 }), "Supprimer"] })] })), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule' }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: editingVehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à votre flotte' })] }), _jsxs("div", { className: "space-y-4 py-4 max-h-[60vh] overflow-y-auto", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Nom *" }), _jsx(Input, { value: formData.name, onChange: (e) => setFormData(p => ({ ...p, name: e.target.value })), placeholder: "Camion A1", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Immatriculation *" }), _jsx(Input, { value: formData.plate, onChange: (e) => setFormData(p => ({ ...p, plate: e.target.value })), placeholder: "AB-123-CD", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "VIN" }), _jsx(Input, { value: formData.vin, onChange: (e) => setFormData(p => ({ ...p, vin: e.target.value })), placeholder: "WDB1234567F123456", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Type" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData(p => ({ ...p, type: e.target.value })), className: "w-full rounded-[12px] border border-[#1F1F2E] bg-[#12121A] text-[#F0F0F5] px-3 py-2 text-sm", children: [_jsx("option", { value: "voiture", children: "Voiture" }), _jsx("option", { value: "camion", children: "Camion" }), _jsx("option", { value: "utilitaire", children: "V\u00E9hicule utilitaire" }), _jsx("option", { value: "engin", children: "Engin de chantier" }), _jsx("option", { value: "moto", children: "Moto" }), _jsx("option", { value: "bateau", children: "Bateau" }), _jsx("option", { value: "divers", children: "Divers" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Ann\u00E9e" }), _jsx(Input, { type: "number", value: formData.year, onChange: (e) => setFormData(p => ({ ...p, year: parseInt(e.target.value) || 0 })), placeholder: "2024", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Marque" }), _jsx(Input, { value: formData.brand, onChange: (e) => setFormData(p => ({ ...p, brand: e.target.value })), placeholder: "Renault", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Mod\u00E8le" }), _jsx(Input, { value: formData.model, onChange: (e) => setFormData(p => ({ ...p, model: e.target.value })), placeholder: "Master", className: "bg-[#12121A] border-[#1F1F2E] text-[#F0F0F5] placeholder:text-[#44445A] focus:border-[#00E5CC]" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(p => ({ ...p, notes: e.target.value })), placeholder: "Informations suppl\u00E9mentaires...", className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-[12px] text-sm text-[#F0F0F5] bg-[#12121A] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] placeholder:text-[#44445A]", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsModalOpen(false), className: "text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "Annuler" }), _jsx(Button, { onClick: handleSubmitVehicle, disabled: createVehicle.isPending || updateVehicleMutation.isPending, className: "bg-[#00E5CC] hover:bg-[#00CCA6] text-[#0A0A0F] font-semibold", children: (createVehicle.isPending || updateVehicleMutation.isPending) ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Créer' })] })] }) }), _jsx(Dialog, { open: !!deleteConfirmId, onOpenChange: () => setDeleteConfirmId(null), children: _jsxs(DialogContent, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Confirmer la suppression" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "\u00CAtes-vous s\u00FBr de vouloir supprimer ce v\u00E9hicule ? Cette action est irr\u00E9versible." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirmId(null), className: "text-[#F0F0F5] bg-[#1A1A25] border-[#1F1F2E] hover:bg-[#1E1E2A]", children: "Annuler" }), _jsx(Button, { variant: "destructive", onClick: handleDeleteVehicle, disabled: deleteVehicleMutation.isPending, className: "bg-[#FF4D6A] hover:bg-[#E63D5C]", children: deleteVehicleMutation.isPending ? 'Suppression...' : 'Supprimer' })] })] }) })] }));
}
//# sourceMappingURL=VehiclesPage.js.map