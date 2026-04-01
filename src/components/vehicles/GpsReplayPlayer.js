import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, X, Gauge, Clock, MapPin, Route, ChevronLeft, ChevronRight, } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { apiClient } from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatDuration, formatSpeed } from '@/lib/utils';
// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
// Helper function to get polyline color based on speed (km/h)
const getSpeedColor = (speed) => {
    if (speed < 50)
        return '#22c55e'; // green
    if (speed < 90)
        return '#eab308'; // yellow
    if (speed < 120)
        return '#f97316'; // orange
    return '#ef4444'; // red
};
// Helper function to calculate distance between two points (km)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
// Helper function to find index closest to a given time (in seconds offset from current)
const findIndexByTimeOffset = (positions, currentTime, offsetSeconds) => {
    const targetTime = currentTime.getTime() + offsetSeconds * 1000;
    let closestIndex = 0;
    let minDiff = Math.abs(new Date(positions[0].timestamp).getTime() - targetTime);
    for (let i = 1; i < positions.length; i++) {
        const posTime = new Date(positions[i].timestamp).getTime();
        const diff = Math.abs(posTime - targetTime);
        if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
        }
    }
    return closestIndex;
};
// Map view controller component
const MapViewController = ({ positions, currentPosition, }) => {
    const map = useMap();
    useEffect(() => {
        if (positions.length === 0)
            return;
        // Calculate bounds from all positions
        const bounds = L.latLngBounds(positions.map((p) => [p.lat, p.lng]));
        // Fit map to bounds with padding
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [positions, map]);
    return null;
};
// Main component
export const GpsReplayPlayer = ({ vehicleId, vehicleName, onClose, }) => {
    const orgId = useAuthStore((s) => s.user?.organizationId) || '';
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalDuration: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        numStops: 0,
    });
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(Date.now());
    // Fetch GPS history
    useEffect(() => {
        const fetchGpsHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!orgId) {
                    setError('Organization ID not found');
                    return;
                }
                const endpoint = API_ROUTES.GPS_PLAYBACK(orgId, vehicleId);
                const response = await apiClient.get(endpoint);
                const data = response.data;
                if (!data || data.length === 0) {
                    setError('No GPS history available for this vehicle');
                    return;
                }
                setPositions(data);
                calculateStats(data);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to fetch GPS history';
                setError(message);
            }
            finally {
                setLoading(false);
            }
        };
        fetchGpsHistory();
    }, [vehicleId, orgId]);
    // Calculate statistics
    const calculateStats = (data) => {
        if (data.length === 0)
            return;
        let totalDistance = 0;
        let maxSpeed = 0;
        let speedSum = 0;
        let stopCount = 0;
        let consecutiveStops = 0;
        for (let i = 0; i < data.length; i++) {
            const current = data[i];
            maxSpeed = Math.max(maxSpeed, current.speed);
            speedSum += current.speed;
            // Distance calculation
            if (i > 0) {
                const prev = data[i - 1];
                totalDistance += calculateDistance(prev.lat, prev.lng, current.lat, current.lng);
            }
            // Stop detection (speed = 0 for > 30 seconds)
            if (current.speed === 0) {
                consecutiveStops++;
                if (consecutiveStops === 1 && i > 0) {
                    // Check if previous point also had speed 0
                    if (data[i - 1].speed !== 0) {
                        stopCount++;
                    }
                }
            }
            else {
                consecutiveStops = 0;
            }
        }
        const startTime = new Date(data[0].timestamp).getTime();
        const endTime = new Date(data[data.length - 1].timestamp).getTime();
        const totalDuration = (endTime - startTime) / 1000; // in seconds
        const avgSpeed = data.length > 0 ? speedSum / data.length : 0;
        setStats({
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration: Math.round(totalDuration),
            avgSpeed: Math.round(avgSpeed * 10) / 10,
            maxSpeed: Math.round(maxSpeed * 10) / 10,
            numStops: stopCount,
        });
    };
    // Handle date preset buttons
    const handleDatePreset = useCallback((preset) => {
        const now = new Date();
        let start;
        let end;
        switch (preset) {
            case 'today':
                start = startOfDay(now);
                end = now;
                break;
            case 'yesterday':
                const yesterday = subDays(now, 1);
                start = startOfDay(yesterday);
                end = endOfDay(yesterday);
                break;
            case '7days':
                start = subDays(now, 7);
                end = now;
                break;
            case '30days':
                start = subDays(now, 30);
                end = now;
                break;
        }
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    }, []);
    // Find stops (speed = 0 for > 30 seconds)
    const stops = useMemo(() => {
        const stopMarkers = [];
        let consecutiveZeroCount = 0;
        let lastZeroIndex = -1;
        for (let i = 0; i < positions.length; i++) {
            if (positions[i].speed === 0) {
                consecutiveZeroCount++;
                lastZeroIndex = i;
            }
            else {
                if (consecutiveZeroCount > 1) {
                    // More than 1 point with speed 0 indicates a stop
                    stopMarkers.push(positions[lastZeroIndex]);
                }
                consecutiveZeroCount = 0;
            }
        }
        // Handle case where route ends with a stop
        if (consecutiveZeroCount > 1) {
            stopMarkers.push(positions[lastZeroIndex]);
        }
        return stopMarkers;
    }, [positions]);
    // Create colored polyline segments
    const polylineSegments = useMemo(() => {
        const segments = [];
        for (let i = 0; i < positions.length - 1; i++) {
            const current = positions[i];
            const next = positions[i + 1];
            const color = getSpeedColor(current.speed);
            const segment = {
                positions: [
                    [current.lat, current.lng],
                    [next.lat, next.lng],
                ],
                color,
            };
            segments.push(segment);
        }
        return segments;
    }, [positions]);
    // Current position
    const currentPosition = useMemo(() => {
        if (positions.length === 0)
            return null;
        return positions[currentIndex];
    }, [positions, currentIndex]);
    // Animation loop
    useEffect(() => {
        if (!isPlaying || positions.length === 0) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }
        const animate = () => {
            const now = Date.now();
            const deltaTime = (now - lastTimeRef.current) / 1000; // Convert to seconds
            lastTimeRef.current = now;
            // Calculate how many positions to advance based on playback speed and time
            const positionsPerSecond = 1; // Adjust based on your data frequency
            const advance = Math.max(1, Math.floor(deltaTime * positionsPerSecond * playbackSpeed));
            setCurrentIndex((prev) => {
                const newIndex = prev + advance;
                if (newIndex >= positions.length) {
                    setIsPlaying(false);
                    return positions.length - 1;
                }
                return newIndex;
            });
            animationFrameRef.current = requestAnimationFrame(animate);
        };
        lastTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, positions.length, playbackSpeed]);
    // Stop animation on unmount
    useEffect(() => {
        return () => {
            setIsPlaying(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);
    if (loading) {
        return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsx(Card, { className: "w-96", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading GPS history..." })] }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsx(Card, { className: "w-96", children: _jsx(CardContent, { className: "py-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold text-destructive mb-2", children: "Error Loading GPS History" }), _jsx("p", { className: "text-sm text-muted-foreground", children: error })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: _jsx(X, { className: "h-4 w-4" }) })] }) }) }) }));
    }
    if (positions.length === 0) {
        return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsx(Card, { className: "w-96", children: _jsx(CardContent, { className: "py-6", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-semibold mb-2", children: "No GPS History" }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["No GPS history available for ", vehicleName] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: _jsx(X, { className: "h-4 w-4" }) })] }) }) }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4", children: _jsxs(Card, { className: "w-full h-full max-w-6xl max-h-screen flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-4 border-b", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("h2", { className: "text-xl font-semibold", children: [vehicleName, " - GPS History Replay"] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [positions[0].timestamp, " to ", positions[positions.length - 1].timestamp] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs(CardContent, { className: "flex-1 p-4 overflow-hidden flex flex-col gap-4", children: [_jsx("div", { className: "flex-1 rounded-lg overflow-hidden border", children: _jsxs(MapContainer, { center: [positions[0].lat, positions[0].lng], zoom: 13, style: { width: '100%', height: '100%' }, className: "z-0", children: [_jsx(TileLayer, { url: "MAPBOX_TILE_URL_PLACEHOLDER", attribution: '\u00A9 Mapbox \u00A9 OpenStreetMap', tileSize: 512, zoomOffset: -1 }), _jsx(MapViewController, { positions: positions, currentPosition: currentPosition }), polylineSegments.map((segment, idx) => (_jsx(Polyline, { positions: segment.positions, color: segment.color, weight: 3, opacity: 0.7 }, `route-${idx}`))), stops.map((stop, idx) => (_jsx(CircleMarker, { center: [stop.lat, stop.lng], radius: 6, fillColor: "#ef4444", fillOpacity: 0.8, color: "#dc2626", weight: 2, children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: "Stop" }), _jsx("p", { children: formatDateTime(new Date(stop.timestamp)) })] }) }) }, `stop-${idx}`))), currentPosition && (_jsx(Marker, { position: [currentPosition.lat, currentPosition.lng], icon: L.divIcon({
                                            html: `
                      <div style="
                        width: 24px;
                        height: 24px;
                        background: white;
                        border: 3px solid #3b82f6;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                        transform: translate(-12px, -12px);
                      "></div>
                    `,
                                            className: '',
                                            iconSize: [24, 24],
                                        }), children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: "Current Position" }), _jsxs("p", { children: [currentPosition.lat.toFixed(5), ", ", currentPosition.lng.toFixed(5)] }), _jsxs("p", { children: ["Speed: ", formatSpeed(currentPosition.speed)] }), _jsx("p", { children: formatDateTime(new Date(currentPosition.timestamp)) })] }) }) })), _jsx(Marker, { position: [positions[0].lat, positions[0].lng], children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: "Start" }), _jsx("p", { children: formatDateTime(new Date(positions[0].timestamp)) })] }) }) }), _jsx(Marker, { position: [positions[positions.length - 1].lat, positions[positions.length - 1].lng], children: _jsx(Popup, { children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-semibold", children: "End" }), _jsx("p", { children: formatDateTime(new Date(positions[positions.length - 1].timestamp)) })] }) }) })] }) }), _jsxs("div", { className: "grid grid-cols-5 gap-2", children: [_jsxs("div", { className: "bg-secondary rounded-lg p-3 flex items-center gap-2", children: [_jsx(Route, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Distance" }), _jsxs("p", { className: "text-sm font-semibold", children: [stats.totalDistance.toFixed(2), " km"] })] })] }), _jsxs("div", { className: "bg-secondary rounded-lg p-3 flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Duration" }), _jsx("p", { className: "text-sm font-semibold", children: formatDuration(stats.totalDuration) })] })] }), _jsxs("div", { className: "bg-secondary rounded-lg p-3 flex items-center gap-2", children: [_jsx(Gauge, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Avg Speed" }), _jsx("p", { className: "text-sm font-semibold", children: formatSpeed(stats.avgSpeed) })] })] }), _jsxs("div", { className: "bg-secondary rounded-lg p-3 flex items-center gap-2", children: [_jsx(Gauge, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Max Speed" }), _jsx("p", { className: "text-sm font-semibold", children: formatSpeed(stats.maxSpeed) })] })] }), _jsxs("div", { className: "bg-secondary rounded-lg p-3 flex items-center gap-2", children: [_jsx(MapPin, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Stops" }), _jsx("p", { className: "text-sm font-semibold", children: stats.numStops })] })] })] }), currentPosition && (_jsxs("div", { className: "bg-secondary rounded-lg p-3 grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Latitude" }), _jsx("p", { className: "text-sm font-mono", children: currentPosition.lat.toFixed(5) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Longitude" }), _jsx("p", { className: "text-sm font-mono", children: currentPosition.lng.toFixed(5) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Speed" }), _jsx("p", { className: "text-sm font-semibold", children: formatSpeed(currentPosition.speed) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Heading" }), _jsxs("p", { className: "text-sm font-semibold", children: [Math.round(currentPosition.heading), "\u00B0"] })] }), _jsxs("div", { className: "md:col-span-4", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Timestamp" }), _jsx("p", { className: "text-sm font-mono", children: formatDateTime(new Date(currentPosition.timestamp)) })] })] })), _jsx("div", { className: "space-y-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs text-muted-foreground", children: [currentIndex + 1, " / ", positions.length] }), _jsx("input", { type: "range", min: "0", max: positions.length - 1, value: currentIndex, onChange: (e) => {
                                            setCurrentIndex(parseInt(e.target.value, 10));
                                            setIsPlaying(false);
                                        }, className: "flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer" }), _jsx("span", { className: "text-xs text-muted-foreground", children: formatDateTime(new Date(currentPosition?.timestamp || positions[0].timestamp)) })] }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Date Filter:" }), _jsxs("div", { className: "flex gap-1 flex-wrap", children: [_jsx(Button, { variant: startDate === format(new Date(), 'yyyy-MM-dd') && endDate === format(new Date(), 'yyyy-MM-dd') ? 'default' : 'outline', size: "sm", onClick: () => handleDatePreset('today'), className: "text-xs h-7 px-2", children: "Aujourd'hui" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDatePreset('yesterday'), className: "text-xs h-7 px-2", children: "Hier" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDatePreset('7days'), className: "text-xs h-7 px-2", children: "7 derniers jours" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleDatePreset('30days'), className: "text-xs h-7 px-2", children: "30 derniers jours" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Start Date" }), _jsx("input", { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "w-full px-2 py-1 text-xs border rounded bg-background" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "End Date" }), _jsx("input", { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "w-full px-2 py-1 text-xs border rounded bg-background" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentIndex(0), disabled: currentIndex === 0, children: _jsx(SkipBack, { className: "h-4 w-4" }) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                if (currentPosition) {
                                                    const newIndex = findIndexByTimeOffset(positions, new Date(currentPosition.timestamp), -300);
                                                    setCurrentIndex(Math.max(0, newIndex));
                                                }
                                            }, disabled: currentIndex === 0, title: "Go back 5 minutes", children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), _jsx("span", { className: "text-xs", children: "-5 min" })] }), _jsx(Button, { size: "sm", onClick: () => setIsPlaying(!isPlaying), className: "px-6", children: isPlaying ? (_jsxs(_Fragment, { children: [_jsx(Pause, { className: "h-4 w-4 mr-2" }), "Pause"] })) : (_jsxs(_Fragment, { children: [_jsx(Play, { className: "h-4 w-4 mr-2" }), "Play"] })) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
                                                if (currentPosition) {
                                                    const newIndex = findIndexByTimeOffset(positions, new Date(currentPosition.timestamp), 300);
                                                    setCurrentIndex(Math.min(positions.length - 1, newIndex));
                                                }
                                            }, disabled: currentIndex === positions.length - 1, title: "Go forward 5 minutes", children: [_jsx("span", { className: "text-xs", children: "+5 min" }), _jsx(ChevronRight, { className: "h-4 w-4 ml-1" })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentIndex(positions.length - 1), disabled: currentIndex === positions.length - 1, children: _jsx(SkipForward, { className: "h-4 w-4" }) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-muted-foreground", children: "Speed:" }), [1, 2, 5, 10].map((speed) => (_jsxs(Button, { variant: playbackSpeed === speed ? 'default' : 'outline', size: "sm", onClick: () => setPlaybackSpeed(speed), className: "w-12", children: [speed, "x"] }, speed)))] }), _jsx(Button, { variant: "outline", size: "sm", onClick: onClose, children: "Close" })] })] })] }) }));
};
//# sourceMappingURL=GpsReplayPlayer.js.map