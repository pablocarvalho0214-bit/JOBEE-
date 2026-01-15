import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
// Ensure CSS is imported even if CDN fails
import 'leaflet/dist/leaflet.css';

interface RadarMapProps {
    lat: number;
    lng: number;
    radiusKm: number;
    onCenterChange: (lat: number, lng: number) => void;
}

export const RadarMap: React.FC<RadarMapProps> = ({ lat, lng, radiusKm, onCenterChange }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const circleRef = useRef<L.Circle | null>(null);

    // Initial Setup
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // Prevent double init

        // Default or Props
        const initialLat = lat || -23.5505;
        const initialLng = lng || -46.6333;

        // Create Map
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            center: [initialLat, initialLng],
            zoom: 10
        });

        // Add Dark Theme Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(map);

        // Add Radar Circle
        const circle = L.circle([initialLat, initialLng], {
            color: '#FACC15',
            fillColor: '#FACC15',
            fillOpacity: 0.15,
            weight: 1,
            dashArray: '4, 8',
            radius: radiusKm * 1000
        }).addTo(map);

        circleRef.current = circle;

        // Fit bounds initially
        map.fitBounds(circle.getBounds(), { padding: [20, 20] });

        // Event: Move End -> Update Sate
        map.on('moveend', () => {
            const center = map.getCenter();
            // Update the circle visual immediately to match center
            circle.setLatLng(center);
            // Notify parent
            onCenterChange(center.lat, center.lng);
        });

        // Event: Moving -> Keep circle centered visually
        map.on('move', () => {
            const center = map.getCenter();
            circle.setLatLng(center);
        });

        mapInstanceRef.current = map;

        // Cleanup
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // React to Props Change (Radius Only for Zoom/Size)
    useEffect(() => {
        if (!mapInstanceRef.current || !circleRef.current) return;
        const map = mapInstanceRef.current;
        const circle = circleRef.current;

        // Update Radius
        circle.setRadius(radiusKm * 1000);

        // Auto Zoom to fit new radius
        map.fitBounds(circle.getBounds(), { padding: [20, 20], animate: true });

    }, [radiusKm]);

    return (
        <div className="w-full h-64 rounded-3xl overflow-hidden relative z-0 border border-white/10 shadow-inner bg-[#0F1422]">
            {/* The Map Container */}
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Fixed Center Crosshair Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1000] flex flex-col items-center justify-center">
                <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_#FACC15] ring-2 ring-white/20"></div>
                <div className="absolute w-32 h-32 border border-primary/20 rounded-full animate-ping opacity-20"></div>
            </div>

            {/* Label overlay */}
            <div className="absolute bottom-2 left-2 z-[1000] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/5 pointer-events-none">
                <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Arraste o mapa</p>
            </div>
        </div>
    );
};
