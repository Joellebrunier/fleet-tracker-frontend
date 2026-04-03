import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useVehicle, useVehicleHistory } from '@/hooks/useVehicles';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, formatTimeAgo } from '@/lib/utils';
import { ArrowLeft, Gauge, Navigation, MapPin, Clock, Cpu, Car, Compass, Play, Download, Power, Battery, Route, Zap, Signal, Activity, Camera, Plus, X, AlertCircle, ChevronDown, AlertTriangle, } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { GpsReplayPlayer } from '@/components/vehicles/GpsReplayPlayer';
import { GpsDataExport } from '@/components/vehicles/GpsDataExport';
import { reverseGeocode } from '@/lib/geocoding';
import { MAPBOX_TILE_URL } from '@/lib/constants';
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
    const organizationId = useAuthStore((s) => s.user?.organizationId) || '';
    const [showReplay, setShowReplay] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);
    const [vehicleNotes, setVehicleNotes] = useState('');
    const [customFields, setCustomFields] = useState([]);
    const [showAddField, setShowAddField] = useState(false);
    const [newFieldForm, setNewFieldForm] = useState({ key: '', value: '' });
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [activeTab, setActiveTab] = useState('gps');
    const [trips, setTrips] = useState([]);
    const [tripsLoading, setTripsLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [replayingTrip, setReplayingTrip] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [exportError, setExportError] = useState(null);
    const [maintenanceInfo, setMaintenanceInfo] = useState({
        type: 'Service',
        isOverdue: false,
    });
    const { data: vehicle, isLoading: vehicleLoading } = useVehicle(id || '');
    const { data: history } = useVehicleHistory(id || '');
    const positions = useMemo(() => {
        if (!history)
            return [];
        const items = Array.isArray(history) ? history : history.data || history.positions || [];
        return items.slice(0, 50);
    }, [history]);
    // Initialize vehicle notes and custom fields from vehicle data
    useEffect(() => {
        if (vehicle) {
            setVehicleNotes(vehicle.notes || '');
            if (vehicle.customFields) {
                const fieldsArray = Array.isArray(vehicle.customFields)
                    ? vehicle.customFields
                    : Object.entries(vehicle.customFields).map(([key, value]) => ({ key, value: String(value) }));
                setCustomFields(fieldsArray);
            }
            // Load maintenance info from vehicle metadata
            const meta = vehicle.metadata || {};
            if (meta.nextMaintenanceDate || meta.nextMaintenanceKm) {
                const nextDate = meta.nextMaintenanceDate ? new Date(meta.nextMaintenanceDate) : undefined;
                const isOverdue = nextDate && nextDate < new Date();
                setMaintenanceInfo({
                    nextDate,
                    nextKm: meta.nextMaintenanceKm,
                    lastDate: meta.lastMaintenanceDate ? new Date(meta.lastMaintenanceDate) : undefined,
                    lastKm: meta.lastMaintenanceKm,
                    type: meta.maintenanceType || 'Service',
                    isOverdue: isOverdue || false,
                });
            }
            // Load photos if stored in metadata
            if (meta.photos && Array.isArray(meta.photos)) {
                setPhotos(meta.photos);
            }
        }
    }, [vehicle]);
    // Reverse geocode current position when lat/lng changes
    useEffect(() => {
        if (vehicle?.currentLat && vehicle?.currentLng) {
            reverseGeocode(vehicle.currentLat, vehicle.currentLng)
                .then(address => setCurrentAddress(address || null))
                .catch(() => setCurrentAddress(null));
        }
    }, [vehicle?.currentLat, vehicle?.currentLng]);
    // Fetch trips when date range changes
    useEffect(() => {
        if (!id || !organizationId)
            return;
        // Validate date range
        if (new Date(dateTo) < new Date(dateFrom)) {
            setExportError('La date de fin doit être après la date de début');
            return;
        }
        setExportError(null);
        const fetchTrips = async () => {
            try {
                setTripsLoading(true);
                const dateFromISO = new Date(dateFrom).toISOString();
                const dateToISO = new Date(new Date(dateTo).getTime() + 24 * 60 * 60 * 1000).toISOString();
                const response = await fetch(`/api/organizations/${organizationId}/gps-history?vehicleId=${id}&dateFrom=${encodeURIComponent(dateFromISO)}&dateTo=${encodeURIComponent(dateToISO)}`);
                if (!response.ok)
                    throw new Error('Failed to fetch GPS history');
                const data = await response.json();
                const positions = Array.isArray(data) ? data : data.data || data.positions || [];
                // Parse trips from GPS positions
                const parsedTrips = parseTripsFromPositions(positions);
                setTrips(parsedTrips);
            }
            catch (error) {
                console.error('Error fetching trips:', error);
                setTrips([]);
            }
            finally {
                setTripsLoading(false);
            }
        };
        fetchTrips();
    }, [id, organizationId, dateFrom, dateTo]);
    // Parse trips from GPS positions
    const parseTripsFromPositions = (positions) => {
        if (!Array.isArray(positions) || positions.length === 0)
            return [];
        const sortedPositions = [...positions].sort((a, b) => {
            const timeA = new Date(a.createdAt || a.timestamp).getTime();
            const timeB = new Date(b.createdAt || b.timestamp).getTime();
            return timeA - timeB;
        });
        const trips = [];
        let currentTrip = null;
        const SPEED_THRESHOLD = 2; // km/h
        const TIME_GAP_THRESHOLD = 5 * 60 * 1000; // 5 minutes
        for (let i = 0; i < sortedPositions.length; i++) {
            const pos = sortedPositions[i];
            const posTime = new Date(pos.createdAt || pos.timestamp);
            const speed = pos.speed || 0;
            // Start a new trip if vehicle is moving
            if (!currentTrip && speed > SPEED_THRESHOLD) {
                currentTrip = {
                    startTime: posTime,
                    startLat: pos.lat,
                    startLng: pos.lng,
                    points: [{ lat: pos.lat, lng: pos.lng, timestamp: posTime, speed }],
                    distance: 0,
                    duration: 0,
                    averageSpeed: 0,
                    maxSpeed: speed,
                };
            }
            else if (currentTrip) {
                // Add point to current trip
                const prevPos = sortedPositions[i - 1];
                const prevTime = new Date(prevPos.createdAt || prevPos.timestamp);
                const timeDiff = (posTime.getTime() - prevTime.getTime()) / 1000 / 3600; // hours
                const distance = calculateDistance(prevPos.lat, prevPos.lng, pos.lat, pos.lng);
                currentTrip.points.push({ lat: pos.lat, lng: pos.lng, timestamp: posTime, speed });
                currentTrip.distance += distance;
                currentTrip.maxSpeed = Math.max(currentTrip.maxSpeed || 0, speed);
                // Check if trip ended (vehicle stopped or time gap)
                if (i === sortedPositions.length - 1) {
                    // End of data
                    finalizeTripIfValid(currentTrip, posTime);
                    trips.push(currentTrip);
                    currentTrip = null;
                }
                else {
                    const nextPos = sortedPositions[i + 1];
                    const nextTime = new Date(nextPos.createdAt || nextPos.timestamp);
                    const nextSpeed = nextPos.speed || 0;
                    const timeGap = nextTime.getTime() - posTime.getTime();
                    if (nextSpeed <= SPEED_THRESHOLD || timeGap > TIME_GAP_THRESHOLD) {
                        // Trip ended
                        finalizeTripIfValid(currentTrip, posTime);
                        trips.push(currentTrip);
                        currentTrip = null;
                    }
                }
            }
        }
        return trips;
    };
    const finalizeTripIfValid = (trip, endTime) => {
        trip.endTime = endTime;
        trip.endLat = trip.points?.[trip.points.length - 1]?.lat || 0;
        trip.endLng = trip.points?.[trip.points.length - 1]?.lng || 0;
        trip.duration = Math.round((endTime.getTime() - trip.startTime.getTime()) / 1000); // seconds
        if (trip.points && trip.points.length > 0) {
            const totalSpeed = trip.points.reduce((sum, p) => sum + p.speed, 0);
            trip.averageSpeed = Math.round((totalSpeed / trip.points.length) * 10) / 10;
        }
    };
    const calculateDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
    // Export functions
    const generateGpsPoints = () => {
        if (!trips || trips.length === 0)
            return [];
        const points = [];
        trips.forEach(trip => {
            if (trip.points) {
                points.push(...trip.points);
            }
        });
        return points.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    };
    const exportToCSV = () => {
        const points = generateGpsPoints();
        if (points.length === 0) {
            setExportError('Aucun point GPS à exporter');
            return;
        }
        const headers = ['Date', 'Heure', 'Latitude', 'Longitude', 'Vitesse', 'Cap', 'Adresse'];
        const rows = points.map(p => {
            const dt = new Date(p.timestamp);
            const date = dt.toLocaleDateString('fr-FR');
            const time = dt.toLocaleTimeString('fr-FR');
            return [
                date,
                time,
                p.lat.toFixed(6),
                p.lng.toFixed(6),
                (p.speed || 0).toFixed(1),
                (p.heading || 0).toFixed(1),
                'GPS Track',
            ];
        });
        const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
        downloadFile(csv, `${vehicle?.name || 'vehicle'}_gps_export.csv`, 'text/csv');
        setExportMenuOpen(false);
    };
    const exportToKML = () => {
        const points = generateGpsPoints();
        if (points.length === 0) {
            setExportError('Aucun point GPS à exporter');
            return;
        }
        const placemarks = points
            .filter((p, idx) => idx % Math.ceil(points.length / 50) === 0 || idx === points.length - 1) // Sample for readability
            .map((p, idx) => `
    <Placemark>
      <name>Point ${idx + 1}</name>
      <Point>
        <coordinates>${p.lng},${p.lat},0</coordinates>
      </Point>
    </Placemark>`)
            .join('\n');
        const linestring = points
            .map(p => `${p.lng},${p.lat},0`)
            .join('\n      ');
        const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${vehicle?.name || 'Vehicle'} GPS Route</name>
    <Placemark>
      <name>Route</name>
      <LineString>
        <coordinates>
      ${linestring}
        </coordinates>
      </LineString>
    </Placemark>
    ${placemarks}
  </Document>
</kml>`;
        downloadFile(kml, `${vehicle?.name || 'vehicle'}_gps_export.kml`, 'application/vnd.google-earth.kml+xml');
        setExportMenuOpen(false);
    };
    const exportToGPX = () => {
        const points = generateGpsPoints();
        if (points.length === 0) {
            setExportError('Aucun point GPS à exporter');
            return;
        }
        const trkpts = points
            .map(p => `
    <trkpt lat="${p.lat}" lon="${p.lng}">
      <ele>0</ele>
      <time>${p.timestamp.toISOString()}</time>
      <speed>${(p.speed || 0).toFixed(1)}</speed>
    </trkpt>`)
            .join('\n');
        const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vehicle GPS Export"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.topografix.com/GPX/1/1"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${vehicle?.name || 'Vehicle'} GPS Track</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${vehicle?.name || 'Vehicle'}</name>
    <trkseg>
      ${trkpts}
    </trkseg>
  </trk>
</gpx>`;
        downloadFile(gpx, `${vehicle?.name || 'vehicle'}_gps_export.gpx`, 'application/gpx+xml');
        setExportMenuOpen(false);
    };
    const exportToXLSX = () => {
        const points = generateGpsPoints();
        if (points.length === 0) {
            setExportError('Aucun point GPS à exporter');
            return;
        }
        const headers = ['Date', 'Heure', 'Latitude', 'Longitude', 'Vitesse', 'Cap', 'Adresse'];
        const rows = points.map(p => {
            const dt = new Date(p.timestamp);
            const date = dt.toLocaleDateString('fr-FR');
            const time = dt.toLocaleTimeString('fr-FR');
            return [
                date,
                time,
                p.lat.toFixed(6),
                p.lng.toFixed(6),
                (p.speed || 0).toFixed(1),
                (p.heading || 0).toFixed(1),
                'GPS Track',
            ];
        });
        // Excel FR compatible CSV with semicolon separator
        const csv = [headers, ...rows].map(r => r.join(';')).join('\n');
        downloadFile(csv, `${vehicle?.name || 'vehicle'}_gps_export.csv`, 'text/csv;charset=utf-8');
        setExportMenuOpen(false);
    };
    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const newPhoto = {
                        id: Date.now().toString(),
                        data: event.target.result,
                        name: file.name,
                        uploadedAt: new Date(),
                    };
                    setPhotos([...photos, newPhoto]);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    const deletePhoto = (photoId) => {
        setPhotos(photos.filter(p => p.id !== photoId));
    };
    const saveNotes = async () => {
        if (!id)
            return;
        try {
            setNotesLoading(true);
            await apiClient.patch(`/vehicles/${id}`, {
                notes: vehicleNotes,
            });
            // Success notification would go here
        }
        catch (error) {
            console.error('Error saving notes:', error);
        }
        finally {
            setNotesLoading(false);
        }
    };
    if (vehicleLoading) {
        return (_jsxs("div", { className: "space-y-6", children: [_jsx(Skeleton, { className: "h-10 w-48" }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx(Skeleton, { className: "h-64 lg:col-span-2" }), _jsx(Skeleton, { className: "h-64" })] })] }));
    }
    if (!vehicle) {
        return (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-[#6B6B80]", children: "V\u00E9hicule introuvable" }), _jsx(Button, { variant: "outline", className: "mt-4", onClick: () => navigate('/vehicles'), children: "Retour \u00E0 la liste" })] }));
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
    return (_jsxs("div", { className: "bg-[#0A0A0F] min-h-screen space-y-6 p-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "text-[#6B6B80] hover:text-[#F0F0F5]", onClick: () => navigate(-1), children: _jsx(ArrowLeft, { size: 18 }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h1", { className: "font-syne text-2xl font-bold text-[#F0F0F5]", children: vehicle.name }), _jsx(Badge, { variant: isMoving ? 'default' : 'secondary', children: isMoving ? 'En route' : hasGps ? 'Arrêté' : 'Hors ligne' })] }), _jsxs("p", { className: "mt-0.5 text-sm text-[#6B6B80]", children: [vehicle.plate, " \u00B7 ", provider, " \u00B7 IMEI: ", vehicle.deviceImei || 'N/A'] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { className: "gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setShowReplay(true), children: [_jsx(Play, { size: 16 }), "Replay GPS"] }), _jsxs(Button, { className: "gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setShowExport(true), children: [_jsx(Download, { size: 16 }), "Exporter"] })] })] }), showReplay && (_jsx(GpsReplayPlayer, { vehicleId: id, vehicleName: vehicle.name, onClose: () => setShowReplay(false) })), _jsx(GpsDataExport, { vehicleId: id, vehicleName: vehicle.name, isOpen: showExport, onClose: () => setShowExport(false) }), _jsxs("div", { className: "flex gap-2 border-b border-[#1F1F2E]", children: [_jsx("button", { onClick: () => setActiveTab('gps'), className: `font-syne px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'gps'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "GPS" }), _jsx("button", { onClick: () => setActiveTab('trips'), className: `font-syne px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'trips'
                            ? 'border-[#00E5CC] text-[#00E5CC]'
                            : 'border-transparent text-[#6B6B80] hover:text-[#F0F0F5]'}`, children: "Trajets" })] }), activeTab === 'gps' && (_jsxs("div", { children: [_jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs(Card, { className: "lg:col-span-2 overflow-hidden bg-[#12121A] border border-[#1F1F2E]", title: "Affiche la position GPS actuelle et l historique r\u00E9cent du v\u00E9hicule", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", children: "Position actuelle" }) }), _jsx(CardContent, { className: "p-0", children: hasGps ? (_jsx("div", { className: "h-72", children: _jsxs(MapContainer, { center: [vehicle.currentLat, vehicle.currentLng], zoom: 14, className: "h-full w-full", zoomControl: false, children: [_jsx(TileLayer, { url: MAPBOX_TILE_URL('streets-v12'), tileSize: 512, zoomOffset: -1 }), _jsx(Marker, { position: [vehicle.currentLat, vehicle.currentLng], children: _jsxs(Popup, { children: [_jsx("strong", { children: vehicle.name }), _jsx("br", {}), (vehicle.currentSpeed || 0).toFixed(0), " km/h"] }) }), positions.map((pos, idx) => (_jsx(CircleMarker, { center: [pos.lat, pos.lng], radius: 3, pathOptions: {
                                                            color: '#00E5CC',
                                                            fillColor: '#00E5CC',
                                                            fillOpacity: 0.5 - idx * 0.01,
                                                            weight: 1,
                                                        } }, idx)))] }) })) : (_jsx("div", { className: "h-72 flex items-center justify-center bg-[#1A1A25]", children: _jsxs("div", { className: "text-center text-[#44445A]", children: [_jsx(MapPin, { size: 32, className: "mx-auto mb-2" }), _jsx("p", { className: "text-sm", children: "Aucune position GPS disponible" })] }) })) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", title: "Informations en temps r\u00E9el du v\u00E9hicule", children: "Statut en temps r\u00E9el" }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "rounded-[12px] bg-[#1A1A25] p-4 text-center border border-[#1F1F2E]", children: [_jsx(Gauge, { size: 20, className: "mx-auto text-[#6B6B80] mb-1" }), _jsx("p", { className: "font-mono font-bold text-3xl text-[#00E5CC]", children: (vehicle.currentSpeed || 0).toFixed(0) }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "km/h" })] }), _jsxs("div", { className: "space-y-3 text-sm", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Power, { size: 14, className: (vehicle.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]') }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Contact" }), _jsx("span", { className: `font-medium text-xs ${vehicle.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]'}`, children: vehicle.ignition ? 'ON' : 'OFF' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "Niveau de batterie du dispositif GPS", children: _jsx(Battery, { size: 14, className: (() => {
                                                                        const batteryLevel = vehicle.batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : ((vehicle.batteryVoltage || meta.batteryVoltage || 0) * 100 / 14));
                                                                        if (batteryLevel > 50)
                                                                            return 'text-[#00E5CC]';
                                                                        if (batteryLevel > 20)
                                                                            return 'text-[#FFB547]';
                                                                        return 'text-[#FF4D6A]';
                                                                    })() }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Batterie" }), _jsx("span", { className: `font-medium text-xs ${(() => {
                                                                    const batteryLevel = vehicle.batteryLevel || (meta.batteryLevel !== undefined ? meta.batteryLevel : ((vehicle.batteryVoltage || meta.batteryVoltage || 0) * 100 / 14));
                                                                    if (batteryLevel > 50)
                                                                        return 'text-[#00E5CC]';
                                                                    if (batteryLevel > 20)
                                                                        return 'text-[#FFB547]';
                                                                    return 'text-[#FF4D6A]';
                                                                })()}`, children: (() => {
                                                                    const batteryLevel = vehicle.batteryLevel || meta.batteryLevel;
                                                                    const batteryVoltage = vehicle.batteryVoltage || meta.batteryVoltage || 0;
                                                                    if (batteryLevel !== undefined)
                                                                        return `${batteryLevel.toFixed(0)}%`;
                                                                    return `${batteryVoltage.toFixed(1)} V`;
                                                                })() })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Compass, { size: 14, className: "text-[#6B6B80]" }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Cap" }), _jsxs("span", { className: "font-mono text-[#F0F0F5]", children: [(vehicle.currentHeading || 0).toFixed(0), "\u00B0"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MapPin, { size: 14, className: "text-[#6B6B80]" }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Position" }), _jsxs("span", { className: "font-mono text-xs text-[#00E5CC]", children: [vehicle.currentLat?.toFixed(5), ", ", vehicle.currentLng?.toFixed(5)] })] }), currentAddress && (_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(MapPin, { size: 14, className: "text-[#6B6B80] mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsx("span", { className: "text-[#6B6B80] text-xs block", children: "Adresse" }), _jsx("span", { className: "text-[#F0F0F5] text-xs leading-tight", children: currentAddress })] })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "Heure de la derni\u00E8re communication du v\u00E9hicule", children: _jsx(Clock, { size: 14, className: "text-[#6B6B80]" }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Derni\u00E8re com." }), _jsx("span", { className: "font-medium text-xs text-[#F0F0F5]", children: vehicle.lastCommunication ? formatTimeAgo(vehicle.lastCommunication) : 'Jamais' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "IMEI du dispositif GPS", children: _jsx(Cpu, { size: 14, className: "text-[#6B6B80]" }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "IMEI" }), _jsx("span", { className: "font-mono text-xs text-[#00E5CC]", children: vehicle.metadata?.imei || vehicle.imei || vehicle.deviceId || vehicle.deviceImei || 'N/A' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "Force du signal GPS", children: _jsx(Signal, { size: 14, className: (vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality || 0) > 75 ? 'text-[#00E5CC]' : (vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality || 0) > 40 ? 'text-[#FFB547]' : 'text-[#FF4D6A]' }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Signal GPS" }), _jsx("span", { className: "font-medium text-xs text-[#F0F0F5]", children: vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality ? `${(vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality).toFixed(0)}%` : 'N/A' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "Heures moteur accumul\u00E9es", children: _jsx(Activity, { size: 14, className: "text-[#6B6B80]" }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Heures moteur" }), _jsx("span", { className: "font-medium text-xs text-[#F0F0F5]", children: vehicle.metadata?.engineHours || vehicle.engineHours ? `${(vehicle.metadata?.engineHours || vehicle.engineHours).toFixed(0)} h` : 'N/A' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "\u00C9tat du contact du moteur", children: _jsx(Power, { size: 14, className: (vehicle.metadata?.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]') }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Contact" }), _jsx("span", { className: `font-medium text-xs ${vehicle.metadata?.ignition ? 'text-[#00E5CC]' : 'text-[#44445A]'}`, children: vehicle.metadata?.ignition ? 'ON' : 'OFF' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { title: "Fournisseur de service GPS", children: _jsx(Cpu, { size: 14, className: "text-[#6B6B80]" }) }), _jsx("span", { className: "text-[#6B6B80] flex-1", children: "Provider" }), _jsx(Badge, { variant: "outline", className: "text-xs bg-[#1A1A25] border-[#1F1F2E] text-[#00E5CC]", children: provider })] })] })] })] })] }), _jsxs("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-4", children: [_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Marque et mod\u00E8le du v\u00E9hicule", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Car, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Marque / Mod\u00E8le" }), _jsxs("p", { className: "font-syne font-semibold text-[#F0F0F5] mt-0.5", children: [vehicle.brand || '—', " ", vehicle.model || ''] })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Plaque dimmatriculation du v\u00E9hicule", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Navigation, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Plaque" }), _jsx("p", { className: "font-syne font-semibold text-[#F0F0F5] mt-0.5", children: vehicle.plate || '—' })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Identifiant unique du dispositif GPS", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Cpu, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "IMEI" }), _jsx("p", { className: "font-mono text-xs text-[#00E5CC] mt-0.5", children: vehicle.deviceImei || vehicle.metadata?.imei || vehicle.imei || '—' })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Date de cr\u00E9ation du v\u00E9hicule dans le syst\u00E8me", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Clock, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Cr\u00E9\u00E9 le" }), _jsx("p", { className: "font-syne font-semibold text-[#F0F0F5] mt-0.5 text-sm", children: vehicle.createdAt ? formatDateTime(vehicle.createdAt) : '—' })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Distance totale parcourue ou kilom\u00E9trage", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Route, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Odom\u00E8tre" }), _jsxs("p", { className: "font-syne font-semibold text-[#F0F0F5] mt-0.5", children: [(vehicle.odometer || vehicle.totalDistance || 0).toLocaleString('fr-FR'), " km"] })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Num\u00E9ro didentification du v\u00E9hicule", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Zap, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "VIN" }), _jsx("p", { className: "font-mono text-xs text-[#00E5CC] mt-0.5", children: vehicle.vin || vehicle.vin || '—' })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Classification du type de v\u00E9hicule", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Car, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Type" }), _jsx("p", { className: "font-syne font-semibold text-[#F0F0F5] mt-0.5", children: vehicle.vehicleType || vehicle.type || '—' })] }) })] }), _jsxs("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Nombre total dheures moteur du v\u00E9hicule", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Activity, { size: 18, className: "text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Heures moteur" }), _jsxs("p", { className: "font-mono font-semibold text-[#F0F0F5] mt-0.5 text-lg", children: [(vehicle.metadata?.engineHours || vehicle.engineHours || 0).toLocaleString('fr-FR'), " h"] })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Niveau de batterie du dispositif GPS", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Battery, { size: 18, className: `mb-2 ${(() => {
                                                const batteryLevel = vehicle.metadata?.batteryLevel || vehicle.batteryLevel;
                                                const batteryVoltage = vehicle.metadata?.batteryVoltage || vehicle.batteryVoltage || 0;
                                                let level = batteryLevel !== undefined ? batteryLevel : (batteryVoltage > 0 ? (batteryVoltage * 100 / 14) : 0);
                                                if (level > 50)
                                                    return 'text-[#00E5CC]';
                                                if (level > 20)
                                                    return 'text-[#FFB547]';
                                                return 'text-[#FF4D6A]';
                                            })()}` }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: "Niveau batterie" }), _jsx("div", { className: "mt-2 flex gap-0.5 mb-2", children: [...Array(5)].map((_, idx) => {
                                                const batteryLevel = vehicle.metadata?.batteryLevel || vehicle.batteryLevel;
                                                const batteryVoltage = vehicle.metadata?.batteryVoltage || vehicle.batteryVoltage || 0;
                                                let level = batteryLevel !== undefined ? batteryLevel : (batteryVoltage > 0 ? (batteryVoltage * 100 / 14) : 0);
                                                const filled = idx < Math.ceil((level / 100) * 5);
                                                return (_jsx("div", { className: `h-2 flex-1 rounded-sm ${filled ? 'bg-[#00E5CC]' : 'bg-[#1F1F2E]'}` }, idx));
                                            }) }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: (() => {
                                                const batteryLevel = vehicle.metadata?.batteryLevel || vehicle.batteryLevel;
                                                const batteryVoltage = vehicle.metadata?.batteryVoltage || vehicle.batteryVoltage || 0;
                                                if (batteryLevel !== undefined)
                                                    return `${batteryLevel.toFixed(0)}%`;
                                                if (batteryVoltage > 0)
                                                    return `${batteryVoltage.toFixed(1)} V`;
                                                return 'N/A';
                                            })() })] }) }), _jsx(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", title: "Force du signal GPS et pr\u00E9cision", children: _jsxs(CardContent, { className: "pt-5 pb-4", children: [_jsx(Signal, { size: 18, className: (() => {
                                                const signalStrength = vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality || vehicle.signalStrength || 0;
                                                if (signalStrength > 75)
                                                    return 'text-[#00E5CC]';
                                                if (signalStrength > 40)
                                                    return 'text-[#FFB547]';
                                                return 'text-[#FF4D6A]';
                                            })(), style: { marginBottom: '8px' } }), _jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Signal GPS" }), _jsx("div", { className: "mt-1 flex gap-0.5 mb-2", children: [...Array(5)].map((_, idx) => {
                                                const signalStrength = vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality || vehicle.signalStrength || 0;
                                                const filled = idx < Math.ceil((signalStrength / 100) * 5);
                                                return (_jsx("div", { className: `h-1.5 flex-1 rounded-sm ${filled ? 'bg-[#00E5CC]' : 'bg-[#1F1F2E]'}` }, idx));
                                            }) }), _jsx("p", { className: "text-xs text-[#6B6B80] mb-3", children: vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality ? `${(vehicle.metadata?.signalStrength || vehicle.metadata?.gpsQuality).toFixed(0)}%` : 'N/A' }), _jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Pr\u00E9cision GPS" }), _jsx("div", { className: "mt-1", children: (() => {
                                                const gpsAccuracy = (vehicle.gpsAccuracy || 0);
                                                let color = 'text-[#00E5CC]';
                                                let bgColor = 'bg-[#1A1A25]';
                                                let label = 'Excellente';
                                                if (gpsAccuracy > 15) {
                                                    color = 'text-[#FF4D6A]';
                                                    bgColor = 'bg-[#1A1A25]';
                                                    label = 'Mauvaise';
                                                }
                                                else if (gpsAccuracy > 5) {
                                                    color = 'text-[#FFB547]';
                                                    bgColor = 'bg-[#1A1A25]';
                                                    label = 'Acceptable';
                                                }
                                                return (_jsx("div", { className: `rounded-[8px] px-2 py-1 ${bgColor} border border-[#1F1F2E]`, children: _jsxs("p", { className: `font-medium text-xs ${color}`, children: [gpsAccuracy.toFixed(1), " m - ", label] }) }));
                                            })() })] }) })] }), maintenanceInfo.nextDate && (_jsxs(Card, { className: `bg-[#12121A] border ${maintenanceInfo.isOverdue ? 'border-[#FF4D6A]' : 'border-[#1F1F2E]'}`, children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", children: "Maintenance" }), maintenanceInfo.isOverdue && (_jsxs(Badge, { variant: "destructive", className: "bg-[#FF4D6A] text-white gap-1", children: [_jsx(AlertTriangle, { size: 12 }), "En retard"] }))] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-3", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Type" }), _jsx("p", { className: "font-medium text-[#F0F0F5]", children: maintenanceInfo.type })] }), _jsxs("div", { className: `rounded-[8px] p-3 border ${maintenanceInfo.isOverdue ? 'bg-[#1A0A0A] border-[#FF4D6A]' : 'bg-[#1A1A25] border-[#1F1F2E]'}`, children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Prochaine date" }), _jsx("p", { className: `font-mono text-sm ${maintenanceInfo.isOverdue ? 'text-[#FF4D6A]' : 'text-[#00E5CC]'}`, children: maintenanceInfo.nextDate?.toLocaleDateString('fr-FR') })] }), maintenanceInfo.nextKm && (_jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-3", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Prochain kilom\u00E9trage" }), _jsxs("p", { className: "font-mono text-[#00E5CC]", children: [maintenanceInfo.nextKm.toLocaleString('fr-FR'), " km"] })] })), maintenanceInfo.lastDate && (_jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-3", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Derni\u00E8re date" }), _jsx("p", { className: "font-mono text-[#6B6B80]", children: maintenanceInfo.lastDate?.toLocaleDateString('fr-FR') })] }))] }) })] })), positions.length > 0 && (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", title: "Derni\u00E8res positions enregistr\u00E9es du v\u00E9hicule", children: "Historique GPS" }), _jsx(CardDescription, { className: "text-xs text-[#6B6B80]", children: "Derni\u00E8res positions enregistr\u00E9es" })] }), _jsx(CardContent, { children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-[#1F1F2E] text-left text-xs text-[#6B6B80]", children: [_jsx("th", { className: "pb-2 pr-4", children: "Date" }), _jsx("th", { className: "pb-2 pr-4", children: "Vitesse" }), _jsx("th", { className: "pb-2 pr-4", children: "Cap" }), _jsx("th", { className: "pb-2", children: "Position" })] }) }), _jsx("tbody", { className: "divide-y divide-[#1F1F2E]", children: positions.slice(0, 15).map((pos, idx) => (_jsxs("tr", { className: "text-xs text-[#F0F0F5]", children: [_jsx("td", { className: "py-2 pr-4 text-[#6B6B80]", children: pos.createdAt ? formatDateTime(pos.createdAt) : formatDateTime(pos.timestamp) }), _jsxs("td", { className: "py-2 pr-4 font-mono font-semibold", children: [(pos.speed || 0).toFixed(0), " km/h"] }), _jsxs("td", { className: "py-2 pr-4 text-[#6B6B80]", children: [(pos.heading || 0).toFixed(0), "\u00B0"] }), _jsxs("td", { className: "py-2 font-mono text-[#00E5CC]", children: [pos.lat?.toFixed(5), ", ", pos.lng?.toFixed(5)] })] }, idx))) })] }) }) })] })), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", title: "Galerie de photos du v\u00E9hicule", children: "Images du v\u00E9hicule" }) }), _jsx(CardContent, { children: photos.length === 0 ? (_jsxs("div", { className: "border-2 border-dashed border-[#1F1F2E] rounded-lg p-8 text-center hover:border-[#2A2A3D] transition", children: [_jsx(Camera, { size: 32, className: "mx-auto text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-sm text-[#6B6B80] mb-4", children: "Aucune image. Glissez-d\u00E9posez ou cliquez pour ajouter." }), _jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoUpload, className: "hidden", id: "photo-input" }), _jsxs(Button, { className: "bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", size: "sm", onClick: () => document.getElementById('photo-input')?.click(), children: [_jsx(Plus, { size: 14, className: "mr-1" }), "Ajouter une image"] })] })) : (_jsxs("div", { children: [_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4", children: photos.map(photo => (_jsxs("div", { className: "relative group border border-[#1F1F2E] rounded-lg overflow-hidden bg-[#1A1A25]", children: [_jsx("img", { src: photo.data, alt: photo.name, className: "w-full h-32 object-cover" }), _jsx("button", { onClick: () => deletePhoto(photo.id), className: "absolute top-2 right-2 bg-[#FF4D6A] text-white p-1 rounded opacity-0 group-hover:opacity-100 transition", children: _jsx(X, { size: 14 }) }), _jsx("p", { className: "text-xs text-[#6B6B80] p-2 truncate", children: photo.name })] }, photo.id))) }), _jsx("input", { type: "file", accept: "image/*", onChange: handlePhotoUpload, className: "hidden", id: "photo-input-add" }), _jsxs(Button, { className: "gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", size: "sm", onClick: () => document.getElementById('photo-input-add')?.click(), children: [_jsx(Plus, { size: 14 }), "Ajouter une image"] })] })) })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", title: "Notes et annotations sur ce v\u00E9hicule", children: "Notes" }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Textarea, { placeholder: "Ajouter des notes et informations sur ce v\u00E9hicule...", value: vehicleNotes, onChange: (e) => setVehicleNotes(e.target.value), className: "min-h-24 text-sm bg-[#1A1A25] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC]" }), _jsx(Button, { className: "bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]", size: "sm", onClick: saveNotes, disabled: notesLoading, children: notesLoading ? 'Enregistrement...' : 'Enregistrer' })] })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsxs(CardHeader, { className: "pb-3 flex items-center justify-between", children: [_jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", title: "Champs suppl\u00E9mentaires personnalis\u00E9s pour ce v\u00E9hicule", children: "Champs personnalis\u00E9s" }), _jsxs(Button, { className: "gap-2 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", size: "sm", onClick: () => setShowAddField(!showAddField), children: [_jsx(Plus, { size: 14 }), "Ajouter un champ"] })] }), _jsxs(CardContent, { className: "space-y-3", children: [showAddField && (_jsxs("div", { className: "border border-[#1F1F2E] rounded-lg p-3 space-y-2 bg-[#1A1A25]", children: [_jsx("input", { type: "text", placeholder: "Nom du champ", value: newFieldForm.key, onChange: (e) => setNewFieldForm({ ...newFieldForm, key: e.target.value }), className: "w-full px-2 py-1.5 border border-[#1F1F2E] rounded text-sm bg-[#12121A] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC]" }), _jsx("input", { type: "text", placeholder: "Valeur", value: newFieldForm.value, onChange: (e) => setNewFieldForm({ ...newFieldForm, value: e.target.value }), className: "w-full px-2 py-1.5 border border-[#1F1F2E] rounded text-sm bg-[#12121A] text-[#F0F0F5] placeholder-[#44445A] focus:border-[#00E5CC]" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", className: "flex-1 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]", onClick: () => {
                                                            if (newFieldForm.key && newFieldForm.value) {
                                                                setCustomFields([...customFields, { key: newFieldForm.key, value: newFieldForm.value }]);
                                                                setNewFieldForm({ key: '', value: '' });
                                                                setShowAddField(false);
                                                            }
                                                        }, children: "Ajouter" }), _jsx(Button, { size: "sm", className: "flex-1 bg-[#12121A] border border-[#1F1F2E] text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]", onClick: () => setShowAddField(false), children: "Annuler" })] })] })), _jsx("div", { className: "space-y-2", children: customFields.length > 0 ? (customFields.map((field, idx) => (_jsxs("div", { className: "border border-[#1F1F2E] rounded-lg p-2.5 flex items-center justify-between text-sm bg-[#1A1A25]", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-[#F0F0F5]", children: field.key }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: field.value })] }), _jsx("button", { onClick: () => setCustomFields(customFields.filter((_, i) => i !== idx)), className: "text-[#6B6B80] hover:text-[#F0F0F5]", children: _jsx(X, { size: 16 }) })] }, idx)))) : (_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Aucun champ personnalis\u00E9" })) })] })] })] })), activeTab === 'trips' && (_jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsx(CardHeader, { className: "pb-3", children: _jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", children: "Filtre et export des trajets" }) }), _jsxs(CardContent, { className: "space-y-4", children: [exportError && (_jsxs("div", { className: "flex items-center gap-2 bg-[#1A0A0A] border border-[#FF4D6A] rounded-lg p-3", children: [_jsx(AlertCircle, { size: 16, className: "text-[#FF4D6A] flex-shrink-0" }), _jsx("p", { className: "text-sm text-[#F0F0F5]", children: exportError })] })), _jsxs("div", { className: "flex gap-4 items-end flex-wrap", children: [_jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-1", children: "\u00C0 partir du" }), _jsx("input", { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm bg-[#1A1A25] text-[#F0F0F5] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "flex-1 min-w-[200px]", children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5] mb-1", children: "Jusqu'au" }), _jsx("input", { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value), className: "w-full px-3 py-2 border border-[#1F1F2E] rounded-lg text-sm bg-[#1A1A25] text-[#F0F0F5] focus:border-[#00E5CC]" })] }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { className: "gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]", onClick: () => setExportMenuOpen(!exportMenuOpen), children: [_jsx(Download, { size: 14 }), "Exporter", _jsx(ChevronDown, { size: 14 })] }), exportMenuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-48 bg-[#12121A] border border-[#1F1F2E] rounded-lg shadow-lg z-10", children: [_jsx("button", { onClick: exportToCSV, className: "w-full text-left px-4 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]", children: "CSV" }), _jsx("button", { onClick: exportToKML, className: "w-full text-left px-4 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]", children: "KML (Google Earth)" }), _jsx("button", { onClick: exportToGPX, className: "w-full text-left px-4 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A25] border-b border-[#1F1F2E]", children: "GPX" }), _jsx("button", { onClick: exportToXLSX, className: "w-full text-left px-4 py-2.5 text-sm text-[#F0F0F5] hover:bg-[#1A1A25]", children: "Excel (FR)" })] }))] })] })] })] }), _jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsxs(CardHeader, { className: "pb-3", children: [_jsxs(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", children: ["Trajets (", trips.length, ")"] }), _jsx(CardDescription, { className: "text-[#6B6B80]", children: tripsLoading ? 'Chargement...' : `${trips.length} trajet(s) trouvé(s)` })] }), _jsx(CardContent, { children: tripsLoading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-20" }), _jsx(Skeleton, { className: "h-20" }), _jsx(Skeleton, { className: "h-20" })] })) : trips.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Route, { size: 32, className: "mx-auto text-[#6B6B80] mb-2" }), _jsx("p", { className: "text-[#6B6B80]", children: "Aucun trajet trouv\u00E9 pour cette p\u00E9riode" })] })) : (_jsx("div", { className: "space-y-3", children: trips.map((trip, idx) => (_jsxs("div", { className: "border border-[#1F1F2E] rounded-[12px] p-4 hover:bg-[#1A1A25] hover:border-[#2A2A3D] transition", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4 mb-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "D\u00E9part" }), _jsx("p", { className: "font-syne font-medium text-sm text-[#F0F0F5]", children: trip.startAddress || `${trip.startLat.toFixed(4)}, ${trip.startLng.toFixed(4)}` }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: formatDateTime(trip.startTime) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Arriv\u00E9e" }), _jsx("p", { className: "font-syne font-medium text-sm text-[#F0F0F5]", children: trip.endAddress || `${trip.endLat.toFixed(4)}, ${trip.endLng.toFixed(4)}` }), _jsx("p", { className: "text-xs text-[#6B6B80]", children: formatDateTime(trip.endTime) })] })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm", children: [_jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Dur\u00E9e" }), _jsx("p", { className: "font-mono font-semibold text-[#00E5CC]", children: formatDuration(trip.duration) })] }), _jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Distance" }), _jsxs("p", { className: "font-mono font-semibold text-[#00E5CC]", children: [trip.distance.toFixed(1), " km"] })] }), _jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Vitesse moy." }), _jsxs("p", { className: "font-mono font-semibold text-[#00E5CC]", children: [trip.averageSpeed.toFixed(0), " km/h"] })] }), _jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2 text-center", children: [_jsx("p", { className: "text-xs text-[#6B6B80] mb-1", children: "Vitesse max" }), _jsxs("p", { className: "font-mono font-semibold text-[#00E5CC]", children: [trip.maxSpeed.toFixed(0), " km/h"] })] })] }), _jsxs(Button, { className: "w-full gap-2 bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00D9BB]", size: "sm", onClick: () => setReplayingTrip(trip), children: [_jsx(Play, { size: 14 }), "Rejouer ce trajet"] })] }, idx))) })) })] }), replayingTrip && (_jsxs(Card, { className: "bg-[#12121A] border border-[#1F1F2E]", children: [_jsxs(CardHeader, { className: "pb-3 flex items-center justify-between", children: [_jsx(CardTitle, { className: "font-syne text-base text-[#F0F0F5]", children: "Affichage du trajet" }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-[#6B6B80] hover:text-[#F0F0F5]", onClick: () => setReplayingTrip(null), children: _jsx(X, { size: 18 }) })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "h-96 rounded-lg overflow-hidden mb-4 border border-[#1F1F2E]", children: _jsxs(MapContainer, { center: [replayingTrip.startLat, replayingTrip.startLng], zoom: 14, className: "h-full w-full", zoomControl: false, children: [_jsx(TileLayer, { url: MAPBOX_TILE_URL('streets-v12'), tileSize: 512, zoomOffset: -1 }), _jsx(Marker, { position: [replayingTrip.startLat, replayingTrip.startLng], children: _jsxs(Popup, { children: [_jsx("strong", { children: "D\u00E9part" }), _jsx("br", {}), formatDateTime(replayingTrip.startTime)] }) }), _jsx(Marker, { position: [replayingTrip.endLat, replayingTrip.endLng], children: _jsxs(Popup, { children: [_jsx("strong", { children: "Arriv\u00E9e" }), _jsx("br", {}), formatDateTime(replayingTrip.endTime)] }) }), replayingTrip.points && replayingTrip.points.map((pt, idx) => (_jsx(CircleMarker, { center: [pt.lat, pt.lng], radius: 2, pathOptions: {
                                                        color: '#00E5CC',
                                                        fillColor: '#00E5CC',
                                                        fillOpacity: 0.6 - (idx / replayingTrip.points.length) * 0.5,
                                                        weight: 1,
                                                    } }, idx)))] }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Dur\u00E9e" }), _jsx("p", { className: "font-mono font-semibold text-[#F0F0F5]", children: formatDuration(replayingTrip.duration) })] }), _jsxs("div", { className: "bg-[#1A1A25] border border-[#1F1F2E] rounded-[8px] p-2", children: [_jsx("p", { className: "text-xs text-[#6B6B80]", children: "Distance" }), _jsxs("p", { className: "font-mono font-semibold text-[#F0F0F5]", children: [replayingTrip.distance.toFixed(1), " km"] })] })] })] })] }))] }))] }));
}
//# sourceMappingURL=VehicleDetailPage.js.map