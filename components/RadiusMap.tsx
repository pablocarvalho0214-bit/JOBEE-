import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadiusMapProps {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
    className?: string;
    onLocationChange?: (lat: number, lng: number, address: string) => void;
}

export const RadiusMap: React.FC<RadiusMapProps> = ({
    latitude,
    longitude,
    radius,
    className = '',
    onLocationChange
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const circlesRef = useRef<L.Circle[]>([]);
    const markerRef = useRef<L.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reverse geocoding function
    const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();

            // Extract city and state
            const city = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
            const state = data.address.state || '';

            return city && state ? `${city} / ${state}` : data.display_name;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return '';
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize map only once
        if (!mapRef.current) {
            // Fix for default marker icon
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });

            const map = L.map(containerRef.current, {
                zoomControl: false,
                attributionControl: false,
            }).setView([latitude, longitude], 11);

            // Add tile layer (OpenStreetMap) with a darker style if possible, 
            // but OSM doesn't have a built-in dark mode. We can use a filter via CSS.
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
            }).addTo(map);

            mapRef.current = map;

            // Add custom draggable marker
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="position: relative; cursor: move;">
                        <div style="width: 24px; height: 24px; background: #FFC700; border: 4px solid #0B0F1A; border-radius: 50%; box-shadow: 0 0 20px rgba(255, 199, 0, 0.4);"></div>
                        <div style="position: absolute; top: 0; left: 0; width: 24px; height: 24px; background: #FFC700; border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.6;"></div>
                    </div>
                `,
                iconSize: [24, 24],
                iconAnchor: [12, 12],
            });

            markerRef.current = L.marker([latitude, longitude], {
                icon: customIcon,
                draggable: true // Make marker draggable
            }).addTo(map);

            // Add concentric circles
            const opacities = [0.15, 0.08, 0.04];
            const scales = [1, 0.66, 0.33];

            circlesRef.current = scales.map((scale, i) => {
                return L.circle([latitude, longitude], {
                    color: '#FFC700',
                    fillColor: '#FFC700',
                    fillOpacity: opacities[i],
                    weight: i === 0 ? 2 : 1,
                    dashArray: i === 0 ? undefined : '5, 5',
                    radius: radius * 1000 * scale,
                }).addTo(map);
            });

            // Handle marker drag
            markerRef.current.on('dragend', async (event) => {
                const marker = event.target;
                const position = marker.getLatLng();

                // Update circles position
                circlesRef.current.forEach(circle => circle.setLatLng(position));

                // Get address and notify parent
                if (onLocationChange) {
                    const address = await reverseGeocode(position.lat, position.lng);
                    onLocationChange(position.lat, position.lng, address);
                }
            });

            // Add click handler to map to move marker
            map.on('click', async (e) => {
                if (markerRef.current && circlesRef.current.length > 0) {
                    markerRef.current.setLatLng(e.latlng);
                    circlesRef.current.forEach(circle => circle.setLatLng(e.latlng));

                    if (onLocationChange) {
                        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
                        onLocationChange(e.latlng.lat, e.latlng.lng, address);
                    }
                }
            });
        }

        return () => {
            // Cleanup on unmount
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                circlesRef.current = [];
            }
        };
    }, []);

    // Update circle radius when it changes
    useEffect(() => {
        if (circlesRef.current.length > 0 && mapRef.current) {
            const scales = [1, 0.66, 0.33];
            circlesRef.current.forEach((circle, i) => {
                circle.setRadius(radius * 1000 * scales[i]);
            });

            // Get the main circle (the largest one)
            const mainCircle = circlesRef.current[0];

            // Use fitBounds to ensure the entire circle is visible
            // We add a small padding to prevent edges from touching the container
            mapRef.current.fitBounds(mainCircle.getBounds(), {
                padding: [20, 20],
                animate: true
            });
        }
    }, [radius]);

    // Update marker and circle position when lat/lng changes externally
    useEffect(() => {
        if (markerRef.current && circlesRef.current.length > 0 && mapRef.current) {
            const newLatLng = L.latLng(latitude, longitude);
            markerRef.current.setLatLng(newLatLng);
            circlesRef.current.forEach(circle => circle.setLatLng(newLatLng));
            mapRef.current.setView(newLatLng, mapRef.current.getZoom(), { animate: true });
        }
    }, [latitude, longitude]);


    return (
        <>
            <style>{`
                @keyframes ping {
                    75%, 100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }
                .leaflet-container {
                    cursor: crosshair;
                }
                .leaflet-marker-draggable {
                    cursor: move !important;
                }
            `}</style>
            <div ref={containerRef} className={className} />
        </>
    );
};
