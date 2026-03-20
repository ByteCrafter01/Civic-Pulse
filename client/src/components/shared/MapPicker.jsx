import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

function ClickHandler({ onLocationChange }) {
    useMapEvents({
        click(e) {
            onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function MapPicker({ position, onLocationChange }) {
    const [address, setAddress] = useState('');
    const markerRef = useRef(null);

    // Reverse geocode on position change
    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&zoom=16`
                );
                const data = await res.json();
                setAddress(data.display_name || '');
            } catch {
                setAddress('');
            }
        };
        if (position.lat && position.lng) {
            fetchAddress();
        }
    }, [position.lat, position.lng]);

    const handleUseMyLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    onLocationChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {},
                { enableHighAccuracy: true }
            );
        }
    };

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker) {
            const latlng = marker.getLatLng();
            onLocationChange({ lat: latlng.lat, lng: latlng.lng });
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Lat: {position.lat.toFixed(4)} | Lng: {position.lng.toFixed(4)}
                </span>
                <button
                    type="button"
                    onClick={handleUseMyLocation}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                >
                    Use my location
                </button>
            </div>
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600" style={{ height: 260 }}>
                <MapContainer
                    center={[position.lat, position.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                        position={[position.lat, position.lng]}
                        draggable={true}
                        ref={markerRef}
                        eventHandlers={{ dragend: handleDragEnd }}
                    />
                    <ClickHandler onLocationChange={onLocationChange} />
                </MapContainer>
            </div>
            {address && (
                <p className="text-xs text-slate-400 truncate" title={address}>{address}</p>
            )}
        </div>
    );
}
