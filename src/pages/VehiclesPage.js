import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useVehicleGroups } from '@/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Download, Trash2, Edit2, FileDown, LayoutGrid, List, Clock, Upload, ChevronDown, AlertCircle, Image as ImageIcon } from 'lucide-react';
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
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showScheduledExports, setShowScheduledExports] = useState(false);
    const [scheduledExports, setScheduledExports] = useState([]);
    const [newScheduledExport, setNewScheduledExport] = useState({ name: '', format: 'csv', frequency: 'daily' });
    // Import CSV/XLSX state
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importPreviewData, setImportPreviewData] = useState([]);
    const [columnMapping, setColumnMapping] = useState({
        Nom: '',
        Plaque: '',
        VIN: '',
        Type: '',
        Marque: '',
        Modèle: '',
    });
    const [importErrors, setImportErrors] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const fileInputRef = useRef(null);
    // Bulk operations state
    const [selectAllChecked, setSelectAllChecked] = useState(false);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [bulkChangeGroupId, setBulkChangeGroupId] = useState('');
    const [showBulkChangeGroup, setShowBulkChangeGroup] = useState(false);
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
        limit: 500,
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
            setSelectAllChecked(true);
        }
        else {
            setSelectedIds(new Set());
            setSelectAllChecked(false);
        }
    };
    // CSV/XLSX Import functions
    const parseCSVData = (text) => {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx] || '';
            });
            rows.push(row);
        }
        return rows;
    };
    const handleFileSelect = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setImportFile(file);
        setImportErrors([]);
        setColumnMapping({
            Nom: '',
            Plaque: '',
            VIN: '',
            Type: '',
            Marque: '',
            Modèle: '',
        });
        const text = await file.text();
        const data = parseCSVData(text);
        setImportPreviewData(data);
        // Auto-detect column headers
        const headers = Object.keys(data[0] || {});
        const mapping = { ...columnMapping };
        headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('nom') || lowerHeader.includes('name'))
                mapping['Nom'] = header;
            else if (lowerHeader.includes('plaque') || lowerHeader.includes('plate') || lowerHeader.includes('immat'))
                mapping['Plaque'] = header;
            else if (lowerHeader.includes('vin'))
                mapping['VIN'] = header;
            else if (lowerHeader.includes('type') || lowerHeader.includes('catégorie'))
                mapping['Type'] = header;
            else if (lowerHeader.includes('marque') || lowerHeader.includes('brand') || lowerHeader.includes('manufacturer'))
                mapping['Marque'] = header;
            else if (lowerHeader.includes('modèle') || lowerHeader.includes('model'))
                mapping['Modèle'] = header;
        });
        setColumnMapping(mapping);
    };
    const validateImportData = () => {
        const errors = [];
        // Check required mappings
        if (!columnMapping.Nom)
            errors.push('Colonne "Nom" non mappée');
        if (!columnMapping.Plaque)
            errors.push('Colonne "Plaque" non mappée');
        // Check for duplicate plates
        const plates = importPreviewData.map(row => row[columnMapping.Plaque]);
        const duplicates = plates.filter((plate, idx) => plates.indexOf(plate) !== idx);
        if (duplicates.length > 0) {
            errors.push(`Plaques dupliquées détectées: ${duplicates.join(', ')}`);
        }
        // Check existing plates in database
        const existingPlates = vehicles.map(v => v.plate);
        const conflictingPlates = plates.filter(p => existingPlates.includes(String(p)));
        if (conflictingPlates.length > 0) {
            errors.push(`Plaques déjà existantes: ${conflictingPlates.join(', ')}`);
        }
        setImportErrors(errors);
        return errors.length === 0;
    };
    const handleImportVehicles = async () => {
        if (!validateImportData())
            return;
        setIsImporting(true);
        setImportProgress(0);
        try {
            const vehiclesToImport = importPreviewData.map((row) => ({
                name: String(row[columnMapping.Nom]),
                registrationNumber: String(row[columnMapping.Plaque]),
                vin: columnMapping.VIN ? String(row[columnMapping.VIN]) : '',
                type: columnMapping.Type ? String(row[columnMapping.Type]).toLowerCase() : 'voiture',
                manufacturer: columnMapping.Marque ? String(row[columnMapping.Marque]) : '',
                model: columnMapping.Modèle ? String(row[columnMapping.Modèle]) : '',
                features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
            }));
            // Simulate batch import with progress
            for (let i = 0; i < vehiclesToImport.length; i++) {
                await apiClient.post(`/api/organizations/${organizationId}/vehicles`, vehiclesToImport[i]);
                setImportProgress(Math.round(((i + 1) / vehiclesToImport.length) * 100));
            }
            // Refresh vehicles list
            setIsImportDialogOpen(false);
            setImportFile(null);
            setImportPreviewData([]);
            setImportProgress(0);
        }
        catch (error) {
            setImportErrors(['Erreur lors de l\'import des véhicules']);
        }
        finally {
            setIsImporting(false);
        }
    };
    const handleBulkDelete = async () => {
        if (!confirm(`Supprimer ${selectedIds.size} véhicules ? Cette action est irréversible.`))
            return;
        try {
            for (const vehicleId of selectedIds) {
                await apiClient.delete(`/api/organizations/${organizationId}/vehicles/${vehicleId}`);
            }
            setSelectedIds(new Set());
            setSelectAllChecked(false);
            setShowBulkDeleteConfirm(false);
        }
        catch (error) {
            console.error('Erreur lors de la suppression groupée:', error);
        }
    };
    const handleBulkChangeGroup = async () => {
        if (!bulkChangeGroupId || selectedIds.size === 0)
            return;
        try {
            for (const vehicleId of selectedIds) {
                const vehicle = vehicles.find(v => v.id === vehicleId);
                if (vehicle) {
                    await updateVehicleMutation.mutateAsync({
                        name: vehicle.name,
                        vin: vehicle.vin || '',
                        registrationNumber: vehicle.plate,
                        type: vehicle.type || '',
                        manufacturer: vehicle.brand || undefined,
                        model: vehicle.model || undefined,
                        year: vehicle.year || undefined,
                        color: vehicle.metadata?.color,
                        groupId: bulkChangeGroupId,
                        features: vehicle.features || {
                            hasGPS: false,
                            hasFuelSensor: false,
                            hasTemperatureSensor: false,
                            hasCrashSensor: false,
                        },
                    });
                }
            }
            setSelectedIds(new Set());
            setSelectAllChecked(false);
            setShowBulkChangeGroup(false);
            setBulkChangeGroupId('');
        }
        catch (error) {
            console.error('Erreur lors du changement de groupe:', error);
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
    const generateKMLData = (vehiclesToExport) => {
        let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
        kml += '  <Document>\n';
        kml += '    <name>Export Véhicules</name>\n';
        kml += '    <description>Positions des véhicules</description>\n';
        vehiclesToExport.forEach(v => {
            if (v.currentLat && v.currentLng) {
                kml += '    <Placemark>\n';
                kml += `      <name>${v.name}</name>\n`;
                kml += `      <description>Plaque: ${v.plate || 'N/A'}\nType: ${v.type || 'N/A'}\nStatut: ${v.status || 'N/A'}\nVitesse: ${formatSpeed(v.currentSpeed)}</description>\n`;
                kml += '      <Point>\n';
                kml += `        <coordinates>${v.currentLng},${v.currentLat},0</coordinates>\n`;
                kml += '      </Point>\n';
                kml += '    </Placemark>\n';
            }
        });
        kml += '  </Document>\n';
        kml += '</kml>';
        return kml;
    };
    const generateGPXData = (vehiclesToExport) => {
        let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
        gpx += '<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">\n';
        gpx += '  <metadata>\n';
        gpx += '    <name>Export Véhicules</name>\n';
        gpx += `    <time>${new Date().toISOString()}</time>\n`;
        gpx += '  </metadata>\n';
        vehiclesToExport.forEach(v => {
            if (v.currentLat && v.currentLng) {
                gpx += '  <wpt lat="' + v.currentLat + '" lon="' + v.currentLng + '">\n';
                gpx += `    <name>${v.name}</name>\n`;
                gpx += `    <desc>Plaque: ${v.plate || 'N/A'}</desc>\n`;
                gpx += '  </wpt>\n';
            }
        });
        gpx += '</gpx>';
        return gpx;
    };
    const exportToFormat = (format, vehiclesToExport = vehicles) => {
        if (vehiclesToExport.length === 0)
            return;
        const timestamp = new Date().toISOString().split('T')[0];
        let blob;
        let filename;
        switch (format) {
            case 'kml':
                blob = new Blob([generateKMLData(vehiclesToExport)], { type: 'application/vnd.google-earth.kml+xml' });
                filename = `vehicles_${timestamp}.kml`;
                break;
            case 'gpx':
                blob = new Blob([generateGPXData(vehiclesToExport)], { type: 'application/gpx+xml' });
                filename = `vehicles_${timestamp}.gpx`;
                break;
            case 'xlsx':
                const headers = ['Nom', 'Plaque', 'Type', 'VIN', 'Statut', 'Vitesse', 'Dernière comm'];
                const rows = vehiclesToExport.map(v => [
                    v.name, v.plate, v.type || '-', v.vin || '-', v.status,
                    formatSpeed(v.currentSpeed), formatTimeAgo(v.lastCommunication)
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
                blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                filename = `vehicles_${timestamp}.xlsx`;
                break;
            default:
                return;
        }
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.click();
        URL.revokeObjectURL(url);
    };
    const exportSelected = () => {
        const selectedVehicles = vehicles.filter(v => selectedIds.has(v.id));
        exportToFormat('csv', selectedVehicles);
        setSelectedIds(new Set());
    };
    const saveScheduledExport = () => {
        if (!newScheduledExport.name)
            return;
        const id = Math.random().toString(36).substring(7);
        const nextRun = new Date();
        if (newScheduledExport.frequency === 'daily')
            nextRun.setDate(nextRun.getDate() + 1);
        else if (newScheduledExport.frequency === 'weekly')
            nextRun.setDate(nextRun.getDate() + 7);
        else if (newScheduledExport.frequency === 'monthly')
            nextRun.setMonth(nextRun.getMonth() + 1);
        const export_ = {
            id,
            name: newScheduledExport.name,
            format: newScheduledExport.format,
            frequency: newScheduledExport.frequency,
            nextRun: nextRun.toISOString().split('T')[0]
        };
        const updated = [...scheduledExports, export_];
        setScheduledExports(updated);
        localStorage.setItem('scheduledExports', JSON.stringify(updated));
        setNewScheduledExport({ name: '', format: 'csv', frequency: 'daily' });
    };
    const deleteScheduledExport = (id) => {
        const updated = scheduledExports.filter(e => e.id !== id);
        setScheduledExports(updated);
        localStorage.setItem('scheduledExports', JSON.stringify(updated));
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
    return (_jsxs("div", { className: "space-y-6 bg-[#F5F7FA] min-h-screen p-4 md:p-6", children: [_jsx("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 font-sans", children: "Catalogue V\u00E9hicules" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Gestion de la flotte Mat\u00E9riel Tech+" })] }) }), _jsx("div", { className: "border-b border-gray-200", children: _jsxs("div", { className: "flex gap-8", children: [_jsxs("button", { onClick: () => setActiveTab('vehicles'), className: `py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'vehicles'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'}`, children: ["V\u00C9HICULES (", vehicles.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('groups'), className: `py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'groups'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-900'}`, children: ["GROUPES (", groups.length, ")"] })] }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", onClick: () => setIsImportDialogOpen(true), children: [_jsx(Upload, { size: 16 }), "IMPORTER"] }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", onClick: () => setShowExportMenu(!showExportMenu), children: [_jsx(FileDown, { size: 16 }), "EXPORTER"] }), showExportMenu && (_jsxs("div", { className: "absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 w-48", children: [_jsx("button", { onClick: () => { exportToCSV(); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "CSV (Tous)" }), _jsx("button", { onClick: () => { exportToFormat('xlsx'); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "Excel XLSX" }), _jsx("button", { onClick: () => { exportToFormat('kml'); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "Google Earth (KML)" }), _jsx("button", { onClick: () => { exportToFormat('gpx'); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50", children: "GPS Format (GPX)" })] }))] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", onClick: exportConducteursCSV, children: [_jsx(FileDown, { size: 16 }), "CONDUCTEURS CSV"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", onClick: () => setShowScheduledExports(!showScheduledExports), children: [_jsx(Clock, { size: 16 }), "EXPORTS PROGRAMM\u00C9S"] }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "R\u00D4LES" }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "AUDIT" }), _jsx(Button, { variant: "outline", size: "sm", className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "ATTRIBUTION" })] }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-[#9CA3AF]", size: 18 }), _jsx(Input, { type: "search", placeholder: "Rechercher par nom ou immatriculation...", value: searchTerm, onChange: (e) => {
                                        setSearchTerm(e.target.value);
                                        setPage(1);
                                    }, className: "pl-10 bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] }) }), _jsxs("select", { value: selectedType, onChange: (e) => {
                            setSelectedType(e.target.value);
                            setPage(1);
                        }, className: "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Tous types" }), _jsx("option", { value: "voiture", children: "Voiture" }), _jsx("option", { value: "camion", children: "Camion" }), _jsx("option", { value: "utilitaire", children: "V\u00E9hicule utilitaire" }), _jsx("option", { value: "engin", children: "Engin de chantier" }), _jsx("option", { value: "moto", children: "Moto" }), _jsx("option", { value: "bateau", children: "Bateau" }), _jsx("option", { value: "divers", children: "Divers" })] }), _jsxs("select", { value: selectedGroup, onChange: (e) => {
                            setSelectedGroup(e.target.value);
                            setPage(1);
                        }, className: "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Filtrer par groupe" }), groups.map(group => (_jsx("option", { value: group.id, children: group.name }, group.id)))] }), _jsxs("select", { value: selectedSource, onChange: (e) => {
                            setSelectedSource(e.target.value);
                            setPage(1);
                        }, className: "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Toutes sources" }), _jsx("option", { value: "echoes", children: "ECHOES" }), _jsx("option", { value: "ubiwan", children: "UBIWAN" }), _jsx("option", { value: "keeptrace", children: "KEEPTRACE" })] }), _jsxs("select", { value: selectedStatus, onChange: (e) => {
                            setSelectedStatus(e.target.value);
                            setPage(1);
                        }, className: "rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "Tous statuts" }), _jsx("option", { value: "active", children: "ACTIF" }), _jsx("option", { value: "offline", children: "HORS LIGNE" })] }), _jsxs("div", { className: "text-sm font-medium text-gray-900", children: [vehicles.length, " r\u00E9sultat", vehicles.length !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", className: "gap-2 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", onClick: () => setViewMode('list'), children: _jsx(List, { size: 16 }) }), _jsx(Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", className: "gap-2 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", onClick: () => setViewMode('grid'), children: _jsx(LayoutGrid, { size: 16 }) })] }), _jsxs(Button, { className: "gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold", onClick: openCreateModal, children: [_jsx(Plus, { size: 18 }), "AJOUTER UN TRACEUR"] })] }), activeTab === 'vehicles' && (_jsxs(_Fragment, { children: [isLoading ? (_jsx("div", { className: viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2', children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: `${viewMode === 'grid' ? 'h-48' : 'h-12'} bg-white` }, i))) })) : vehicles.length === 0 ? (_jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-gray-900", children: "Aucun v\u00E9hicule trouv\u00E9" }) }) })) : viewMode === 'grid' ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: vehicles.map((vehicle) => (_jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow", children: [_jsx("div", { className: "h-32 bg-white border-b border-gray-200 flex items-center justify-center overflow-hidden relative group", children: vehicle.metadata?.photoUrl ? (_jsx("img", { src: vehicle.metadata.photoUrl, alt: vehicle.name, className: "w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer", onClick: () => window.open(vehicle.metadata.photoUrl, '_blank') })) : (_jsxs("div", { className: "flex flex-col items-center gap-2 text-[#9CA3AF]", children: [_jsx(ImageIcon, { size: 32 }), _jsx("span", { className: "text-xs", children: "Pas de photo" })] })) }), _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx(CardTitle, { className: "text-gray-900 cursor-pointer hover:text-blue-600 transition-colors font-sans", onClick: () => navigate(`/vehicles/${vehicle.id}`), children: vehicle.name }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: vehicle.plate || 'N/A' })] }), _jsx("input", { type: "checkbox", checked: selectedIds.has(vehicle.id), onChange: () => toggleSelectVehicle(vehicle.id), className: "rounded" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-sm", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "Type" }), _jsxs("p", { className: "font-medium text-gray-900 font-mono", children: [vehicle.type === 'voiture' && 'Voiture', vehicle.type === 'camion' && 'Camion', vehicle.type === 'utilitaire' && 'Utilitaire', vehicle.type === 'engin' && 'Engin', vehicle.type === 'moto' && 'Moto', vehicle.type === 'bateau' && 'Bateau', vehicle.type === 'divers' && 'Divers', !['voiture', 'camion', 'utilitaire', 'engin', 'moto', 'bateau', 'divers'].includes(vehicle.type || '') && (vehicle.type || 'N/A')] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500", children: "VIN" }), _jsx("p", { className: "font-medium text-gray-900 truncate font-mono", children: vehicle.vin ? vehicle.vin.substring(0, 8) : 'N/A' })] })] }), _jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Badge, { variant: vehicle.status === 'active' ? 'default' : 'destructive', className: vehicle.status === 'active' ? 'bg-blue-600 bg-opacity-20 text-blue-600' : 'bg-red-500 bg-opacity-20 text-red-500', children: vehicle.status === 'active' ? 'ACTIF' : 'HORS LIGNE' }), _jsx("span", { className: "text-xs text-[#9CA3AF]", children: vehicle.metadata?.source || 'ECHOES' })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 gap-2 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", onClick: () => openEditModal(vehicle), children: [_jsx(Edit2, { size: 14 }), "\u00C9diter"] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-red-500 hover:text-red-600 hover:bg-red-50 bg-gray-100 border border-gray-200", onClick: () => setDeleteConfirmId(vehicle.id), children: _jsx(Trash2, { size: 14 }) })] })] })] }, vehicle.id))) })) : (_jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200 bg-gray-50", children: [_jsx("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 w-12 uppercase tracking-wider", children: _jsx("input", { type: "checkbox", checked: selectAllChecked && vehicles.length > 0, onChange: (e) => toggleSelectAll(e.target.checked), className: "rounded", title: "S\u00E9lectionner tous" }) }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "NOM" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "VIN / IMEI" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "PLAQUE" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "CAT\u00C9GORIE" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "\u00C9TAT" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "DISPONIBILIT\u00C9" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "SOURCE" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "ACTIONS" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: vehicles.map((vehicle) => (_jsxs("tr", { className: "hover:bg-blue-50/50 border-b border-gray-100 transition-colors", children: [_jsx("td", { className: "px-4 py-4 text-sm font-medium text-gray-900 w-12", children: _jsx("input", { type: "checkbox", checked: selectedIds.has(vehicle.id), onChange: () => toggleSelectVehicle(vehicle.id), className: "rounded" }) }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: _jsx("button", { onClick: () => navigate(`/vehicles/${vehicle.id}`), className: "hover:text-blue-600 hover:underline transition-colors", children: vehicle.name }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: (vehicle.vin || vehicle.metadata?.imei || vehicle.metadata?.deviceId || '—') }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 font-mono", children: vehicle.plate || '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-900 capitalize", children: vehicle.type ? (_jsx(_Fragment, { children: (() => {
                                                            const t = vehicle.type.toLowerCase();
                                                            if (t === 'voiture' || t === 'car')
                                                                return 'Voiture';
                                                            if (t === 'camion' || t === 'truck')
                                                                return 'Camion';
                                                            if (t === 'utilitaire' || t === 'van' || t === 'utility')
                                                                return 'Utilitaire';
                                                            if (t === 'engin' || t === 'machinery' || t === 'equipment')
                                                                return 'Engin';
                                                            if (t === 'moto' || t === 'motorcycle')
                                                                return 'Moto';
                                                            if (t === 'bateau' || t === 'boat')
                                                                return 'Bateau';
                                                            if (t === 'divers' || t === 'other')
                                                                return 'Divers';
                                                            return vehicle.type;
                                                        })() })) : '—' }), _jsx("td", { className: "px-6 py-4 text-sm", children: vehicle.status === 'active' ? (_jsx("span", { className: "text-blue-600 font-semibold", children: "ACTIF" })) : (_jsx("span", { className: "text-gray-500 font-semibold", children: "HORS LIGNE" })) }), _jsx("td", { className: "px-6 py-4 text-sm", children: vehicle.status === 'active' ? (_jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200", children: "Disponible" })) : vehicle.status === 'maintenance' ? (_jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200", children: "En maintenance" })) : (_jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200", children: "Indisponible" })) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: "text-blue-600 font-semibold", children: vehicle.metadata?.source || 'ECHOES' }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    openEditModal(vehicle);
                                                                }, title: "Modifier", className: "text-gray-900 hover:text-blue-600", children: _jsx(Edit2, { size: 16 }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: (e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteConfirmId(vehicle.id);
                                                                }, title: "Supprimer", className: "text-gray-900 hover:text-red-500", children: _jsx(Trash2, { size: 16 }) })] }) })] }, vehicle.id))) })] }) }) })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-900", children: ["Page ", page, " sur ", totalPages, " \u2014 ", vehiclesData?.total || vehicles.length, " v\u00E9hicule", (vehiclesData?.total || vehicles.length) > 1 ? 's' : '', " au total"] }), totalPages > 1 && (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, className: "text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "Pr\u00E9c\u00E9dent" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, className: "text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "Suivant" })] }))] })] })), activeTab === 'groups' && (_jsx(_Fragment, { children: groupsLoading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [...Array(3)].map((_, i) => (_jsx(Skeleton, { className: "h-48 bg-white" }, i))) })) : groups.length === 0 ? (_jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-gray-900", children: "Aucun groupe configur\u00E9" }) }) })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: groups.map((group) => (_jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-gray-900 font-sans", children: group.name }), _jsx("p", { className: "text-sm text-gray-500 mt-2", children: group.description || 'Pas de description' })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs(Badge, { variant: "secondary", className: "bg-gray-100 text-gray-700 border border-gray-200", children: [group.vehicleCount || 0, " v\u00E9hicules"] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "flex-1 gap-2 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", children: [_jsx(Edit2, { size: 14 }), "\u00C9diter"] }), _jsx(Button, { variant: "outline", size: "sm", className: "text-red-500 hover:text-red-600 hover:bg-red-50 bg-gray-100 border border-gray-200", children: _jsx(Trash2, { size: 14 }) })] })] })] }, group.id))) })) })), selectedIds.size > 0 && (_jsxs("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-3 flex-wrap max-w-3xl z-40", children: [_jsxs("span", { className: "text-sm font-medium text-gray-900 w-full sm:w-auto", children: [selectedIds.size, " v\u00E9hicule", selectedIds.size > 1 ? 's' : '', " s\u00E9lectionn\u00E9", selectedIds.size > 1 ? 's' : ''] }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowExportMenu(!showExportMenu), className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: [_jsx(Download, { size: 16 }), "Exporter"] }), showExportMenu && (_jsxs("div", { className: "absolute bottom-10 left-0 bg-white border border-gray-200 rounded-lg shadow-sm z-50 w-48", children: [_jsx("button", { onClick: () => { exportSelected(); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "CSV" }), _jsx("button", { onClick: () => { exportToFormat('xlsx', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "Excel XLSX" }), _jsx("button", { onClick: () => { exportToFormat('kml', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 border-b border-gray-100", children: "KML" }), _jsx("button", { onClick: () => { exportToFormat('gpx', vehicles.filter(v => selectedIds.has(v.id))); setShowExportMenu(false); }, className: "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50", children: "GPX" })] }))] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowBulkChangeGroup(true), className: "gap-2 text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: [_jsx(ChevronDown, { size: 16 }), "Changer groupe"] }), _jsxs(Button, { variant: "destructive", size: "sm", onClick: () => setShowBulkDeleteConfirm(true), className: "gap-2 bg-red-600 hover:bg-red-700 text-white", children: [_jsx(Trash2, { size: 16 }), "Supprimer (", selectedIds.size, ")"] })] })), _jsx(Dialog, { open: isImportDialogOpen, onOpenChange: setIsImportDialogOpen, children: _jsxs(DialogContent, { className: "max-w-2xl bg-white border border-gray-200 rounded-lg shadow-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Importer des v\u00E9hicules" }), _jsx(DialogDescription, { className: "text-gray-500", children: "Importez des v\u00E9hicules \u00E0 partir d'un fichier CSV ou XLSX" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Fichier CSV/XLSX" }), _jsxs("div", { className: "border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-600 transition-colors cursor-pointer", onClick: () => fileInputRef.current?.click(), children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".csv,.xlsx", onChange: handleFileSelect, className: "hidden" }), _jsx(Upload, { className: "h-8 w-8 mx-auto mb-2 text-[#9CA3AF]" }), _jsx("p", { className: "text-gray-900", children: importFile ? importFile.name : 'Cliquez pour sélectionner un fichier' }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "CSV ou XLSX accept\u00E9s" })] })] }), importPreviewData.length > 0 && (_jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Mappage des colonnes" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: Object.keys(columnMapping).map(field => (_jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "text-xs text-gray-500", children: [field, " ", ['Nom', 'Plaque'].includes(field) ? '*' : ''] }), _jsxs("select", { value: columnMapping[field], onChange: (e) => setColumnMapping({ ...columnMapping, [field]: e.target.value }), className: "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600", children: [_jsx("option", { value: "", children: "S\u00E9lectionner..." }), Object.keys(importPreviewData[0] || {}).map(header => (_jsx("option", { value: header, children: header }, header)))] })] }, field))) })] })), importPreviewData.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Aper\u00E7u (premi\u00E8res 5 lignes)" }), _jsx("div", { className: "border border-gray-200 rounded-lg overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white border-b border-gray-200", children: _jsx("tr", { children: Object.keys(columnMapping)
                                                                .filter(field => columnMapping[field])
                                                                .map(field => (_jsx("th", { className: "px-4 py-2 text-left text-gray-900 font-medium", children: field }, field))) }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: importPreviewData.map((row, idx) => (_jsx("tr", { className: "hover:bg-gray-100", children: Object.keys(columnMapping)
                                                                .filter(field => columnMapping[field])
                                                                .map(field => (_jsx("td", { className: "px-4 py-2 text-gray-900", children: row[columnMapping[field]] }, field))) }, idx))) })] }) })] })), importErrors.length > 0 && (_jsx("div", { className: "bg-red-500 bg-opacity-10 border border-red-500 rounded-lg p-3", children: _jsxs("div", { className: "flex gap-2 items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" }), _jsx("div", { className: "text-sm text-red-500", children: importErrors.map((error, idx) => (_jsx("div", { children: error }, idx))) })] }) })), isImporting && importProgress > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-sm text-gray-900", children: [_jsx("span", { children: "Import en cours..." }), _jsxs("span", { children: [importProgress, "%"] })] }), _jsx("div", { className: "w-full bg-gray-100 rounded-full h-2 border border-gray-200", children: _jsx("div", { className: "bg-blue-600 h-full rounded-full transition-all", style: { width: `${importProgress}%` } }) })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsImportDialogOpen(false), disabled: isImporting, className: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", children: "Annuler" }), _jsx(Button, { onClick: handleImportVehicles, disabled: isImporting || importPreviewData.length === 0, className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold", children: isImporting ? `Import en cours (${importProgress}%)` : `Importer ${importPreviewData.length} véhicules` })] })] }) }), _jsx(Dialog, { open: showBulkChangeGroup, onOpenChange: setShowBulkChangeGroup, children: _jsxs(DialogContent, { className: "bg-white border border-gray-200 rounded-lg shadow-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Changer le groupe" }), _jsxs(DialogDescription, { className: "text-gray-500", children: ["S\u00E9lectionnez le groupe pour les ", selectedIds.size, " v\u00E9hicules s\u00E9lectionn\u00E9s"] })] }), _jsx("div", { className: "space-y-4 py-4", children: _jsxs("select", { value: bulkChangeGroupId, onChange: (e) => setBulkChangeGroupId(e.target.value), className: "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-blue-600", children: [_jsx("option", { value: "", children: "S\u00E9lectionner un groupe..." }), groups.map(group => (_jsx("option", { value: group.id, children: group.name }, group.id)))] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowBulkChangeGroup(false), className: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", children: "Annuler" }), _jsx(Button, { onClick: handleBulkChangeGroup, disabled: !bulkChangeGroupId, className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold", children: "Confirmer" })] })] }) }), _jsx(Dialog, { open: showBulkDeleteConfirm, onOpenChange: setShowBulkDeleteConfirm, children: _jsxs(DialogContent, { className: "bg-white border border-gray-200 rounded-lg shadow-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Confirmer la suppression" }), _jsxs(DialogDescription, { className: "text-gray-500", children: ["\u00CAtes-vous s\u00FBr de vouloir supprimer ", selectedIds.size, " v\u00E9hicules ? Cette action est irr\u00E9versible."] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowBulkDeleteConfirm(false), className: "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200", children: "Annuler" }), _jsx(Button, { onClick: handleBulkDelete, className: "bg-red-600 hover:bg-red-700 text-white", children: "Supprimer" })] })] }) }), _jsx(Dialog, { open: isModalOpen, onOpenChange: setIsModalOpen, children: _jsxs(DialogContent, { className: "max-w-lg bg-white border border-gray-200 rounded-lg shadow-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: editingVehicle ? 'Modifier le véhicule' : 'Nouveau véhicule' }), _jsx(DialogDescription, { className: "text-gray-500", children: editingVehicle ? 'Mettre à jour les informations du véhicule' : 'Ajouter un nouveau véhicule à votre flotte' })] }), _jsxs("div", { className: "space-y-4 py-4 max-h-[60vh] overflow-y-auto", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Nom *" }), _jsx(Input, { value: formData.name, onChange: (e) => setFormData(p => ({ ...p, name: e.target.value })), placeholder: "Camion A1", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Immatriculation *" }), _jsx(Input, { value: formData.plate, onChange: (e) => setFormData(p => ({ ...p, plate: e.target.value })), placeholder: "AB-123-CD", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "VIN" }), _jsx(Input, { value: formData.vin, onChange: (e) => setFormData(p => ({ ...p, vin: e.target.value })), placeholder: "WDB1234567F123456", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Type" }), _jsxs("select", { value: formData.type, onChange: (e) => setFormData(p => ({ ...p, type: e.target.value })), className: "w-full rounded-lg border border-gray-200 bg-white text-gray-900 px-3 py-2 text-sm", children: [_jsx("option", { value: "voiture", children: "Voiture" }), _jsx("option", { value: "camion", children: "Camion" }), _jsx("option", { value: "utilitaire", children: "V\u00E9hicule utilitaire" }), _jsx("option", { value: "engin", children: "Engin de chantier" }), _jsx("option", { value: "moto", children: "Moto" }), _jsx("option", { value: "bateau", children: "Bateau" }), _jsx("option", { value: "divers", children: "Divers" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Ann\u00E9e" }), _jsx(Input, { type: "number", value: formData.year, onChange: (e) => setFormData(p => ({ ...p, year: parseInt(e.target.value) || 0 })), placeholder: "2024", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Marque" }), _jsx(Input, { value: formData.brand, onChange: (e) => setFormData(p => ({ ...p, brand: e.target.value })), placeholder: "Renault", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Mod\u00E8le" }), _jsx(Input, { value: formData.model, onChange: (e) => setFormData(p => ({ ...p, model: e.target.value })), placeholder: "Master", className: "bg-white border border-gray-200 text-gray-900 placeholder:text-[#9CA3AF] focus:border-blue-600 rounded-lg" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-900", children: "Notes" }), _jsx("textarea", { value: formData.notes, onChange: (e) => setFormData(p => ({ ...p, notes: e.target.value })), placeholder: "Informations suppl\u00E9mentaires...", className: "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-[#9CA3AF]", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setIsModalOpen(false), className: "text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "Annuler" }), _jsx(Button, { onClick: handleSubmitVehicle, disabled: createVehicle.isPending || updateVehicleMutation.isPending, className: "bg-blue-600 hover:bg-blue-700 text-white font-semibold", children: (createVehicle.isPending || updateVehicleMutation.isPending) ? 'Enregistrement...' : editingVehicle ? 'Mettre à jour' : 'Créer' })] })] }) }), _jsx(Dialog, { open: !!deleteConfirmId, onOpenChange: () => setDeleteConfirmId(null), children: _jsxs(DialogContent, { className: "bg-white border border-gray-200 rounded-lg shadow-lg", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-gray-900 font-sans", children: "Confirmer la suppression" }), _jsx(DialogDescription, { className: "text-gray-500", children: "\u00CAtes-vous s\u00FBr de vouloir supprimer ce v\u00E9hicule ? Cette action est irr\u00E9versible." })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setDeleteConfirmId(null), className: "text-gray-700 bg-gray-100 border border-gray-200 hover:bg-gray-200", children: "Annuler" }), _jsx(Button, { variant: "destructive", onClick: handleDeleteVehicle, disabled: deleteVehicleMutation.isPending, className: "bg-red-600 hover:bg-red-700", children: deleteVehicleMutation.isPending ? 'Suppression...' : 'Supprimer' })] })] }) })] }));
}
//# sourceMappingURL=VehiclesPage.js.map