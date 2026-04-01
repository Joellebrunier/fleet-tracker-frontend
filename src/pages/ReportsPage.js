'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/ui/dialog';
import { BarChart3, Download, FileText, Calendar, Car, Filter, Clock, CheckCircle, Loader2, FileSpreadsheet, File, } from 'lucide-react';
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
export default function ReportsPage() {
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    // State for report generation dialog
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    // Form state
    const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [reportFormat, setReportFormat] = useState('pdf');
    const [isGenerating, setIsGenerating] = useState(false);
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
    const reportTypes = Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => ({
        type: key,
        ...config,
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Reports" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Generate and download fleet reports" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reportTypes.map((report) => {
                    const Icon = report.icon;
                    return (_jsxs(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", onClick: () => handleOpenDialog(report.type), children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg", children: report.title }), _jsx(CardDescription, { className: "text-sm", children: report.description })] }), _jsx(Icon, { className: "text-fleet-tracker-600 flex-shrink-0", size: 24 })] }) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outline", className: "w-full gap-2", onClick: () => handleOpenDialog(report.type), children: [_jsx(Download, { size: 16 }), "Generate Report"] }) })] }, report.type));
                }) }), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: selectedReportType && REPORT_TYPE_CONFIG[selectedReportType].title }), _jsx(DialogDescription, { children: "Configure the report parameters and download format" })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Date Range" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "From" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "w-full" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium text-gray-700", children: "To" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "w-full" })] })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Car, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Vehicles (Optional)" })] }), _jsx("p", { className: "text-sm text-gray-600", children: "Leave blank to include all vehicles in your fleet" }), _jsx("div", { className: "grid grid-cols-2 gap-3 max-h-48 overflow-y-auto", children: vehicles.map((vehicle) => (_jsxs("label", { className: "flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: selectedVehicles.includes(vehicle.id), onChange: () => handleVehicleToggle(vehicle.id), className: "rounded border-gray-300" }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.plate })] })] }, vehicle.id))) })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { size: 18, className: "text-gray-600" }), _jsx("h3", { className: "font-semibold text-gray-900", children: "Report Format" })] }), _jsx("div", { className: "flex gap-3", children: ['pdf', 'excel', 'csv'].map((format) => {
                                                const Icon = FORMAT_ICONS[format];
                                                return (_jsxs("button", { onClick: () => setReportFormat(format), className: `flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${reportFormat === format
                                                        ? 'border-fleet-tracker-600 bg-fleet-tracker-50 text-fleet-tracker-700'
                                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'}`, children: [_jsx(Icon, { size: 18 }), _jsx("span", { className: "text-sm font-medium capitalize", children: format })] }, format));
                                            }) })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleCloseDialog, disabled: isGenerating, children: "Cancel" }), _jsx(Button, { onClick: handleGenerateReport, disabled: isGenerating, className: "gap-2", children: isGenerating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { size: 16, className: "animate-spin" }), "Generating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Download, { size: 16 }), "Generate Report"] })) })] })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Generated Reports" }), _jsx(Badge, { variant: "secondary", children: generatedReports.length })] }) }), _jsx(CardContent, { children: generatedReports.length === 0 ? (_jsxs("div", { className: "space-y-3 text-center py-12", children: [_jsx("p", { className: "text-gray-500", children: "No reports generated yet" }), _jsxs(Button, { variant: "outline", onClick: () => handleOpenDialog('trip'), className: "gap-2", children: [_jsx(Download, { size: 16 }), "Generate your first report"] })] })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Report Type" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Date Range" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Format" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Status" }), _jsx("th", { className: "px-4 py-3 text-left font-semibold text-gray-900", children: "Generated" }), _jsx("th", { className: "px-4 py-3 text-right font-semibold text-gray-900", children: "Action" })] }) }), _jsx("tbody", { children: generatedReports.map((report) => {
                                            const reportConfig = REPORT_TYPE_CONFIG[report.type];
                                            const formatIcon = FORMAT_ICONS[report.format];
                                            return (_jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(reportConfig.icon, { size: 16, className: "text-gray-500 flex-shrink-0" }), _jsx("span", { className: "font-medium text-gray-900", children: reportConfig.title })] }) }), _jsxs("td", { className: "px-4 py-3 text-gray-600", children: [format(report.dateFrom, 'MMM dd, yyyy'), " -", ' ', format(report.dateTo, 'MMM dd, yyyy')] }), _jsx("td", { className: "px-4 py-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [formatIcon && React.createElement(formatIcon, { size: 16, className: 'text-gray-500' }), _jsx("span", { className: "capitalize text-gray-600", children: report.format })] }) }), _jsxs("td", { className: "px-4 py-3", children: [report.status === 'completed' && (_jsxs(Badge, { className: "bg-green-100 text-green-800 flex w-fit gap-1", children: [_jsx(CheckCircle, { size: 14 }), "Completed"] })), report.status === 'pending' && (_jsxs(Badge, { className: "bg-yellow-100 text-yellow-800 flex w-fit gap-1", children: [_jsx(Loader2, { size: 14, className: "animate-spin" }), "Pending"] })), report.status === 'failed' && (_jsx(Badge, { className: "bg-red-100 text-red-800", children: "Failed" }))] }), _jsx("td", { className: "px-4 py-3 text-gray-600 text-xs", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 14 }), formatDateTime(report.generatedAt)] }) }), _jsx("td", { className: "px-4 py-3 text-right", children: _jsxs(Button, { size: "sm", variant: "outline", disabled: report.status !== 'completed', onClick: () => handleDownloadReport(report), className: "gap-2", children: [_jsx(Download, { size: 14 }), "Download"] }) })] }, report.id));
                                        }) })] }) })) })] })] }));
}
//# sourceMappingURL=ReportsPage.js.map