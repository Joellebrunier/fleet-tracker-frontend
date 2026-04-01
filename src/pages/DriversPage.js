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
import { UserCircle, Plus, Search, Phone, Mail, Car, Shield, Star, Edit2, Trash2 } from 'lucide-react';
export default function DriversPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
    });
    // Generate deterministic performance scores based on driver ID
    const getPerformanceScore = (driverId) => {
        let hash = 0;
        for (let i = 0; i < driverId.length; i++) {
            hash = ((hash << 5) - hash) + driverId.charCodeAt(i);
            hash |= 0;
        }
        const abs = Math.abs(hash);
        return {
            safety: 60 + (abs % 35),
            efficiency: 55 + ((abs >> 4) % 40),
            punctuality: 65 + ((abs >> 8) % 30),
        };
    };
    // Mock driver statuses
    const driverStatuses = {};
    // Fetch drivers
    const { data: drivers = [], isLoading, error } = useQuery({
        queryKey: ['drivers', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            const response = await apiClient.get(`/api/organizations/${organizationId}/drivers`);
            return response.data;
        },
        enabled: !!organizationId,
    });
    // Create/Update driver mutation
    const upsertMutation = useMutation({
        mutationFn: async (data) => {
            if (editingDriver) {
                return await apiClient.put(`/api/organizations/${organizationId}/drivers/${editingDriver.id}`, data);
            }
            return await apiClient.post(`/api/organizations/${organizationId}/drivers`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers', organizationId] });
            handleCloseModal();
        },
    });
    // Delete driver mutation
    const deleteMutation = useMutation({
        mutationFn: async (driverId) => {
            return await apiClient.delete(`/api/organizations/${organizationId}/drivers/${driverId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['drivers', organizationId] });
        },
    });
    const handleOpenModal = (driver) => {
        if (driver) {
            setEditingDriver(driver);
            setFormData({
                firstName: driver.firstName,
                lastName: driver.lastName,
                email: driver.email,
                phone: driver.phone,
                licenseNumber: driver.licenseNumber,
                licenseExpiry: new Date(driver.licenseExpiry)
                    .toISOString()
                    .split('T')[0],
                assignedVehicleId: driver.assignedVehicleId,
            });
        }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDriver(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            licenseNumber: '',
            licenseExpiry: '',
        });
    };
    const handleFormChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);
    const handleSubmit = async () => {
        if (!formData.firstName ||
            !formData.lastName ||
            !formData.email ||
            !formData.phone ||
            !formData.licenseNumber ||
            !formData.licenseExpiry) {
            return;
        }
        await upsertMutation.mutateAsync({
            ...formData,
            licenseExpiry: new Date(formData.licenseExpiry).toISOString(),
        });
    };
    const handleDelete = async (driverId) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce conducteur ?')) {
            await deleteMutation.mutateAsync(driverId);
        }
    };
    // Filter and search drivers
    const filteredDrivers = drivers.filter((driver) => {
        const matchesSearch = driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.phone.includes(searchQuery);
        if (statusFilter === 'all')
            return matchesSearch;
        const status = driverStatuses[driver.id] || 'active';
        return matchesSearch && status === statusFilter;
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'default';
            case 'inactive':
                return 'secondary';
            case 'on_leave':
                return 'outline';
            default:
                return 'default';
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return 'Actif';
            case 'inactive':
                return 'Inactif';
            case 'on_leave':
                return 'En congé';
            default:
                return 'Unknown';
        }
    };
    return (_jsxs("div", { className: "space-y-6 p-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900", children: "Conducteurs" }), _jsx("p", { className: "mt-1 text-sm text-slate-600", children: "G\u00E9rez les conducteurs de votre flotte et leurs performances" })] }), _jsxs(Button, { onClick: () => handleOpenModal(), className: "flex items-center gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Ajouter un conducteur"] })] }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-slate-400" }), _jsx(Input, { placeholder: "Rechercher par nom, email ou t\u00E9l\u00E9phone...", className: "pl-10", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'active', 'inactive', 'on_leave'].map((status) => (_jsx(Button, { variant: statusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setStatusFilter(status), className: "capitalize", children: status === 'all' ? 'Tous' : getStatusLabel(status) }, status))) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900", children: drivers.length }), _jsx("p", { className: "text-xs text-gray-500", children: "Total conducteurs" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-green-600", children: drivers.filter(d => (driverStatuses[d.id] || 'active') === 'active').length }), _jsx("p", { className: "text-xs text-gray-500", children: "Actifs" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-yellow-600", children: drivers.filter(d => new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length }), _jsx("p", { className: "text-xs text-gray-500", children: "Permis expirant bient\u00F4t" })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-blue-600", children: drivers.filter(d => d.assignedVehicleId).length }), _jsx("p", { className: "text-xs text-gray-500", children: "V\u00E9hicule assign\u00E9" })] }) })] }), isLoading ? (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, i) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-2/3" }) }), _jsxs(CardContent, { children: [_jsx(Skeleton, { className: "h-4 w-full" }), _jsx(Skeleton, { className: "mt-2 h-4 w-3/4" })] })] }, i))) })) : error ? (_jsx(Card, { className: "border-red-200 bg-red-50", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-red-800", children: "Erreur de chargement des conducteurs" }) }) })) : filteredDrivers.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(UserCircle, { className: "mb-4 h-12 w-12 text-slate-300" }), _jsx("p", { className: "text-slate-600", children: searchQuery || statusFilter !== 'all'
                                ? 'Aucun conducteur ne correspond à votre recherche'
                                : 'Aucun conducteur. Créez-en un pour commencer.' })] }) })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredDrivers.map((driver) => {
                    const status = driverStatuses[driver.id] || 'active';
                    const performance = getPerformanceScore(driver.id);
                    const licenseDate = new Date(driver.licenseExpiry);
                    const now = new Date();
                    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    const licenseExpired = licenseDate < now;
                    const licenseExpiringSoon = licenseDate < thirtyDaysFromNow && licenseDate >= now;
                    return (_jsxs(Card, { className: "flex flex-col overflow-hidden transition-shadow hover:shadow-md", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx(UserCircle, { className: "h-10 w-10 text-slate-400 flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs(CardTitle, { className: "truncate", children: [driver.firstName, " ", driver.lastName] }), _jsx(Badge, { variant: getStatusColor(status), className: "mt-2 capitalize", children: getStatusLabel(status) })] })] }) }) }), _jsxs(CardContent, { className: "flex-1 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx(Mail, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { className: "truncate", children: driver.email })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx(Phone, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { children: driver.phone })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700", children: [_jsx(Shield, { className: "h-4 w-4" }), "Permis"] }), _jsxs("div", { className: "space-y-1 text-sm text-slate-600", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Num\u00E9ro :" }), ' ', driver.licenseNumber] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: "Expire :" }), _jsx("span", { className: licenseExpired
                                                                    ? 'text-red-600 font-semibold'
                                                                    : 'text-slate-600', children: new Date(driver.licenseExpiry).toLocaleDateString() }), licenseExpired && (_jsx(Badge, { variant: "destructive", className: "text-xs", children: "Expir\u00E9" })), licenseExpiringSoon && (_jsx(Badge, { variant: "secondary", className: "text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100", children: "Expire bient\u00F4t" }))] })] })] }), driver.assignedVehicleId && (_jsx("div", { className: "border-t border-slate-200 pt-3", children: _jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600", children: [_jsx(Car, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { children: "V\u00E9hicule assign\u00E9" })] }) })), _jsxs("div", { className: "border-t border-slate-200 pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold text-slate-700", children: [_jsx(Star, { className: "h-4 w-4" }), "Performance"] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-slate-600", children: "S\u00E9curit\u00E9" }), _jsxs("span", { className: "font-semibold text-slate-900", children: [performance.safety, "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-green-500", style: { width: `${performance.safety}%` } }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-slate-600", children: "Efficacit\u00E9" }), _jsxs("span", { className: "font-semibold text-slate-900", children: [performance.efficiency, "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-blue-500", style: { width: `${performance.efficiency}%` } }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-slate-600", children: "Ponctualit\u00E9" }), _jsxs("span", { className: "font-semibold text-slate-900", children: [performance.punctuality, "%"] })] }), _jsx("div", { className: "h-1.5 bg-slate-200 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-purple-500", style: { width: `${performance.punctuality}%` } }) })] })] })] }), _jsxs("div", { className: "border-t border-slate-200 px-6 py-3 flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1", onClick: () => handleOpenModal(driver), children: [_jsx(Edit2, { className: "h-4 w-4 mr-1" }), "Modifier"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 text-red-600 hover:text-red-700", onClick: () => handleDelete(driver.id), disabled: deleteMutation.isPending, children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Supprimer"] })] })] }, driver.id));
                }) })), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingDriver ? 'Modifier le conducteur' : 'Nouveau conducteur' }), _jsx(DialogDescription, { children: editingDriver
                                        ? 'Mettre à jour les informations du conducteur'
                                        : 'Ajouter un nouveau conducteur à votre flotte' })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Pr\u00E9nom" }), _jsx(Input, { value: formData.firstName, onChange: (e) => handleFormChange('firstName', e.target.value), placeholder: "Jean" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Nom" }), _jsx(Input, { value: formData.lastName, onChange: (e) => handleFormChange('lastName', e.target.value), placeholder: "Dupont" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Email" }), _jsx(Input, { type: "email", value: formData.email, onChange: (e) => handleFormChange('email', e.target.value), placeholder: "john@example.com" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "T\u00E9l\u00E9phone" }), _jsx(Input, { type: "tel", value: formData.phone, onChange: (e) => handleFormChange('phone', e.target.value), placeholder: "+33 (1) 23 45 67 89" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "N\u00B0 de permis" }), _jsx(Input, { value: formData.licenseNumber, onChange: (e) => handleFormChange('licenseNumber', e.target.value), placeholder: "DL123456789" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700", children: "Date d'expiration" }), _jsx(Input, { type: "date", value: formData.licenseExpiry, onChange: (e) => handleFormChange('licenseExpiry', e.target.value) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleCloseModal, disabled: upsertMutation.isPending, children: "Annuler" }), _jsx(Button, { onClick: handleSubmit, disabled: upsertMutation.isPending, children: upsertMutation.isPending
                                        ? 'Enregistrement...'
                                        : editingDriver
                                            ? 'Mettre à jour'
                                            : 'Créer' })] })] }) })] }));
}
//# sourceMappingURL=DriversPage.js.map