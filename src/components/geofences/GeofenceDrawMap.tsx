import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'
import { GeofenceShape, Coordinates } from '@/types/geofence'

interface GeofenceDrawMapProps {
  initialShape?: GeofenceShape
  onShapeChange: (shape: GeofenceShape | null) => void
  center?: [number, number]
  zoom?: number
}

export default function GeofenceDrawMap({
  initialShape,
  onShapeChange,
  center = [43.7, 7.12],
  zoom = 12,
}: GeofenceDrawMapProps) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup())
  const drawControlRef = useRef<L.Control.Draw | null>(null)

  const extractShape = useCallback((layer: L.Layer): GeofenceShape | null => {
    if (layer instanceof L.Circle) {
      const latlng = layer.getLatLng()
      return {
        type: 'circle',
        center: { lat: latlng.lat, lng: latlng.lng },
        radiusMeters: Math.round(layer.getRadius()),
      }
    } else if (layer instanceof L.Polygon) {
      const latlngs = (layer.getLatLngs()[0] as L.LatLng[])
      const points: Coordinates[] = latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }))
      return {
        type: 'polygon',
        points,
      }
    }
    return null
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current).setView(center, zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const drawnItems = drawnItemsRef.current
    map.addLayer(drawnItems)

    // Add existing shape if editing
    if (initialShape) {
      let layer: L.Layer | null = null
      if (initialShape.type === 'circle') {
        layer = L.circle([initialShape.center.lat, initialShape.center.lng], {
          radius: initialShape.radiusMeters,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
        })
        map.setView([initialShape.center.lat, initialShape.center.lng], 14)
      } else if (initialShape.type === 'polygon') {
        const latlngs = initialShape.points.map((p) => [p.lat, p.lng] as [number, number])
        layer = L.polygon(latlngs, {
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
        })
        map.fitBounds((layer as L.Polygon).getBounds().pad(0.2))
      }
      if (layer) {
        drawnItems.addLayer(layer)
      }
    }

    // Draw controls
    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: false,
        marker: false,
        circlemarker: false,
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          },
        },
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          },
        },
        circle: {
          shapeOptions: {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          },
          showRadius: true,
          metric: true,
        },
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    })

    drawControlRef.current = drawControl
    map.addControl(drawControl)

    // Handle draw created
    map.on(L.Draw.Event.CREATED, (e: any) => {
      // Clear previous shapes — only one geofence at a time
      drawnItems.clearLayers()
      const layer = e.layer
      drawnItems.addLayer(layer)
      const shape = extractShape(layer)
      onShapeChange(shape)
    })

    // Handle edit
    map.on(L.Draw.Event.EDITED, (e: any) => {
      const layers = e.layers
      layers.eachLayer((layer: L.Layer) => {
        const shape = extractShape(layer)
        onShapeChange(shape)
      })
    })

    // Handle delete
    map.on(L.Draw.Event.DELETED, () => {
      if (drawnItems.getLayers().length === 0) {
        onShapeChange(null)
      }
    })

    // Invalidate size after render
    setTimeout(() => map.invalidateSize(), 100)

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Use the drawing tools (top-right) to create a circle, polygon, or rectangle on the map.
      </p>
      <div
        ref={containerRef}
        className="h-[350px] w-full rounded-lg border border-gray-300"
        style={{ zIndex: 0 }}
      />
    </div>
  )
}
