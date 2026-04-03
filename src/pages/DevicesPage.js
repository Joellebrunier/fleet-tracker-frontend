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
import { Search, Wifi, Zap, Locate, RotateCw, AlertCircle, Link as LinkIcon, Download, Upload } from 'lucide-react';
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
    const fileInputRef = useRef(null);
    // Fetch devices
    const { data: devices = [], isLoading, error } = useQuery({
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
    const getBatteryColor = (level) => {
        if (!level)
            return 'bg-gray-200';
        if (level > 50)
            return 'bg-green-500';
        if (level > 20)
            return 'bg-yellow-500';
        return 'bg-red-500';
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
    const handleAssignVehicle = async () => {
        if (!selectedDevice || !selectedVehicleId)
            return;
        try {
            await apiClient.put(`/api/devices/${selectedDevice.id}`, {
                vehicleId: selectedVehicleId,
            });
            setAssignmentDialog(false);
            setSelectedDevice(null);
            // In a real app, would invalidate query cache here
        }
        catch (error) {
            console.error('Erreur lors de l\'assignation:', error);
        }
    };
    const sendDeviceCommand = async (deviceId, command) => {
        try {
            await apiClient.post(`/api/devices/${deviceId}/command`, {
                command,
            });
            // Show success notification
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
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const data = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (values.length >= 4) {
                    data.push({
                        imei: values[0] || '',
                        model: values[1] || '',
                        provider: values[2] || '',
                        simNumber: values[3] || ''
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
                    simNumber: device.simNumber
                });
            }
            setImportDialog(false);
            setImportFile(null);
            setParsedData([]);
            // Refresh devices list
        }
        catch (error) {
            console.error('Erreur lors de l\'importation:', error);
        }
    };
    const handleExportDevices = () => {
        if (devices.length === 0)
            return;
        const headers = ['IMEI', 'Modèle', 'Fournisseur', 'Numéro SIM', 'Statut', 'Batterie', 'Signal'];
        const rows = devices.map(d => [
            d.imei,
            d.model,
            d.provider,
            d.simNumber || '',
            getStatusLabel(d.status),
            d.batteryLevel || 0,
            d.signalStrength || 0
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Appareils GPS" }), _jsx("p", { className: "mt-2 text-gray-600", children: "G\u00E9rez vos trackers et appareils GPS" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", onClick: () => setImportDialog(true), className: "flex items-center gap-2", children: [_jsx(Upload, { size: 16 }), "Importateur"] }), _jsxs(Button, { variant: "outline", onClick: handleExportDevices, className: "flex items-center gap-2", children: [_jsx(Download, { size: 16 }), "Exportateur CSV"] })] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-gray-400", size: 18 }), _jsx(Input, { type: "search", placeholder: "Rechercher par IMEI ou mod\u00E8le...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }) }) }), isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-16" }, i))) })) : error ? (_jsx(Card, { className: "border-red-200 bg-red-50", children: _jsx(CardContent, { className: "pt-6", children: _jsx("p", { className: "text-red-800", children: "Erreur de chargement des appareils" }) }) })) : filteredDevices.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-gray-500", children: searchTerm
                            ? 'Aucun appareil ne correspond à votre recherche'
                            : 'Aucun appareil trouvé. Connectez vos trackers GPS pour commencer.' }) }) })) : (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "IMEI" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Mod\u00E8le" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Firmware" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Statut" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Batterie" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Signal" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "V\u00E9hicule" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Derni\u00E8re pos." }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: filteredDevices.map((device) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: device.imei }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: device.model }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: device.firmwareVersion || '-' }), _jsx("td", { className: "px-6 py-4", children: _jsx(Badge, { variant: getStatusColor(device.status), children: getStatusLabel(device.status) }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "h-6 w-16 bg-gray-200 rounded overflow-hidden", children: _jsx("div", { className: `h-full ${getBatteryColor(device.batteryLevel)}`, style: { width: `${device.batteryLevel || 0}%` } }) }), _jsxs("span", { className: "text-xs text-gray-600 w-8", children: [device.batteryLevel || 0, "%"] })] }) }), _jsx("td", { className: "px-6 py-4", children: _jsx("div", { className: "flex gap-0.5", children: [...Array(4)].map((_, i) => (_jsx("div", { className: `h-3 w-1 rounded-sm ${i < getSignalBars(device.signalStrength)
                                                        ? 'bg-green-500'
                                                        : 'bg-gray-200'}` }, i))) }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: device.vehicleName ? (_jsx(Badge, { variant: "secondary", children: device.vehicleName })) : (_jsx("span", { className: "text-gray-400", children: "Non assign\u00E9" })) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: formatTimeAgo(device.lastSeen) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => openAssignmentDialog(device), className: "p-1.5 hover:bg-blue-100 rounded text-blue-600", title: "Assigner \u00E0 un v\u00E9hicule", children: _jsx(LinkIcon, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'locate'), className: "p-1.5 hover:bg-green-100 rounded text-green-600", title: "Localiser", children: _jsx(Locate, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'restart'), className: "p-1.5 hover:bg-amber-100 rounded text-amber-600", title: "Red\u00E9marrer", children: _jsx(RotateCw, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'diagnostic'), className: "p-1.5 hover:bg-purple-100 rounded text-purple-600", title: "Diagnostic", children: _jsx(AlertCircle, { size: 16 }) }), device.provider === 'Echoes' && (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => sendDeviceCommand(device.id, 'echoes_sync'), className: "p-1.5 hover:bg-indigo-100 rounded text-indigo-600", title: "Synchroniser Echoes", children: _jsx(Wifi, { size: 16 }) }), _jsx("button", { onClick: () => sendDeviceCommand(device.id, 'echoes_update'), className: "p-1.5 hover:bg-teal-100 rounded text-teal-600", title: "Mettre \u00E0 jour Echoes", children: _jsx(Zap, { size: 16 }) })] }))] }) })] }, device.id))) })] }) }) })), _jsx(Dialog, { open: assignmentDialog, onOpenChange: setAssignmentDialog, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Assigner un v\u00E9hicule" }), _jsxs(DialogDescription, { children: ["S\u00E9lectionnez un v\u00E9hicule pour assigner le tracker IMEI:", ' ', _jsx("strong", { children: selectedDevice?.imei })] })] }), _jsx("div", { className: "space-y-4", children: vehicles.length === 0 ? (_jsx("p", { className: "text-gray-600 text-sm", children: "Aucun v\u00E9hicule disponible. Cr\u00E9ez d'abord un v\u00E9hicule." })) : (_jsx("div", { className: "space-y-2 max-h-64 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "radio", name: "vehicle", value: vehicle.id, checked: selectedVehicleId === vehicle.id, onChange: (e) => setSelectedVehicleId(e.target.value) }), _jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-sm text-gray-600", children: vehicle.licensePlate })] })] }, vehicle.id))) })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setAssignmentDialog(false), children: "Annuler" }), _jsx(Button, { onClick: handleAssignVehicle, disabled: !selectedVehicleId, children: "Assigner" })] })] }) }), _jsx(Dialog, { open: importDialog, onOpenChange: setImportDialog, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Importer des appareils" }), _jsx(DialogDescription, { children: "T\u00E9l\u00E9chargez un fichier CSV avec le format: IMEI, Mod\u00E8le, Fournisseur, Num\u00E9ro SIM" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv", onChange: handleImportFileChange, className: "hidden" }), _jsxs("button", { onClick: () => fileInputRef.current?.click(), className: "text-gray-600 hover:text-gray-900", children: [_jsx(Upload, { className: "mx-auto mb-2", size: 32 }), _jsx("p", { className: "font-medium", children: "Cliquez pour s\u00E9lectionner un fichier CSV" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "ou glissez-d\u00E9posez" })] })] }), importFile && (_jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("p", { className: "text-sm font-medium text-gray-900", children: ["Fichier s\u00E9lectionn\u00E9: ", importFile.name] }) })), parsedData.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900", children: ["Aper\u00E7u (", parsedData.length, " appareils)"] }), _jsx("div", { className: "border border-gray-200 rounded-lg overflow-x-auto max-h-64 overflow-y-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-gray-100 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "IMEI" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Mod\u00E8le" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Fournisseur" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Num\u00E9ro SIM" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: parsedData.map((row, idx) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2", children: row.imei }), _jsx("td", { className: "px-4 py-2", children: row.model }), _jsx("td", { className: "px-4 py-2", children: row.provider }), _jsx("td", { className: "px-4 py-2", children: row.simNumber })] }, idx))) })] }) })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                        setImportDialog(false);
                                        setImportFile(null);
                                        setParsedData([]);
                                    }, children: "Annuler" }), _jsx(Button, { onClick: handleImportDevices, disabled: parsedData.length === 0, children: "Importer" })] })] }) })] }));
}
//# sourceMappingURL=DevicesPage.js.map