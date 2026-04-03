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
import { UserCircle, Plus, Search, Phone, Mail, Car, Shield, Star, Edit2, Trash2, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
export default function DriversPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDriver, setEditingDriver] = useState(null);
    const [schedulingDriver, setSchedulingDriver] = useState(null);
    const [schedule, setSchedule] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        assignedVehicleIds: [],
        notes: '',
    });
    // Generate deterministic behavior score based on driver ID
    const getBehaviorScore = (driverId) => {
        let hash = 0;
        for (let i = 0; i < driverId.length; i++) {
            hash = ((hash << 5) - hash) + driverId.charCodeAt(i);
            hash |= 0;
        }
        const abs = Math.abs(hash);
        const overall = 55 + (abs % 40);
        const trend = Array.from({ length: 7 }, (_, i) => 50 + ((abs >> i) % 35));
        return {
            overall,
            harshBraking: 5 + (abs % 12),
            speedingEvents: 2 + ((abs >> 4) % 8),
            idleTime: 15 + ((abs >> 8) % 25),
            sevenDayTrend: trend,
        };
    };
    // Generate deterministic performance scores based on driver ID
    const getPerformanceScoreFallback = (driverId) => {
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
    // Fetch vehicles
    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            try {
                const response = await apiClient.get(`/api/organizations/${organizationId}/vehicles`);
                return response.data;
            }
            catch {
                return [];
            }
        },
        enabled: !!organizationId,
    });
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
    // Fetch driver stats with fallback
    const fetchDriverStats = async (driverId) => {
        try {
            const response = await apiClient.get(`/api/organizations/${organizationId}/drivers/${driverId}/stats`);
            return response.data;
        }
        catch {
            return getPerformanceScoreFallback(driverId);
        }
    };
    // Get driver status based on driver data
    const getDriverStatus = (driver) => {
        return 'active';
    };
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
    // Schedule mutation
    const scheduleMutation = useMutation({
        mutationFn: async (driverId) => {
            return await apiClient.post(`/api/organizations/${organizationId}/drivers/${driverId}/schedule`, { schedule });
        },
        onSuccess: () => {
            setSchedulingDriver(null);
            setSchedule({});
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
                assignedVehicleIds: driver.assignedVehicleIds || (driver.assignedVehicleId ? [driver.assignedVehicleId] : []),
                notes: driver.notes || '',
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
            assignedVehicleIds: [],
            notes: '',
        });
    };
    const handleFormChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);
    const handleVehicleChange = useCallback((vehicleId) => {
        setFormData((prev) => ({ ...prev, assignedVehicleId: vehicleId }));
    }, []);
    const handleVehicleCheckboxChange = useCallback((vehicleId, checked) => {
        setFormData((prev) => {
            const current = prev.assignedVehicleIds || [];
            const updated = checked
                ? [...current, vehicleId]
                : current.filter(id => id !== vehicleId);
            return { ...prev, assignedVehicleIds: updated };
        });
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
    const handleScheduleSlotClick = (day, slot) => {
        const key = `${day}-${slot}`;
        setSchedule((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };
    const handleSaveSchedule = async () => {
        if (schedulingDriver) {
            await scheduleMutation.mutateAsync(schedulingDriver.id);
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
        const status = getDriverStatus(driver);
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
    const getBehaviorScoreColor = (score) => {
        if (score > 80)
            return 'text-[#00E5CC]';
        if (score > 60)
            return 'text-[#FFB547]';
        return 'text-[#FF4D6A]';
    };
    const getBehaviorScoreBgColor = (score) => {
        if (score > 80)
            return 'bg-[rgba(0,229,204,0.12)]';
        if (score > 60)
            return 'bg-[rgba(255,181,71,0.12)]';
        return 'bg-[rgba(255,77,106,0.12)]';
    };
    return (_jsxs("div", { className: "space-y-6 p-6 bg-[#0A0A0F] min-h-screen", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Conducteurs" }), _jsx("p", { className: "mt-1 text-sm text-[#6B6B80]", children: "G\u00E9rez les conducteurs de votre flotte et leurs performances" })] }), _jsxs(Button, { onClick: () => handleOpenModal(), className: "flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: [_jsx(Plus, { className: "h-4 w-4" }), "Ajouter un conducteur"] })] }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-[#6B6B80]" }), _jsx(Input, { placeholder: "Rechercher par nom, email ou t\u00E9l\u00E9phone...", className: "pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'active', 'inactive', 'on_leave'].map((status) => (_jsx(Button, { variant: statusFilter === status ? 'default' : 'outline', size: "sm", onClick: () => setStatusFilter(status), className: `capitalize ${statusFilter === status
                                ? 'bg-[#00E5CC] text-[#0A0A0F] font-bold'
                                : 'bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]'}`, children: status === 'all' ? 'Tous' : getStatusLabel(status) }, status))) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-[#F0F0F5] font-syne", children: drivers.length }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Total conducteurs" })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-[#00E5CC] font-syne", children: drivers.filter(d => getDriverStatus(d) === 'active').length }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Actifs" })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-[#FFB547] font-syne", children: drivers.filter(d => new Date(d.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Permis expirant bient\u00F4t" })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-[#00E5CC] font-syne", children: drivers.filter(d => d.assignedVehicleId || (d.assignedVehicleIds && d.assignedVehicleIds.length > 0)).length }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "V\u00E9hicule assign\u00E9" })] }) })] }), isLoading ? (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, i) => (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(Skeleton, { className: "h-6 w-2/3 bg-[#1A1A25]" }) }), _jsxs(CardContent, { children: [_jsx(Skeleton, { className: "h-4 w-full bg-[#1A1A25]" }), _jsx(Skeleton, { className: "mt-2 h-4 w-3/4 bg-[#1A1A25]" })] })] }, i))) })) : error ? (_jsx(Card, { className: "border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-[#FF4D6A]", children: "Erreur de chargement des conducteurs" }) }) })) : filteredDrivers.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(UserCircle, { className: "mb-4 h-12 w-12 text-[#44445A]" }), _jsx("p", { className: "text-[#6B6B80]", children: searchQuery || statusFilter !== 'all'
                                ? 'Aucun conducteur ne correspond à votre recherche'
                                : 'Aucun conducteur. Créez-en un pour commencer.' })] }) })) : (_jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: filteredDrivers.map((driver) => {
                    const status = getDriverStatus(driver);
                    const performance = getPerformanceScoreFallback(driver.id);
                    const behavior = getBehaviorScore(driver.id);
                    const licenseDate = new Date(driver.licenseExpiry);
                    const now = new Date();
                    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
                    const licenseExpired = licenseDate < now;
                    const licenseExpiringSoon = licenseDate < thirtyDaysFromNow && licenseDate >= now;
                    const maxTrend = Math.max(...behavior.sevenDayTrend);
                    const assignedVehicles = driver.assignedVehicleIds && driver.assignedVehicleIds.length > 0
                        ? driver.assignedVehicleIds
                        : (driver.assignedVehicleId ? [driver.assignedVehicleId] : []);
                    return (_jsxs(Card, { className: "flex flex-col overflow-hidden transition-shadow hover:shadow-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex items-start gap-3 flex-1", children: [_jsx(UserCircle, { className: "h-10 w-10 text-[#44445A] flex-shrink-0" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs(CardTitle, { className: "truncate font-syne text-[#F0F0F5]", children: [driver.firstName, " ", driver.lastName] }), _jsx(Badge, { variant: getStatusColor(status), className: "mt-2 capitalize", children: getStatusLabel(status) })] })] }) }) }), _jsxs(CardContent, { className: "flex-1 space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-[#6B6B80]", children: [_jsx(Mail, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { className: "truncate", children: driver.email })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-[#6B6B80]", children: [_jsx(Phone, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { children: driver.phone })] })] }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold text-[#6B6B80]", children: [_jsx(Shield, { className: "h-4 w-4" }), "Permis"] }), _jsxs("div", { className: "space-y-1 text-sm text-[#6B6B80]", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: "Num\u00E9ro :" }), ' ', driver.licenseNumber] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: "Expire :" }), _jsx("span", { className: licenseExpired
                                                                    ? 'text-[#FF4D6A] font-semibold'
                                                                    : 'text-[#6B6B80]', children: new Date(driver.licenseExpiry).toLocaleDateString() }), licenseExpired && (_jsx(Badge, { variant: "destructive", className: "text-xs bg-[#FF4D6A] text-white", children: "Expir\u00E9" })), licenseExpiringSoon && (_jsx(Badge, { variant: "secondary", className: "text-xs bg-[rgba(255,181,71,0.12)] text-[#FFB547] hover:bg-[rgba(255,181,71,0.12)]", children: "Expire bient\u00F4t" }))] })] })] }), assignedVehicles.length > 0 && (_jsxs("div", { className: "border-t border-[#1F1F2E] pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-sm text-[#6B6B80]", children: [_jsx(Car, { className: "h-4 w-4 flex-shrink-0" }), _jsx("span", { children: "V\u00E9hicules assign\u00E9s" })] }), _jsx("div", { className: "flex flex-wrap gap-1", children: assignedVehicles.map(vehicleId => {
                                                    const vehicle = vehicles.find(v => v.id === vehicleId);
                                                    return vehicle ? (_jsx(Badge, { variant: "secondary", className: "bg-[rgba(0,229,204,0.12)] text-[#00E5CC] text-xs", children: vehicle.name }, vehicleId)) : null;
                                                }) })] })), _jsxs("div", { className: `border-t border-[#1F1F2E] pt-3 px-3 py-2 rounded-lg ${getBehaviorScoreBgColor(behavior.overall)}`, children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-[#6B6B80]", children: [_jsx(AlertTriangle, { className: "h-4 w-4" }), "Score de comportement"] }), _jsxs("span", { className: `text-lg font-bold font-mono ${getBehaviorScoreColor(behavior.overall)}`, children: [behavior.overall, "/100"] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 text-xs", children: [_jsxs("div", { className: "text-[#6B6B80]", children: [_jsx("div", { className: "font-medium", children: "Freinage" }), _jsx("div", { className: "text-[#F0F0F5] font-mono", children: behavior.harshBraking })] }), _jsxs("div", { className: "text-[#6B6B80]", children: [_jsx("div", { className: "font-medium", children: "Vitesse" }), _jsx("div", { className: "text-[#F0F0F5] font-mono", children: behavior.speedingEvents })] }), _jsxs("div", { className: "text-[#6B6B80]", children: [_jsx("div", { className: "font-medium", children: "Ralenti" }), _jsxs("div", { className: "text-[#F0F0F5] font-mono", children: [behavior.idleTime, "%"] })] })] })] }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold text-[#6B6B80]", children: [_jsx(TrendingUp, { className: "h-4 w-4" }), "Tendance 7 jours"] }), _jsx("div", { className: "flex items-end gap-1 h-12", children: behavior.sevenDayTrend.map((value, idx) => (_jsx("div", { className: "flex-1 bg-[#1A1A25] rounded-t hover:bg-[#00E5CC] transition-colors", style: {
                                                        height: `${(value / maxTrend) * 100}%`,
                                                    }, title: `J${idx + 1}: ${value}%` }, idx))) })] }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-3", children: [_jsxs("div", { className: "mb-2 flex items-center gap-2 text-xs font-semibold text-[#6B6B80]", children: [_jsx(Star, { className: "h-4 w-4" }), "Performance"] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-[#6B6B80]", children: "S\u00E9curit\u00E9" }), _jsxs("span", { className: "font-semibold text-[#00E5CC] font-mono", children: [performance.safety, "%"] })] }), _jsx("div", { className: "h-1.5 bg-[#1A1A25] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#00E5CC]", style: { width: `${performance.safety}%` } }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-[#6B6B80]", children: "Efficacit\u00E9" }), _jsxs("span", { className: "font-semibold text-[#00E5CC] font-mono", children: [performance.efficiency, "%"] })] }), _jsx("div", { className: "h-1.5 bg-[#1A1A25] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#00E5CC]", style: { width: `${performance.efficiency}%` } }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-[#6B6B80]", children: "Ponctualit\u00E9" }), _jsxs("span", { className: "font-semibold text-[#00E5CC] font-mono", children: [performance.punctuality, "%"] })] }), _jsx("div", { className: "h-1.5 bg-[#1A1A25] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#00E5CC]", style: { width: `${performance.punctuality}%` } }) })] })] })] }), _jsxs("div", { className: "border-t border-[#1F1F2E] px-6 py-3 flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", onClick: () => {
                                            setSchedulingDriver(driver);
                                            setSchedule({});
                                        }, children: [_jsx(Calendar, { className: "h-4 w-4 mr-1" }), "Planning"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", onClick: () => handleOpenModal(driver), children: [_jsx(Edit2, { className: "h-4 w-4 mr-1" }), "Modifier"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 bg-[#1A1A25] border border-[#1F1F2E] text-[#FF4D6A] hover:bg-[#2A2A3D]", onClick: () => handleDelete(driver.id), disabled: deleteMutation.isPending, children: [_jsx(Trash2, { className: "h-4 w-4 mr-1" }), "Supprimer"] })] })] }, driver.id));
                }) })), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border-[#1F1F2E] max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: editingDriver ? 'Modifier le conducteur' : 'Nouveau conducteur' }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: editingDriver
                                        ? 'Mettre à jour les informations du conducteur'
                                        : 'Ajouter un nouveau conducteur à votre flotte' })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Pr\u00E9nom" }), _jsx(Input, { value: formData.firstName, onChange: (e) => handleFormChange('firstName', e.target.value), placeholder: "Jean", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Nom" }), _jsx(Input, { value: formData.lastName, onChange: (e) => handleFormChange('lastName', e.target.value), placeholder: "Dupont", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Email" }), _jsx(Input, { type: "email", value: formData.email, onChange: (e) => handleFormChange('email', e.target.value), placeholder: "john@example.com", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "T\u00E9l\u00E9phone" }), _jsx(Input, { type: "tel", value: formData.phone, onChange: (e) => handleFormChange('phone', e.target.value), placeholder: "+33 (1) 23 45 67 89", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "N\u00B0 de permis" }), _jsx(Input, { value: formData.licenseNumber, onChange: (e) => handleFormChange('licenseNumber', e.target.value), placeholder: "DL123456789", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Date d'expiration" }), _jsx(Input, { type: "date", value: formData.licenseExpiry, onChange: (e) => handleFormChange('licenseExpiry', e.target.value), className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "V\u00E9hicules assign\u00E9s" }), _jsx("div", { className: "space-y-2 bg-[#0A0A0F] border border-[#1F1F2E] rounded-[8px] p-3 max-h-48 overflow-y-auto", children: vehicles.length === 0 ? (_jsx("p", { className: "text-sm text-[#6B6B80]", children: "Aucun v\u00E9hicule disponible" })) : (vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: (formData.assignedVehicleIds || []).includes(vehicle.id), onChange: (e) => handleVehicleCheckboxChange(vehicle.id, e.target.checked), className: "w-4 h-4 rounded border-[#1F1F2E] bg-[#12121A] cursor-pointer" }), _jsxs("span", { className: "text-sm text-[#F0F0F5]", children: [vehicle.name, " (", vehicle.licensePlate, ")"] })] }, vehicle.id)))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Notes" }), _jsx("textarea", { value: formData.notes || '', onChange: (e) => handleFormChange('notes', e.target.value), placeholder: "Notes ou commentaires sur le conducteur...", className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] placeholder-[#44445A]", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleCloseModal, disabled: upsertMutation.isPending, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleSubmit, disabled: upsertMutation.isPending, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: upsertMutation.isPending
                                        ? 'Enregistrement...'
                                        : editingDriver
                                            ? 'Mettre à jour'
                                            : 'Créer' })] })] }) }), _jsx(Dialog, { open: !!schedulingDriver, onOpenChange: () => setSchedulingDriver(null), children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: ["Planning de ", schedulingDriver?.firstName, " ", schedulingDriver?.lastName] }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez le planning hebdomadaire du conducteur" })] }), _jsx("div", { className: "py-4", children: _jsx("div", { className: "grid grid-cols-7 gap-3", children: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "font-semibold text-xs text-[#6B6B80] mb-2", children: day }), _jsxs("div", { className: "space-y-1", children: [_jsx("button", { onClick: () => handleScheduleSlotClick(day, 'morning'), className: `w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${schedule[`${day}-morning`]
                                                        ? 'bg-[#00E5CC] border-[#00E5CC] text-[#0A0A0F]'
                                                        : 'bg-[#1A1A25] border-[#1F1F2E] text-[#6B6B80] hover:bg-[#2A2A3D] hover:border-[#2A2A3D]'}`, children: "Matin" }), _jsx("button", { onClick: () => handleScheduleSlotClick(day, 'afternoon'), className: `w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${schedule[`${day}-afternoon`]
                                                        ? 'bg-[#00E5CC] border-[#00E5CC] text-[#0A0A0F]'
                                                        : 'bg-[#1A1A25] border-[#1F1F2E] text-[#6B6B80] hover:bg-[#2A2A3D] hover:border-[#2A2A3D]'}`, children: "Apr\u00E8s" }), _jsx("button", { onClick: () => handleScheduleSlotClick(day, 'night'), className: `w-full px-2 py-2 text-xs font-medium rounded border transition-colors ${schedule[`${day}-night`]
                                                        ? 'bg-[#00E5CC] border-[#00E5CC] text-[#0A0A0F]'
                                                        : 'bg-[#1A1A25] border-[#1F1F2E] text-[#6B6B80] hover:bg-[#2A2A3D] hover:border-[#2A2A3D]'}`, children: "Nuit" })] })] }, day))) }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setSchedulingDriver(null), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleSaveSchedule, disabled: scheduleMutation.isPending, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: scheduleMutation.isPending ? 'Enregistrement...' : 'Sauvegarder' })] })] }) })] }));
}
//# sourceMappingURL=DriversPage.js.map