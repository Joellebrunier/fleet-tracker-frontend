'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { BarChart3, Download, FileText, Calendar, Car, Filter, Clock, CheckCircle, Loader2, FileSpreadsheet, File, Printer, Mail, Clock as ClockIcon, } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
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
    // Email state
    const [emailRecipient, setEmailRecipient] = useState('');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    // Generated reports state
    const [generatedReports, setGeneratedReports] = useState([
        {
            id: '1',
            type: 'trip',
            format: 'pdf',
            status: 'completed',
            generatedAt: new Date(Date.now() - 86400000),
            dateFrom: subDays(new Date(), 60),
            dateTo: subDays(new Date(), 30),
            vehicleCount: 5,
            downloadUrl: '/reports/trip-report-2024.pdf',
        },
        {
            id: '2',
            type: 'fuel',
            format: 'excel',
            status: 'completed',
            generatedAt: new Date(Date.now() - 172800000),
            dateFrom: subDays(new Date(), 90),
            dateTo: subDays(new Date(), 60),
            vehicleCount: 8,
            downloadUrl: '/reports/fuel-report-2024.xlsx',
        },
    ]);
    // Mock vehicles (in a real app, these would come from the backend)
    const [vehicles] = useState([
        { id: 'v1', name: 'Truck 1', plate: 'ABC-123' },
        { id: 'v2', name: 'Truck 2', plate: 'DEF-456' },
        { id: 'v3', name: 'Van 1', plate: 'GHI-789' },
        { id: 'v4', name: 'Van 2', plate: 'JKL-012' },
        { id: 'v5', name: 'Car 1', plate: 'MNO-345' },
    ]);
    const handleOpenDialog = useCallback((reportType) => {
        setSelectedReportType(reportType);
        setSelectedVehicles([]);
        setReportFormat('pdf');
        setDialogOpen(true);
    }, []);
    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        setSelectedReportType(null);
    }, []);
    const handleVehicleToggle = useCallback((vehicleId) => {
        setSelectedVehicles((prev) => prev.includes(vehicleId) ? prev.filter((id) => id !== vehicleId) : [...prev, vehicleId]);
    }, []);
    const handleGenerateReport = useCallback(async () => {
        if (!selectedReportType || !orgId) {
            return;
        }
        setIsGenerating(true);
        try {
            const payload = {
                type: selectedReportType,
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo),
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
            // Optionally show error toast here
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
    const handleSendEmail = useCallback(() => {
        if (emailRecipient && emailSubject) {
            alert('Rapport envoyé!');
            setShowEmailDialog(false);
            setEmailRecipient('');
            setEmailSubject('');
            setEmailMessage('');
        }
    }, [emailRecipient, emailSubject]);
    const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
        type: key,
        ...config,
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Rapports" }), _jsx("p", { className: "mt-2 text-gray-600", children: "G\u00E9n\u00E9rer et t\u00E9l\u00E9charger les rapports de flotte" })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Mod\u00E8les de rapports" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-3", children: reportTemplates.map((template) => {
                            const Icon = template.icon;
                            return (_jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", onClick: () => applyTemplate(template), children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base", children: template.name }), _jsx(CardDescription, { className: "text-xs", children: template.description })] }), _jsx(Icon, { className: "text-blue-600 flex-shrink-0", size: 20 })] }) }) }, template.name));
                        }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-3", children: "Cr\u00E9er un rapport personnalis\u00E9" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reportTypes.map((report) => {
                            const Icon = report.icon;
                            return (_jsxs(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", onClick: () => handleOpenDialog(report.type), children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: report.title }), _jsx(CardDescription, { className: "text-sm", children: report.description })] }), _jsx(Icon, { className: "text-blue-600 flex-shrink-0", size: 24 })] }) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outline", className: "w-full gap-2", onClick: () => handleOpenDialog(report.type), children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] }) })] }, report.type));
                        }) })] }), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title }), _jsx(DialogDescription, { children: "Configurez les param\u00E8tres du rapport et le format de t\u00E9l\u00E9chargement" })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "P\u00E9riode" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "De" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "w-full" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "\u00C0" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "w-full" })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Car, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "V\u00E9hicules (Optionnel)" })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Laissez vide pour inclure tous les v\u00E9hicules de votre flotte" }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-h-48 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.includes(vehicle.id), onChange: () => handleVehicleToggle(vehicle.id), className: "rounded border-gray-300" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.plate })] })] }, vehicle.id))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Format du rapport" })] }), _jsx("div", { className: "flex gap-3", children: ['pdf', 'excel', 'csv'].map((format) => {
                                                const Icon = FORMAT_ICONS[format];
                                                return (_jsxs("button", { onClick: () => setReportFormat(format), className: `flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${reportFormat === format
                                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { className: "text-sm font-medium capitalize", children: format })] }, format));
                                            }) })] })] }), _jsxs(DialogFooter, { className: "flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", onClick: handleCloseDialog, disabled: isGenerating, children: "Annuler" }), _jsxs(Button, { variant: "outline", onClick: () => setShowScheduleForm(!showScheduleForm), className: "gap-2", children: [_jsx(ClockIcon, { size: 16 }), "Programmer"] }), _jsxs(Button, { variant: "outline", onClick: handlePrint, className: "gap-2", children: [_jsx(Printer, { size: 16 }), "Imprimer"] }), _jsxs(Button, { variant: "outline", onClick: () => setShowEmailDialog(true), className: "gap-2", children: [_jsx(Mail, { size: 16 }), "Email"] }), _jsx(Button, { onClick: handleGenerateReport, disabled: isGenerating, className: "gap-2", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin" }), "G\u00E9n\u00E9ration..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] })) })] })] }) }), showScheduleForm && (_jsx(Dialog, { open: showScheduleForm, onOpenChange: setShowScheduleForm, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Programmer la g\u00E9n\u00E9ration du rapport" }), _jsx(DialogDescription, { children: "Configurez la fr\u00E9quence d'envoi automatique du rapport" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Fr\u00E9quence" }), _jsxs("select", { value: scheduleFrequency, onChange: (e) => setScheduleFrequency(e.target.value), className: "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500", children: [_jsx("option", { value: "daily", children: "Quotidien" }), _jsx("option", { value: "weekly", children: "Hebdomadaire" }), _jsx("option", { value: "monthly", children: "Mensuel" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Email de livraison" }), _jsx(Input, { type: "email", value: scheduleEmail, onChange: (e) => setScheduleEmail(e.target.value), placeholder: "votre.email@exemple.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Prochain envoi" }), _jsxs("div", { className: "text-sm text-gray-600", children: [scheduleFrequency === 'daily' && 'Demain à 08:00', scheduleFrequency === 'weekly' && 'Lundi prochain à 09:00', scheduleFrequency === 'monthly' && '1er du mois prochain à 09:00'] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowScheduleForm(false), children: "Annuler" }), _jsx(Button, { onClick: () => {
                                        setShowScheduleForm(false);
                                        alert('Programmation enregistrée!');
                                    }, children: "Enregistrer" })] })] }) })), _jsx(Dialog, { open: showEmailDialog, onOpenChange: setShowEmailDialog, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Envoyer le rapport par email" }), _jsx(DialogDescription, { children: "Configurez les d\u00E9tails de l'email avant d'envoyer" })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Destinataire *" }), _jsx(Input, { type: "email", value: emailRecipient, onChange: (e) => setEmailRecipient(e.target.value), placeholder: "destinataire@exemple.com" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Objet *" }), _jsx(Input, { value: emailSubject, onChange: (e) => setEmailSubject(e.target.value), placeholder: selectedReportType ? REPORT_TYPE_CONFIG[selectedReportType].title : 'Objet du rapport' })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-gray-700", children: "Message" }), _jsx("textarea", { value: emailMessage, onChange: (e) => setEmailMessage(e.target.value), placeholder: "Votre message...", className: "w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none", rows: 3 })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowEmailDialog(false), children: "Annuler" }), _jsx(Button, { onClick: handleSendEmail, children: "Envoyer" })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Rapports g\u00E9n\u00E9r\u00E9s" }), _jsx(Badge, { variant: "secondary", children: generatedReports.length })] }) }), _jsx(CardContent, { children: generatedReports.length === 0 ? (_jsxs("div", { className: "space-y-3 text-center py-12", children: [_jsx("p", { className: "text-gray-500", children: "Aucun rapport g\u00E9n\u00E9r\u00E9 encore" }), _jsxs(Button, { variant: "outline", onClick: () => handleOpenDialog('trip'), className: "gap-2", children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer votre premier rapport"] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Type de rapport" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "P\u00E9riode" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Format" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Statut" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "G\u00E9n\u00E9r\u00E9" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Action" })] }) }), _jsx("tbody", { children: generatedReports.map((report) => {
                                            const reportConfig = REPORT_TYPE_CONFIG[report.type];
                                            const formatIcon = FORMAT_ICONS[report.format];
                                            return (_jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(reportConfig.icon, { size: 16, className: "text-gray-500 flex-shrink-0" }), _jsx("span", { className: "font-medium text-gray-900", children: reportConfig.title })] }) }), _jsxs("td", { className: "px-4 py-3 text-gray-600", children: [format(report.dateFrom, 'dd MMM, yyyy'), " -", ' ', format(report.dateTo, 'dd MMM, yyyy')] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-gray-500' }), _jsx("span", { className: "capitalize text-gray-600", children: report.format })] }) }), _jsxs("td", { className: "px-4 py-3", children: [report.status === 'completed' && (_jsxs(Badge, { className: "bg-green-100 text-green-800 flex w-fit gap-1", children: [_jsx(CheckCircle, { size: 14 }), "Compl\u00E9t\u00E9"] })), report.status === 'pending' && (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 flex w-fit gap-1", children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), "En attente"] })), report.status === 'failed' && (_jsx(Badge, { className: "bg-red-100 text-red-800", children: "\u00C9chou\u00E9" }))] }), _jsx("td", { className: "px-4 py-3 text-gray-600 text-xs", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDateTime(report.generatedAt)] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Button, { size: "sm", variant: "outline", disabled: report.status !== 'completed', onClick: () => handleDownloadReport(report), className: "gap-2", children: [_jsx(Download, { size: 14 }), "T\u00E9l\u00E9charger"] }) })] }, report.id));
                                        }) })] }) })) })] })] }));
}
//# sourceMappingURL=ReportsPage.js.map