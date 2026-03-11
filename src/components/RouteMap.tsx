import { useEffect, useRef } from 'react';
import L from 'leaflet';
import polylineDecode from '@mapbox/polyline';

// Fix Leaflet's default icon URLs broken by Vite's asset pipeline
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface RouteMapProps {
  polyline: string;
  className?: string;
}

export function RouteMap({ polyline, className = '' }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const coords = polylineDecode.decode(polyline); // [[lat, lng], ...]

    if (coords.length === 0) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const latLngs = coords.map(([lat, lng]) => L.latLng(lat, lng));
    const route = L.polyline(latLngs, { color: '#f97316', weight: 3, opacity: 0.9 }).addTo(map);

    // Start and end markers
    L.circleMarker(latLngs[0], {
      radius: 6, fillColor: '#22c55e', color: '#fff', weight: 2, fillOpacity: 1,
    }).addTo(map);
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 6, fillColor: '#ef4444', color: '#fff', weight: 2, fillOpacity: 1,
    }).addTo(map);

    map.fitBounds(route.getBounds(), { padding: [12, 12] });

    // Recalculate tile layout after the modal finishes rendering
    setTimeout(() => map.invalidateSize(), 0);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [polyline]);

  return <div ref={containerRef} className={`w-full h-full ${className}`} />;
}
