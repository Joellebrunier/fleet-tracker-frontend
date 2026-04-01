import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicle, useVehicleHistory } from '@/hooks/useVehicles';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatTimeAgo } from '@/lib/utils';
import { ArrowLeft, Gauge, Navigation, MapPin, Clock, Cpu, Car, Compass, } from 'lucide-react';
// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
export default function VehicleDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id || '');
    const { data: history } = useVehicleHistory(id || '');
    const positions = useMemo(() => {
        if (!history)
            return [];
        const items = Array.isArray(history) ? history : history.data || history.positions || [];
        return items.slice(0, 50);
    }, [history]);
    if (vehicleLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-48" }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx(Skeleton, { className: "h-64 lg:col-span-2" }), _jsx(Skeleton, { className: "h-64" })] })] }));
    }
    if (!vehicle) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-500", children: "V\u00E9hicule introuvable" }), _jsx(Button, { variant: "outline", className: "mt-4", onClick: () => navigate('/vehicles'), children: "Retour \u00E0 la liste" })] }));
    }
    const isMoving = (vehicle.currentSpeed || 0) > 2;
    const hasGps = vehicle.currentLat && vehicle.currentLng;
    const meta = vehicle.metadata || {};
    // Detect provider
    let provider = 'Inconnu';
    if (meta.flespiChannelId)
        provider = 'Flespi';
    else if (meta.echoesUid)
        provider = 'Echoes';
    else if (meta.keeptraceId)
        provider = 'KeepTrace';
    else if (meta.ubiwanId)
        provider = 'Ubiwan';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(-1), children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: vehicle.name }), _jsx(Badge, { variant: isMoving ? 'default' : 'secondary', children: isMoving ? 'En route' : hasGps ? 'Arrêté' : 'Hors ligne' })] }), _jsxs("p", { className: "mt-0.5 text-sm text-gray-500", children: [vehicle.plate, " \u00B7 ", provider, " \u00B7 IMEI: ", vehicle.deviceImei || 'N/A'] })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2 overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-base", children: "Position actuelle" }) }), _jsx(CardContent, { className: "p-0", children: hasGps ? (_jsx("div", { className: "h-72", children: _jsxs(MapContainer, { center: [vehicle.currentLat, vehicle.currentLng], zoom: 14, className: "h-full w-full", zoomControl: false, children: [_jsx(TileLayer, { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" }), _jsx(Marker, { position: [vehicle.currentLat, vehicle.currentLng], children: _jsxs(Popup, { children: [_jsx("strong", { children: vehicle.name }), _jsx("br", {}), (vehicle.currentSpeed || 0).toFixed(0), " km/h"] }) }), positions.map((pos, idx) => (_jsx(CircleMarker, { center: [pos.lat, pos.lng], radius: 3, pathOptions: {
                                                    color: '#3b82f6',
                                                    fillColor: '#3b82f6',
                                                    fillOpacity: 0.5 - idx * 0.01,
                                                    weight: 1,
                                                } }, idx)))] }) })) : (_jsx("div", { className: "h-72 flex items-center justify-center bg-gray-50", children: _jsxs("div", { className: "text-center text-gray-400", children: [_jsx(MapPin, { size: 32, className: "mx-auto mb-2" }), _jsx("p", { className: "text-sm", children: "Aucune position GPS disponible" })] }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "text-base", children: "Statut en temps r\u00E9el" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "rounded-lg bg-gray-50 p-4 text-center", children: [_jsx(Gauge, { size: 20, className: "mx-auto text-gray-400 mb-1" }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: (vehicle.currentSpeed || 0).toFixed(0) }), _jsx("p", { className: "text-xs text-gray-500", children: "km/h" })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Compass, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-gray-600 flex-1", children: "Cap" }), _jsxs("span", { className: "font-medium", children: [(vehicle.currentHeading || 0).toFixed(0), "\u00B0"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-gray-600 flex-1", children: "Position" }), _jsxs("span", { className: "font-mono text-xs", children: [vehicle.currentLat?.toFixed(5), ", ", vehicle.currentLng?.toFixed(5)] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-gray-600 flex-1", children: "Derni\u00E8re com." }), _jsx("span", { className: "font-medium text-xs", children: vehicle.lastCommunication ? formatTimeAgo(vehicle.lastCommunication) : 'Jamais' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Cpu, { size: 14, className: "text-gray-400" }), _jsx("span", { className: "text-gray-600 flex-1", children: "Provider" }), _jsx(Badge, { variant: "outline", className: "text-xs", children: provider })] })] })] })] })] }), _jsxs("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Car, { size: 18, className: "text-gray-400 mb-2" }), _jsx("p", { className: "text-xs text-gray-500", children: "Marque / Mod\u00E8le" }), _jsxs("p", { className: "font-semibold text-gray-900 mt-0.5", children: [vehicle.brand || '—', " ", vehicle.model || ''] })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Navigation, { size: 18, className: "text-gray-400 mb-2" }), _jsx("p", { className: "text-xs text-gray-500", children: "Plaque" }), _jsx("p", { className: "font-semibold text-gray-900 mt-0.5", children: vehicle.plate || '—' })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Cpu, { size: 18, className: "text-gray-400 mb-2" }), _jsx("p", { className: "text-xs text-gray-500", children: "IMEI" }), _jsx("p", { className: "font-mono text-xs text-gray-900 mt-0.5", children: vehicle.deviceImei || '—' })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Clock, { size: 18, className: "text-gray-400 mb-2" }), _jsx("p", { className: "text-xs text-gray-500", children: "Cr\u00E9\u00E9 le" }), _jsx("p", { className: "font-semibold text-gray-900 mt-0.5 text-sm", children: vehicle.createdAt ? formatDateTime(vehicle.createdAt) : '—' })] }) })] }), positions.length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "text-base", children: "Historique GPS" }), _jsx(CardDescription, { className: "text-xs", children: "Derni\u00E8res positions enregistr\u00E9es" })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-left text-xs text-gray-500", children: [_jsx("th", { className: "pb-2 pr-4", children: "Date" }), _jsx("th", { className: "pb-2 pr-4", children: "Vitesse" }), _jsx("th", { className: "pb-2 pr-4", children: "Cap" }), _jsx("th", { className: "pb-2", children: "Position" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-100", children: positions.slice(0, 15).map((pos, idx) => (_jsxs("tr", { className: "text-xs", children: [_jsx("td", { className: "py-2 pr-4 text-gray-600", children: pos.createdAt ? formatDateTime(pos.createdAt) : formatDateTime(pos.timestamp) }), _jsxs("td", { className: "py-2 pr-4 font-medium", children: [(pos.speed || 0).toFixed(0), " km/h"] }), _jsxs("td", { className: "py-2 pr-4 text-gray-600", children: [(pos.heading || 0).toFixed(0), "\u00B0"] }), _jsxs("td", { className: "py-2 font-mono text-gray-500", children: [pos.lat?.toFixed(5), ", ", pos.lng?.toFixed(5)] })] }, idx))) })] }) }) })] }))] }));
}
//# sourceMappingURL=VehicleDetailPage.js.map