import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useVehicles } from '@/hooks/useVehicles';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Grid2X2, List } from 'lucide-react';
import { VehicleStatus } from '@/types/vehicle';
import { formatSpeed, formatTimeAgo } from '@/lib/utils';
export default function VehiclesPage() {
    const [viewMode, setViewMode] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [page, setPage] = useState(1);
    const { data: vehiclesData, isLoading } = useVehicles({
        page,
        limit: 20,
        status: selectedStatus,
        search: searchTerm,
    });
    const vehicles = vehiclesData?.data || [];
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Vehicles" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Manage and monitor your fleet" })] }), _jsxs(Button, { className: "gap-2", children: [_jsx(Plus, { size: 18 }), "Add Vehicle"] })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-gray-400", size: 18 }), _jsx(Input, { type: "search", placeholder: "Search by name or registration...", value: searchTerm, onChange: (e) => {
                                                setSearchTerm(e.target.value);
                                                setPage(1);
                                            }, className: "pl-10" })] }) }), _jsxs("select", { value: selectedStatus, onChange: (e) => {
                                    setSelectedStatus(e.target.value);
                                    setPage(1);
                                }, className: "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50", children: [_jsx("option", { value: "", children: "All Statuses" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "offline", children: "Offline" }), _jsx("option", { value: "idle", children: "Idle" }), _jsx("option", { value: "maintenance", children: "Maintenance" })] }), _jsxs("div", { className: "flex gap-2 border-l border-gray-200 pl-4", children: [_jsx(Button, { variant: viewMode === 'list' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('list'), children: _jsx(List, { size: 18 }) }), _jsx(Button, { variant: viewMode === 'grid' ? 'default' : 'outline', size: "sm", onClick: () => setViewMode('grid'), children: _jsx(Grid2X2, { size: 18 }) })] })] }) }) }), isLoading ? (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: [...Array(6)].map((_, i) => (_jsx(Skeleton, { className: "h-48" }, i))) })) : vehicles.length === 0 ? (_jsx(Card, { className: "text-center", children: _jsx(CardContent, { className: "pt-12", children: _jsx("p", { className: "text-gray-500", children: "No vehicles found" }) }) })) : viewMode === 'list' ? (_jsx(Card, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Registration" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Speed" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Last Update" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: vehicles.map((vehicle) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors cursor-pointer", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: vehicle.name }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: vehicle.registrationNumber }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600 capitalize", children: vehicle.type }), _jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: formatSpeed(vehicle.speed) }), _jsx("td", { className: "px-6 py-4", children: _jsx(Badge, { variant: getStatusBadgeVariant(vehicle.status), children: vehicle.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: formatTimeAgo(vehicle.lastUpdate) })] }, vehicle.id))) })] }) }) })) : (_jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: vehicles.map((vehicle) => (_jsx(Card, { className: "hover:shadow-md transition-shadow cursor-pointer", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-sm text-gray-500", children: vehicle.registrationNumber })] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Type:" }), _jsx("span", { className: "font-medium capitalize", children: vehicle.type })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Speed:" }), _jsx("span", { className: "font-medium", children: formatSpeed(vehicle.speed) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Odometer:" }), _jsxs("span", { className: "font-medium", children: [vehicle.odometer.toLocaleString(), " km"] })] })] }), _jsx("div", { className: "border-t border-gray-200 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Badge, { variant: getStatusBadgeVariant(vehicle.status), children: vehicle.status }), _jsx("span", { className: "text-xs text-gray-500", children: formatTimeAgo(vehicle.lastUpdate) })] }) })] }) }) }, vehicle.id))) })), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("p", { className: "text-sm text-gray-600", children: ["Page ", page, " of ", totalPages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.max(1, page - 1)), disabled: page === 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(Math.min(totalPages, page + 1)), disabled: page === totalPages, children: "Next" })] })] }))] }));
}
//# sourceMappingURL=VehiclesPage.js.map