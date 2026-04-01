import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { GeofenceShape } from '@/types/geofence';
interface GeofenceDrawMapProps {
    initialShape?: GeofenceShape;
    onShapeChange: (shape: GeofenceShape | null) => void;
    center?: [number, number];
    zoom?: number;
}
export default function GeofenceDrawMap({ initialShape, onShapeChange, center, zoom, }: GeofenceDrawMapProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=GeofenceDrawMap.d.ts.map