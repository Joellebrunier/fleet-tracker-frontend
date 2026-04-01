import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useVehicles } from '@/hooks/useVehicles';
import { useMapStore } from '@/stores/mapStore';
import { formatTimeAgo } from '@/lib/utils';
import { Search, Layers, Navigation, Eye, ChevronRight, Satellite, Map as MapIcon, Wifi, WifiOff, HelpCircle, Wind, MapPin } from 'lucide-react';
import { useGpsWebSocket } from '@/hooks/useGpsWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { MAPBOX_TILE_URL, MAPBOX_TOKEN } from '@/lib/constants';
// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Vehicle marker icon factory
function createVehicleIcon(speed, heading, isSelected, vehicleType) {
    const isMoving = speed > 2;
    // Determine color based on vehicle type if moving, gray if stopped
    let typeColor = '#22c55e'; // default green
    if (vehicleType === 'car')
        typeColor = '#3b82f6';
    else if (vehicleType === 'truck')
        typeColor = '#f97316';
    else if (vehicleType === 'van')
        typeColor = '#8b5cf6';
    else if (vehicleType === 'motorcycle')
        typeColor = '#ef4444';
    const color = isMoving ? typeColor : '#6b7280'; // use type color if moving, gray if stopped
    const borderColor = isSelected ? '#3b82f6' : '#ffffff';
    const size = isSelected ? 18 : 14;
    const border = isSelected ? 4 : 2;
    return L.divIcon({
        html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${border}px solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ${isMoving ? `transform: rotate(${heading}deg);` : ''}
    "></div>
    ${isMoving ? `<div style="
      position: absolute; top: -6px; left: 50%; transform: translateX(-50%) rotate(${heading}deg);
      width: 0; height: 0;
      border-left: 4px solid transparent; border-right: 4px solid transparent;
      border-bottom: 8px solid ${color};
    "></div>` : ''}`,
        className: 'vehicle-marker',
        iconSize: [size + border * 2, size + border * 2],
        iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
    });
}
// Component to fly the map to a selected vehicle
function FlyToVehicle({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 15, { duration: 1 });
        }
    }, [lat, lng, map]);
    return null;
}
// Component to handle keyboard shortcuts
function KeyboardShortcuts({ onShortcut }) {
    const map = useMap();
    const [showHelp, setShowHelp] = useState(false);
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key.toLowerCase() === 'f') {
                onShortcut('fullscreen');
            }
            else if (e.key.toLowerCase() === 't') {
                onShortcut('traffic');
            }
            else if (e.key.toLowerCase() === 's') {
                onShortcut('streets');
            }
            else if (e.key.toLowerCase() === 'a') {
                onShortcut('satellite');
            }
            else if (e.key.toLowerCase() === 'r') {
                onShortcut('terrain');
            }
            else if (e.key === '?') {
                setShowHelp(!showHelp);
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onShortcut, showHelp]);
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowHelp(!showHelp), className: "absolute bottom-16 right-4 z-[1000] bg-white shadow-md rounded-lg p-2 hover:bg-gray-50 border border-gray-200", title: "Press ? for help", children: _jsx(HelpCircle, { size: 16, className: "text-gray-600" }) }), showHelp && (_jsxs("div", { className: "absolute bottom-28 right-4 z-[1000] bg-white shadow-lg rounded-lg p-3 border border-gray-200 w-56 text-xs", children: [_jsx("p", { className: "font-semibold mb-2 text-gray-900", children: "Raccourcis clavier" }), _jsxs("div", { className: "space-y-1.5 text-gray-600", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "F" }), _jsx("span", { children: "Basculer plein \u00E9cran" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "T" }), _jsx("span", { children: "Afficher trafic" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "S" }), _jsx("span", { children: "Plan rue" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "A" }), _jsx("span", { children: "Satellite" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "R" }), _jsx("span", { children: "Terrain" })] })] })] }))] }));
}
// TODO: Implement marker clustering - when zoom < 8 and vehicles are close together, show count badges
// This would require leaflet.markercluster or custom grouping logic
// Component to fit bounds to all vehicles
function FitBounds({ vehicles }) {
    const map = useMap();
    const hasSetBounds = useRef(false);
    useEffect(() => {
        if (vehicles.length > 0 && !hasSetBounds.current) {
            const withGps = vehicles.filter((v) => v.currentLat && v.currentLng);
            if (withGps.length > 0) {
                const bounds = L.latLngBounds(withGps.map((v) => [v.currentLat, v.currentLng]));
                map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
                hasSetBounds.current = true;
            }
        }
    }, [vehicles, map]);
    return null;
}
export default function MapPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [tileLayer, setTileLayer] = useState('streets');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [showHelpPopover, setShowHelpPopover] = useState(false);
    const [showMiniMap, setShowMiniMap] = useState(true);
    const [showManualGps, setShowManualGps] = useState(false);
    const [manualGpsForm, setManualGpsForm] = useState({ lat: '', lng: '', name: '' });
    const [manualMarkers, setManualMarkers] = useState([]);
    const { selectedVehicleId, selectVehicle, showGeofences, toggleGeofences, } = useMapStore();
    const queryClient = useQueryClient();
    const { data: vehiclesData } = useVehicles({ limit: 500 });
    // Real-time WebSocket for GPS position updates
    const { isConnected } = useGpsWebSocket({
        enabled: true,
        onPositionUpdate: (update) => {
            // Invalidate vehicle queries to refresh positions
            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        },
    });
    const vehicles = useMemo(() => vehiclesData?.data || [], [vehiclesData]);
    const filteredVehicles = useMemo(() => vehicles.filter((v) => v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase())), [vehicles, searchTerm]);
    const vehiclesWithGps = useMemo(() => vehicles.filter((v) => v.currentLat && v.currentLng), [vehicles]);
    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    const movingCount = vehiclesWithGps.filter((v) => (v.currentSpeed || 0) > 2).length;
    const stoppedCount = vehiclesWithGps.length - movingCount;
    const offlineCount = vehicles.length - vehiclesWithGps.length;
    // Calculate average speed of moving vehicles
    const avgFleetSpeed = movingCount > 0
        ? vehiclesWithGps
            .filter((v) => (v.currentSpeed || 0) > 2)
            .reduce((sum, v) => sum + (v.currentSpeed || 0), 0) / movingCount
        : 0;
    const tileUrl = tileLayer === 'satellite'
        ? MAPBOX_TILE_URL('satellite-streets-v12')
        : tileLayer === 'terrain'
            ? MAPBOX_TILE_URL('outdoors-v12')
            : MAPBOX_TILE_URL('streets-v12');
    const tileAttribution = '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const trafficUrl = `https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
    const handleShortcut = (action) => {
        switch (action) {
            case 'fullscreen':
                setIsFullscreen(!isFullscreen);
                break;
            case 'traffic':
                setShowTraffic(!showTraffic);
                break;
            case 'streets':
                setTileLayer('streets');
                break;
            case 'satellite':
                setTileLayer('satellite');
                break;
            case 'terrain':
                setTileLayer('terrain');
                break;
        }
    };
    return (_jsxs("div", { className: "flex h-[calc(100vh-80px)] gap-4", children: [_jsxs("div", { className: `relative ${isFullscreen ? 'w-full' : 'flex-1'} rounded-lg border border-gray-200 overflow-hidden shadow-sm`, children: [_jsxs(MapContainer, { center: [43.7, 3.87], zoom: 6, className: "h-full w-full z-0", zoomControl: false, children: [_jsx(TileLayer, { url: tileUrl, attribution: tileAttribution, tileSize: 512, zoomOffset: -1 }), showTraffic && _jsx(TileLayer, { url: trafficUrl, attribution: tileAttribution, opacity: 0.5 }), _jsx(FitBounds, { vehicles: vehicles }), _jsx(KeyboardShortcuts, { onShortcut: handleShortcut }), selectedVehicle?.currentLat && selectedVehicle?.currentLng && (_jsx(FlyToVehicle, { lat: selectedVehicle.currentLat, lng: selectedVehicle.currentLng })), vehiclesWithGps.map((vehicle) => (_jsx(Marker, { position: [vehicle.currentLat, vehicle.currentLng], icon: createVehicleIcon(vehicle.currentSpeed || 0, vehicle.currentHeading || 0, vehicle.id === selectedVehicleId, vehicle.type), eventHandlers: {
                                    click: () => selectVehicle(vehicle.id),
                                }, children: _jsx(Popup, { children: _jsxs("div", { className: "min-w-48 p-1", children: [_jsx("p", { className: "font-bold text-sm", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500 mb-2", children: vehicle.plate }), _jsxs("div", { className: "text-xs space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Vitesse:" }), _jsxs("span", { className: "font-medium", children: [(vehicle.currentSpeed || 0).toFixed(0), " km/h"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Derni\u00E8re com.:" }), _jsx("span", { className: "font-medium", children: formatTimeAgo(vehicle.lastCommunication) })] })] }), _jsx("button", { onClick: () => navigate(`/vehicles/${vehicle.id}`), className: "mt-2 w-full text-xs text-blue-600 hover:text-blue-800 font-medium", children: "Voir d\u00E9tails \u2192" })] }) }) }, vehicle.id))), manualMarkers.map((marker, idx) => (_jsx(Marker, { position: [marker.lat, marker.lng], icon: L.divIcon({
                                    html: `<div style="
                  width: 20px; height: 20px;
                  background: #f97316;
                  border: 2px solid #ffffff;
                  border-radius: 50%;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>`,
                                    className: 'manual-marker',
                                    iconSize: [20, 20],
                                    iconAnchor: [10, 10],
                                }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-bold", children: marker.name }), _jsxs("p", { className: "text-xs text-gray-500", children: [marker.lat.toFixed(5), ", ", marker.lng.toFixed(5)] })] }) }) }, `manual-${idx}`)))] }), _jsxs("div", { className: "absolute top-4 right-4 z-[1000] flex flex-col gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                    if (tileLayer === 'streets')
                                        setTileLayer('satellite');
                                    else if (tileLayer === 'satellite')
                                        setTileLayer('terrain');
                                    else
                                        setTileLayer('streets');
                                }, className: "gap-2 bg-white shadow-md", children: [tileLayer === 'streets' ? _jsx(Satellite, { size: 16 }) : tileLayer === 'satellite' ? _jsx(MapIcon, { size: 16 }) : _jsx(Layers, { size: 16 }), tileLayer === 'streets' ? 'Satellite' : tileLayer === 'satellite' ? 'Terrain' : 'Plan'] }), _jsxs(Button, { variant: showTraffic ? 'default' : 'outline', size: "sm", onClick: () => setShowTraffic(!showTraffic), className: "gap-2 bg-white shadow-md", children: [_jsx(Wind, { size: 16 }), "Trafic"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsFullscreen(!isFullscreen), className: "gap-2 bg-white shadow-md", children: [_jsx(Navigation, { size: 16 }), isFullscreen ? 'Quitter plein écran' : 'Plein écran'] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowManualGps(!showManualGps), className: "gap-2 bg-white shadow-md", children: [_jsx(MapPin, { size: 16 }), "Saisie manuelle"] })] }), _jsx("div", { className: "absolute top-4 left-4 z-[1000] flex flex-col gap-2", children: _jsxs("div", { className: "rounded-lg bg-white px-3 py-1.5 shadow-md text-xs font-medium flex items-center gap-1.5", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-green-500 inline-block" }), "Fournisseur principal: Flespi"] }) }), _jsxs("div", { className: "absolute bottom-4 left-4 z-[1000] flex flex-wrap gap-2 max-w-xs", children: [_jsxs("div", { className: "rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-green-500 inline-block" }), movingCount, " en mouvement"] }), _jsxs("div", { className: "rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" }), stoppedCount, " \u00E0 l'arr\u00EAt"] }), _jsxs("div", { className: "rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-red-400 inline-block" }), offlineCount, " hors ligne"] }), _jsxs("div", { className: "rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium", children: ["Vitesse moyenne: ", avgFleetSpeed.toFixed(0), " km/h"] }), _jsxs("div", { className: "rounded-full bg-white px-3 py-1 shadow-md text-xs font-medium", children: [vehiclesWithGps.length, " / ", vehicles.length, " GPS actif"] }), _jsxs("div", { className: `rounded-full px-3 py-1 shadow-md text-xs font-medium flex items-center gap-1.5 ${isConnected ? 'bg-green-50 text-green-700' : 'bg-white text-gray-500'}`, children: [isConnected ? _jsx(Wifi, { size: 12 }) : _jsx(WifiOff, { size: 12 }), isConnected ? 'Live' : 'Polling'] })] }), showMiniMap && (_jsx("div", { className: "absolute bottom-4 left-56 z-[1000]", children: _jsx(Card, { className: "w-40 shadow-lg", children: _jsxs(CardContent, { className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-xs font-semibold text-gray-700", children: "Vue d'ensemble" }), _jsx("button", { onClick: () => setShowMiniMap(false), className: "text-gray-400 hover:text-gray-600 text-sm", children: "\u00D7" })] }), _jsxs("div", { className: "text-xs text-gray-600 space-y-1", children: [_jsxs("p", { className: "font-medium", children: [vehiclesWithGps.length, " v\u00E9hicules"] }), _jsx("p", { className: "text-gray-500", children: "Zone: Nice/C\u00F4te d'Azur" })] })] }) }) })), showManualGps && (_jsx("div", { className: "absolute top-20 right-4 z-[1000]", children: _jsxs(Card, { className: "w-64 shadow-lg", children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm", children: "Saisie manuelle GPS" }), _jsx("button", { onClick: () => setShowManualGps(false), className: "text-gray-400 hover:text-gray-600", children: "\u00D7" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-600 block mb-1", children: "Latitude" }), _jsx(Input, { type: "number", step: "0.00001", placeholder: "43.7", value: manualGpsForm.lat, onChange: (e) => setManualGpsForm({ ...manualGpsForm, lat: e.target.value }), className: "h-8 text-xs" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-600 block mb-1", children: "Longitude" }), _jsx(Input, { type: "number", step: "0.00001", placeholder: "3.87", value: manualGpsForm.lng, onChange: (e) => setManualGpsForm({ ...manualGpsForm, lng: e.target.value }), className: "h-8 text-xs" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-gray-600 block mb-1", children: "Nom du traceur" }), _jsx(Input, { type: "text", placeholder: "Traceur manuel", value: manualGpsForm.name, onChange: (e) => setManualGpsForm({ ...manualGpsForm, name: e.target.value }), className: "h-8 text-xs" })] }), _jsx(Button, { size: "sm", onClick: () => {
                                                if (manualGpsForm.lat && manualGpsForm.lng) {
                                                    const newMarker = {
                                                        lat: parseFloat(manualGpsForm.lat),
                                                        lng: parseFloat(manualGpsForm.lng),
                                                        name: manualGpsForm.name || 'Traceur manuel',
                                                    };
                                                    setManualMarkers([...manualMarkers, newMarker]);
                                                    setManualGpsForm({ lat: '', lng: '', name: '' });
                                                }
                                            }, className: "w-full text-xs h-8", children: "Ajouter" })] })] }) })), _jsx("div", { className: "absolute bottom-4 right-4 z-[1000]", children: _jsx(KeyboardShortcuts, { onShortcut: handleShortcut }) })] }), !isFullscreen && (_jsxs("div", { className: "w-80 flex flex-col gap-4 overflow-hidden", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-4 pb-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-gray-400", size: 16 }), _jsx(Input, { type: "search", placeholder: "Rechercher un v\u00E9hicule...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-9 h-10" })] }) }) }), _jsxs(Card, { className: "flex-1 overflow-hidden flex flex-col", children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs(CardTitle, { className: "text-sm font-semibold text-gray-700", children: ["V\u00E9hicules (", filteredVehicles.length, ")"] }) }), _jsx(CardContent, { className: "flex-1 overflow-y-auto pb-4", children: _jsx("div", { className: "space-y-1.5", children: filteredVehicles.map((vehicle) => {
                                        const isMoving = (vehicle.currentSpeed || 0) > 2;
                                        const hasGps = vehicle.currentLat && vehicle.currentLng;
                                        return (_jsx("button", { onClick: () => selectVehicle(vehicle.id), className: `w-full rounded-lg border p-2.5 text-left transition-all ${selectedVehicleId === vehicle.id
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2.5 w-2.5 rounded-full flex-shrink-0 ${!hasGps ? 'bg-red-400' : isMoving ? 'bg-green-500' : 'bg-gray-400'}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm text-gray-900 truncate", children: vehicle.name }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: vehicle.plate })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsx("p", { className: "text-xs font-medium text-gray-700", children: hasGps ? `${(vehicle.currentSpeed || 0).toFixed(0)} km/h` : 'Hors ligne' }), _jsx("p", { className: "text-xs text-gray-400", children: formatTimeAgo(vehicle.lastCommunication) })] })] }) }, vehicle.id));
                                    }) }) })] }), selectedVehicle && (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-semibold", children: selectedVehicle.name }), _jsx(Badge, { variant: selectedVehicle.currentSpeed > 2 ? 'default' : 'secondary', className: "text-xs", children: selectedVehicle.currentSpeed > 2 ? 'En route' : 'Arrêté' })] }) }), _jsxs(CardContent, { className: "space-y-2 text-sm pb-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "bg-gray-50 rounded p-2", children: [_jsx("p", { className: "text-gray-500", children: "Vitesse" }), _jsxs("p", { className: "font-bold text-lg", children: [(selectedVehicle.currentSpeed || 0).toFixed(0), _jsx("span", { className: "text-xs font-normal", children: " km/h" })] })] }), _jsxs("div", { className: "bg-gray-50 rounded p-2", children: [_jsx("p", { className: "text-gray-500", children: "Cap" }), _jsxs("p", { className: "font-bold text-lg", children: [(selectedVehicle.currentHeading || 0).toFixed(0), _jsx("span", { className: "text-xs font-normal", children: "\u00B0" })] })] })] }), _jsxs("div", { className: "text-xs text-gray-500", children: [_jsxs("p", { children: ["Position: ", selectedVehicle.currentLat?.toFixed(5), ", ", selectedVehicle.currentLng?.toFixed(5)] }), _jsxs("p", { children: ["Derni\u00E8re com.: ", formatTimeAgo(selectedVehicle.lastCommunication)] })] }), _jsxs(Button, { variant: "outline", className: "w-full gap-2", size: "sm", onClick: () => navigate(`/vehicles/${selectedVehicle.id}`), children: [_jsx(Eye, { size: 14 }), "Voir les d\u00E9tails", _jsx(ChevronRight, { size: 14 })] })] })] }))] }))] }));
}
//# sourceMappingURL=MapPage.js.map