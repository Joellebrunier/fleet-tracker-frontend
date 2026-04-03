import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Search, Wifi, Zap, Locate, RotateCw, AlertCircle, Link as LinkIcon, Download, Upload, Battery, History, Layers } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
export default function DevicesPage() {
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const [searchTerm, setSearchTerm] = useState('');
    const [assignmentDialog, setAssignmentDialog] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [selectedVehicleId, setSelectedVehicleId] = useState('');
    const [importDialog, setImportDialog] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [editingDevice, setEditingDevice] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [historyDialog, setHistoryDialog] = useState(false);
    const [selectedDeviceHistory, setSelectedDeviceHistory] = useState([]);
    const [bulkAssignDialog, setBulkAssignDialog] = useState(false);
    const [selectedDeviceIds, setSelectedDeviceIds] = useState(new Set());
    const [bulkAssignVehicleId, setBulkAssignVehicleId] = useState('');
    const fileInputRef = useRef(null);
    // Fetch devices
    const { data: devices = [], isLoading, error, refetch } = useQuery({
        queryKey: ['devices', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            try {
                const response = await apiClient.get(`/api/organizations/${organizationId}/devices`);
                const raw = response.data;
                if (Array.isArray(raw))
                    return raw;
                if (raw && Array.isArray(raw.data))
                    return raw.data;
                if (raw && Array.isArray(raw.devices))
                    return raw.devices;
                return [];
            }
            catch {
                return [];
            }
        },
        enabled: !!organizationId,
        retry: false,
    });
    // Fetch vehicles for assignment
    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles', organizationId],
        queryFn: async () => {
            if (!organizationId)
                return [];
            try {
                const response = await apiClient.get(`/api/organizations/${organizationId}/vehicles`);
                const raw = response.data;
                if (Array.isArray(raw))
                    return raw;
                if (raw && Array.isArray(raw.data))
                    return raw.data;
                if (raw && Array.isArray(raw.vehicles))
                    return raw.vehicles;
                return [];
            }
            catch {
                return [];
            }
        },
        enabled: !!organizationId,
    });
    const getStatusColor = (status) => {
        switch (status) {
            case 'online':
                return 'default';
            case 'offline':
                return 'destructive';
            case 'faulty':
                return 'secondary';
            default:
                return 'default';
        }
    };
    const getStatusLabel = (status) => {
        switch (status) {
            case 'online':
                return 'En ligne';
            case 'offline':
                return 'Hors ligne';
            case 'faulty':
                return 'Défaillant';
            default:
                return status;
        }
    };
    const getInventoryStatusColor = (status) => {
        switch (status) {
            case 'En stock':
                return 'default';
            case 'Assigné':
                return 'secondary';
            case 'En réparation':
                return 'outline';
            case 'Retiré':
                return 'destructive';
            default:
                return 'default';
        }
    };
    const getBatteryColor = (level) => {
        if (!level)
            return 'bg-[#1A1A25]';
        if (level > 50)
            return 'bg-[#00E5CC]';
        if (level > 20)
            return 'bg-[#FFB547]';
        return 'bg-[#FF4D6A]';
    };
    const getBatteryTextColor = (level) => {
        if (!level)
            return 'text-[#6B6B80]';
        if (level > 50)
            return 'text-[#00E5CC]';
        if (level > 20)
            return 'text-[#FFB547]';
        return 'text-[#FF4D6A]';
    };
    const getSignalBars = (strength) => {
        if (!strength)
            return 0;
        if (strength >= 75)
            return 4;
        if (strength >= 50)
            return 3;
        if (strength >= 25)
            return 2;
        return 1;
    };
    // Filter devices
    const filteredDevices = devices.filter((device) => {
        const matchesSearch = device.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
            device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (device.vehicleName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        return matchesSearch;
    });
    const openAssignmentDialog = (device) => {
        setSelectedDevice(device);
        setSelectedVehicleId(device.vehicleId || '');
        setAssignmentDialog(true);
    };
    const openEditDialog = (device) => {
        setEditingDevice(device);
        setEditDialog(true);
    };
    const openHistoryDialog = (device) => {
        setSelectedDevice(device);
        // Mock history data based on device ID
        const mockHistory = [
            {
                id: '1',
                deviceId: device.id,
                vehicleId: 'vh-001',
                vehicleName: 'Renault Master 1',
                assignedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                removedDate: undefined,
                status: 'current',
            },
            {
                id: '2',
                deviceId: device.id,
                vehicleId: 'vh-002',
                vehicleName: 'Peugeot Boxer 2',
                assignedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                removedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'previous',
            },
            {
                id: '3',
                deviceId: device.id,
                vehicleId: 'vh-003',
                vehicleName: 'Mercedes Sprinter 3',
                assignedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
                removedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'previous',
            },
        ];
        setSelectedDeviceHistory(mockHistory);
        setHistoryDialog(true);
    };
    const handleAssignVehicle = async () => {
        if (!selectedDevice || !selectedVehicleId)
            return;
        try {
            await apiClient.put(`/api/devices/${selectedDevice.id}`, {
                vehicleId: selectedVehicleId,
            });
            setAssignmentDialog(false);
            setSelectedDevice(null);
            refetch();
        }
        catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
        }
    };
    const handleSaveDevice = async () => {
        if (!editingDevice)
            return;
        try {
            await apiClient.put(`/api/devices/${editingDevice.id}`, {
                simNumber: editingDevice.simNumber,
                operator: editingDevice.operator,
                dataPlan: editingDevice.dataPlan,
                inventoryStatus: editingDevice.inventoryStatus,
            });
            setEditDialog(false);
            setEditingDevice(null);
            refetch();
        }
        catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
        }
    };
    const handleBulkAssign = async () => {
        if (selectedDeviceIds.size === 0 || !bulkAssignVehicleId)
            return;
        try {
            for (const deviceId of selectedDeviceIds) {
                await apiClient.put(`/api/devices/${deviceId}`, {
                    vehicleId: bulkAssignVehicleId,
                });
            }
            setBulkAssignDialog(false);
            setSelectedDeviceIds(new Set());
            setBulkAssignVehicleId('');
            refetch();
        }
        catch (error) {
            console.error('Erreur lors de l\'attribution en masse:', error);
        }
    };
    const sendDeviceCommand = async (deviceId, command) => {
        try {
            await apiClient.post(`/api/devices/${deviceId}/command`, {
                command,
            });
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi de la commande:', error);
        }
    };
    const handleImportFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImportFile(file);
            parseCSV(file);
        }
    };
    const parseCSV = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            const lines = text.split('\n').filter(line => line.trim());
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 4) {
                    data.push({
                        imei: values[0] || '',
                        model: values[1] || '',
                        provider: values[2] || '',
                        simNumber: values[3] || '',
                        operator: values[4] || '',
                        dataPlan: values[5] || '',
                    });
                }
            }
            setParsedData(data);
        };
        reader.readAsText(file);
    };
    const handleImportDevices = async () => {
        try {
            if (parsedData.length === 0)
                return;
            for (const device of parsedData) {
                await apiClient.post(`/api/organizations/${organizationId}/devices`, {
                    imei: device.imei,
                    model: device.model,
                    provider: device.provider,
                    simNumber: device.simNumber,
                    operator: device.operator,
                    dataPlan: device.dataPlan,
                });
            }
            setImportDialog(false);
            setImportFile(null);
            setParsedData([]);
            refetch();
        }
        catch (error) {
            console.error('Erreur lors de l\'importation:', error);
        }
    };
    const handleExportDevices = () => {
        if (devices.length === 0)
            return;
        const headers = ['IMEI', 'Modèle', 'Fournisseur', 'Numéro SIM', 'Opérateur', 'Plan données', 'Statut', 'Batterie', 'Signal', 'Inventaire'];
        const rows = devices.map(d => [
            d.imei,
            d.model,
            d.provider,
            d.simNumber || '',
            d.operator || '',
            d.dataPlan || '',
            getStatusLabel(d.status),
            d.batteryLevel || 0,
            d.signalStrength || 0,
            d.inventoryStatus || 'Assigné',
        ]);
        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appareils-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };
    const toggleDeviceSelection = (deviceId) => {
        const newSelection = new Set(selectedDeviceIds);
        if (newSelection.has(deviceId)) {
            newSelection.delete(deviceId);
        }
        else {
            newSelection.add(deviceId);
        }
        setSelectedDeviceIds(newSelection);
    };
    const selectAllDevices = (select) => {
        if (select) {
            setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
        }
        else {
            setSelectedDeviceIds(new Set());
        }
    };
    return (_jsxs("div", { className: "space-y-6 p-6 bg-[#0A0A0F] min-h-screen", children: [_jsxs("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5] font-syne", children: "Appareils GPS" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "G\u00E9rez vos trackers et appareils GPS" })] }), _jsxs("div", { className: "flex gap-2", children: [selectedDeviceIds.size > 0 && (_jsxs(Button, { onClick: () => setBulkAssignDialog(true), className: "flex items-center gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: [_jsx(Layers, { size: 16 }), "Attribution en masse (", selectedDeviceIds.size, ")"] })), _jsxs(Button, { variant: "outline", onClick: () => setImportDialog(true), className: "flex items-center gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: [_jsx(Upload, { size: 16 }), "Importateur"] }), _jsxs(Button, { variant: "outline", onClick: handleExportDevices, className: "flex items-center gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: [_jsx(Download, { size: 16 }), "Exportateur CSV"] })] })] }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-[#6B6B80]", size: 18 }), _jsx(Input, { type: "search", placeholder: "Rechercher par IMEI ou mod\u00E8le...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }) }) }), isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-16 bg-[#1A1A25]" }, i))) })) : error ? (_jsx(Card, { className: "border-[#FF4D6A] bg-rgba(255, 77, 106, 0.1)", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-[#FF4D6A]", children: "Erreur de chargement des appareils" }) }) })) : filteredDevices.length === 0 ? (_jsx(Card, { className: "text-center bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-[#6B6B80]", children: searchTerm
                            ? 'Aucun appareil ne correspond à votre recherche'
                            : 'Aucun appareil trouvé. Connectez vos trackers GPS pour commencer.' }) }) })) : (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "px-6 py-3 text-left", children: _jsx("input", { type: "checkbox", checked: selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0, onChange: (e) => selectAllDevices(e.target.checked), className: "w-4 h-4 rounded border-[#1F1F2E] bg-[#0A0A0F] cursor-pointer" }) }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "IMEI" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Mod\u00E8le" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "SIM / Op\u00E9rateur" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Firmware" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Statut" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Batterie" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Signal" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Inventaire" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "V\u00E9hicule" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Derni\u00E8re pos." }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-[#6B6B80]", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-[#1F1F2E]", children: filteredDevices.map((device) => (_jsxs("tr", { className: "hover:bg-[#1A1A25] transition-colors", children: [_jsx("td", { className: "px-6 py-4", children: _jsx("input", { type: "checkbox", checked: selectedDeviceIds.has(device.id), onChange: () => toggleDeviceSelection(device.id), className: "w-4 h-4 rounded border-[#1F1F2E] bg-[#0A0A0F] cursor-pointer" }) }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-[#F0F0F5] font-mono", children: device.imei }), _jsx("td", { className: "px-6 py-4 text-sm text-[#6B6B80]", children: device.model }), _jsx("td", { className: "px-6 py-4 text-sm text-[#6B6B80]", children: _jsxs("div", { className: "space-y-0.5", children: [device.simNumber && _jsx("div", { className: "font-mono", children: device.simNumber }), device.operator && _jsx("div", { className: "text-xs", children: device.operator })] }) }), _jsx("td", { className: "px-6 py-4 text-sm text-[#6B6B80]", children: device.firmwareVersion || '-' }), _jsx("td", { className: "px-6 py-4", children: _jsx(Badge, { variant: getStatusColor(device.status), children: getStatusLabel(device.status) }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Battery, { className: `h-4 w-4 ${getBatteryTextColor(device.batteryLevel)}` }), _jsx("div", { className: "h-6 w-12 bg-[#1A1A25] rounded overflow-hidden", children: _jsx("div", { className: `h-full ${getBatteryColor(device.batteryLevel)}`, style: { width: `${device.batteryLevel || 0}%` } }) }), _jsxs("span", { className: `text-xs font-mono ${getBatteryTextColor(device.batteryLevel)}`, children: [device.batteryLevel || 0, "%"] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "flex gap-0.5", children: [...Array(4)].map((_, i) => (_jsx("div", { className: `h-3 w-1 rounded-sm ${i < getSignalBars(device.signalStrength)
                                                        ? 'bg-[#00E5CC]'
                                                        : 'bg-[#1A1A25]'}` }, i))) }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx(Badge, { variant: getInventoryStatusColor(device.inventoryStatus), children: device.inventoryStatus || 'Assigné' }) }), _jsx("td", { className: "px-6 py-4 text-sm text-[#6B6B80]", children: device.vehicleName ? (_jsx(Badge, { variant: "secondary", className: "bg-[rgba(0,229,204,0.12)] text-[#00E5CC]", children: device.vehicleName })) : (_jsx("span", { className: "text-[#44445A]", children: "Non assign\u00E9" })) }), _jsx("td", { className: "px-6 py-4 text-sm text-[#6B6B80]", children: formatTimeAgo(device.lastSeen) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => openEditDialog(device), className: "p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]", title: "Modifier d\u00E9tails SIM", children: _jsx(Wifi, { size: 16 }) }), _jsx("button", { onClick: () => openHistoryDialog(device), className: "p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]", title: "Historique remplacements", children: _jsx(History, { size: 16 }) }), _jsx("button", { onClick: () => openAssignmentDialog(device), className: "p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]", title: "Assigner \u00E0 un v\u00E9hicule", children: _jsx(LinkIcon, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'locate'), className: "p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]", title: "Localiser", children: _jsx(Locate, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'restart'), className: "p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]", title: "Red\u00E9marrer", children: _jsx(RotateCw, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'diagnostic'), className: "p-1.5 hover:bg-[rgba(255,181,71,0.12)] rounded text-[#FFB547]", title: "Diagnostic", children: _jsx(AlertCircle, { size: 16 }) }), device.provider === 'Echoes' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => sendDeviceCommand(device.id, 'echoes_sync'), className: "p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]", title: "Synchroniser Echoes", children: _jsx(Wifi, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'echoes_update'), className: "p-1.5 hover:bg-[rgba(0,229,204,0.12)] rounded text-[#00E5CC]", title: "Mettre \u00E0 jour Echoes", children: _jsx(Zap, { size: 16 }) })] }))] }) })] }, device.id))) })] }) }) })), _jsx(Dialog, { open: editDialog, onOpenChange: setEditDialog, children: _jsxs(DialogContent, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "D\u00E9tails de la carte SIM" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Modifier les informations SIM et l'inventaire de l'appareil" })] }), editingDevice && (_jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "IMEI" }), _jsx(Input, { disabled: true, value: editingDevice.imei, className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#6B6B80] rounded-[8px]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Num\u00E9ro SIM" }), _jsx(Input, { value: editingDevice.simNumber || '', onChange: (e) => setEditingDevice({ ...editingDevice, simNumber: e.target.value }), placeholder: "898210...", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Op\u00E9rateur" }), _jsx(Input, { value: editingDevice.operator || '', onChange: (e) => setEditingDevice({ ...editingDevice, operator: e.target.value }), placeholder: "Orange, SFR, Bouygues...", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Plan de donn\u00E9es" }), _jsx(Input, { value: editingDevice.dataPlan || '', onChange: (e) => setEditingDevice({ ...editingDevice, dataPlan: e.target.value }), placeholder: "10 GB/mois, Illimit\u00E9...", className: "bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] placeholder-[#44445A]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "Statut inventaire" }), _jsxs("select", { value: editingDevice.inventoryStatus || 'Assigné', onChange: (e) => setEditingDevice({ ...editingDevice, inventoryStatus: e.target.value }), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]", children: [_jsx("option", { value: "En stock", children: "En stock" }), _jsx("option", { value: "Assign\u00E9", children: "Assign\u00E9" }), _jsx("option", { value: "En r\u00E9paration", children: "En r\u00E9paration" }), _jsx("option", { value: "Retir\u00E9", children: "Retir\u00E9" })] })] })] })), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setEditDialog(false), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleSaveDevice, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: "Sauvegarder" })] })] }) }), _jsx(Dialog, { open: historyDialog, onOpenChange: setHistoryDialog, children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: ["Historique des remplacements - ", selectedDevice?.imei] }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Historique d'assignation de cet appareil \u00E0 diff\u00E9rents v\u00E9hicules" })] }), _jsx("div", { className: "space-y-3 py-4", children: selectedDeviceHistory.length === 0 ? (_jsx("p", { className: "text-[#6B6B80] text-sm", children: "Aucun historique disponible" })) : (selectedDeviceHistory.map((history) => (_jsxs("div", { className: "border border-[#1F1F2E] rounded-lg p-4 bg-[#0A0A0F]", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: history.vehicleName }), _jsxs("p", { className: "text-sm text-[#6B6B80]", children: ["Assign\u00E9: ", new Date(history.assignedDate).toLocaleDateString('fr-FR')] })] }), _jsx(Badge, { variant: history.status === 'current' ? 'default' : 'secondary', children: history.status === 'current' ? 'Actuel' : 'Précédent' })] }), history.removedDate && (_jsxs("p", { className: "text-sm text-[#6B6B80]", children: ["Retir\u00E9: ", new Date(history.removedDate).toLocaleDateString('fr-FR')] }))] }, history.id)))) }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: () => setHistoryDialog(false), className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: "Fermer" }) })] }) }), _jsx(Dialog, { open: assignmentDialog, onOpenChange: setAssignmentDialog, children: _jsxs(DialogContent, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Assigner un v\u00E9hicule" }), _jsxs(DialogDescription, { className: "text-[#6B6B80]", children: ["S\u00E9lectionnez un v\u00E9hicule pour assigner le tracker IMEI:", ' ', _jsx("strong", { className: "text-[#00E5CC]", children: selectedDevice?.imei })] })] }), _jsx("div", { className: "space-y-4", children: vehicles.length === 0 ? (_jsx("p", { className: "text-[#6B6B80] text-sm", children: "Aucun v\u00E9hicule disponible. Cr\u00E9ez d'abord un v\u00E9hicule." })) : (_jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-[#1F1F2E] rounded-lg hover:bg-[#1A1A25] cursor-pointer transition-colors", children: [_jsx("input", { type: "radio", name: "vehicle", value: vehicle.id, checked: selectedVehicleId === vehicle.id, onChange: (e) => setSelectedVehicleId(e.target.value) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: vehicle.name }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: vehicle.licensePlate })] })] }, vehicle.id))) })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setAssignmentDialog(false), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleAssignVehicle, disabled: !selectedVehicleId, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: "Assigner" })] })] }) }), _jsx(Dialog, { open: bulkAssignDialog, onOpenChange: setBulkAssignDialog, children: _jsxs(DialogContent, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Attribution en masse" }), _jsxs(DialogDescription, { className: "text-[#6B6B80]", children: ["Assigner ", selectedDeviceIds.size, " appareil(s) \u00E0 un v\u00E9hicule"] })] }), _jsx("div", { className: "space-y-4 py-4", children: _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "S\u00E9lectionner un v\u00E9hicule" }), _jsxs("select", { value: bulkAssignVehicleId, onChange: (e) => setBulkAssignVehicleId(e.target.value), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-[8px] text-sm bg-[#0A0A0F] text-[#F0F0F5] focus:outline-none focus:ring-2 focus:ring-[#00E5CC]", children: [_jsx("option", { value: "", children: "-- S\u00E9lectionner un v\u00E9hicule --" }), vehicles.map((vehicle) => (_jsxs("option", { value: vehicle.id, children: [vehicle.name, " (", vehicle.licensePlate, ")"] }, vehicle.id)))] })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setBulkAssignDialog(false), className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsxs(Button, { onClick: handleBulkAssign, disabled: !bulkAssignVehicleId, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: ["Assigner \u00E0 ", selectedDeviceIds.size, " appareil(s)"] })] })] }) }), _jsx(Dialog, { open: importDialog, onOpenChange: setImportDialog, children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5] font-syne", children: "Importer des appareils" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "T\u00E9l\u00E9chargez un fichier CSV avec le format: IMEI, Mod\u00E8le, Fournisseur, Num\u00E9ro SIM, Op\u00E9rateur, Plan donn\u00E9es" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border-2 border-dashed border-[#1F1F2E] rounded-lg p-8 text-center hover:border-[#2A2A3D] transition-colors", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", onChange: handleImportFileChange, className: "hidden" }), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "text-[#6B6B80] hover:text-[#F0F0F5]", children: [_jsx(Upload, { className: "mx-auto mb-2", size: 32 }), _jsx("p", { className: "font-medium", children: "Cliquez pour s\u00E9lectionner un fichier CSV" }), _jsx("p", { className: "text-sm text-[#6B6B80] mt-1", children: "ou glissez-d\u00E9posez" })] })] }), importFile && (_jsx("div", { className: "bg-[#1A1A25] p-4 rounded-lg border border-[#1F1F2E]", children: _jsxs("p", { className: "text-sm font-medium text-[#F0F0F5]", children: ["Fichier s\u00E9lectionn\u00E9: ", importFile.name] }) })), parsedData.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm font-medium text-[#F0F0F5]", children: ["Aper\u00E7u (", parsedData.length, " appareils)"] }), _jsx("div", { className: "border border-[#1F1F2E] rounded-lg overflow-x-auto max-h-64 overflow-y-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-[#0A0A0F] border-b border-[#1F1F2E]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "IMEI" }), _jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "Mod\u00E8le" }), _jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "Fournisseur" }), _jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "SIM" }), _jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "Op\u00E9rateur" }), _jsx("th", { className: "px-4 py-2 text-left text-[#6B6B80]", children: "Plan" })] }) }), _jsx("tbody", { className: "divide-y divide-[#1F1F2E]", children: parsedData.map((row, idx) => (_jsxs("tr", { className: "hover:bg-[#1A1A25]", children: [_jsx("td", { className: "px-4 py-2 text-[#F0F0F5] font-mono", children: row.imei }), _jsx("td", { className: "px-4 py-2 text-[#6B6B80]", children: row.model }), _jsx("td", { className: "px-4 py-2 text-[#6B6B80]", children: row.provider }), _jsx("td", { className: "px-4 py-2 text-[#6B6B80] font-mono text-xs", children: row.simNumber }), _jsx("td", { className: "px-4 py-2 text-[#6B6B80]", children: row.operator }), _jsx("td", { className: "px-4 py-2 text-[#6B6B80] text-xs", children: row.dataPlan })] }, idx))) })] }) })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                        setImportDialog(false);
                                        setImportFile(null);
                                        setParsedData([]);
                                    }, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#2A2A3D]", children: "Annuler" }), _jsx(Button, { onClick: handleImportDevices, disabled: parsedData.length === 0, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00d4bb]", children: "Importer" })] })] }) })] }));
}
//# sourceMappingURL=DevicesPage.js.map