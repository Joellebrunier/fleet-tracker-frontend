import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { useVehicles, useCreateVehicle } from '@/hooks/useVehicles';
import { useMapStore } from '@/stores/mapStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { Search, Navigation, Wifi, HelpCircle, AlertCircle, X, Edit2, Trash2, Clock, Plus, Share2, Download, Settings, RefreshCw, Check } from 'lucide-react';
import { useGpsWebSocket } from '@/hooks/useGpsWebSocket';
import { useQueryClient } from '@tanstack/react-query';
// Simple virtualization hook — renders only visible items
function useVirtualization(totalItems, itemHeight, containerRef) {
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(600);
    useEffect(() => {
        const el = containerRef.current;
        if (!el)
            return;
        const observer = new ResizeObserver((entries) => {
            setContainerHeight(entries[0]?.contentRect.height || 600);
        });
        observer.observe(el);
        const handleScroll = () => setScrollTop(el.scrollTop);
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => { observer.disconnect(); el.removeEventListener('scroll', handleScroll); };
    }, [containerRef]);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 10;
    const endIndex = Math.min(totalItems, startIndex + visibleCount);
    return { startIndex, endIndex, totalHeight: totalItems * itemHeight, offsetY: startIndex * itemHeight };
}
const ITEM_HEIGHT = 68;
const PROVIDER_COLORS = {
    ECHOES: 'bg-violet-100 text-violet-700',
    UBIWAN: 'bg-sky-100 text-sky-700',
    KEEPTRACE: 'bg-teal-100 text-teal-700',
    FLESPI: 'bg-orange-100 text-orange-700',
};
const CIRCUMFERENCE = 2 * Math.PI * 14;
function VehicleList({ vehicles, selectedVehicleId, useImperialUnits, onSelect }) {
    const scrollRef = useRef(null);
    const { startIndex, endIndex, totalHeight, offsetY } = useVirtualization(vehicles.length, ITEM_HEIGHT, scrollRef);
    return (_jsx("div", { ref: scrollRef, className: "flex-1 overflow-y-auto", style: { contain: 'strict' }, children: _jsx("div", { style: { height: totalHeight, position: 'relative' }, children: _jsx("div", { style: { position: 'absolute', top: offsetY, left: 0, right: 0 }, children: vehicles.slice(startIndex, endIndex).map((vehicle) => {
                    const speed = vehicle.currentSpeed || 0;
                    const isMoving = speed > 2;
                    const hasGps = vehicle.currentLat && vehicle.currentLng;
                    const isSelected = selectedVehicleId === vehicle.id;
                    const provider = vehicle.gpsProvider || '';
                    const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
                    const speedPct = Math.min(speed / 200, 1);
                    const strokeDash = speedPct * CIRCUMFERENCE;
                    const speedColor = !hasGps ? '#ef4444' : isMoving ? '#10b981' : '#9ca3af';
                    return (_jsx("button", { onClick: () => onSelect(vehicle.id), className: `w-full px-3 py-2 text-left border-b border-gray-100 ${isSelected ? 'bg-blue-50 border-l-3 border-l-[#4361EE]' : 'hover:bg-gray-50'}`, style: { height: ITEM_HEIGHT }, children: _jsxs("div", { className: "flex items-center gap-2.5", children: [_jsxs("div", { className: "relative w-9 h-9 shrink-0", children: [_jsxs("svg", { viewBox: "0 0 36 36", className: "w-full h-full -rotate-90", children: [_jsx("circle", { cx: "18", cy: "18", r: "14", fill: "none", stroke: "#e5e7eb", strokeWidth: "3" }), _jsx("circle", { cx: "18", cy: "18", r: "14", fill: "none", stroke: speedColor, strokeWidth: "3", strokeDasharray: `${strokeDash} ${CIRCUMFERENCE}`, strokeLinecap: "round" })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsx("span", { className: "text-[8px] font-bold tabular-nums", style: { color: speedColor }, children: hasGps ? Math.round(speed) : '—' }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("p", { className: `font-bold text-[12px] truncate ${isSelected ? 'text-[#4361EE]' : 'text-gray-900'}`, children: vehicle.plate || vehicle.name }), _jsx("div", { className: `w-1.5 h-1.5 rounded-full shrink-0 ${!hasGps ? 'bg-red-400' : isMoving ? 'bg-emerald-500' : 'bg-gray-400'}` })] }), _jsx("p", { className: "text-[10px] text-gray-400 truncate", children: brandModel || vehicle.name }), _jsxs("div", { className: "flex items-center gap-1.5 mt-0.5", children: [provider && _jsx("span", { className: `text-[9px] font-bold px-1.5 py-0.5 rounded ${PROVIDER_COLORS[provider] || 'bg-gray-100 text-gray-500'}`, children: provider }), _jsx("span", { className: "text-[10px] text-gray-400 tabular-nums", children: hasGps ? `${getFormattedSpeed(speed, useImperialUnits).value} ${getFormattedSpeed(speed, useImperialUnits).unit}` : 'Non localisé' })] })] })] }) }, vehicle.id));
                }) }) }) }));
}
import { TOMTOM_TILE_URL, TOMTOM_TRAFFIC_FLOW_URL } from '@/lib/constants';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
// Helper: Derive GPS provider from vehicle metadata
function getGpsProvider(vehicle) {
    const meta = vehicle.metadata || {};
    if (meta.echoesRaw || meta.echoesUid)
        return 'ECHOES';
    if (meta.ubiwanRaw || meta.ubiwanId)
        return 'UBIWAN';
    if (meta.keeptraceRaw || meta.keeptraceId)
        return 'KEEPTRACE';
    if (meta.flespiRaw || meta.flespiId)
        return 'FLESPI';
    // Check device IMEI patterns or other hints
    if (vehicle.deviceImei)
        return 'FLESPI';
    return '';
}
// Helper function to convert speed based on user preferences
function getFormattedSpeed(speedKmh, useImperial) {
    if (useImperial) {
        const mph = speedKmh * 0.621371;
        return { value: mph.toFixed(0), unit: 'mph' };
    }
    return { value: speedKmh.toFixed(0), unit: 'km/h' };
}
// Reusable manual marker icon (created once)
const manualMarkerIcon = L.divIcon({ html: '<div style="width:16px;height:16px;background:#f97316;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>', className: 'manual-marker', iconSize: [16, 16], iconAnchor: [8, 8] });
// Fix default marker icons for Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Vehicle marker icon factory — cached to avoid recreating icons
const iconCache = new Map();
function createVehicleIcon(speed, heading, isSelected, vehicleType) {
    const isMoving = speed > 2;
    // Quantize heading to 15-degree increments to improve cache hits
    const quantizedHeading = isMoving ? Math.round(heading / 15) * 15 : 0;
    const cacheKey = `${isMoving ? 1 : 0}-${isSelected ? 1 : 0}-${vehicleType || 'd'}-${quantizedHeading}`;
    const cached = iconCache.get(cacheKey);
    if (cached)
        return cached;
    let typeColor = '#22c55e';
    if (vehicleType === 'car')
        typeColor = '#3b82f6';
    else if (vehicleType === 'truck')
        typeColor = '#f97316';
    else if (vehicleType === 'van')
        typeColor = '#8b5cf6';
    else if (vehicleType === 'motorcycle')
        typeColor = '#ef4444';
    const color = isMoving ? typeColor : '#6b7280';
    const borderColor = isSelected ? '#3b82f6' : '#ffffff';
    const size = isSelected ? 18 : 14;
    const border = isSelected ? 4 : 2;
    const icon = L.divIcon({
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:${border}px solid ${borderColor};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);${isMoving ? `transform:rotate(${quantizedHeading}deg);` : ''}"></div>${isMoving ? `<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(${quantizedHeading}deg);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid ${color};"></div>` : ''}`,
        className: 'vehicle-marker',
        iconSize: [size + border * 2, size + border * 2],
        iconAnchor: [(size + border * 2) / 2, (size + border * 2) / 2],
    });
    // Limit cache size
    if (iconCache.size > 500)
        iconCache.clear();
    iconCache.set(cacheKey, icon);
    return icon;
}
// Component to fly the map to a selected vehicle
function FlyToVehicle({ lat, lng, vehicleId }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng && vehicleId) {
            map.flyTo([lat, lng], Math.max(map.getZoom(), 14), { duration: 1 });
        }
    }, [lat, lng, vehicleId, map]);
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
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowHelp(!showHelp), className: "absolute bottom-16 right-4 z-[400] bg-white shadow-lg rounded-xl p-2 hover:bg-gray-50 border border-gray-200", title: "Press ? for help", children: _jsx(HelpCircle, { size: 16, className: "text-gray-500" }) }), showHelp && (_jsxs("div", { className: "absolute bottom-28 right-4 z-[400] bg-white shadow-lg rounded-xl p-3 border border-gray-200 w-56 text-xs backdrop-blur", children: [_jsx("p", { className: "font-sans font-semibold mb-2 text-gray-900", children: "Raccourcis clavier" }), _jsxs("div", { className: "space-y-1.5 text-gray-500", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "F" }), _jsx("span", { children: "Basculer plein \u00E9cran" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "T" }), _jsx("span", { children: "Afficher trafic" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "S" }), _jsx("span", { children: "Plan rue" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "A" }), _jsx("span", { children: "Satellite" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "R" }), _jsx("span", { children: "Terrain" })] })] })] }))] }));
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
// Component to track zoom level changes
function MapEvents({ onZoomChange }) {
    const map = useMap();
    useEffect(() => {
        const handleZoom = () => {
            onZoomChange(map.getZoom());
        };
        map.on('zoom', handleZoom);
        return () => {
            map.off('zoom', handleZoom);
        };
    }, [map, onZoomChange]);
    return null;
}
// Mini-map overview component with lower zoom
function MiniMapOverview({ vehicles }) {
    const map = useMap();
    return (_jsx("div", { className: "absolute bottom-32 left-56 z-[400] w-56 h-56 border border-gray-200 rounded-xl overflow-hidden shadow-lg bg-white pointer-events-none", children: _jsxs(MapContainer, { center: map.getCenter(), zoom: map.getZoom() - 4, style: { width: '100%', height: '100%' }, zoomControl: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, scrollWheelZoom: false, touchZoom: false, className: "pointer-events-none", children: [_jsx(TileLayer, { url: TOMTOM_TILE_URL('dark'), attribution: "\u00A9 TomTom" }), vehicles.map((v) => v.currentLat && v.currentLng && (_jsx(Marker, { position: [v.currentLat, v.currentLng], icon: L.divIcon({
                        html: `<div style="width: 6px; height: 6px; background: #4361EE; border-radius: 50%; box-shadow: 0 0 4px rgba(67,97,238,0.6);"></div>`,
                        className: 'mini-marker',
                        iconSize: [6, 6],
                        iconAnchor: [3, 3],
                    }) }, `minimap-${v.id}`)))] }) }));
}
// Event markers component
function EventMarkers({ alerts }) {
    const iconMap = {
        speed: '#EF4444',
        geofence: '#F59E0B',
        idle: '#4361EE',
    };
    return (_jsx(_Fragment, { children: alerts.map(alert => (alert.lat && alert.lng && (_jsx(Marker, { position: [alert.lat, alert.lng], icon: L.divIcon({
                html: `<div style="
                width: 20px; height: 20px;
                background: ${iconMap[alert.type]};
                border: 2px solid white;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; font-weight: bold;
                box-shadow: 0 0 8px rgba(0,0,0,0.4);
              ">!</div>`,
                className: 'alert-marker',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-xs bg-white text-gray-900", children: [_jsx("p", { className: "font-bold font-sans", children: alert.type.toUpperCase() }), _jsx("p", { className: "text-gray-500", children: alert.message })] }) }) }, alert.id)))) }));
}
// Vehicle trail polyline component with breadcrumb dots
function VehicleTrailComponent({ trail }) {
    if (!trail || trail.length < 2)
        return null;
    const coordinates = trail.map(t => [t.lat, t.lng]);
    // Show breadcrumb dots only for a subset of points (every Nth point)
    const dotInterval = Math.max(1, Math.floor(trail.length / 80));
    return (_jsxs(_Fragment, { children: [_jsx(Polyline, { positions: coordinates, color: "#4361EE", weight: 3, opacity: 0.7 }), trail.filter((_, idx) => idx % dotInterval === 0).map((point, idx) => (_jsx(CircleMarker, { center: [point.lat, point.lng], radius: 3, fillColor: "#4361EE", color: "#ffffff", weight: 1, opacity: 0.8, fillOpacity: 0.8, children: _jsx(Popup, { children: _jsx("div", { className: "text-xs", children: _jsx("div", { className: "font-semibold", children: new Date(point.timestamp).toLocaleString('fr-FR') }) }) }) }, `trail-${idx}`))), _jsx(CircleMarker, { center: [trail[0].lat, trail[0].lng], radius: 6, fillColor: "#22c55e", color: "#ffffff", weight: 2, fillOpacity: 0.9, children: _jsx(Popup, { children: _jsxs("span", { className: "text-xs font-semibold", children: ["D\u00E9but: ", new Date(trail[0].timestamp).toLocaleString('fr-FR')] }) }) }), _jsx(CircleMarker, { center: [trail[trail.length - 1].lat, trail[trail.length - 1].lng], radius: 6, fillColor: "#ef4444", color: "#ffffff", weight: 2, fillOpacity: 0.9, children: _jsx(Popup, { children: _jsxs("span", { className: "text-xs font-semibold", children: ["Fin: ", new Date(trail[trail.length - 1].timestamp).toLocaleString('fr-FR')] }) }) })] }));
}
// Event markers with icon types
function EventMarkersComponent({ alerts }) {
    return (_jsx(_Fragment, { children: alerts.map(alert => {
            if (!alert.lat || !alert.lng)
                return null;
            // Create SVG icons for different event types
            let icon = '';
            let color = '#EF4444';
            if (alert.type === 'speed') {
                // Warning triangle for speed alerts
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 18H2z"/></svg>`;
                color = '#EF4444';
            }
            else if (alert.type === 'geofence') {
                // Shield for geofence events
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
                color = '#F59E0B';
            }
            else if (alert.type === 'idle') {
                // Clock for idle events
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
                color = '#4361EE';
            }
            return (_jsx(Marker, { position: [alert.lat, alert.lng], icon: L.divIcon({
                    html: `<div style="
                width: 28px; height: 28px;
                background: ${color};
                border: 2px solid white;
                border-radius: 4px;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              ">${icon}</div>`,
                    className: 'event-marker',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14],
                }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-xs bg-white text-gray-900 p-2", children: [_jsx("p", { className: "font-bold font-sans", children: alert.type.toUpperCase() }), _jsx("p", { className: "text-gray-500", children: alert.message }), _jsx("p", { className: "text-[#9CA3AF] text-xs mt-1", children: new Date(alert.timestamp).toLocaleTimeString('fr-FR') })] }) }) }, alert.id));
        }) }));
}
// Helper: Calculate idle duration
function calculateIdleDuration(lastSpeed, lastSpeedUpdate) {
    if (!lastSpeed || lastSpeed > 2)
        return { duration: 0, durationStr: '' };
    if (!lastSpeedUpdate)
        return { duration: 0, durationStr: '' };
    const now = new Date();
    const lastUpdate = new Date(lastSpeedUpdate);
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { duration: diffMins, durationStr };
}
// Helper: Get current timezone
function getCurrentTimezone() {
    const now = new Date();
    const offset = -now.getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '';
    const offsetStr = `UTC${sign}${offset.toFixed(0)}`;
    // Get timezone name from locale (fallback to UTC offset)
    const tzName = new Intl.DateTimeFormat('en-US', {
        timeZoneName: 'short',
    })
        .formatToParts(now)
        .find(part => part.type === 'timeZoneName')?.value || 'UTC';
    return { offset: offsetStr, name: tzName };
}
export default function MapPage() {
    const navigate = useNavigate();
    const orgId = useAuthStore((s) => s.user?.organizationId)
        || useAuthStore((s) => s.user?.organization_id)
        || '';
    const [searchTerm, setSearchTerm] = useState('');
    const [mapStyle, setMapStyle] = useState('plan');
    const [tileLayer, setTileLayer] = useState('streets');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);
    const [showHelpPopover, setShowHelpPopover] = useState(false);
    const [showMiniMap, setShowMiniMap] = useState(true);
    const [showManualGps, setShowManualGps] = useState(false);
    const [showProviderPanel, setShowProviderPanel] = useState(true);
    const [activeDetailTab, setActiveDetailTab] = useState('temps-reel');
    const [manualGpsForm, setManualGpsForm] = useState({ lat: '', lng: '', vehicleId: '', name: '' });
    const [manualMarkers, setManualMarkers] = useState([]);
    const [providerStatus, setProviderStatus] = useState({
        flespi: { status: 'connected', failoverActive: false },
        echoes: { status: 'connected', failoverActive: false },
        keeptrace: { status: 'connected', failoverActive: false },
        ubiwan: { status: 'connected', failoverActive: false },
    });
    const [isSubmittingGps, setIsSubmittingGps] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(6);
    // New feature states
    const [vehicleTrails, setVehicleTrails] = useState({});
    const [vehicleStops, setVehicleStops] = useState({});
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const saved = localStorage.getItem('fleet-tracker_recent_searches');
            return saved ? JSON.parse(saved) : [];
        }
        catch {
            return [];
        }
    });
    const [showMiniMapToggle, setShowMiniMapToggle] = useState(true);
    const [isActualFullscreen, setIsActualFullscreen] = useState(false);
    const [showRecentSearches, setShowRecentSearches] = useState(false);
    // Dialog states
    const [showCreateVehicle, setShowCreateVehicle] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showShareToast, setShowShareToast] = useState(false);
    const [newVehicleForm, setNewVehicleForm] = useState({ name: '', plate: '', vin: '', type: 'car', brand: '', model: '' });
    const [createError, setCreateError] = useState('');
    const mapContainerRef = useRef(null);
    const searchInputRef = useRef(null);
    // Filter states
    const [sourceFilter, setSourceFilter] = useState('TOUS');
    const [statutFilter, setStatutFilter] = useState('TOUS');
    const [groupeFilter, setGroupeFilter] = useState('Tous');
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const [useImperialUnits] = useState(() => {
        try {
            const prefs = localStorage.getItem('fleet-tracker_preferences');
            return prefs ? JSON.parse(prefs).units === 'imperial' : false;
        }
        catch {
            return false;
        }
    });
    const { selectedVehicleId, selectVehicle, showGeofences, toggleGeofences, } = useMapStore();
    const queryClient = useQueryClient();
    const { data: vehiclesData, isLoading: vehiclesLoading, refetch: refetchVehicles } = useVehicles({ limit: 1000 });
    // Real-time WebSocket for GPS position updates — update in-place instead of refetching
    const { isConnected } = useGpsWebSocket({
        enabled: true,
        onPositionUpdate: useCallback((update) => {
            queryClient.setQueriesData({ queryKey: ['vehicles'] }, (oldData) => {
                if (!oldData?.data)
                    return oldData;
                return {
                    ...oldData,
                    data: oldData.data.map((v) => v.id === update.vehicleId
                        ? {
                            ...v,
                            currentLat: update.lat ?? v.currentLat,
                            currentLng: update.lng ?? v.currentLng,
                            currentSpeed: update.speed ?? v.currentSpeed,
                            currentHeading: update.heading ?? v.currentHeading,
                            lastCommunication: update.timestamp ?? v.lastCommunication,
                        }
                        : v),
                };
            });
        }, [queryClient]),
    });
    // Enrich vehicles with derived gpsProvider
    const vehicles = useMemo(() => {
        const raw = vehiclesData?.data || [];
        return raw.map((v) => ({
            ...v,
            gpsProvider: v.gpsProvider || getGpsProvider(v),
        }));
    }, [vehiclesData]);
    // Get unique groups from vehicles (with colors for display)
    const uniqueGroups = useMemo(() => {
        const groups = new Set();
        vehicles.forEach((v) => {
            if (v.group)
                groups.add(v.group);
        });
        return Array.from(groups).sort();
    }, [vehicles]);
    // Pre-compute lowercase search once (not per vehicle)
    const filteredVehicles = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return vehicles.filter((v) => {
            // Search filter — q computed once above
            if (q) {
                const name = (v.name || '').toLowerCase();
                const plate = (v.plate || '').toLowerCase();
                if (!name.includes(q) && !plate.includes(q))
                    return false;
            }
            // Source filter (GPS provider)
            if (sourceFilter !== 'TOUS') {
                const provider = (v.gpsProvider || '').toUpperCase();
                if (provider !== sourceFilter)
                    return false;
            }
            // Statut filter
            if (statutFilter === 'LOCALISÉS') {
                if (!v.currentLat || !v.currentLng)
                    return false;
            }
            else if (statutFilter === 'NON LOC.') {
                if (v.currentLat && v.currentLng)
                    return false;
            }
            // Groupe filter
            if (groupeFilter !== 'Tous') {
                if (v.group !== groupeFilter)
                    return false;
            }
            return true;
        });
    }, [vehicles, searchTerm, sourceFilter, statutFilter, groupeFilter]);
    const vehiclesWithGps = useMemo(() => vehicles.filter((v) => v.currentLat && v.currentLng), [vehicles]);
    // Simple clustering for low zoom levels (< 10)
    // Groups nearby vehicles and shows count badges instead of individual markers
    const clusteringEnabled = currentZoom < 10;
    const displayedVehicles = useMemo(() => {
        if (!clusteringEnabled || vehiclesWithGps.length <= 20) {
            return vehiclesWithGps;
        }
        // Simple grid-based clustering when too many vehicles at low zoom
        const gridSize = 0.5; // degrees
        const clusters = new Map();
        vehiclesWithGps.forEach((v) => {
            const gridX = Math.floor(v.currentLat / gridSize) * gridSize;
            const gridY = Math.floor(v.currentLng / gridSize) * gridSize;
            const key = `${gridX},${gridY}`;
            if (!clusters.has(key)) {
                clusters.set(key, []);
            }
            clusters.get(key).push(v);
        });
        // Return cluster representatives (first vehicle from each cluster)
        return Array.from(clusters.values()).map((cluster) => ({
            ...cluster[0],
            _clusterCount: cluster.length,
            _clusterVehicles: cluster,
        }));
    }, [vehiclesWithGps, clusteringEnabled]);
    const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
    // Memoized fleet stats — single pass instead of multiple .filter() calls
    const { movingCount, stoppedCount, offlineCount, avgFleetSpeed } = useMemo(() => {
        let moving = 0;
        let speedSum = 0;
        for (const v of vehiclesWithGps) {
            if ((v.currentSpeed || 0) > 2) {
                moving++;
                speedSum += v.currentSpeed || 0;
            }
        }
        return {
            movingCount: moving,
            stoppedCount: vehiclesWithGps.length - moving,
            offlineCount: vehicles.length - vehiclesWithGps.length,
            avgFleetSpeed: moving > 0 ? speedSum / moving : 0,
        };
    }, [vehicles, vehiclesWithGps]);
    // Map style to tile layer mapping
    const getTileUrl = (style) => {
        switch (style) {
            case 'satellite':
                return TOMTOM_TILE_URL('satellite');
            case 'relief':
                return TOMTOM_TILE_URL('hybrid');
            case 'sombre':
                return TOMTOM_TILE_URL('dark');
            case 'clair':
                return TOMTOM_TILE_URL('basic');
            case 'plan':
            default:
                return TOMTOM_TILE_URL('basic');
        }
    };
    const tileUrl = getTileUrl(mapStyle);
    const tileAttribution = '&copy; <a href="https://www.tomtom.com/">TomTom</a>';
    const trafficUrl = TOMTOM_TRAFFIC_FLOW_URL;
    // Handle fullscreen via Fullscreen API
    const handleActualFullscreen = useCallback(async () => {
        if (!mapContainerRef.current)
            return;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                setIsActualFullscreen(false);
            }
            else {
                await mapContainerRef.current.requestFullscreen();
                setIsActualFullscreen(true);
            }
        }
        catch (error) {
            console.error('Erreur fullscreen:', error);
            // Fallback to UI fullscreen
            setIsFullscreen(!isFullscreen);
        }
    }, [isFullscreen]);
    // Save recent search to localStorage
    const addRecentSearch = useCallback((search) => {
        if (!search.trim())
            return;
        const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('fleet-tracker_recent_searches', JSON.stringify(updated));
    }, [recentSearches]);
    // Handle search with recent searches
    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
        setShowRecentSearches(value.length === 0);
    }, []);
    const handleRecentSearchSelect = useCallback((search) => {
        setSearchTerm(search);
        addRecentSearch(search);
        setShowRecentSearches(false);
    }, [addRecentSearch]);
    const handleSearchSubmit = useCallback(() => {
        if (searchTerm.trim()) {
            addRecentSearch(searchTerm);
            setShowRecentSearches(false);
        }
    }, [searchTerm, addRecentSearch]);
    // Vehicle create mutation
    const createVehicleMutation = useCreateVehicle();
    const handleCreateVehicle = useCallback(async () => {
        if (!newVehicleForm.plate.trim()) {
            setCreateError('La plaque d\'immatriculation est requise');
            return;
        }
        setCreateError('');
        try {
            await createVehicleMutation.mutateAsync({
                name: newVehicleForm.name || newVehicleForm.plate,
                registrationNumber: newVehicleForm.plate,
                vin: newVehicleForm.vin || '',
                type: newVehicleForm.type || 'car',
                manufacturer: newVehicleForm.brand,
                model: newVehicleForm.model,
                features: { hasGPS: true, hasFuelSensor: false, hasTemperatureSensor: false, hasCrashSensor: false },
            });
            setShowCreateVehicle(false);
            setNewVehicleForm({ name: '', plate: '', vin: '', type: 'car', brand: '', model: '' });
            refetchVehicles();
        }
        catch (err) {
            setCreateError(err?.response?.data?.message || err?.message || 'Erreur lors de la création');
        }
    }, [newVehicleForm, createVehicleMutation, refetchVehicles]);
    // Share handler
    const handleShare = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 2000);
        }).catch(() => {
            // Fallback: open native share if available
            if (navigator.share) {
                navigator.share({ title: 'Fleet Tracker - Carte', url });
            }
        });
    }, []);
    // Export CSV handler
    const handleExportCSV = useCallback(() => {
        const headers = ['Plaque', 'Nom', 'VIN', 'Marque', 'Modèle', 'Type', 'Latitude', 'Longitude', 'Vitesse', 'Statut', 'Dernière communication', 'Fournisseur GPS'];
        const rows = filteredVehicles.map((v) => [
            v.plate || '', v.name || '', v.vin || '', v.brand || '', v.model || '', v.type || '',
            v.currentLat || '', v.currentLng || '', v.currentSpeed || 0, v.status || '',
            v.lastCommunication || '', v.gpsProvider || ''
        ]);
        const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleet-tracker-vehicules-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredVehicles]);
    // Delete vehicle handler
    const handleDeleteVehicle = useCallback(async () => {
        if (!selectedVehicle?.id)
            return;
        try {
            const orgId = useAuthStore.getState().user?.organizationId || '';
            await apiClient.delete(`/api/organizations/${orgId}/vehicles/${selectedVehicle.id}`);
            selectVehicle(null);
            setShowDeleteConfirm(false);
            refetchVehicles();
        }
        catch (err) {
            console.error('Delete failed:', err);
        }
    }, [selectedVehicle?.id, selectVehicle, refetchVehicles]);
    // Refresh detail panel data
    const handleRefreshDetail = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    }, [queryClient]);
    // Fetch real GPS history trail when a vehicle is selected
    const [trailLoading, setTrailLoading] = useState(false);
    useEffect(() => {
        if (!selectedVehicle?.id) {
            setVehicleTrails({});
            setVehicleStops({});
            return;
        }
        const vehicleId = selectedVehicle.id;
        let cancelled = false;
        setTrailLoading(true);
        const fetchTrail = async () => {
            try {
                const now = new Date();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                const params = new URLSearchParams({
                    vehicleId,
                    startDate: thirtyDaysAgo.toISOString(),
                    endDate: now.toISOString(),
                    limit: '1000',
                    interval: '300', // sample every 5 minutes to keep data manageable
                });
                console.log('[GPS History] Fetching trail for vehicle', vehicleId, 'orgId', orgId);
                const response = await apiClient.get(`${API_ROUTES.GPS_HISTORY(orgId)}?${params}`, { timeout: 30000 } // 30s timeout for large history queries
                );
                if (cancelled)
                    return;
                // The axios interceptor unwraps {success, data} → response.data = {data: [...], total: N}
                // So response.data.data is the array of points
                const raw = response.data;
                console.log('[GPS History] Response shape:', { keys: Object.keys(raw || {}), type: typeof raw, isArray: Array.isArray(raw) });
                let points = [];
                if (Array.isArray(raw)) {
                    points = raw;
                }
                else if (raw?.data && Array.isArray(raw.data)) {
                    points = raw.data;
                }
                else if (Array.isArray(raw?.rows)) {
                    points = raw.rows;
                }
                console.log('[GPS History] Extracted', points.length, 'points');
                // Map to VehicleTrail format and sort chronologically
                const trail = points
                    .filter((p) => p.lat && p.lng)
                    .map((p) => ({
                    lat: parseFloat(p.lat) || p.lat,
                    lng: parseFloat(p.lng) || p.lng,
                    timestamp: p.createdAt || p.timestamp || p.created_at || '',
                }))
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                if (!cancelled) {
                    setVehicleTrails({ [vehicleId]: trail });
                    // Detect stops (speed < 2 for consecutive points)
                    const stops = [];
                    let stopStart = null;
                    points.forEach((p, idx) => {
                        const speed = parseFloat(p.speed) || 0;
                        if (speed < 2) {
                            if (!stopStart)
                                stopStart = p;
                        }
                        else {
                            if (stopStart) {
                                const startTime = new Date(stopStart.createdAt || stopStart.timestamp).getTime();
                                const endTime = new Date(p.createdAt || p.timestamp).getTime();
                                const duration = (endTime - startTime) / 60000; // minutes
                                if (duration > 5) { // Only record stops > 5 minutes
                                    stops.push({
                                        lat: parseFloat(stopStart.lat),
                                        lng: parseFloat(stopStart.lng),
                                        duration,
                                        timestamp: stopStart.createdAt || stopStart.timestamp,
                                    });
                                }
                                stopStart = null;
                            }
                        }
                    });
                    setVehicleStops({ [vehicleId]: stops });
                    setTrailLoading(false);
                }
            }
            catch (err) {
                console.error('Failed to fetch GPS history trail:', err);
                if (!cancelled) {
                    setVehicleTrails({});
                    setVehicleStops({});
                    setTrailLoading(false);
                }
            }
        };
        fetchTrail();
        return () => { cancelled = true; };
    }, [selectedVehicle?.id, orgId]);
    // Generate mock alert events
    useEffect(() => {
        const alerts = [];
        filteredVehicles.forEach((v) => {
            if ((v.currentSpeed || 0) > 130) {
                alerts.push({
                    id: `speed-${v.id}`,
                    type: 'speed',
                    lat: v.currentLat,
                    lng: v.currentLng,
                    timestamp: new Date().toISOString(),
                    message: `Vitesse excessive: ${getFormattedSpeed(v.currentSpeed || 0, useImperialUnits).value} ${getFormattedSpeed(v.currentSpeed || 0, useImperialUnits).unit}`,
                    vehicleId: v.id,
                });
            }
        });
        setActiveAlerts(alerts);
    }, [filteredVehicles, useImperialUnits]);
    const handleShortcut = (action) => {
        switch (action) {
            case 'fullscreen':
                handleActualFullscreen();
                break;
            case 'traffic':
                setShowTraffic(!showTraffic);
                break;
            case 'streets':
                setMapStyle('plan');
                break;
            case 'satellite':
                setMapStyle('satellite');
                break;
            case 'terrain':
                setMapStyle('relief');
                break;
        }
    };
    return (_jsxs("div", { ref: mapContainerRef, className: `flex h-full bg-white ${isActualFullscreen ? 'fixed inset-0 z-[10000] w-screen h-screen' : ''}`, children: [!isFullscreen && (_jsxs("div", { className: "w-[310px] flex flex-col overflow-hidden bg-white border-r border-gray-200 shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 px-3 py-2.5 border-b border-gray-200", children: [_jsxs("button", { onClick: () => setShowCreateVehicle(true), className: "flex items-center gap-1.5 px-3 py-1.5 bg-[#4361EE] text-white rounded text-xs font-semibold hover:bg-[#3B52D3] transition-colors", children: [_jsx(Plus, { size: 14 }), " V\u00C9HICULE"] }), _jsxs("button", { onClick: handleShare, className: "flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-gray-600 rounded text-xs font-medium hover:bg-gray-50 transition-colors", children: [_jsx(Share2, { size: 12 }), "PARTAGE"] }), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: handleExportCSV, className: "p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors", title: "Exporter CSV", children: _jsx(Download, { size: 16 }) }), _jsx("button", { onClick: () => navigate('/settings'), className: "p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors", title: "Param\u00E8tres", children: _jsx(Settings, { size: 16 }) })] }), _jsx("div", { className: "px-3 py-2.5 border-b border-gray-200", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-2.5 text-gray-400", size: 14 }), _jsx(Input, { ref: searchInputRef, type: "search", placeholder: "Nom, plaque, VIN, ville...", value: searchTerm, onChange: (e) => handleSearchChange(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearchSubmit(), onFocus: () => setShowRecentSearches(searchTerm.length === 0 && recentSearches.length > 0), className: "pl-9 h-9 bg-white border border-gray-300 text-gray-900 text-xs placeholder-gray-400 focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] rounded" }), showRecentSearches && recentSearches.length > 0 && (_jsxs("div", { className: "absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded shadow-xl z-[100] overflow-hidden", children: [_jsx("div", { className: "px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100", children: "Recherches r\u00E9centes" }), recentSearches.map((search, idx) => (_jsxs("button", { onClick: () => handleRecentSearchSelect(search), className: "w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2", children: [_jsx(Clock, { size: 11, className: "text-gray-300" }), search] }, idx)))] }))] }) }), _jsxs("div", { className: "px-3 pt-3 pb-1", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5", children: "SOURCE" }), _jsx("div", { className: "flex flex-wrap gap-1", children: ['TOUS', 'ECHOES', 'UBIWAN', 'KEEPTRACE', 'FLESPI'].map((source) => (_jsx("button", { onClick: () => setSourceFilter(source), className: `px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${sourceFilter === source
                                        ? 'bg-[#4361EE] text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`, children: source }, source))) })] }), _jsxs("div", { className: "px-3 pt-2 pb-2.5 border-b border-gray-200", children: [_jsx("p", { className: "text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5", children: "STATUT" }), _jsx("div", { className: "flex gap-1", children: ['TOUS', 'LOCALISÉS', 'NON LOC.'].map((statut) => (_jsx("button", { onClick: () => setStatutFilter(statut), className: `px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${statutFilter === statut
                                        ? 'bg-[#4361EE] text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`, children: statut }, statut))) })] }), _jsxs("div", { className: "px-3 py-2 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50", children: [_jsxs("span", { children: ["V\u00C9HICULE \u2014 ", filteredVehicles.length, " R\u00C9SULTATS"] }), _jsx("span", { children: "VITESSE" })] }), _jsx(VehicleList, { vehicles: filteredVehicles, selectedVehicleId: selectedVehicleId, useImperialUnits: useImperialUnits, onSelect: selectVehicle })] })), _jsxs("div", { className: "relative flex-1 overflow-hidden", children: [_jsx("div", { className: "absolute top-3 left-3 z-[1000] flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1", children: [
                            { id: 'plan', label: 'Plan' },
                            { id: 'satellite', label: 'Satellite' },
                            { id: 'sombre', label: 'Sombre' },
                        ].map((style) => (_jsx("button", { onClick: () => setMapStyle(style.id), className: `px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${mapStyle === style.id
                                ? 'bg-[#4361EE] text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}`, children: style.label }, style.id))) }), _jsxs(MapContainer, { center: [43.7, 3.87], zoom: 6, className: "h-full w-full z-0", zoomControl: true, children: [_jsx(TileLayer, { url: tileUrl, attribution: tileAttribution }), showTraffic && _jsx(TileLayer, { url: trafficUrl, attribution: "", opacity: 0.6 }), _jsx(FitBounds, { vehicles: vehicles }), _jsx(KeyboardShortcuts, { onShortcut: handleShortcut }), _jsx(MapEvents, { onZoomChange: setCurrentZoom }), selectedVehicle?.currentLat && selectedVehicle?.currentLng && (_jsx(FlyToVehicle, { lat: selectedVehicle.currentLat, lng: selectedVehicle.currentLng, vehicleId: selectedVehicleId })), selectedVehicle?.id && vehicleTrails[selectedVehicle.id] && (_jsx(VehicleTrailComponent, { trail: vehicleTrails[selectedVehicle.id] })), _jsx(EventMarkersComponent, { alerts: activeAlerts }), displayedVehicles.map((vehicle) => {
                                const idleInfo = calculateIdleDuration(vehicle.currentSpeed || 0, vehicle.lastCommunication);
                                return (_jsxs("div", { children: [_jsx(Marker, { position: [vehicle.currentLat, vehicle.currentLng], icon: createVehicleIcon(vehicle.currentSpeed || 0, vehicle.currentHeading || 0, vehicle.id === selectedVehicleId, vehicle.type), eventHandlers: { click: () => selectVehicle(vehicle.id) }, children: _jsx(Popup, { children: _jsxs("div", { className: "min-w-48 p-1 bg-white text-gray-900", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsxs("div", { children: [_jsx("p", { className: "font-bold text-sm font-sans", children: vehicle.plate || vehicle.name }), _jsx("p", { className: "text-xs text-gray-500", children: vehicle.name })] }) }), _jsxs("div", { className: "text-xs space-y-1", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Vitesse:" }), _jsxs("span", { className: "font-medium", children: [getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value, " ", getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Fournisseur:" }), _jsx("span", { className: "font-medium", children: vehicle.gpsProvider || '—' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Derni\u00E8re com.:" }), _jsx("span", { className: "font-medium", children: formatTimeAgo(vehicle.lastCommunication) })] })] }), _jsx("button", { onClick: () => navigate(`/vehicles/${vehicle.id}`), className: "mt-2 w-full text-xs text-[#4361EE] hover:text-[#3B52D3] font-medium", children: "Voir d\u00E9tails \u2192" })] }) }) }), (vehicle.currentSpeed || 0) <= 2 && (_jsx(CircleMarker, { center: [vehicle.currentLat, vehicle.currentLng], radius: 6, fillColor: "#6b7280", color: "#6b7280", weight: 1, opacity: 0.4, fillOpacity: 0.2 }))] }, vehicle.id));
                            }), manualMarkers.map((marker, idx) => (_jsx(Marker, { position: [marker.lat, marker.lng], icon: manualMarkerIcon, children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-bold", children: marker.name }), _jsxs("p", { className: "text-xs text-gray-500 font-mono", children: [marker.lat.toFixed(5), ", ", marker.lng.toFixed(5)] })] }) }) }, `manual-${idx}`)))] })] }), selectedVehicle && !isFullscreen && (_jsxs("div", { className: "w-[320px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shrink-0", children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-bold text-gray-900", children: selectedVehicle.plate || selectedVehicle.name }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => navigate(`/vehicles/${selectedVehicle.id}`), className: "p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors", title: "\u00C9diter", children: _jsx(Edit2, { size: 14 }) }), _jsx("button", { onClick: () => setShowDeleteConfirm(true), className: "p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors", title: "Supprimer", children: _jsx(Trash2, { size: 14 }) }), _jsx("span", { className: `px-2.5 py-1 rounded text-[11px] font-semibold uppercase ${selectedVehicle.currentSpeed > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`, children: selectedVehicle.currentSpeed > 2 ? 'EN ROUTE' : "À L'ARRÊT" }), _jsx("button", { onClick: () => selectVehicle(null), className: "p-1 text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { size: 16 }) })] })] }) }), _jsxs("div", { className: "flex border-b border-gray-200", children: [_jsxs("button", { onClick: () => setActiveDetailTab('temps-reel'), className: `flex items-center gap-1.5 flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${activeDetailTab === 'temps-reel'
                                    ? 'text-[#4361EE] border-[#4361EE]'
                                    : 'text-gray-400 border-transparent hover:text-gray-600'}`, children: [_jsx(Wifi, { size: 12 }), "TEMPS R\u00C9EL"] }), _jsxs("button", { onClick: () => setActiveDetailTab('historique'), className: `flex items-center gap-1.5 flex-1 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${activeDetailTab === 'historique'
                                    ? 'text-[#4361EE] border-[#4361EE]'
                                    : 'text-gray-400 border-transparent hover:text-gray-600'}`, children: [_jsx(Clock, { size: 12 }), "HISTORIQUE"] })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: activeDetailTab === 'temps-reel' ? (_jsxs("div", { className: "divide-y divide-gray-100", children: [_jsxs("div", { className: "px-4 py-3", children: [_jsx("h3", { className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5", children: "IDENTIT\u00C9" }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Plaque" }), _jsx("span", { className: "font-medium text-gray-900", children: selectedVehicle.plate })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "VIN" }), _jsx("span", { className: "font-medium text-gray-900 text-[12px] font-mono", children: selectedVehicle.vin || 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Statut API" }), _jsx("span", { className: "font-medium text-gray-900 uppercase text-[12px]", children: selectedVehicle.apiStatus || 'ENABLED' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Flotte ID" }), _jsx("span", { className: "font-medium text-gray-900", children: selectedVehicle.fleetId || '—' })] })] })] }), _jsxs("div", { className: "px-4 py-3", children: [_jsx("h3", { className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5", children: "APPAREIL GPS" }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Type" }), _jsx("span", { className: "font-medium text-gray-900", children: selectedVehicle.gpsDeviceType || 'Standard' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "ID Appareil" }), _jsx("span", { className: "font-medium text-gray-900 font-mono text-[12px]", children: selectedVehicle.gpsDeviceId || 'N/A' })] })] })] }), _jsxs("div", { className: "px-4 py-3", children: [_jsx("h3", { className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5", children: "T\u00C9L\u00C9M\u00C9TRIE" }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Vitesse" }), _jsx("span", { className: `font-medium ${(selectedVehicle.currentSpeed || 0) > 2 ? 'text-green-600' : 'text-red-500'}`, children: (selectedVehicle.currentSpeed || 0) > 0
                                                                ? `${getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value} ${getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit}`
                                                                : 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Odom\u00E8tre" }), _jsx("span", { className: "font-medium text-gray-900", children: selectedVehicle.odometer ? `${Math.round(selectedVehicle.odometer / 1000)} km` : 'N/A' })] }), (selectedVehicle.currentSpeed || 0) <= 2 && calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "\u00C0 l'arr\u00EAt depuis" }), _jsx("span", { className: "font-medium text-amber-600", children: calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr })] }))] })] }), _jsxs("div", { className: "px-4 py-3", children: [_jsx("h3", { className: "text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5", children: "POSITION" }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Latitude" }), _jsx("span", { className: "font-mono text-gray-900 text-[12px]", children: selectedVehicle.currentLat?.toFixed(6) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Longitude" }), _jsx("span", { className: "font-mono text-gray-900 text-[12px]", children: selectedVehicle.currentLng?.toFixed(6) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Derni\u00E8re com." }), _jsx("span", { className: "font-medium text-gray-900", children: formatTimeAgo(selectedVehicle.lastCommunication) })] })] })] })] })) : (_jsx("div", { className: "p-4 text-sm", children: trailLoading ? (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-[#4361EE] mx-auto mb-2" }), _jsx("span", { className: "text-gray-400", children: "Chargement de l'historique..." })] })) : vehicleTrails[selectedVehicle.id]?.length ? (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-[#4361EE] font-semibold text-xs uppercase", children: [_jsx(Navigation, { size: 12 }), "Trajet \u2014 30 derniers jours"] }), _jsxs("div", { className: "space-y-2 text-[13px]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Points GPS" }), _jsx("span", { className: "font-medium text-gray-900", children: vehicleTrails[selectedVehicle.id].length.toLocaleString() })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Premier point" }), _jsx("span", { className: "font-medium text-gray-900", children: new Date(vehicleTrails[selectedVehicle.id][0]?.timestamp).toLocaleDateString('fr-FR') })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Dernier point" }), _jsx("span", { className: "font-medium text-gray-900", children: new Date(vehicleTrails[selectedVehicle.id][vehicleTrails[selectedVehicle.id].length - 1]?.timestamp).toLocaleDateString('fr-FR') })] }), vehicleStops[selectedVehicle.id]?.length > 0 && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-500", children: "Arr\u00EAts d\u00E9tect\u00E9s" }), _jsx("span", { className: "font-medium text-amber-600", children: vehicleStops[selectedVehicle.id].length })] }))] }), _jsx("div", { className: "text-[11px] text-gray-400 italic", children: "Le trac\u00E9 est affich\u00E9 sur la carte" })] })) : (_jsxs("div", { className: "text-center py-8", children: [_jsx(Clock, { size: 32, className: "mx-auto text-gray-200 mb-2" }), _jsx("span", { className: "text-gray-400", children: "Aucun historique disponible" })] })) })) }), _jsxs("div", { className: "border-t border-gray-200 p-3 space-y-2", children: [_jsxs("button", { onClick: handleRefreshDetail, className: "w-full flex items-center justify-center gap-2 px-4 py-2 text-[#4361EE] border border-[#4361EE] rounded text-xs font-semibold hover:bg-[#4361EE] hover:text-white transition-colors", children: [_jsx(RefreshCw, { size: 13 }), "RAFRA\u00CECHIR"] }), _jsx("button", { onClick: () => navigate(`/vehicles/${selectedVehicle.id}`), className: "w-full text-center px-4 py-2 bg-gray-100 text-gray-600 rounded text-xs font-semibold hover:bg-gray-200 transition-colors", children: "VOIR D\u00C9TAILS COMPLETS" })] })] })), showCreateVehicle && (_jsxs("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center", onClick: () => setShowCreateVehicle(false), children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm" }), _jsxs("div", { className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-gray-200", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "px-6 py-4 border-b border-gray-200 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900", children: "Nouveau v\u00E9hicule" }), _jsx("button", { onClick: () => setShowCreateVehicle(false), className: "p-1 text-gray-400 hover:text-gray-600", children: _jsx(X, { size: 18 }) })] }), _jsxs("div", { className: "p-6 space-y-4", children: [createError && (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm", children: [_jsx(AlertCircle, { size: 14 }), " ", createError] })), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Plaque d'immatriculation *" }), _jsx("input", { type: "text", value: newVehicleForm.plate, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() })), placeholder: "AA-123-BB", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Nom du v\u00E9hicule" }), _jsx("input", { type: "text", value: newVehicleForm.name, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, name: e.target.value })), placeholder: "Ex: Camion livraison 01", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Marque" }), _jsx("input", { type: "text", value: newVehicleForm.brand, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, brand: e.target.value })), placeholder: "BMW, Mercedes...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Mod\u00E8le" }), _jsx("input", { type: "text", value: newVehicleForm.model, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, model: e.target.value })), placeholder: "S\u00E9rie 3, Sprinter...", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "VIN" }), _jsx("input", { type: "text", value: newVehicleForm.vin, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, vin: e.target.value.toUpperCase() })), placeholder: "Optionnel", className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1", children: "Type" }), _jsxs("select", { value: newVehicleForm.type, onChange: (e) => setNewVehicleForm(prev => ({ ...prev, type: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#4361EE]/20 focus:border-[#4361EE] outline-none bg-white", children: [_jsx("option", { value: "car", children: "Voiture" }), _jsx("option", { value: "truck", children: "Camion" }), _jsx("option", { value: "van", children: "Utilitaire" }), _jsx("option", { value: "motorcycle", children: "Moto" }), _jsx("option", { value: "bus", children: "Bus" })] })] })] })] }), _jsxs("div", { className: "px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50", children: [_jsx("button", { onClick: () => setShowCreateVehicle(false), className: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleCreateVehicle, disabled: createVehicleMutation.isPending, className: "px-5 py-2 bg-[#4361EE] text-white text-sm font-semibold rounded-lg hover:bg-[#3B52D3] transition-colors disabled:opacity-50 flex items-center gap-2", children: createVehicleMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), " Cr\u00E9ation..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { size: 14 }), " Cr\u00E9er le v\u00E9hicule"] })) })] })] })] })), showDeleteConfirm && selectedVehicle && (_jsxs("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center", onClick: () => setShowDeleteConfirm(false), children: [_jsx("div", { className: "absolute inset-0 bg-black/50 backdrop-blur-sm" }), _jsxs("div", { className: "relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-200", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "p-6 text-center", children: [_jsx("div", { className: "w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Trash2, { size: 24, className: "text-red-500" }) }), _jsx("h3", { className: "text-lg font-bold text-gray-900 mb-2", children: "Supprimer le v\u00E9hicule ?" }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Voulez-vous vraiment supprimer ", _jsx("span", { className: "font-semibold text-gray-700", children: selectedVehicle.plate || selectedVehicle.name }), " ? Cette action est irr\u00E9versible."] })] }), _jsxs("div", { className: "px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50", children: [_jsx("button", { onClick: () => setShowDeleteConfirm(false), className: "px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors", children: "Annuler" }), _jsx("button", { onClick: handleDeleteVehicle, className: "px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors", children: "Supprimer" })] })] })] })), showShareToast && (_jsxs("div", { className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium", style: { animation: 'fadeInDown 0.2s ease-out' }, children: [_jsx(Check, { size: 16, className: "text-emerald-400" }), "Lien copi\u00E9 dans le presse-papier"] })), vehiclesLoading && vehicles.length === 0 && (_jsx("div", { className: "absolute inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-10 h-10 border-3 border-[#4361EE]/20 border-t-[#4361EE] rounded-full animate-spin mx-auto mb-3" }), _jsx("p", { className: "text-sm font-medium text-gray-500", children: "Chargement des v\u00E9hicules..." })] }) }))] }));
}
//# sourceMappingURL=MapPage.js.map