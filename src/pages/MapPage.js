import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useVehicles } from '@/hooks/useVehicles';
import { useMapStore } from '@/stores/mapStore';
import { useAuthStore } from '@/stores/authStore';
import { formatTimeAgo } from '@/lib/utils';
import { Search, Layers, Eye, ChevronRight, Satellite, Map as MapIcon, Wifi, WifiOff, HelpCircle, Wind, MapPin, AlertCircle, ChevronDown, CheckCircle2, X, Edit2, Trash2, Clock, Maximize2 } from 'lucide-react';
import { useGpsWebSocket } from '@/hooks/useGpsWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import { MAPBOX_TILE_URL, MAPBOX_TOKEN } from '@/lib/constants';
// Helper function to convert speed based on user preferences
function getFormattedSpeed(speedKmh, useImperial) {
    if (useImperial) {
        const mph = speedKmh * 0.621371;
        return { value: mph.toFixed(0), unit: 'mph' };
    }
    return { value: speedKmh.toFixed(0), unit: 'km/h' };
}
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
    return (_jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowHelp(!showHelp), className: "absolute bottom-16 right-4 z-[1000] bg-[#12121A] shadow-md rounded-[12px] p-2 hover:bg-[#1A1A25] border border-[#1F1F2E]", title: "Press ? for help", children: _jsx(HelpCircle, { size: 16, className: "text-[#6B6B80]" }) }), showHelp && (_jsxs("div", { className: "absolute bottom-28 right-4 z-[1000] bg-[#12121A] shadow-lg rounded-[12px] p-3 border border-[#1F1F2E] w-56 text-xs backdrop-blur", children: [_jsx("p", { className: "font-syne font-semibold mb-2 text-[#F0F0F5]", children: "Raccourcis clavier" }), _jsxs("div", { className: "space-y-1.5 text-[#6B6B80]", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "F" }), _jsx("span", { children: "Basculer plein \u00E9cran" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "T" }), _jsx("span", { children: "Afficher trafic" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "S" }), _jsx("span", { children: "Plan rue" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "A" }), _jsx("span", { children: "Satellite" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "R" }), _jsx("span", { children: "Terrain" })] })] })] }))] }));
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
    return (_jsx("div", { className: "absolute bottom-32 left-56 z-[1000] w-56 h-56 border-2 border-[#1F1F2E] rounded-lg overflow-hidden shadow-lg bg-[#12121A] pointer-events-none", children: _jsxs(MapContainer, { center: map.getCenter(), zoom: map.getZoom() - 4, style: { width: '100%', height: '100%' }, zoomControl: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, scrollWheelZoom: false, touchZoom: false, className: "pointer-events-none", children: [_jsx(TileLayer, { url: MAPBOX_TILE_URL('dark-v11'), attribution: "", tileSize: 512, zoomOffset: -1 }), vehicles.map((v) => v.currentLat && v.currentLng && (_jsx(Marker, { position: [v.currentLat, v.currentLng], icon: L.divIcon({
                        html: `<div style="width: 6px; height: 6px; background: #00E5CC; border-radius: 50%; box-shadow: 0 0 4px rgba(0,229,204,0.6);"></div>`,
                        className: 'mini-marker',
                        iconSize: [6, 6],
                        iconAnchor: [3, 3],
                    }) }, `minimap-${v.id}`)))] }) }));
}
// Event markers component
function EventMarkers({ alerts }) {
    const iconMap = {
        speed: '#FF4D6A',
        geofence: '#FFB547',
        idle: '#00E5CC',
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
            }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-xs bg-[#12121A] text-[#F0F0F5]", children: [_jsx("p", { className: "font-bold font-syne", children: alert.type.toUpperCase() }), _jsx("p", { className: "text-[#6B6B80]", children: alert.message })] }) }) }, alert.id)))) }));
}
// Vehicle trail polyline component with breadcrumb dots
function VehicleTrail({ trail }) {
    if (!trail || trail.length < 2)
        return null;
    const coordinates = trail.map(t => [t.lat, t.lng]);
    return (_jsxs(_Fragment, { children: [_jsx(Polyline, { positions: coordinates, color: "#00E5CC", weight: 2, opacity: 0.6, dashArray: "5,5" }), trail.map((point, idx) => (_jsx(CircleMarker, { center: [point.lat, point.lng], radius: 3, fillColor: "#00E5CC", color: "#00E5CC", weight: 1, opacity: 0.4 + (idx / trail.length) * 0.6, fillOpacity: 0.4 + (idx / trail.length) * 0.6 }, `trail-${idx}`)))] }));
}
// Event markers with icon types
function EventMarkersComponent({ alerts }) {
    return (_jsx(_Fragment, { children: alerts.map(alert => {
            if (!alert.lat || !alert.lng)
                return null;
            // Create SVG icons for different event types
            let icon = '';
            let color = '#FF4D6A';
            if (alert.type === 'speed') {
                // Warning triangle for speed alerts
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 18H2z"/></svg>`;
                color = '#FF4D6A';
            }
            else if (alert.type === 'geofence') {
                // Shield for geofence events
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
                color = '#FFB547';
            }
            else if (alert.type === 'idle') {
                // Clock for idle events
                icon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
                color = '#00E5CC';
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
                }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-xs bg-[#12121A] text-[#F0F0F5] p-2", children: [_jsx("p", { className: "font-bold font-syne", children: alert.type.toUpperCase() }), _jsx("p", { className: "text-[#6B6B80]", children: alert.message }), _jsx("p", { className: "text-[#44445A] text-xs mt-1", children: new Date(alert.timestamp).toLocaleTimeString('fr-FR') })] }) }) }, alert.id));
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
    // Get unique groups from vehicles (with colors for display)
    const uniqueGroups = useMemo(() => {
        const groups = new Set();
        vehicles.forEach((v) => {
            if (v.group)
                groups.add(v.group);
        });
        return Array.from(groups).sort();
    }, [vehicles]);
    const filteredVehicles = useMemo(() => vehicles.filter((v) => {
        // Search filter
        const matchesSearch = v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (v.plate || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch)
            return false;
        // Source filter (GPS provider)
        if (sourceFilter !== 'TOUS') {
            const provider = (v.gpsProvider || '').toUpperCase();
            if (provider !== sourceFilter)
                return false;
        }
        // Statut filter (GPS localized or not)
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
    }), [vehicles, searchTerm, sourceFilter, statutFilter, groupeFilter]);
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
    // Map style to tile layer mapping
    const getTileUrl = (style) => {
        switch (style) {
            case 'satellite':
                return MAPBOX_TILE_URL('satellite-streets-v12');
            case 'relief':
                return MAPBOX_TILE_URL('outdoors-v12');
            case 'sombre':
                return MAPBOX_TILE_URL('dark-v11');
            case 'clair':
                return MAPBOX_TILE_URL('light-v11');
            case 'plan':
            default:
                return MAPBOX_TILE_URL('streets-v12');
        }
    };
    const tileUrl = getTileUrl(mapStyle);
    const tileAttribution = '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    const trafficUrl = `https://api.mapbox.com/styles/v1/mapbox/traffic-day-v2/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`;
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
    // Simulate vehicle trails (in production, fetch from API)
    useEffect(() => {
        if (selectedVehicle?.id) {
            // Generate mock trail for demo
            const trail = Array.from({ length: 10 }, (_, i) => ({
                lat: selectedVehicle.currentLat + (Math.random() - 0.5) * 0.05,
                lng: selectedVehicle.currentLng + (Math.random() - 0.5) * 0.05,
                timestamp: new Date(Date.now() - (10 - i) * 60000).toISOString(),
            }));
            setVehicleTrails(prev => ({ ...prev, [selectedVehicle.id]: trail }));
            // Generate mock stops for demo
            const stops = Array.from({ length: 3 }, (_, i) => ({
                lat: selectedVehicle.currentLat + (Math.random() - 0.5) * 0.1,
                lng: selectedVehicle.currentLng + (Math.random() - 0.5) * 0.1,
                duration: (i + 1) * 15,
                timestamp: new Date(Date.now() - (3 - i) * 120000).toISOString(),
            }));
            setVehicleStops(prev => ({ ...prev, [selectedVehicle.id]: stops }));
        }
    }, [selectedVehicle?.id]);
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
    return (_jsxs("div", { ref: mapContainerRef, className: `flex h-[calc(100vh-80px)] gap-4 ${isActualFullscreen ? 'fixed inset-0 z-[10000] w-screen h-screen' : ''}`, children: [_jsxs("div", { className: `relative ${isFullscreen ? 'w-full' : 'flex-1'} rounded-lg border border-[#1F1F2E] overflow-hidden shadow-sm`, children: [_jsx("div", { className: "absolute top-4 left-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-2 flex gap-1.5 backdrop-blur border border-[#1F1F2E]", children: [
                            { id: 'plan', label: 'Plan' },
                            { id: 'satellite', label: 'Satellite' },
                            { id: 'relief', label: 'Relief' },
                            { id: 'sombre', label: 'Sombre' },
                            { id: 'clair', label: 'Clair' },
                        ].map((style) => (_jsx("button", { onClick: () => setMapStyle(style.id), className: `px-3 py-1.5 rounded text-xs font-medium transition-all ${mapStyle === style.id
                                ? 'bg-[#00E5CC] text-[#0A0A0F] shadow-sm'
                                : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'}`, children: style.label }, style.id))) }), _jsxs(MapContainer, { center: [43.7, 3.87], zoom: 6, className: "h-full w-full z-0", zoomControl: false, children: [_jsx(TileLayer, { url: tileUrl, attribution: tileAttribution, tileSize: 512, zoomOffset: -1 }), showTraffic && _jsx(TileLayer, { url: trafficUrl, attribution: tileAttribution, opacity: 0.5 }), _jsx(FitBounds, { vehicles: vehicles }), _jsx(KeyboardShortcuts, { onShortcut: handleShortcut }), _jsx(MapEvents, { onZoomChange: setCurrentZoom }), selectedVehicle?.currentLat && selectedVehicle?.currentLng && (_jsx(FlyToVehicle, { lat: selectedVehicle.currentLat, lng: selectedVehicle.currentLng })), selectedVehicle?.id && vehicleTrails[selectedVehicle.id] && (_jsx(VehicleTrail, { trail: vehicleTrails[selectedVehicle.id] })), _jsx(EventMarkersComponent, { alerts: activeAlerts }), displayedVehicles.map((vehicle) => {
                                const idleInfo = calculateIdleDuration(vehicle.currentSpeed || 0, vehicle.lastCommunication);
                                return (_jsxs("div", { children: [_jsx(Marker, { position: [vehicle.currentLat, vehicle.currentLng], icon: createVehicleIcon(vehicle.currentSpeed || 0, vehicle.currentHeading || 0, vehicle.id === selectedVehicleId, vehicle.type), eventHandlers: {
                                                click: () => selectVehicle(vehicle.id),
                                            }, children: _jsx(Popup, { children: _jsxs("div", { className: "min-w-48 p-1 bg-[#12121A] text-[#F0F0F5]", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { children: [_jsx("p", { className: "font-bold text-sm font-syne", children: vehicle.name }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.plate })] }), vehicle.gpsProviderFailover && (_jsx("div", { title: "Basculement fournisseur actif", children: _jsx(AlertCircle, { size: 14, className: "text-[#FFB547]" }) }))] }), _jsxs("div", { className: "text-xs space-y-1", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Vitesse:" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "font-medium", children: [getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value, " ", getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).unit] }), (vehicle.currentSpeed || 0) > 130 && (_jsxs(Badge, { className: "bg-[#FF4D6A] text-white text-xs gap-1", children: [_jsx(AlertCircle, { size: 10 }), "EXC\u00C8S"] }))] })] }), (vehicle.currentSpeed || 0) <= 2 && idleInfo.durationStr && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "\u00C0 l'arr\u00EAt depuis:" }), _jsx("span", { className: "font-medium text-[#00E5CC]", children: idleInfo.durationStr })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Derni\u00E8re com.:" }), _jsx("span", { className: "font-medium", children: formatTimeAgo(vehicle.lastCommunication) })] }), vehicle.gpsProvider && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Fournisseur:" }), _jsx("span", { className: "font-medium text-xs", children: vehicle.gpsProvider })] })), vehicle._clusterCount && vehicle._clusterCount > 1 && (_jsx("div", { className: "mt-2 pt-2 border-t border-[#1F1F2E]", children: _jsxs("p", { className: "text-[#6B6B80] font-medium", children: [vehicle._clusterCount, " v\u00E9hicules dans cette zone"] }) }))] }), _jsx("button", { onClick: () => navigate(`/vehicles/${vehicle.id}`), className: "mt-2 w-full text-xs text-[#00E5CC] hover:text-[#00D4B8] font-medium", children: "Voir d\u00E9tails \u2192" })] }) }) }), (vehicle.currentSpeed || 0) <= 2 && (_jsx(CircleMarker, { center: [vehicle.currentLat, vehicle.currentLng], radius: 6, fillColor: "#FF4D6A", color: "#FF4D6A", weight: 2, opacity: 0.6, fillOpacity: 0.3 }))] }, vehicle.id));
                            }), manualMarkers.map((marker, idx) => (_jsx(Marker, { position: [marker.lat, marker.lng], icon: L.divIcon({
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
                                }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm bg-[#12121A] text-[#F0F0F5]", children: [_jsx("p", { className: "font-bold font-syne", children: marker.name }), _jsxs("p", { className: "text-xs text-[#6B6B80] font-mono", children: [marker.lat.toFixed(5), ", ", marker.lng.toFixed(5)] })] }) }) }, `manual-${idx}`)))] }), _jsx("div", { className: "absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end", children: _jsxs("div", { className: "bg-[#12121A]/95 rounded-[12px] shadow-md px-3 py-1.5 text-xs font-medium text-[#F0F0F5] border border-[#1F1F2E] backdrop-blur", children: ["Zoom: ", currentZoom, currentZoom < 10 && (_jsx("span", { className: "ml-1 text-[#6B6B80] text-xs", children: "(groupage actif)" }))] }) }), _jsxs("div", { className: "absolute top-14 right-4 z-[1000] flex flex-col gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => {
                                    if (tileLayer === 'streets')
                                        setTileLayer('satellite');
                                    else if (tileLayer === 'satellite')
                                        setTileLayer('terrain');
                                    else
                                        setTileLayer('streets');
                                }, className: "gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur", children: [tileLayer === 'streets' ? _jsx(Satellite, { size: 16 }) : tileLayer === 'satellite' ? _jsx(MapIcon, { size: 16 }) : _jsx(Layers, { size: 16 }), tileLayer === 'streets' ? 'Satellite' : tileLayer === 'satellite' ? 'Terrain' : 'Plan'] }), _jsxs(Button, { size: "sm", onClick: () => setShowTraffic(!showTraffic), className: `gap-2 shadow-md backdrop-blur border ${showTraffic ? 'bg-[#00E5CC] text-[#0A0A0F] border-[#00E5CC]' : 'bg-[#12121A]/95 border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25]'}`, children: [_jsx(Wind, { size: 16 }), "Trafic"] }), _jsxs(Button, { size: "sm", onClick: handleActualFullscreen, className: "gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur", title: "Appuyez sur F pour un raccourci", children: [_jsx(Maximize2, { size: 16 }), isActualFullscreen ? 'Quitter plein écran' : 'Plein écran'] }), _jsxs(Button, { size: "sm", onClick: () => setShowManualGps(!showManualGps), className: "gap-2 bg-[#12121A]/95 shadow-md border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] backdrop-blur", children: [_jsx(MapPin, { size: 16 }), "Saisie manuelle"] })] }), _jsxs("div", { className: "absolute top-20 left-4 z-[1000] flex flex-col gap-2", children: [_jsxs("div", { className: "rounded-[12px] bg-[#12121A]/95 px-3 py-1.5 shadow-md text-xs font-medium flex items-center gap-1.5 border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur", children: [_jsx("span", { className: `h-2 w-2 rounded-full inline-block ${providerStatus.flespi.status === 'connected' ? 'bg-[#00E5CC]' : 'bg-[#FF4D6A]'}` }), "Fournisseur principal: Flespi", providerStatus.flespi.failoverActive && _jsx(AlertCircle, { size: 12, className: "text-[#FFB547]" })] }), _jsxs("div", { className: "rounded-[12px] bg-[#12121A]/95 px-3 py-1.5 shadow-md text-xs font-medium flex items-center gap-1.5 border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur", children: [_jsx(Clock, { size: 12, className: "text-[#00E5CC]" }), getCurrentTimezone().offset, " (", getCurrentTimezone().name, ")"] })] }), _jsxs("div", { className: "absolute bottom-4 left-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-3 text-xs font-medium border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur", children: [_jsx("p", { className: "font-syne font-semibold mb-1.5", children: "Statut des v\u00E9hicules" }), _jsxs("div", { className: "flex gap-4 text-[#6B6B80]", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#00E5CC] inline-block" }), _jsxs("span", { children: ["En mouvement: ", _jsx("span", { className: "font-bold text-[#F0F0F5]", children: movingCount })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#44445A] inline-block" }), _jsxs("span", { children: ["\u00C0 l'arr\u00EAt: ", _jsx("span", { className: "font-bold text-[#F0F0F5]", children: stoppedCount })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#FF4D6A] inline-block" }), _jsxs("span", { children: ["Hors ligne: ", _jsx("span", { className: "font-bold text-[#F0F0F5]", children: offlineCount })] })] })] }), _jsxs("div", { className: "mt-1.5 pt-1.5 border-t border-[#1F1F2E] flex gap-4 text-[#6B6B80]", children: [_jsxs("span", { children: ["Vitesse moy.: ", _jsxs("span", { className: "font-bold text-[#F0F0F5]", children: [getFormattedSpeed(avgFleetSpeed, useImperialUnits).value, " ", getFormattedSpeed(avgFleetSpeed, useImperialUnits).unit] })] }), _jsxs("span", { children: [vehiclesWithGps.length, "/", vehicles.length, " GPS actif"] }), _jsxs("div", { className: `flex items-center gap-1.5 ${isConnected ? 'text-[#00E5CC]' : 'text-[#6B6B80]'}`, children: [isConnected ? _jsx(Wifi, { size: 12 }) : _jsx(WifiOff, { size: 12 }), isConnected ? 'Live' : 'Polling'] })] })] }), _jsxs("div", { className: "absolute bottom-4 right-4 z-[1000] bg-[#12121A]/95 rounded-[12px] shadow-md p-3 text-xs border border-[#1F1F2E] text-[#F0F0F5] backdrop-blur", children: [_jsx("p", { className: "font-syne font-semibold mb-2", children: "L\u00E9gende des couleurs" }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#00E5CC] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "En mouvement" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2.5 w-2.5 rounded-full bg-[#44445A] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "\u00C0 l'arr\u00EAt" })] }), _jsxs("div", { className: "border-t border-[#1F1F2E] pt-1.5 mt-1.5", children: [_jsx("p", { className: "text-[#6B6B80] font-medium mb-1", children: "Types de v\u00E9hicules" }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#3b82f6] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "Voiture" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#f97316] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "Camion" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#8b5cf6] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "Utilitaire" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-[#ef4444] inline-block" }), _jsx("span", { className: "text-[#6B6B80]", children: "Moto" })] })] })] })] })] }), showMiniMap && (_jsx("div", { className: "absolute bottom-4 right-80 z-[1000]", children: _jsx(Card, { className: "shadow-lg bg-[#12121A] border-[#1F1F2E]", children: _jsxs("div", { className: "relative w-56 h-40 rounded overflow-hidden", children: [_jsxs(MapContainer, { center: [43.7, 3.87], zoom: 5, className: "h-full w-full z-0", zoomControl: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, scrollWheelZoom: false, touchZoom: false, children: [_jsx(TileLayer, { url: MAPBOX_TILE_URL('dark-v11'), attribution: "", tileSize: 512, zoomOffset: -1 }), vehiclesWithGps.map((v) => (_jsx(CircleMarker, { center: [v.currentLat, v.currentLng], radius: 3, fillColor: "#00E5CC", color: "#00E5CC", weight: 1, opacity: 0.8, fillOpacity: 0.7 }, `minimap-${v.id}`)))] }), _jsxs("div", { className: "absolute top-2 left-2 z-[1001] bg-[#12121A]/90 rounded px-2 py-1 text-xs font-medium text-[#F0F0F5] border border-[#1F1F2E]", children: [vehiclesWithGps.length, " v\u00E9hicules"] }), _jsx("button", { onClick: () => setShowMiniMap(false), className: "absolute top-2 right-2 z-[1001] text-[#6B6B80] hover:text-[#F0F0F5] bg-[#12121A]/90 rounded w-6 h-6 flex items-center justify-center", children: "\u00D7" })] }) }) })), showManualGps && (_jsx("div", { className: "absolute top-20 right-4 z-[1000]", children: _jsxs(Card, { className: "w-72 shadow-lg bg-[#12121A] border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-syne text-[#F0F0F5]", children: "Saisie manuelle GPS" }), _jsx("button", { onClick: () => setShowManualGps(false), className: "text-[#6B6B80] hover:text-[#F0F0F5]", children: "\u00D7" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6B80] block mb-1", children: "V\u00E9hicule" }), _jsxs("select", { value: manualGpsForm.vehicleId, onChange: (e) => setManualGpsForm({ ...manualGpsForm, vehicleId: e.target.value }), className: "w-full h-8 px-2 text-xs border border-[#1F1F2E] rounded-md focus:ring-2 focus:ring-[#00E5CC] focus:border-transparent bg-[#0A0A0F] text-[#F0F0F5]", children: [_jsx("option", { value: "", children: "S\u00E9lectionner un v\u00E9hicule" }), vehicles.map((v) => (_jsxs("option", { value: v.id, className: "bg-[#12121A] text-[#F0F0F5]", children: [v.name, " (", v.plate, ")"] }, v.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6B80] block mb-1", children: "Latitude" }), _jsx(Input, { type: "number", step: "0.00001", placeholder: "43.7", value: manualGpsForm.lat, onChange: (e) => setManualGpsForm({ ...manualGpsForm, lat: e.target.value }), className: "h-8 text-xs bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] focus:ring-[#00E5CC]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#6B6B80] block mb-1", children: "Longitude" }), _jsx(Input, { type: "number", step: "0.00001", placeholder: "3.87", value: manualGpsForm.lng, onChange: (e) => setManualGpsForm({ ...manualGpsForm, lng: e.target.value }), className: "h-8 text-xs bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] focus:ring-[#00E5CC]" })] }), _jsx(Button, { size: "sm", disabled: !manualGpsForm.vehicleId || !manualGpsForm.lat || !manualGpsForm.lng || isSubmittingGps, onClick: async () => {
                                                if (manualGpsForm.vehicleId && manualGpsForm.lat && manualGpsForm.lng && organizationId) {
                                                    setIsSubmittingGps(true);
                                                    try {
                                                        const response = await fetch(`/api/organizations/${organizationId}/vehicles/${manualGpsForm.vehicleId}/position`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                lat: parseFloat(manualGpsForm.lat),
                                                                lng: parseFloat(manualGpsForm.lng),
                                                                timestamp: new Date().toISOString(),
                                                                source: 'manual',
                                                            }),
                                                        });
                                                        if (response.ok) {
                                                            setManualGpsForm({ lat: '', lng: '', vehicleId: '', name: '' });
                                                            queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                                                        }
                                                    }
                                                    catch (error) {
                                                        console.error('Erreur lors de la soumission GPS:', error);
                                                    }
                                                    finally {
                                                        setIsSubmittingGps(false);
                                                    }
                                                }
                                            }, className: "w-full text-xs h-8 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4B8] disabled:opacity-50", children: isSubmittingGps ? 'Envoi...' : 'Envoyer' })] })] }) })), _jsx("div", { className: "absolute bottom-4 right-4 z-[1000]", children: _jsx(Button, { size: "sm", className: "bg-[#12121A]/95 border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] shadow backdrop-blur", onClick: () => setShowHelpPopover(!showHelpPopover), children: _jsx(HelpCircle, { size: 16 }) }) }), selectedVehicle && !isFullscreen && (_jsxs("div", { className: "absolute top-0 right-0 h-full w-80 bg-[#12121A] shadow-lg border-l border-[#1F1F2E] z-[999] flex flex-col overflow-hidden rounded-r-lg", children: [_jsx("div", { className: "bg-[#12121A] p-4 border-b border-[#1F1F2E]", children: _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h2", { className: "text-lg font-syne font-bold text-[#F0F0F5]", children: selectedVehicle.plate }), _jsx(Badge, { className: `text-xs mt-1 ${selectedVehicle.currentSpeed > 2 ? 'bg-[#00E5CC] text-[#0A0A0F]' : 'bg-[#44445A] text-[#F0F0F5]'}`, children: selectedVehicle.currentSpeed > 2 ? 'EN MOUVEMENT' : 'À L\'ARRÊT' })] }), _jsx("button", { onClick: () => selectVehicle(null), className: "text-[#6B6B80] hover:text-[#F0F0F5] p-1", children: _jsx(X, { size: 20 }) })] }) }), _jsxs("div", { className: "flex border-b border-[#1F1F2E] bg-[#0A0A0F]", children: [_jsx("button", { onClick: () => setActiveDetailTab('temps-reel'), className: `flex-1 px-4 py-2 text-xs font-medium transition-all ${activeDetailTab === 'temps-reel'
                                            ? 'text-[#00E5CC] border-b-2 border-[#00E5CC] bg-[#12121A]'
                                            : 'text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "TEMPS R\u00C9EL" }), _jsx("button", { onClick: () => setActiveDetailTab('historique'), className: `flex-1 px-4 py-2 text-xs font-medium transition-all ${activeDetailTab === 'historique'
                                            ? 'text-[#00E5CC] border-b-2 border-[#00E5CC] bg-[#12121A]'
                                            : 'text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "HISTORIQUE" })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: activeDetailTab === 'temps-reel' ? (_jsxs("div", { className: "divide-y divide-[#1F1F2E]", children: [_jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3", children: "Identit\u00E9" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Plaque" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.plate })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "VIN" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.vin || 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Statut API" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.apiStatus || 'Actif' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Flotte ID" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.fleetId || selectedVehicle.id })] })] })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3", children: "Appareil GPS" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Type" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.gpsDeviceType || 'Standard' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "ID Appareil" }), _jsx("span", { className: "font-medium text-[#F0F0F5] truncate", children: selectedVehicle.gpsDeviceId || 'N/A' })] })] })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3", children: "T\u00E9l\u00E9m\u00E9trie" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Vitesse" }), _jsxs("span", { className: "font-medium text-[#F0F0F5]", children: [getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value, " ", getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit] })] }), (selectedVehicle.currentSpeed || 0) <= 2 && calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr && (_jsxs("div", { className: "flex justify-between text-[#00E5CC] font-medium", children: [_jsx("span", { className: "text-[#6B6B80]", children: "\u00C0 l'arr\u00EAt depuis" }), _jsx("span", { children: calculateIdleDuration(selectedVehicle.currentSpeed || 0, selectedVehicle.lastCommunication).durationStr })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Odom\u00E8tre" }), _jsxs("span", { className: "font-medium text-[#F0F0F5]", children: [selectedVehicle.odometer || 'N/A', " km"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Carburant" }), _jsxs("span", { className: "font-medium text-[#F0F0F5]", children: [selectedVehicle.fuelLevel || 'N/A', "%"] })] })] })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3", children: "Position" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Latitude" }), _jsx("span", { className: "font-mono text-[#F0F0F5]", children: selectedVehicle.currentLat?.toFixed(6) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Longitude" }), _jsx("span", { className: "font-mono text-[#F0F0F5]", children: selectedVehicle.currentLng?.toFixed(6) })] })] })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "text-xs font-syne font-bold text-[#F0F0F5] uppercase tracking-wide mb-3", children: "Activit\u00E9" }), _jsxs("div", { className: "space-y-2 text-xs", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Derni\u00E8re com." }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: formatTimeAgo(selectedVehicle.lastCommunication) })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "D\u00E9but trajet" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.tripStart || 'N/A' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-[#6B6B80]", children: "Fin trajet" }), _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.tripEnd || 'N/A' })] })] })] })] })) : (_jsx("div", { className: "p-4 text-xs text-[#6B6B80]", children: _jsx("p", { children: "Historique non disponible" }) })) }), _jsxs("div", { className: "border-t border-[#1F1F2E] p-4 flex gap-2 bg-[#0A0A0F]", children: [_jsxs("button", { onClick: () => navigate(`/vehicles/${selectedVehicle.id}`), className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#00E5CC] text-[#0A0A0F] rounded text-xs font-medium hover:bg-[#00D4B8] transition-colors", children: [_jsx(Edit2, { size: 14 }), "\u00C9diter"] }), _jsxs("button", { className: "flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#FF4D6A]/10 text-[#FF4D6A] rounded text-xs font-medium hover:bg-[#FF4D6A]/20 transition-colors border border-[#FF4D6A]/30", children: [_jsx(Trash2, { size: 14 }), "Supprimer"] })] })] }))] }), !isFullscreen && (_jsxs("div", { className: "w-80 flex flex-col gap-4 overflow-hidden", children: [_jsx(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: _jsx(CardContent, { className: "pt-4 pb-4", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 text-[#6B6B80]", size: 16 }), _jsx(Input, { ref: searchInputRef, type: "search", placeholder: "Rechercher un v\u00E9hicule...", value: searchTerm, onChange: (e) => handleSearchChange(e.target.value), onKeyPress: (e) => e.key === 'Enter' && handleSearchSubmit(), onFocus: () => setShowRecentSearches(searchTerm.length === 0 && recentSearches.length > 0), className: "pl-9 h-10 bg-[#0A0A0F] border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:ring-[#00E5CC]" }), showRecentSearches && recentSearches.length > 0 && (_jsxs("div", { className: "absolute top-12 left-0 right-0 bg-[#12121A] border border-[#1F1F2E] rounded-md shadow-lg z-[100] overflow-hidden", children: [_jsx("div", { className: "px-3 py-2 text-xs font-semibold text-[#6B6B80] border-b border-[#1F1F2E]", children: "Recherches r\u00E9centes" }), _jsx("div", { className: "max-h-40 overflow-y-auto", children: recentSearches.map((search, idx) => (_jsxs("button", { onClick: () => handleRecentSearchSelect(search), className: "w-full text-left px-3 py-2 text-xs text-[#F0F0F5] hover:bg-[#1A1A25] transition-colors flex items-center gap-2", children: [_jsx(Clock, { size: 12, className: "text-[#6B6B80]" }), search] }, idx))) })] }))] }) }) }), _jsxs(Card, { className: "flex-1 overflow-hidden flex flex-col bg-[#12121A] border-[#1F1F2E]", children: [_jsxs(CardHeader, { className: "pb-3 pt-4", children: [_jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-xs font-semibold text-[#F0F0F5] mb-1.5", children: "SOURCE" }), _jsx("div", { className: "flex gap-1.5", children: ['TOUS', 'ECHOES', 'UBIWAN', 'KEEPTRACE'].map((source) => (_jsx("button", { onClick: () => setSourceFilter(source), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${sourceFilter === source
                                                        ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                                        : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'}`, children: source }, source))) })] }), _jsxs("div", { className: "mb-3", children: [_jsx("p", { className: "text-xs font-semibold text-[#F0F0F5] mb-1.5", children: "STATUT" }), _jsx("div", { className: "flex gap-1.5", children: ['TOUS', 'LOCALISÉS', 'NON LOC.'].map((statut) => (_jsx("button", { onClick: () => setStatutFilter(statut), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${statutFilter === statut
                                                        ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                                        : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'}`, children: statut }, statut))) })] }), _jsxs("div", { className: "mb-2", children: [_jsx("p", { className: "text-xs font-semibold text-[#F0F0F5] mb-1.5", children: "GROUPE" }), _jsxs("div", { className: "flex flex-wrap gap-1.5", children: [_jsx("button", { onClick: () => setGroupeFilter('Tous'), className: `px-2 py-1 rounded text-xs font-medium transition-colors ${groupeFilter === 'Tous'
                                                            ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                                            : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'}`, children: "Tous" }), uniqueGroups.map((group) => (_jsxs("button", { onClick: () => setGroupeFilter(group), className: `px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${groupeFilter === group
                                                            ? 'bg-[#00E5CC] text-[#0A0A0F]'
                                                            : 'bg-[#1A1A25] text-[#6B6B80] hover:bg-[#2A2A3D]'}`, children: [_jsx("span", { className: "text-sm", children: "\u25A0" }), group] }, group)))] })] })] }), _jsxs("div", { className: "px-4 py-2 border-t border-[#1F1F2E] flex items-center justify-between text-xs font-semibold text-[#F0F0F5]", children: [_jsxs("span", { children: ["V\u00C9HICULE \u2014 ", filteredVehicles.length, " R\u00C9SULTATS"] }), _jsx("span", { children: "VITESSE" })] }), _jsx(CardContent, { className: "flex-1 overflow-y-auto pb-4", children: _jsx("div", { className: "space-y-1.5", children: filteredVehicles.map((vehicle) => {
                                        const isMoving = (vehicle.currentSpeed || 0) > 2;
                                        const hasGps = vehicle.currentLat && vehicle.currentLng;
                                        return (_jsx("button", { onClick: () => selectVehicle(vehicle.id), className: `w-full rounded-lg border p-2.5 text-left transition-all ${selectedVehicleId === vehicle.id
                                                ? 'border-[#00E5CC] bg-[#00E5CC]/10 shadow-sm'
                                                : 'border-[#1F1F2E] hover:border-[#2A2A3D] hover:bg-[#1A1A25]'}`, children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-bold text-sm text-[#F0F0F5] truncate", children: vehicle.plate }), _jsx("p", { className: "text-xs text-[#6B6B80] truncate", children: vehicle.name })] }), _jsxs("div", { className: "text-right flex-shrink-0", children: [_jsx("p", { className: "text-xs font-medium text-[#F0F0F5]", children: hasGps ? `${getFormattedSpeed(vehicle.currentSpeed || 0, useImperialUnits).value}` : '—' }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: vehicle.gpsProvider || '—' })] })] }) }, vehicle.id));
                                    }) }) })] }), _jsxs(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs("div", { className: "flex items-center justify-between cursor-pointer", onClick: () => setShowProviderPanel(!showProviderPanel), children: [_jsx(CardTitle, { className: "text-sm font-syne font-semibold text-[#F0F0F5]", children: "Fournisseurs GPS" }), _jsx(ChevronDown, { size: 16, className: `transition-transform text-[#6B6B80] ${showProviderPanel ? 'rotate-0' : '-rotate-90'}` })] }) }), showProviderPanel && (_jsx(CardContent, { className: "space-y-2 text-xs pb-4", children: [
                                    { key: 'flespi', label: 'Flespi' },
                                    { key: 'echoes', label: 'Echoes' },
                                    { key: 'keeptrace', label: 'KeepTrace' },
                                    { key: 'ubiwan', label: 'Ubiwan' },
                                ].map((provider) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-[#1A1A25] rounded border border-[#1F1F2E]", children: [_jsx("span", { className: "font-medium text-[#F0F0F5]", children: provider.label }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("div", { className: "flex items-center gap-1", children: providerStatus[provider.key].status === 'connected' ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { size: 12, className: "text-[#00E5CC]" }), _jsx("span", { className: "text-[#6B6B80]", children: "Connect\u00E9" })] })) : (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { size: 12, className: "text-[#FF4D6A]" }), _jsx("span", { className: "text-[#6B6B80]", children: "Erreur" })] })) }), providerStatus[provider.key].failoverActive && (_jsx(Badge, { className: "text-xs bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/30", children: "Secours" }))] })] }, provider.key))) }))] }), selectedVehicle && (_jsxs(Card, { className: "bg-[#12121A] border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-2 pt-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-syne font-semibold text-[#F0F0F5]", children: selectedVehicle.name }), _jsx(Badge, { className: `text-xs ${selectedVehicle.currentSpeed > 2 ? 'bg-[#00E5CC] text-[#0A0A0F]' : 'bg-[#44445A] text-[#F0F0F5]'}`, children: selectedVehicle.currentSpeed > 2 ? 'En route' : 'Arrêté' })] }) }), _jsxs(CardContent, { className: "space-y-2 text-sm pb-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "bg-[#1A1A25] rounded p-2 border border-[#1F1F2E]", children: [_jsx("p", { className: "text-[#6B6B80]", children: "Vitesse" }), _jsxs("p", { className: "font-bold text-lg text-[#F0F0F5]", children: [getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).value, _jsxs("span", { className: "text-xs font-normal", children: [" ", getFormattedSpeed(selectedVehicle.currentSpeed || 0, useImperialUnits).unit] })] })] }), _jsxs("div", { className: "bg-[#1A1A25] rounded p-2 border border-[#1F1F2E]", children: [_jsx("p", { className: "text-[#6B6B80]", children: "Cap" }), _jsxs("p", { className: "font-bold text-lg text-[#F0F0F5]", children: [(selectedVehicle.currentHeading || 0).toFixed(0), _jsx("span", { className: "text-xs font-normal", children: "\u00B0" })] })] })] }), _jsxs("div", { className: "text-xs text-[#6B6B80]", children: [_jsxs("p", { children: ["Position: ", _jsxs("span", { className: "font-mono text-[#F0F0F5]", children: [selectedVehicle.currentLat?.toFixed(5), ", ", selectedVehicle.currentLng?.toFixed(5)] })] }), _jsxs("p", { children: ["Derni\u00E8re com.: ", formatTimeAgo(selectedVehicle.lastCommunication)] }), selectedVehicle.gpsProvider && (_jsxs("p", { children: ["Fournisseur: ", _jsx("span", { className: "font-medium text-[#F0F0F5]", children: selectedVehicle.gpsProvider })] }))] }), _jsxs(Button, { className: "w-full gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D4B8]", size: "sm", onClick: () => navigate(`/vehicles/${selectedVehicle.id}`), children: [_jsx(Eye, { size: 14 }), "Voir les d\u00E9tails", _jsx(ChevronRight, { size: 14 })] })] })] }))] }))] }));
}
//# sourceMappingURL=MapPage.js.map