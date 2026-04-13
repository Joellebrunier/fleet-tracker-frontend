import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, Download, Clock, User, FileText, AlertTriangle, Settings } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
export default function AuditLogPage() {
    const { user } = useAuth();
    const orgId = user?.organizationId || '';
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState('all');
    const [actionFilter, setActionFilter] = useState('all');
    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['audit-logs', orgId],
        queryFn: async () => {
            if (!orgId)
                return [];
            const response = await apiClient.get(`/api/organizations/${orgId}/audit-logs`);
            return response.data;
        },
        enabled: !!orgId,
    });
    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
        const matchesAction = actionFilter === 'all' || log.action === actionFilter;
        return matchesSearch && matchesSeverity && matchesAction;
    });
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-[rgba(255,77,106,0.12)] text-red-500';
            case 'warning': return 'bg-[rgba(255,181,71,0.12)] text-amber-500';
            default: return 'bg-[rgba(0,229,204,0.12)] text-blue-600';
        }
    };
    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'critical': return 'Critique';
            case 'warning': return 'Avertissement';
            default: return 'Info';
        }
    };
    const getActionIcon = (action) => {
        if (action.includes('login') || action.includes('auth'))
            return _jsx(User, { size: 14 });
        if (action.includes('alert'))
            return _jsx(AlertTriangle, { size: 14 });
        if (action.includes('config') || action.includes('setting'))
            return _jsx(Settings, { size: 14 });
        return _jsx(FileText, { size: 14 });
    };
    const exportLogs = () => {
        const csv = ['Date,Utilisateur,Action,Ressource,Détails,Sévérité,IP']
            .concat(filteredLogs.map(l => `${l.timestamp},${l.userName},${l.action},${l.resource},${l.details || ''},${l.severity},${l.ipAddress || ''}`)).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
    return (_jsxs("div", { className: "min-h-screen bg-[#F5F7FA] p-4 md:p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 font-sans", children: "Journal d'audit" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Suivez toutes les actions et modifications du syst\u00E8me" })] }), _jsxs(Button, { variant: "outline", onClick: exportLogs, className: "gap-2 bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200", children: [_jsx(Download, { size: 16 }), "Exporter CSV"] })] }), _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-500" }), _jsx(Input, { placeholder: "Rechercher par utilisateur, action...", className: "pl-10 bg-white border-gray-200 text-gray-900 rounded-lg focus:border-blue-600 placeholder-[#9CA3AF]", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })] }), _jsx("div", { className: "flex gap-2", children: ['all', 'info', 'warning', 'critical'].map(sev => (_jsx(Button, { variant: severityFilter === sev ? 'default' : 'outline', size: "sm", onClick: () => setSeverityFilter(sev), className: `${severityFilter === sev
                                ? 'bg-blue-600 text-white font-bold'
                                : 'bg-gray-100 border border-gray-200 text-gray-900 hover:bg-gray-200'}`, children: sev === 'all' ? 'Tous' : getSeverityLabel(sev) }, sev))) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [_jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-gray-900 font-sans", children: logs.length }), _jsx("p", { className: "text-xs text-gray-500", children: "Total \u00E9v\u00E9nements" })] }) }), _jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-blue-600 font-sans", children: logs.filter(l => l.severity === 'info').length }), _jsx("p", { className: "text-xs text-gray-500", children: "Informations" })] }) }), _jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-amber-500 font-sans", children: logs.filter(l => l.severity === 'warning').length }), _jsx("p", { className: "text-xs text-gray-500", children: "Avertissements" })] }) }), _jsx(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: _jsxs(CardContent, { className: "pt-5 pb-4 text-center", children: [_jsx("p", { className: "text-2xl font-bold text-red-500 font-sans", children: logs.filter(l => l.severity === 'critical').length }), _jsx("p", { className: "text-xs text-gray-500", children: "Critiques" })] }) })] }), _jsxs(Card, { className: "bg-white rounded-xl border border-gray-200 shadow-sm", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-gray-900 font-sans", children: [_jsx(Shield, { size: 18 }), "\u00C9v\u00E9nements (", filteredLogs.length, ")"] }) }), _jsx(CardContent, { children: isLoading ? (_jsx("div", { className: "space-y-3", children: [...Array(5)].map((_, i) => _jsx(Skeleton, { className: "h-16 bg-gray-100" }, i)) })) : filteredLogs.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Shield, { size: 48, className: "mx-auto mb-4 text-[#9CA3AF]" }), _jsx("p", { children: "Aucun \u00E9v\u00E9nement d'audit trouv\u00E9" })] })) : (_jsx("div", { className: "space-y-2", children: filteredLogs.map(log => (_jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-blue-50/50 transition-colors", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-0.5 text-[#9CA3AF]", children: getActionIcon(log.action) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-gray-900 text-sm", children: log.userName }), _jsx("span", { className: `text-xs px-1.5 py-0.5 rounded ${getSeverityColor(log.severity)}`, children: getSeverityLabel(log.severity) })] }), _jsxs("p", { className: "text-sm text-gray-500", children: [log.action, " \u2014 ", log.resource] }), log.details && _jsx("p", { className: "text-xs text-[#9CA3AF] mt-0.5", children: log.details })] })] }), _jsxs("div", { className: "text-right text-xs text-[#9CA3AF]", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { size: 12 }), log.timestamp ? formatTimeAgo(new Date(log.timestamp)) : '—'] }), log.ipAddress && _jsx("p", { className: "mt-0.5 font-mono", children: log.ipAddress })] })] }, log.id))) })) })] })] }));
}
//# sourceMappingURL=AuditLogPage.js.map