'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { BarChart3, Download, FileText, Calendar, Car, Filter, Clock, CheckCircle, Loader2, FileSpreadsheet, File, Printer, Mail, Clock as ClockIcon, AlertCircle, } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useVehicles } from '@/hooks/useVehicles';
const REPORT_TYPE_CONFIG = {
    trip: {
        title: 'Trip Report',
        description: 'Detailed trip information with distance, duration, and route',
        icon: FileText,
    },
    fuel: {
        title: 'Fuel Report',
        description: 'Fuel consumption analysis and optimization recommendations',
        icon: BarChart3,
    },
    driver: {
        title: 'Driver Report',
        description: 'Driver behavior analysis and performance metrics',
        icon: FileText,
    },
    fleet: {
        title: 'Fleet Report',
        description: 'Overall fleet performance and utilization statistics',
        icon: BarChart3,
    },
    maintenance: {
        title: 'Maintenance Report',
        description: 'Maintenance schedule and service history',
        icon: FileText,
    },
    compliance: {
        title: 'Compliance Report',
        description: 'Alert violations and compliance metrics',
        icon: BarChart3,
    },
};
const FORMAT_ICONS = {
    pdf: FileText,
    excel: FileSpreadsheet,
    csv: File,
};
const reportTemplates = [
    {
        name: 'Rapport hebdomadaire flotte',
        description: 'Rapport hebdomadaire, tous les véhicules, PDF',
        type: 'fleet',
        frequency: 'weekly',
        format: 'pdf',
        icon: BarChart3,
    },
    {
        name: 'Rapport mensuel conducteurs',
        description: 'Rapport mensuel, performance des conducteurs, Excel',
        type: 'driver',
        frequency: 'monthly',
        format: 'excel',
        icon: FileText,
    },
    {
        name: 'Rapport quotidien alertes',
        description: 'Rapport quotidien, résumé des alertes, Email',
        type: 'compliance',
        frequency: 'daily',
        format: 'pdf',
        icon: BarChart3,
    },
];
export default function ReportsPage() {
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    // State for report generation dialog
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [showEmailDialog, setShowEmailDialog] = useState(false);
    // Form state
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [reportFormat, setReportFormat] = useState('pdf');
    const [isGenerating, setIsGenerating] = useState(false);
    // Schedule state
    const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
    const [scheduleEmail, setScheduleEmail] = useState('');
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleError, setScheduleError] = useState('');
    // Email state
    const [emailRecipient, setEmailRecipient] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');
    // Error state
    const [generationError, setGenerationError] = useState('');
    // Generated reports state — starts empty, populated via API
    const [generatedReports, setGeneratedReports] = useState([]);
    // Load report history from API
    useEffect(() => {
        const loadReportHistory = async () => {
            if (!orgId)
                return;
            try {
                const response = await apiClient.get(`${API_ROUTES.REPORTS_GENERATE(orgId)}/history`);
                const data = response.data;
                if (Array.isArray(data)) {
                    setGeneratedReports(data.map((r) => ({
                        ...r,
                        generatedAt: new Date(r.generatedAt || r.createdAt),
                        dateFrom: new Date(r.dateFrom),
                        dateTo: new Date(r.dateTo),
                    })));
                }
            }
            catch {
                // API may not have history endpoint yet — keep empty
            }
        };
        loadReportHistory();
    }, [orgId]);
    // Fetch real vehicles from API
    const { data: vehiclesData } = useVehicles({ limit: 500 });
    const vehicles = (vehiclesData?.data || []).map((v) => ({
        id: v.id,
        name: v.name || v.plate || 'Sans nom',
        plate: v.plate || '—',
    }));
    const handleOpenDialog = useCallback((reportType) => {
        setSelectedReportType(reportType);
        setSelectedVehicles([]);
        setReportFormat('pdf');
        setDialogOpen(true);
    }, []);
    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setSelectedReportType(null);
        setGenerationError('');
    }, []);
    const applyDateRange = useCallback((range) => {
        const today = new Date();
        let newDateFrom;
        let newDateTo = today;
        switch (range) {
            case 'today':
                newDateFrom = today;
                break;
            case 'week':
                newDateFrom = startOfWeek(today, { weekStartsOn: 1 });
                break;
            case 'month':
                newDateFrom = startOfMonth(today);
                break;
            case 'lastMonth':
                const firstOfThisMonth = startOfMonth(today);
                newDateTo = subDays(firstOfThisMonth, 1);
                newDateFrom = startOfMonth(newDateTo);
                break;
            default:
                return;
        }
        setDateFrom(format(newDateFrom, 'yyyy-MM-dd'));
        setDateTo(format(newDateTo, 'yyyy-MM-dd'));
    }, []);
    const handleVehicleToggle = useCallback((vehicleId) => {
        setSelectedVehicles((prev) => prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]);
    }, []);
    const handleGenerateReport = useCallback(async () => {
        if (!selectedReportType || !orgId) {
            setGenerationError('Type de rapport non sélectionné');
            return;
        }
        setIsGenerating(true);
        setGenerationError('');
        try {
            const payload = {
                type: selectedReportType,
                dateFrom: dateFrom,
                dateTo: dateTo,
                vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
                format: reportFormat,
            };
            const response = await apiClient.post(API_ROUTES.REPORTS_GENERATE(orgId), payload);
            const result = response.data || {};
            // Add new report to the list
            const newReport = {
                id: result.id || `report-${Date.now()}`,
                type: selectedReportType,
                format: reportFormat,
                status: result.status || 'completed',
                generatedAt: new Date(),
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo),
                vehicleCount: selectedVehicles.length || undefined,
                downloadUrl: result.downloadUrl,
            };
            setGeneratedReports((prev) => [newReport, ...prev]);
            handleCloseDialog();
        }
        catch (error) {
            console.error('Failed to generate report:', error);
            setGenerationError(error instanceof Error
                ? error.message
                : 'Erreur lors de la génération du rapport');
        }
        finally {
            setIsGenerating(false);
        }
    }, [selectedReportType, orgId, dateFrom, dateTo, selectedVehicles, reportFormat, handleCloseDialog]);
    const handleDownloadReport = useCallback((report) => {
        if (report.downloadUrl) {
            const link = document.createElement('a');
            link.href = report.downloadUrl;
            link.download = `${report.type}-report.${report.format === 'excel' ? 'xlsx' : report.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, []);
    const applyTemplate = useCallback((template) => {
        setSelectedReportType(template.type);
        setReportFormat(template.format);
        setDialogOpen(true);
    }, []);
    const handlePrint = useCallback(() => {
        window.print();
    }, []);
    const handleSendEmail = useCallback(async () => {
        if (!emailRecipient || !emailSubject || !orgId) {
            setEmailError('Veuillez remplir tous les champs requis');
            return;
        }
        setIsSendingEmail(true);
        setEmailError('');
        try {
            const payload = {
                recipient: emailRecipient,
                subject: emailSubject,
                message: emailMessage,
                reportType: selectedReportType,
                dateFrom: dateFrom,
                dateTo: dateTo,
                vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
                format: reportFormat,
            };
            await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/email`, payload);
            setShowEmailDialog(false);
            setEmailRecipient('');
            setEmailSubject('');
            setEmailMessage('');
        }
        catch (error) {
            console.error('Failed to send email:', error);
            setEmailError(error instanceof Error
                ? error.message
                : 'Erreur lors de l\'envoi de l\'email');
        }
        finally {
            setIsSendingEmail(false);
        }
    }, [emailRecipient, emailSubject, orgId, selectedReportType, dateFrom, dateTo, selectedVehicles, reportFormat]);
    const handleScheduleReport = useCallback(async () => {
        if (!scheduleEmail || !selectedReportType || !orgId) {
            setScheduleError('Veuillez remplir tous les champs requis');
            return;
        }
        setIsScheduling(true);
        setScheduleError('');
        try {
            const payload = {
                reportType: selectedReportType,
                frequency: scheduleFrequency,
                recipientEmail: scheduleEmail,
                dateFrom: dateFrom,
                dateTo: dateTo,
                vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
                format: reportFormat,
            };
            await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/schedule`, payload);
            setShowScheduleForm(false);
            setScheduleEmail('');
        }
        catch (error) {
            console.error('Failed to schedule report:', error);
            setScheduleError(error instanceof Error
                ? error.message
                : 'Erreur lors de la programmation du rapport');
        }
        finally {
            setIsScheduling(false);
        }
    }, [scheduleEmail, selectedReportType, orgId, scheduleFrequency, dateFrom, dateTo, selectedVehicles, reportFormat]);
    const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
        type: key,
        ...config,
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5]", children: "Rapports" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "G\u00E9n\u00E9rer et t\u00E9l\u00E9charger les rapports de flotte" })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5] mb-3", children: "Mod\u00E8les de rapports" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: reportTemplates.map((template) => {
                            const Icon = template.icon;
                            return (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D] transition-colors cursor-pointer", onClick: () => applyTemplate(template), children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base text-[#F0F0F5]", children: template.name }), _jsx(CardDescription, { className: "text-xs text-[#6B6B80]", children: template.description })] }), _jsx(Icon, { className: "text-[#00E5CC] flex-shrink-0", size: 20 })] }) }) }, template.name));
                        }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5] mb-3", children: "Cr\u00E9er un rapport personnalis\u00E9" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reportTypes.map((report) => {
                            const Icon = report.icon;
                            return (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D] transition-colors cursor-pointer", onClick: () => handleOpenDialog(report.type), children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg text-[#F0F0F5]", children: report.title }), _jsx(CardDescription, { className: "text-sm text-[#6B6B80]", children: report.description })] }), _jsx(Icon, { className: "text-[#00E5CC] flex-shrink-0", size: 24 })] }) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outline", className: "w-full gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#00E5CC] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", onClick: () => handleOpenDialog(report.type), children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] }) })] }, report.type));
                        }) })] }), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez les param\u00E8tres du rapport et le format de t\u00E9l\u00E9chargement" })] }), _jsxs("div", { className: "space-y-6 py-4", children: [generationError && (_jsxs("div", { className: "flex gap-3 p-4 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 18, className: "text-[#FF4D6A] flex-shrink-0" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: generationError })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "P\u00E9riode" })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('today'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Aujourd'hui" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('week'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Cette semaine" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('month'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Ce mois" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('lastMonth'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Mois dernier" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "De" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "w-full bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "\u00C0" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "w-full bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Car, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "V\u00E9hicules (Optionnel)" })] }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Laissez vide pour inclure tous les v\u00E9hicules de votre flotte" }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-h-48 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-[#1F1F2E] rounded-lg bg-[#1A1A25] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] cursor-pointer transition-colors", children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.includes(vehicle.id), onChange: () => handleVehicleToggle(vehicle.id), className: "rounded border-[#1F1F2E] accent-[#00E5CC]" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: vehicle.name }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.plate })] })] }, vehicle.id))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "Format du rapport" })] }), _jsx("div", { className: "flex gap-3", children: ['pdf', 'excel', 'csv'].map((format) => {
                                                const Icon = FORMAT_ICONS[format];
                                                return (_jsxs("button", { onClick: () => setReportFormat(format), className: `flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${reportFormat === format
                                                        ? 'border-[#00E5CC] bg-[#00E5CC]/10 text-[#00E5CC]'
                                                        : 'border-[#1F1F2E] text-[#6B6B80] hover:border-[#2A2A3D] hover:bg-[#1A1A25]'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { className: "text-sm font-medium capitalize", children: format })] }, format));
                                            }) })] })] }), _jsxs(DialogFooter, { className: "flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", onClick: handleCloseDialog, disabled: isGenerating, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsxs(Button, { variant: "outline", onClick: () => setShowScheduleForm(!showScheduleForm), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(ClockIcon, { size: 16 }), "Programmer"] }), _jsxs(Button, { variant: "outline", onClick: handlePrint, className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Printer, { size: 16 }), "Imprimer"] }), _jsxs(Button, { variant: "outline", onClick: () => setShowEmailDialog(true), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Mail, { size: 16 }), "Email"] }), _jsx(Button, { onClick: handleGenerateReport, disabled: isGenerating, className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin" }), "G\u00E9n\u00E9ration..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] })) })] })] }) }), showScheduleForm && (_jsx(Dialog, { open: showScheduleForm, onOpenChange: setShowScheduleForm, children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: "Programmer la g\u00E9n\u00E9ration du rapport" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez la fr\u00E9quence d'envoi automatique du rapport" })] }), _jsxs("div", { className: "space-y-4", children: [scheduleError && (_jsxs("div", { className: "flex gap-3 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 16, className: "text-[#FF4D6A] flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: scheduleError })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Fr\u00E9quence" }), _jsxs("select", { value: scheduleFrequency, onChange: (e) => setScheduleFrequency(e.target.value), className: "w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50", children: [_jsx("option", { value: "daily", children: "Quotidien" }), _jsx("option", { value: "weekly", children: "Hebdomadaire" }), _jsx("option", { value: "monthly", children: "Mensuel" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Email de livraison *" }), _jsx(Input, { type: "email", value: scheduleEmail, onChange: (e) => setScheduleEmail(e.target.value), placeholder: "votre.email@exemple.com", disabled: isScheduling, className: "bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Prochain envoi" }), _jsxs("div", { className: "text-sm text-[#6B6B80]", children: [scheduleFrequency === 'daily' && 'Demain à 08:00', scheduleFrequency === 'weekly' && 'Lundi prochain à 09:00', scheduleFrequency === 'monthly' && '1er du mois prochain à 09:00'] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowScheduleForm(false), disabled: isScheduling, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsx(Button, { onClick: handleScheduleReport, disabled: isScheduling, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isScheduling ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin mr-2" }), "Programmation..."] })) : ('Enregistrer') })] })] }) })), _jsx(Dialog, { open: showEmailDialog, onOpenChange: setShowEmailDialog, children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: "Envoyer le rapport par email" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez les d\u00E9tails de l'email avant d'envoyer" })] }), _jsxs("div", { className: "space-y-4", children: [emailError && (_jsxs("div", { className: "flex gap-3 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 16, className: "text-[#FF4D6A] flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: emailError })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Destinataire *" }), _jsx(Input, { type: "email", value: emailRecipient, onChange: (e) => setEmailRecipient(e.target.value), placeholder: "destinataire@exemple.com", disabled: isSendingEmail, className: "bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Objet *" }), _jsx(Input, { value: emailSubject, onChange: (e) => setEmailSubject(e.target.value), placeholder: selectedReportType ? REPORT_TYPE_CONFIG[selectedReportType].title : 'Objet du rapport', disabled: isSendingEmail, className: "bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Message" }), _jsx("textarea", { value: emailMessage, onChange: (e) => setEmailMessage(e.target.value), placeholder: "Votre message...", className: "w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#44445A] resize-none focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50", rows: 3, disabled: isSendingEmail })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowEmailDialog(false), disabled: isSendingEmail, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsx(Button, { onClick: handleSendEmail, disabled: isSendingEmail, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isSendingEmail ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin mr-2" }), "Envoi..."] })) : ('Envoyer') })] })] }) }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Rapports g\u00E9n\u00E9r\u00E9s" }), _jsx(Badge, { variant: "secondary", className: "bg-[#1A1A25] text-[#F0F0F5] border border-[#1F1F2E]", children: generatedReports.length })] }) }), _jsx(CardContent, { children: generatedReports.length === 0 ? (_jsxs("div", { className: "space-y-3 text-center py-12", children: [_jsx("p", { className: "text-[#6B6B80]", children: "Aucun rapport g\u00E9n\u00E9r\u00E9 encore" }), _jsxs(Button, { variant: "outline", onClick: () => handleOpenDialog('trip'), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#00E5CC] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer votre premier rapport"] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Type de rapport" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "P\u00E9riode" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Format" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Statut" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "G\u00E9n\u00E9r\u00E9" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-[#F0F0F5]", children: "Action" })] }) }), _jsx("tbody", { children: generatedReports.map((report) => {
                                            const reportConfig = REPORT_TYPE_CONFIG[report.type];
                                            const formatIcon = FORMAT_ICONS[report.format];
                                            return (_jsxs("tr", { className: "border-b border-[#1A1A25] hover:bg-[#1A1A25] transition-colors", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(reportConfig.icon, { size: 16, className: "text-[#6B6B80] flex-shrink-0" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: reportConfig.title })] }) }), _jsxs("td", { className: "px-4 py-3 text-[#6B6B80]", children: [format(report.dateFrom, 'dd MMM, yyyy'), " -", ' ', format(report.dateTo, 'dd MMM, yyyy')] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-[#6B6B80]' }), _jsx("span", { className: "capitalize text-[#6B6B80]", children: report.format })] }) }), _jsxs("td", { className: "px-4 py-3", children: [report.status === 'completed' && (_jsxs(Badge, { className: "bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/30 flex w-fit gap-1", children: [_jsx(CheckCircle, { size: 14 }), "Compl\u00E9t\u00E9"] })), report.status === 'pending' && (_jsxs(Badge, { className: "bg-[#FFB547]/10 text-[#FFB547] border border-[#FFB547]/30 flex w-fit gap-1", children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), "En attente"] })), report.status === 'failed' && (_jsx(Badge, { className: "bg-[#FF4D6A]/10 text-[#FF4D6A] border border-[#FF4D6A]/30", children: "\u00C9chou\u00E9" }))] }), _jsx("td", { className: "px-4 py-3 text-[#6B6B80] text-xs", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDateTime(report.generatedAt)] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Button, { size: "sm", variant: "outline", disabled: report.status !== 'completed', onClick: () => handleDownloadReport(report), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Download, { size: 14 }), "T\u00E9l\u00E9charger"] }) })] }, report.id));
                                        }) })] }) })) })] })] }));
}
//# sourceMappingURL=ReportsPage.js.map