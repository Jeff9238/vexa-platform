'use client'

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Loader2, Search } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '350px',
  borderRadius: '1rem'
};

// Default center (Kuala Lumpur)
const defaultCenter = {
  lat: 3.140853,
  lng: 101.693207
};

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
];

const LIBRARIES: ("places")[] = ["places"];

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
  searchQuery?: string; // <--- NEW: The text from the Area/State inputs
}

export default function MapPicker({ onLocationSelect, initialLat, initialLng, searchQuery }: MapPickerProps) {
  const [marker, setMarker] = useState<{lat: number, lng: number} | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [finding, setFinding] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries: LIBRARIES
  });

  // Load initial marker if provided (For Edit Page)
  useEffect(() => {
    if (initialLat && initialLng) {
      setMarker({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarker({ lat, lng });
      onLocationSelect(lat, lng);
    }
  }, [onLocationSelect]);

  // NEW: Function to find location from text
  const findFromText = () => {
    if (!searchQuery || !window.google) return;
    setFinding(true);
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
        setFinding(false);
        if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();
            
            // Update Map & Marker
            setMarker({ lat, lng });
            onLocationSelect(lat, lng);
            mapRef?.panTo({ lat, lng });
            mapRef?.setZoom(15);
        } else {
            alert("Location not found. Please try dragging the pin manually.");
        }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
          <label className="text-xs text-neutral-500 uppercase font-bold tracking-widest">Pin Exact Location</label>
          
          {/* NEW: Search Button */}
          {searchQuery && searchQuery.length > 3 && (
              <button 
                type="button"
                onClick={findFromText}
                disabled={!isLoaded || finding}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all"
              >
                {finding ? <Loader2 size={12} className="animate-spin"/> : <Search size={12}/>}
                Find "{searchQuery}" on Map
              </button>
          )}

          {marker ? (
              <span className="text-xs text-green-400 flex items-center gap-1 font-bold"><MapPin size={12}/> Coordinates Set</span>
          ) : (
              <span className="text-xs text-red-400">Click map to set</span>
          )}
      </div>
      
      <div className="border border-neutral-800 rounded-2xl overflow-hidden shadow-inner bg-neutral-900 h-[350px] flex items-center justify-center relative">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={marker || defaultCenter}
            zoom={marker ? 15 : 10}
            onClick={onMapClick}
            onLoad={map => setMapRef(map)}
            options={{ styles: DARK_MAP_STYLE, disableDefaultUI: false, streetViewControl: false }}
          >
            {marker && <Marker position={marker} />}
          </GoogleMap>
        ) : (
          <div className="text-gray-500 flex gap-2"><Loader2 className="animate-spin"/> Loading Map...</div>
        )}
      </div>
    </div>
  );
}