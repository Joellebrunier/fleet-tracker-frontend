import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAlerts, useAlertStats, useBulkAcknowledgeAlerts } from '@/hooks/useAlerts';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check } from 'lucide-react';
import { formatDateTime, getSeverityColor } from '@/lib/utils';
import { AlertSeverity } from '@/types/alert';
export default function AlertsPage() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('unacknowledged');
    const { data: alertsData, isLoading } = useAlerts({ page, limit: 20, status });
    const { data: stats } = useAlertStats();
    const { mutate: bulkAcknowledge } = useBulkAcknowledgeAlerts();
    const alerts = alertsData?.data || [];
    const totalPages = alertsData?.totalPages || 1;
    const getSeverityBadgeVariant = (severity) => {
        switch (severity) {
            case AlertSeverity.CRITICAL:
                return 'destructive';
            case AlertSeverity.HIGH:
                return 'secondary';
            case AlertSeverity.MEDIUM:
                return 'warning';
            case AlertSeverity.LOW:
                return 'outline';
            default:
                return 'default';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Alerts" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Monitor and manage fleet alerts" })] }), stats ? (_jsxs("div", { className: "grid gap-4 sm:grid-cols-3 lg:grid-cols-5", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total" }), _jsx("p", { className: "mt-2 text-2xl font-bold", children: stats.total })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-sm text-red-600 font-medium", children: "Critical" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-red-600", children: stats.critical })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-sm text-orange-600 font-medium", children: "High" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-orange-600", children: stats.high })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-sm text-yellow-600 font-medium", children: "Medium" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-yellow-600", children: stats.medium })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-sm text-blue-600 font-medium", children: "Low" }), _jsx("p", { className: "mt-2 text-2xl font-bold text-blue-600", children: stats.low })] }) })] })) : (_jsx(Skeleton, { className: "h-24" })), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                                    setStatus(undefined);
                                    setPage(1);
                                }, className: `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${status === undefined
                                    ? 'bg-fleet-tracker-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "All" }), _jsx("button", { onClick: () => {
                                    setStatus('unacknowledged');
                                    setPage(1);
                                }, className: `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${status === 'unacknowledged'
                                    ? 'bg-fleet-tracker-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Unacknowledged" }), _jsx("button", { onClick: () => {
                                    setStatus('acknowledged');
                                    setPage(1);
                                }, className: `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${status === 'acknowledged'
                                    ? 'bg-fleet-tracker-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: "Acknowledged" })] }) }) }), isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => (_jsx(Skeleton, { className: "h-24" }, i))) })) : alerts.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsxs(CardContent, { className: "pt-12", children: [_jsx(AlertCircle, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("p", { className: "text-gray-500", children: "No alerts found" })] }) })) : (_jsx("div", { className: "space-y-3", children: alerts.map((alert) => (_jsx(Card, { className: getSeverityColor(alert.severity), children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: `rounded-lg p-2 ${getSeverityColor(alert.severity)}`, children: _jsx(AlertCircle, { size: 20, className: "text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: alert.title }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: alert.message }), _jsx("p", { className: "mt-2 text-xs text-gray-500", children: formatDateTime(alert.createdAt) })] })] }) }), _jsxs("div", { className: "flex flex-col items-end gap-2", children: [_jsx(Badge, { variant: getSeverityBadgeVariant(alert.severity), children: alert.severity }), alert.isAcknowledged && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Acknowledged" })), !alert.isAcknowledged && (_jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", onClick: () => bulkAcknowledge([alert.id]), children: [_jsx(Check, { size: 14 }), "Acknowledge"] }))] })] }) }) }, alert.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Next" })] })] }))] }));
}
//# sourceMappingURL=AlertsPage.js.map