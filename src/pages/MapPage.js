import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useVehicles } from '@/hooks/useVehicles';
import { useMapStore } from '@/stores/mapStore';
import { formatSpeed, formatTimeAgo } from '@/lib/utils';
import { MAP_DEFAULTS } from '@/lib/constants';
import { Map, Search, Layers } from 'lucide-react';
export default function MapPage() {
    const mapContainer = useRef(null);
    const [map, setMap] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { selectedVehicleId, selectVehicle, mapStyle, setMapStyle, showGeofences, toggleGeofences, } = useMapStore();
    const { data: vehiclesData } = useVehicles({ limit: 100 });
    const vehicles = vehiclesData?.data || [];
    const filteredVehicles = vehicles.filter((v) => v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase()));
    // Initialize map (simplified - requires mapbox-gl setup)
    useEffect(() => {
        if (mapContainer.current && !map) {
            // Map initialization would go here
            // For now, this is a placeholder
        }
    }, [map]);
    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    return (_jsx("div", { className: "h-full space-y-4", children: _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row", children: [_jsxs("div", { className: "flex-1 rounded-lg border border-gray-200 bg-white shadow-sm lg:h-[calc(100vh-200px)]", children: [_jsx("div", { ref: mapContainer, className: "h-96 w-full rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center lg:h-full", children: _jsxs("div", { className: "text-center", children: [_jsx(Map, { className: "mx-auto mb-4 text-gray-400", size: 48 }), _jsx("p", { className: "text-gray-500", children: "Map view (Mapbox integration required)" }), _jsx("p", { className: "text-sm text-gray-400 mt-2", children: "Configure MAPBOX_TOKEN in environment variables" })] }) }), _jsxs("div", { className: "absolute top-4 right-4 space-y-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setMapStyle(mapStyle === MAP_DEFAULTS.MAP_STYLE
                                        ? MAP_DEFAULTS.SATELLITE_STYLE
                                        : MAP_DEFAULTS.MAP_STYLE), className: "gap-2", children: [_jsx(Layers, { size: 16 }), "Style"] }), _jsx(Button, { variant: showGeofences ? 'default' : 'outline', size: "sm", onClick: () => toggleGeofences(!showGeofences), children: "Geofences" })] })] }), _jsxs("div", { className: "w-full space-y-4 lg:w-80", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-gray-400", size: 18 }), _jsx(Input, { type: "search", placeholder: "Search vehicles...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg", children: ["Vehicles (", filteredVehicles.length, ")"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "max-h-96 space-y-2 overflow-y-auto", children: filteredVehicles.map((vehicle) => (_jsxs("button", { onClick: () => selectVehicle(vehicle.id), className: `w-full rounded-lg border-2 p-3 text-left transition-colors ${selectedVehicleId === vehicle.id
                                                ? 'border-fleet-tracker-500 bg-fleet-tracker-50'
                                                : 'border-gray-200 hover:border-gray-300'}`, children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.plate })] }), _jsx(Badge, { variant: "secondary", children: vehicle.status })] }), _jsxs("div", { className: "mt-2 flex items-center justify-between text-xs text-gray-600", children: [_jsx("span", { children: formatSpeed(vehicle.currentSpeed) }), _jsx("span", { children: formatTimeAgo(vehicle.lastCommunication) })] })] }, vehicle.id))) }) })] }), selectedVehicle && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: selectedVehicle.name }) }), _jsxs(CardContent, { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Speed:" }), _jsx("span", { className: "font-medium", children: formatSpeed(selectedVehicle.currentSpeed) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Status:" }), _jsx(Badge, { variant: "default", children: selectedVehicle.status })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Position:" }), _jsxs("span", { className: "font-medium text-xs", children: [selectedVehicle.currentLat?.toFixed(4), ", ", selectedVehicle.currentLng?.toFixed(4)] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Last Update:" }), _jsx("span", { className: "font-medium", children: formatTimeAgo(selectedVehicle.lastCommunication) })] }), _jsx("div", { className: "border-t border-gray-200 pt-3", children: _jsx(Button, { variant: "outline", className: "w-full", size: "sm", children: "View Details" }) })] })] }))] })] }) }));
}
//# sourceMappingURL=MapPage.js.map