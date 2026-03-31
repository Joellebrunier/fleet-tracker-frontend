import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, FileText } from 'lucide-react';
export default function ReportsPage() {
    const reportTypes = [
        {
            title: 'Trip Report',
            description: 'Detailed trip information with distance, duration, and route',
            icon: FileText,
        },
        {
            title: 'Fuel Report',
            description: 'Fuel consumption analysis and optimization recommendations',
            icon: BarChart3,
        },
        {
            title: 'Driver Report',
            description: 'Driver behavior analysis and performance metrics',
            icon: FileText,
        },
        {
            title: 'Fleet Report',
            description: 'Overall fleet performance and utilization statistics',
            icon: BarChart3,
        },
        {
            title: 'Maintenance Report',
            description: 'Maintenance schedule and service history',
            icon: FileText,
        },
        {
            title: 'Compliance Report',
            description: 'Alert violations and compliance metrics',
            icon: BarChart3,
        },
    ];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Reports" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Generate and download fleet reports" })] }), _jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reportTypes.map((report) => {
                    const Icon = report.icon;
                    return (_jsxs(Card, { className: "hover:shadow-md transition-shadow", children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: report.title }), _jsx(CardDescription, { children: report.description })] }), _jsx(Icon, { className: "text-fleet-tracker-600", size: 24 })] }) }), _jsx(CardContent, { children: _jsxs(Button, { variant: "outline", className: "w-full gap-2", children: [_jsx(Download, { size: 16 }), "Generate Report"] }) })] }, report.title));
                }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Recent Reports" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3 text-center py-12", children: [_jsx("p", { className: "text-gray-500", children: "No reports generated yet" }), _jsx(Button, { variant: "outline", children: "Generate your first report" })] }) })] })] }));
}
//# sourceMappingURL=ReportsPage.js.map