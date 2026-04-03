'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { BarChart3, Download, FileText, Calendar, Car, Filter, Clock, CheckCircle, Loader2, FileSpreadsheet, File, Printer, Mail, Clock as ClockIcon, AlertCircle, Share2, Plus, X, ToggleLeft, } from 'lucide-react';
import { format, subDays, startOfWeek, startOfMonth, addDays, addWeeks, addMonths } from 'date-fns';
import { formatDateTime } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { useVehicles } from '@/hooks/useVehicles';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
const ENHANCED_TEMPLATES = [
    {
        name: 'Rapport kilométrage mensuel',
        description: 'Kilométrage mensuel par véhicule',
        type: 'trip',
        frequency: 'monthly',
        format: 'excel',
        icon: FileSpreadsheet,
    },
    {
        name: 'Rapport activité conducteurs',
        description: 'Résumé de l\'activité des conducteurs',
        type: 'driver',
        frequency: 'monthly',
        format: 'pdf',
        icon: FileText,
    },
    {
        name: 'Rapport violations géoclôtures',
        description: 'Violations de géoclôture détectées',
        type: 'compliance',
        frequency: 'weekly',
        format: 'pdf',
        icon: BarChart3,
    },
    {
        name: 'Rapport consommation carburant',
        description: 'Estimation de consommation carburant',
        type: 'fuel',
        frequency: 'monthly',
        format: 'excel',
        icon: FileSpreadsheet,
    },
    {
        name: 'Rapport alertes hebdomadaire',
        description: 'Résumé hebdomadaire des alertes',
        type: 'compliance',
        frequency: 'weekly',
        format: 'pdf',
        icon: BarChart3,
    },
    {
        name: 'Rapport utilisation flotte',
        description: 'Pourcentage utilisation flotte',
        type: 'fleet',
        frequency: 'weekly',
        format: 'excel',
        icon: FileSpreadsheet,
    },
];
// Mock trend data generator
const generateTrendData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
            date: format(date, 'MMM dd'),
            mileage: Math.floor(Math.random() * 500) + 200,
            speed: Math.floor(Math.random() * 40) + 40,
            alerts: Math.floor(Math.random() * 10),
            utilization: Math.floor(Math.random() * 40) + 50,
        });
    }
    return data;
};
export default function ReportsPage() {
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    // State for report generation dialog
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('generate');
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
    const [emailRecipients, setEmailRecipients] = useState([]);
    const [newRecipient, setNewRecipient] = useState('');
    const [sendCopyToMe, setSendCopyToMe] = useState(false);
    const [scheduleTimeOfDay, setScheduleTimeOfDay] = useState('09:00');
    const [scheduleDayOfWeek, setScheduleDayOfWeek] = useState(1);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleError, setScheduleError] = useState('');
    const [scheduledReports, setScheduledReports] = useState([]);
    // Email state
    const [emailRecipient, setEmailRecipient] = useState('');
    const [emailRecipientsList, setEmailRecipientsList] = useState([]);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailError, setEmailError] = useState('');
    // Error state
    const [generationError, setGenerationError] = useState('');
    // Generated reports state
    const [generatedReports, setGeneratedReports] = useState([]);
    // Trends and comparison state
    const [trendData, setTrendData] = useState([]);
    const [comparisonVehicles, setComparisonVehicles] = useState([]);
    const [comparisonData, setComparisonData] = useState([]);
    const [copiedShareLink, setCopiedShareLink] = useState(false);
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
        // Generate mock trend data
        setTrendData(generateTrendData());
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
        setShowScheduleForm(false);
        setShowEmailDialog(false);
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
    const handleComparisonVehicleToggle = useCallback((vehicleId) => {
        setComparisonVehicles((prev) => {
            if (prev.includes(vehicleId)) {
                return prev.filter((id) => id !== vehicleId);
            }
            if (prev.length < 4) {
                return [...prev, vehicleId];
            }
            return prev;
        });
    }, []);
    const generateComparisonData = useCallback(() => {
        if (comparisonVehicles.length === 0)
            return;
        const data = comparisonVehicles.map((vehicleId) => {
            const vehicle = vehicles.find((v) => v.id === vehicleId);
            return {
                vehicleId,
                vehicleName: vehicle?.name || 'Unknown',
                km: Math.floor(Math.random() * 5000) + 1000,
                trips: Math.floor(Math.random() * 100) + 20,
                alerts: Math.floor(Math.random() * 20),
                avgSpeed: Math.floor(Math.random() * 40) + 40,
            };
        });
        setComparisonData(data);
    }, [comparisonVehicles, vehicles]);
    useEffect(() => {
        generateComparisonData();
    }, [comparisonVehicles, generateComparisonData]);
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
    const addEmailRecipient = useCallback(() => {
        if (emailRecipient && !emailRecipientsList.includes(emailRecipient)) {
            setEmailRecipientsList((prev) => [...prev, emailRecipient]);
            setEmailRecipient('');
        }
    }, [emailRecipient, emailRecipientsList]);
    const removeEmailRecipient = useCallback((email) => {
        setEmailRecipientsList((prev) => prev.filter((e) => e !== email));
    }, []);
    const handleSendEmail = useCallback(async () => {
        const finalRecipients = [...emailRecipientsList];
        if (sendCopyToMe) {
            const userEmail = useAuthStore((s) => s.user?.email);
            if (userEmail && !finalRecipients.includes(userEmail)) {
                finalRecipients.push(userEmail);
            }
        }
        if (finalRecipients.length === 0 || !emailSubject || !orgId) {
            setEmailError('Veuillez remplir tous les champs requis');
            return;
        }
        setIsSendingEmail(true);
        setEmailError('');
        try {
            const payload = {
                recipients: finalRecipients,
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
            setEmailRecipientsList([]);
            setEmailSubject('');
            setEmailMessage('');
            setSendCopyToMe(false);
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
    }, [emailRecipientsList, sendCopyToMe, emailSubject, orgId, selectedReportType, dateFrom, dateTo, selectedVehicles, reportFormat]);
    const addScheduleEmailRecipient = useCallback(() => {
        if (scheduleEmail && !emailRecipients.includes(scheduleEmail)) {
            setEmailRecipients((prev) => [...prev, scheduleEmail]);
            setScheduleEmail('');
        }
    }, [scheduleEmail, emailRecipients]);
    const removeScheduleEmailRecipient = useCallback((email) => {
        setEmailRecipients((prev) => prev.filter((e) => e !== email));
    }, []);
    const handleScheduleReport = useCallback(async () => {
        if (emailRecipients.length === 0 || !selectedReportType || !orgId) {
            setScheduleError('Veuillez ajouter au moins une adresse e-mail');
            return;
        }
        setIsScheduling(true);
        setScheduleError('');
        try {
            // Calculate next run date
            let nextRun = new Date();
            if (scheduleFrequency === 'daily') {
                nextRun = addDays(nextRun, 1);
            }
            else if (scheduleFrequency === 'weekly') {
                nextRun = addWeeks(nextRun, 1);
            }
            else if (scheduleFrequency === 'monthly') {
                nextRun = addMonths(nextRun, 1);
            }
            const payload = {
                reportType: selectedReportType,
                frequency: scheduleFrequency,
                recipientEmails: emailRecipients,
                dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
                timeOfDay: scheduleTimeOfDay,
                dateFrom: dateFrom,
                dateTo: dateTo,
                vehicleIds: selectedVehicles.length > 0 ? selectedVehicles : undefined,
                format: reportFormat,
            };
            await apiClient.post(`${API_ROUTES.ORGANIZATIONS}/${orgId}/reports/schedule`, payload);
            // Add to scheduled reports list
            const newScheduledReport = {
                id: `scheduled-${Date.now()}`,
                type: selectedReportType,
                frequency: scheduleFrequency,
                nextRun: nextRun,
                isActive: true,
                recipients: emailRecipients,
                dayOfWeek: scheduleFrequency === 'weekly' ? scheduleDayOfWeek : undefined,
                timeOfDay: scheduleTimeOfDay,
            };
            setScheduledReports((prev) => [newScheduledReport, ...prev]);
            setShowScheduleForm(false);
            setEmailRecipients([]);
            setScheduleEmail('');
            setScheduleTimeOfDay('09:00');
            setScheduleDayOfWeek(1);
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
    }, [emailRecipients, selectedReportType, orgId, scheduleFrequency, scheduleDayOfWeek, scheduleTimeOfDay, dateFrom, dateTo, selectedVehicles, reportFormat]);
    const handleToggleScheduledReport = useCallback((reportId) => {
        setScheduledReports((prev) => prev.map((r) => r.id === reportId ? { ...r, isActive: !r.isActive } : r));
    }, []);
    const generateShareLink = useCallback(() => {
        if (!selectedReportType)
            return;
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const shareUrl = `${baseUrl}/reports/share?type=${selectedReportType}&from=${dateFrom}&to=${dateTo}&vehicles=${selectedVehicles.join(',')}`;
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopiedShareLink(true);
            setTimeout(() => setCopiedShareLink(false), 2000);
        });
    }, [selectedReportType, dateFrom, dateTo, selectedVehicles]);
    const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
        type: key,
        ...config,
    }));
    const dayOfWeekNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-[#F0F0F5]", children: "Rapports" }), _jsx("p", { className: "mt-2 text-[#6B6B80]", children: "G\u00E9n\u00E9rer, programmer et analyser les rapports de flotte" })] }), _jsxs("div", { className: "flex gap-2 border-b border-[#1F1F2E] overflow-x-auto", children: [_jsx("button", { onClick: () => setActiveTab('generate'), className: `px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'generate'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "G\u00E9n\u00E9rer" }), _jsx("button", { onClick: () => setActiveTab('scheduled'), className: `px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'scheduled'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "Programm\u00E9s" }), _jsx("button", { onClick: () => setActiveTab('trends'), className: `px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'trends'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "Tendances" }), _jsx("button", { onClick: () => setActiveTab('comparison'), className: `px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === 'comparison'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "Comparaison" })] }), activeTab === 'generate' && (_jsxs(_Fragment, { children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5] mb-3", children: "Mod\u00E8les de rapports" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: ENHANCED_TEMPLATES.map((template) => {
                                    const Icon = template.icon;
                                    return (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D] transition-colors cursor-pointer", onClick: () => applyTemplate(template), children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-base text-[#F0F0F5]", children: template.name }), _jsx(CardDescription, { className: "text-xs text-[#6B6B80]", children: template.description })] }), _jsx(Icon, { className: "text-[#00E5CC] flex-shrink-0", size: 20 })] }) }) }, template.name));
                                }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5] mb-3", children: "Cr\u00E9er un rapport personnalis\u00E9" }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reportTypes.map((report) => {
                                    const Icon = report.icon;
                                    return (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px] hover:border-[#2A2A3D] transition-colors cursor-pointer", onClick: () => handleOpenDialog(report.type), children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg text-[#F0F0F5]", children: report.title }), _jsx(CardDescription, { className: "text-sm text-[#6B6B80]", children: report.description })] }), _jsx(Icon, { className: "text-[#00E5CC] flex-shrink-0", size: 24 })] }) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outline", className: "w-full gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#00E5CC] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", onClick: () => handleOpenDialog(report.type), children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] }) })] }, report.type));
                                }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Rapports g\u00E9n\u00E9r\u00E9s" }), _jsx(Badge, { variant: "secondary", className: "bg-[#1A1A25] text-[#F0F0F5] border border-[#1F1F2E]", children: generatedReports.length })] }) }), _jsx(CardContent, { children: generatedReports.length === 0 ? (_jsxs("div", { className: "space-y-3 text-center py-12", children: [_jsx("p", { className: "text-[#6B6B80]", children: "Aucun rapport g\u00E9n\u00E9r\u00E9 encore" }), _jsxs(Button, { variant: "outline", onClick: () => handleOpenDialog('trip'), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#00E5CC] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer votre premier rapport"] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Type de rapport" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "P\u00E9riode" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Format" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Statut" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "G\u00E9n\u00E9r\u00E9" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-[#F0F0F5]", children: "Action" })] }) }), _jsx("tbody", { children: generatedReports.map((report) => {
                                                    const reportConfig = REPORT_TYPE_CONFIG[report.type];
                                                    const formatIcon = FORMAT_ICONS[report.format];
                                                    return (_jsxs("tr", { className: "border-b border-[#1A1A25] hover:bg-[#1A1A25] transition-colors", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(reportConfig.icon, { size: 16, className: "text-[#6B6B80] flex-shrink-0" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: reportConfig.title })] }) }), _jsxs("td", { className: "px-4 py-3 text-[#6B6B80]", children: [format(report.dateFrom, 'dd MMM, yyyy'), " -", ' ', format(report.dateTo, 'dd MMM, yyyy')] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-[#6B6B80]' }), _jsx("span", { className: "capitalize text-[#6B6B80]", children: report.format })] }) }), _jsxs("td", { className: "px-4 py-3", children: [report.status === 'completed' && (_jsxs(Badge, { className: "bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/30 flex w-fit gap-1", children: [_jsx(CheckCircle, { size: 14 }), "Compl\u00E9t\u00E9"] })), report.status === 'pending' && (_jsxs(Badge, { className: "bg-[#FFB547]/10 text-[#FFB547] border border-[#FFB547]/30 flex w-fit gap-1", children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), "En attente"] })), report.status === 'failed' && (_jsx(Badge, { className: "bg-[#FF4D6A]/10 text-[#FF4D6A] border border-[#FF4D6A]/30", children: "\u00C9chou\u00E9" }))] }), _jsx("td", { className: "px-4 py-3 text-[#6B6B80] text-xs", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDateTime(report.generatedAt)] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Button, { size: "sm", variant: "outline", disabled: report.status !== 'completed', onClick: () => handleDownloadReport(report), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px] disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx(Download, { size: 14 }), "T\u00E9l\u00E9charger"] }) })] }, report.id));
                                                }) })] }) })) })] })] })), activeTab === 'scheduled' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5]", children: "Rapports programm\u00E9s" }), _jsxs(Button, { onClick: () => {
                                    setShowScheduleForm(true);
                                    setSelectedReportType('fleet');
                                }, className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: [_jsx(Plus, { size: 16 }), "Programmer un rapport"] })] }), scheduledReports.length === 0 ? (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsxs(CardContent, { className: "py-12 text-center", children: [_jsx("p", { className: "text-[#6B6B80] mb-4", children: "Aucun rapport programm\u00E9" }), _jsxs(Button, { onClick: () => {
                                        setShowScheduleForm(true);
                                        setSelectedReportType('fleet');
                                    }, className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: [_jsx(Plus, { size: 16 }), "Cr\u00E9er la premi\u00E8re programmation"] })] }) })) : (_jsx("div", { className: "grid gap-4", children: scheduledReports.map((report) => {
                            const reportConfig = REPORT_TYPE_CONFIG[report.type];
                            return (_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex gap-4 flex-1", children: [_jsx("div", { className: "text-[#00E5CC] mt-1", children: React.createElement(reportConfig.icon, { size: 24 }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: reportConfig.title }), _jsxs("p", { className: "text-sm text-[#6B6B80] mt-1", children: ["Fr\u00E9quence: ", report.frequency === 'daily' ? 'Quotidien' : report.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel', report.frequency === 'weekly' && ` - ${dayOfWeekNames[report.dayOfWeek || 0]}`] }), _jsxs("p", { className: "text-sm text-[#6B6B80]", children: ["Prochain envoi: ", format(report.nextRun, 'dd MMM yyyy'), " \u00E0 ", report.timeOfDay] }), _jsxs("p", { className: "text-sm text-[#6B6B80] mt-1", children: ["Destinataires: ", report.recipients.join(', ')] })] })] }), _jsx("button", { onClick: () => handleToggleScheduledReport(report.id), className: `p-2 rounded-lg transition-colors ${report.isActive
                                                    ? 'bg-[#00E5CC]/10 text-[#00E5CC]'
                                                    : 'bg-[#FF4D6A]/10 text-[#FF4D6A]'}`, children: _jsx(ToggleLeft, { size: 20 }) })] }) }) }, report.id));
                        }) }))] })), activeTab === 'trends' && (_jsxs("div", { className: "space-y-6", children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5]", children: "Tendances (30 derniers jours)" }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Kilom\u00E9trage moyen quotidien" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: trendData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorMileage", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#00E5CC", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#00E5CC", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#2A2A3D" }), _jsx(XAxis, { dataKey: "date", stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#12121A', border: '1px solid #1F1F2E' }, labelStyle: { color: '#F0F0F5' } }), _jsx(Area, { type: "monotone", dataKey: "mileage", stroke: "#00E5CC", fillOpacity: 1, fill: "url(#colorMileage)" })] }) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Vitesse moyenne (km/h)" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: trendData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#2A2A3D" }), _jsx(XAxis, { dataKey: "date", stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#12121A', border: '1px solid #1F1F2E' }, labelStyle: { color: '#F0F0F5' } }), _jsx(Line, { type: "monotone", dataKey: "speed", stroke: "#FFB547", dot: false, strokeWidth: 2 })] }) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Fr\u00E9quence des alertes" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(AreaChart, { data: trendData, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "colorAlerts", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#FF4D6A", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#FF4D6A", stopOpacity: 0 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#2A2A3D" }), _jsx(XAxis, { dataKey: "date", stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#12121A', border: '1px solid #1F1F2E' }, labelStyle: { color: '#F0F0F5' } }), _jsx(Area, { type: "monotone", dataKey: "alerts", stroke: "#FF4D6A", fillOpacity: 1, fill: "url(#colorAlerts)" })] }) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Utilisation flotte (%)" }) }), _jsx(CardContent, { children: _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: trendData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#2A2A3D" }), _jsx(XAxis, { dataKey: "date", stroke: "#6B6B80", style: { fontSize: '12px' } }), _jsx(YAxis, { stroke: "#6B6B80", style: { fontSize: '12px' }, domain: [0, 100] }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#12121A', border: '1px solid #1F1F2E' }, labelStyle: { color: '#F0F0F5' } }), _jsx(Line, { type: "monotone", dataKey: "utilization", stroke: "#00E5CC", dot: false, strokeWidth: 2 })] }) }) })] })] })] })), activeTab === 'comparison' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-[#F0F0F5] mb-3", children: "S\u00E9lectionner des v\u00E9hicules \u00E0 comparer" }), _jsx("p", { className: "text-sm text-[#6B6B80] mb-4", children: "S\u00E9lectionnez 2 \u00E0 4 v\u00E9hicules pour les comparer c\u00F4te \u00E0 c\u00F4te" }), _jsx("div", { className: "grid gap-3 max-h-64 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-[#1F1F2E] rounded-lg bg-[#1A1A25] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] cursor-pointer transition-colors", children: [_jsx("input", { type: "checkbox", checked: comparisonVehicles.includes(vehicle.id), onChange: () => handleComparisonVehicleToggle(vehicle.id), className: "rounded border-[#1F1F2E] accent-[#00E5CC]" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: vehicle.name }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.plate })] }), comparisonVehicles.includes(vehicle.id) && (_jsx(Badge, { className: "bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/30", children: "S\u00E9lectionn\u00E9" }))] }, vehicle.id))) })] }), comparisonData.length > 0 && (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-[#F0F0F5]", children: "Comparaison v\u00E9hicules" }) }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E]", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "V\u00E9hicule" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Km" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Trajets" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Alertes" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-[#F0F0F5]", children: "Vit. moy." })] }) }), _jsx("tbody", { children: comparisonData.map((item) => (_jsxs("tr", { className: "border-b border-[#1A1A25] hover:bg-[#1A1A25] transition-colors", children: [_jsx("td", { className: "px-4 py-3 font-medium text-[#F0F0F5]", children: item.vehicleName }), _jsx("td", { className: "px-4 py-3 text-[#6B6B80]", children: item.km.toLocaleString() }), _jsx("td", { className: "px-4 py-3 text-[#6B6B80]", children: item.trips }), _jsx("td", { className: "px-4 py-3", children: _jsx(Badge, { className: `${item.alerts > 15
                                                                    ? 'bg-[#FF4D6A]/10 text-[#FF4D6A]'
                                                                    : 'bg-[#00E5CC]/10 text-[#00E5CC]'}`, children: item.alerts }) }), _jsxs("td", { className: "px-4 py-3 text-[#6B6B80]", children: [item.avgSpeed, " km/h"] })] }, item.vehicleId))) })] }) }) })] }))] })), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "max-w-2xl bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez les param\u00E8tres du rapport et le format de t\u00E9l\u00E9chargement" })] }), _jsxs("div", { className: "space-y-6 py-4", children: [generationError && (_jsxs("div", { className: "flex gap-3 p-4 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 18, className: "text-[#FF4D6A] flex-shrink-0" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: generationError })] })), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "P\u00E9riode" })] }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('today'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Aujourd'hui" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('week'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Cette semaine" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('month'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Ce mois" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => applyDateRange('lastMonth'), className: "text-xs bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[6px]", children: "Mois dernier" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "De" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "w-full bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-[#F0F0F5]", children: "\u00C0" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "w-full bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Car, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "V\u00E9hicules (Optionnel)" })] }), _jsx("p", { className: "text-sm text-[#6B6B80]", children: "Laissez vide pour inclure tous les v\u00E9hicules de votre flotte" }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-h-48 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-[#1F1F2E] rounded-lg bg-[#1A1A25] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] cursor-pointer transition-colors", children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.includes(vehicle.id), onChange: () => handleVehicleToggle(vehicle.id), className: "rounded border-[#1F1F2E] accent-[#00E5CC]" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-[#F0F0F5]", children: vehicle.name }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.plate })] })] }, vehicle.id))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { size: 18, className: "text-[#6B6B80]" }), _jsx("h3", { className: "font-semibold text-[#F0F0F5]", children: "Format du rapport" })] }), _jsx("div", { className: "flex gap-3", children: ['pdf', 'excel', 'csv'].map((format) => {
                                                const Icon = FORMAT_ICONS[format];
                                                return (_jsxs("button", { onClick: () => setReportFormat(format), className: `flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${reportFormat === format
                                                        ? 'border-[#00E5CC] bg-[#00E5CC]/10 text-[#00E5CC]'
                                                        : 'border-[#1F1F2E] text-[#6B6B80] hover:border-[#2A2A3D] hover:bg-[#1A1A25]'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { className: "text-sm font-medium capitalize", children: format })] }, format));
                                            }) })] })] }), _jsxs(DialogFooter, { className: "flex-wrap gap-2", children: [_jsx(Button, { variant: "outline", onClick: handleCloseDialog, disabled: isGenerating, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsxs(Button, { variant: "outline", onClick: () => setShowScheduleForm(!showScheduleForm), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(ClockIcon, { size: 16 }), "Programmer"] }), _jsxs(Button, { variant: "outline", onClick: handlePrint, className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Printer, { size: 16 }), "Imprimer"] }), _jsxs(Button, { variant: "outline", onClick: () => setShowEmailDialog(true), className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Mail, { size: 16 }), "Email"] }), _jsxs(Button, { variant: "outline", onClick: generateShareLink, className: "gap-2 bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: [_jsx(Share2, { size: 16 }), copiedShareLink ? 'Copié!' : 'Partager'] }), _jsx(Button, { onClick: handleGenerateReport, disabled: isGenerating, className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin" }), "G\u00E9n\u00E9ration..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { size: 16 }), "G\u00E9n\u00E9rer le rapport"] })) })] })] }) }), showScheduleForm && (_jsx(Dialog, { open: showScheduleForm, onOpenChange: setShowScheduleForm, children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: "Programmer la g\u00E9n\u00E9ration du rapport" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez la fr\u00E9quence d'envoi automatique du rapport" })] }), _jsxs("div", { className: "space-y-4", children: [scheduleError && (_jsxs("div", { className: "flex gap-3 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 16, className: "text-[#FF4D6A] flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: scheduleError })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Fr\u00E9quence" }), _jsxs("select", { value: scheduleFrequency, onChange: (e) => setScheduleFrequency(e.target.value), className: "w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50", children: [_jsx("option", { value: "daily", children: "Quotidien" }), _jsx("option", { value: "weekly", children: "Hebdomadaire" }), _jsx("option", { value: "monthly", children: "Mensuel" })] })] }), scheduleFrequency === 'weekly' && (_jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Jour de la semaine" }), _jsxs("select", { value: scheduleDayOfWeek, onChange: (e) => setScheduleDayOfWeek(Number(e.target.value)), className: "w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] focus:border-[#00E5CC] focus:outline-none focus:ring-1 focus:ring-[#00E5CC]/50", children: [_jsx("option", { value: 0, children: "Lundi" }), _jsx("option", { value: 1, children: "Mardi" }), _jsx("option", { value: 2, children: "Mercredi" }), _jsx("option", { value: 3, children: "Jeudi" }), _jsx("option", { value: 4, children: "Vendredi" }), _jsx("option", { value: 5, children: "Samedi" }), _jsx("option", { value: 6, children: "Dimanche" })] })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Heure de l'envoi" }), _jsx(Input, { type: "time", value: scheduleTimeOfDay, onChange: (e) => setScheduleTimeOfDay(e.target.value), className: "bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Destinataires" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx(Input, { type: "email", value: scheduleEmail, onChange: (e) => setScheduleEmail(e.target.value), placeholder: "email@exemple.com", className: "flex-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" }), _jsx(Button, { onClick: addScheduleEmailRecipient, className: "bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00C4B0] rounded-[8px]", children: _jsx(Plus, { size: 16 }) })] }), _jsx("div", { className: "space-y-2", children: emailRecipients.map((email) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-[#1A1A25] rounded-lg", children: [_jsx("span", { className: "text-sm text-[#F0F0F5]", children: email }), _jsx("button", { onClick: () => removeScheduleEmailRecipient(email), className: "text-[#FF4D6A] hover:bg-[#FF4D6A]/10 p-1 rounded", children: _jsx(X, { size: 16 }) })] }, email))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "sendCopyToMe", checked: sendCopyToMe, onChange: (e) => setSendCopyToMe(e.target.checked), className: "rounded border-[#1F1F2E] accent-[#00E5CC]" }), _jsx("label", { htmlFor: "sendCopyToMe", className: "text-sm text-[#F0F0F5] cursor-pointer", children: "M'envoyer une copie" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Prochain envoi" }), _jsxs("div", { className: "text-sm text-[#6B6B80] p-2 bg-[#1A1A25] rounded-lg", children: [scheduleFrequency === 'daily' && 'Demain à ' + scheduleTimeOfDay, scheduleFrequency === 'weekly' && `${dayOfWeekNames[scheduleDayOfWeek]} prochain à ${scheduleTimeOfDay}`, scheduleFrequency === 'monthly' && '1er du mois prochain à ' + scheduleTimeOfDay] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowScheduleForm(false), disabled: isScheduling, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsx(Button, { onClick: handleScheduleReport, disabled: isScheduling, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isScheduling ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin mr-2" }), "Programmation..."] })) : ('Enregistrer') })] })] }) })), _jsx(Dialog, { open: showEmailDialog, onOpenChange: setShowEmailDialog, children: _jsxs(DialogContent, { className: "max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { className: "text-[#F0F0F5]", children: "Envoyer le rapport par email" }), _jsx(DialogDescription, { className: "text-[#6B6B80]", children: "Configurez les d\u00E9tails de l'email avant d'envoyer" })] }), _jsxs("div", { className: "space-y-4", children: [emailError && (_jsxs("div", { className: "flex gap-3 p-3 bg-[#FF4D6A]/10 border border-[#FF4D6A] rounded-lg", children: [_jsx(AlertCircle, { size: 16, className: "text-[#FF4D6A] flex-shrink-0 mt-0.5" }), _jsx("p", { className: "text-sm text-[#FF4D6A]", children: emailError })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Destinataires" }), _jsxs("div", { className: "flex gap-2 mb-2", children: [_jsx(Input, { type: "email", value: emailRecipient, onChange: (e) => setEmailRecipient(e.target.value), placeholder: "email@exemple.com", disabled: isSendingEmail, className: "flex-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" }), _jsx(Button, { onClick: addEmailRecipient, className: "bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00C4B0] rounded-[8px]", children: _jsx(Plus, { size: 16 }) })] }), _jsx("div", { className: "space-y-2 max-h-24 overflow-y-auto", children: emailRecipientsList.map((email) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-[#1A1A25] rounded-lg", children: [_jsx("span", { className: "text-sm text-[#F0F0F5]", children: email }), _jsx("button", { onClick: () => removeEmailRecipient(email), className: "text-[#FF4D6A] hover:bg-[#FF4D6A]/10 p-1 rounded", children: _jsx(X, { size: 16 }) })] }, email))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "sendCopyToMe2", checked: sendCopyToMe, onChange: (e) => setSendCopyToMe(e.target.checked), className: "rounded border-[#1F1F2E] accent-[#00E5CC]" }), _jsx("label", { htmlFor: "sendCopyToMe2", className: "text-sm text-[#F0F0F5] cursor-pointer", children: "M'envoyer une copie" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Objet" }), _jsx(Input, { value: emailSubject, onChange: (e) => setEmailSubject(e.target.value), placeholder: selectedReportType ? REPORT_TYPE_CONFIG[selectedReportType].title : 'Objet du rapport', disabled: isSendingEmail, className: "bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Message" }), _jsx("textarea", { value: emailMessage, onChange: (e) => setEmailMessage(e.target.value), placeholder: "Votre message...", className: "w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2 text-sm text-[#F0F0F5] placeholder-[#44445A] resize-none focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50", rows: 3, disabled: isSendingEmail })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-[#F0F0F5]", children: "Format" }), _jsx("div", { className: "flex gap-2", children: ['pdf', 'excel', 'csv'].map((format) => {
                                                const Icon = FORMAT_ICONS[format];
                                                return (_jsxs("button", { onClick: () => setReportFormat(format), className: `flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${reportFormat === format
                                                        ? 'border-[#00E5CC] bg-[#00E5CC]/10 text-[#00E5CC]'
                                                        : 'border-[#1F1F2E] text-[#6B6B80] hover:border-[#2A2A3D]'}`, children: [_jsx(Icon, { size: 16 }), _jsx("span", { className: "capitalize", children: format })] }, format));
                                            }) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowEmailDialog(false), disabled: isSendingEmail, className: "bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1F1F2E] hover:border-[#2A2A3D] rounded-[8px]", children: "Annuler" }), _jsx(Button, { onClick: handleSendEmail, disabled: isSendingEmail, className: "bg-[#00E5CC] text-[#0A0A0F] font-bold hover:bg-[#00C4B0] rounded-[8px]", children: isSendingEmail ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin mr-2" }), "Envoi..."] })) : ('Envoyer') })] })] }) })] }));
}
//# sourceMappingURL=ReportsPage.js.map