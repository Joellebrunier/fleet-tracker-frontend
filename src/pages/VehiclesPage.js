import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Grid2X2, List, MapPin, Clock, Download, Trash2 } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { formatSpeed, formatTimeAgo } from '@/lib/utils';
export default function VehiclesPage() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [page, setPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const { data: vehiclesData, isLoading } = useVehicles({
        page,
        limit: 20,
        status: selectedStatus,
        search: searchTerm,
        groupId: selectedGroup || undefined,
    });
    const vehicles = vehiclesData?.data || [];
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "V\u00E9hicules" }), _jsx("p", { className: "mt-2 text-gray-600", children: "G\u00E9rez et surveillez votre flotte" })] }), _jsxs("div", { className: "flex gap-2", children: [selectedIds.size === 0 && (_jsxs(Button, { variant: "outline", className: "gap-2", onClick: exportToCSV, children: [_jsx(Download, { size: 18 }), "Exporter"] })), _jsxs(Button, { className: "gap-2", children: [_jsx(Plus, { size: 18 }), "Ajouter un v\u00E9hicule"] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-gray-400", size: 18 }), _jsx(Input, { type: "search", placeholder: "Rechercher par nom ou immatriculation...", value: searchTerm, onChange: (e) => {
                                                setSearchTerm(e.target.value);
                                                setPage(1);
                                            }, className: "pl-10" })] }) }), _jsxs("select", { value: selectedGroup, onChange: (e) => {
                                    setSelectedGroup(e.target.value);
                                    setPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Tous les groupes" }), _jsx("option", { value: "group1", children: "Groupe 1" }), _jsx("option", { value: "group2", children: "Groupe 2" }), _jsx("option", { value: "group3", children: "Groupe 3" })] }), _jsxs("select", { value: selectedStatus, onChange: (e) => {
                                    setSelectedStatus(e.target.value);
                                    setPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Tous les statuts" }), _jsx("option", { value: "active", children: "Actif" }), _jsx("option", { value: "offline", children: "Hors ligne" }), _jsx("option", { value: "idle", children: "En veille" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] }), _jsxs("div", { className: "flex gap-2 border-l border-gray-200 pl-4", children: [_jsx(Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('list'), children: _jsx(List, { size: 18 }) }), _jsx(Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('grid'), children: _jsx(Grid2X2, { size: 18 }) })] })] }) }) }), isLoading ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, i) => (_jsx(Skeleton, { className: "h-48" }, i))) })) : vehicles.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-gray-500", children: "Aucun v\u00E9hicule trouv\u00E9" }) }) })) : viewMode === 'list' ? (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "px-4 py-3 text-left text-sm font-semibold text-gray-900 w-12", children: _jsx("input", { type: "checkbox", checked: selectedIds.size === vehicles.length && vehicles.length > 0, onChange: (e) => toggleSelectAll(e.target.checked), className: "rounded" }) }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Nom" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Immatriculation" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "VIN" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Vitesse" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Statut" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Derni\u00E8re MAJ" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: vehicles.map((vehicle) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-4 py-4 text-sm font-medium text-gray-900 w-12", children: _jsx("input", { type: "checkbox", checked: selectedIds.has(vehicle.id), onChange: () => toggleSelectVehicle(vehicle.id), className: "rounded" }) }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.name }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.plate }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.vin ? (vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin) : '-' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 capitalize cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.type }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: formatSpeed(vehicle.currentSpeed) }), _jsx("td", { className: "px-6 py-4 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: _jsx(Badge, { variant: getStatusBadgeVariant(vehicle.status), children: vehicle.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: formatTimeAgo(vehicle.lastCommunication) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            navigate(`/map?vehicleId=${vehicle.id}`);
                                                        }, title: "Localiser sur la carte", children: _jsx(MapPin, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                            e.stopPropagation();
                                                            navigate(`/vehicles/${vehicle.id}?replay=true`);
                                                        }, title: "Afficher l'historique", children: _jsx(Clock, { size: 16 }) })] }) })] }, vehicle.id))) })] }) }) })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: vehicles.map((vehicle) => (_jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-sm text-gray-500", children: vehicle.plate }), vehicle.vin && (_jsxs("p", { className: "text-xs text-gray-400 mt-1", children: ["VIN: ", vehicle.vin.length > 8 ? vehicle.vin.substring(0, 8) + '...' : vehicle.vin] }))] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Type:" }), _jsx("span", { className: "font-medium capitalize", children: vehicle.type })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Vitesse:" }), _jsx("span", { className: "font-medium", children: formatSpeed(vehicle.currentSpeed) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Position:" }), _jsxs("span", { className: "font-medium text-xs", children: [vehicle.currentLat?.toFixed(4), ", ", vehicle.currentLng?.toFixed(4)] })] })] }), _jsxs("div", { className: "border-t border-gray-200 pt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx(Badge, { variant: getStatusBadgeVariant(vehicle.status), children: vehicle.status }), _jsx("span", { className: "text-xs text-gray-500", children: formatTimeAgo(vehicle.lastCommunication) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "flex-1", onClick: (e) => {
                                                        e.stopPropagation();
                                                        navigate(`/map?vehicleId=${vehicle.id}`);
                                                    }, title: "Localiser sur la carte", children: [_jsx(MapPin, { size: 16, className: "mr-2" }), _jsx("span", { className: "text-xs", children: "Carte" })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "flex-1", onClick: (e) => {
                                                        e.stopPropagation();
                                                        navigate(`/vehicles/${vehicle.id}?replay=true`);
                                                    }, title: "Afficher l'historique", children: [_jsx(Clock, { size: 16, className: "mr-2" }), _jsx("span", { className: "text-xs", children: "Historique" })] })] })] })] }) }) }, vehicle.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " sur ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Pr\u00E9c\u00E9dent" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Suivant" })] })] })), selectedIds.size > 0 && (_jsxs("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900", children: [selectedIds.size, " v\u00E9hicules s\u00E9lectionn\u00E9s"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: exportToCSV, className: "gap-2", children: [_jsx(Download, { size: 16 }), "Exporter"] }), _jsxs(Button, { variant: "outline", size: "sm", disabled: true, className: "gap-2 text-red-600", children: [_jsx(Trash2, { size: 16 }), "Supprimer"] })] }))] }));
}
//# sourceMappingURL=VehiclesPage.js.map