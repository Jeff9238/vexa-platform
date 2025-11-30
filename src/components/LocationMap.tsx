'use client'

import { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { ShoppingBag, Utensils, Coffee, School, Loader2, MapPin, ExternalLink } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '1rem'
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

export default function LocationMap({ lat, lng }: { lat: number, lng: number }) {
  const [places, setPlaces] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const center = { lat, lng };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!,
    libraries: LIBRARIES
  });

  useEffect(() => {
    if (!isLoaded || !window.google) return;

    try {
        const mapDiv = document.createElement('div');
        const service = new google.maps.places.PlacesService(mapDiv);
        
        const request = {
          location: center,
          radius: 2000, // 2km radius
          type: 'point_of_interest'
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const relevant = results.filter(p => 
                p.types?.includes('shopping_mall') || 
                p.types?.includes('restaurant') || 
                p.types?.includes('cafe') ||
                p.types?.includes('school') ||
                p.types?.includes('hospital')
            ).slice(0, 6); 
            setPlaces(relevant);
          }
        });
    } catch (error) {
        console.error("Maps Error:", error);
    }
  }, [isLoaded, lat, lng]);

  if (!isLoaded) return <div className="h-[400px] bg-neutral-900 rounded-2xl flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading Location...</div>;

  return (
    <div className="space-y-6">
        {/* MAP */}
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={14}
            options={{ styles: DARK_MAP_STYLE, disableDefaultUI: true, streetViewControl: false }}
        >
            {/* Main Listing Pin (Red) */}
            <Marker position={center} />

            {/* Nearby Places Pins (Small Blue) */}
            {places.map((place) => (
                <Marker 
                    key={place.place_id}
                    position={place.geometry.location}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 5,
                        fillColor: "#3b82f6", // Blue
                        fillOpacity: 1,
                        strokeColor: "#ffffff",
                        strokeWeight: 1,
                    }}
                    onClick={() => setSelectedPlace(place)}
                />
            ))}

            {/* Popup when clicking a small pin */}
            {selectedPlace && (
                <InfoWindow
                    position={selectedPlace.geometry.location}
                    onCloseClick={() => setSelectedPlace(null)}
                >
                    <div className="text-black p-1">
                        <h4 className="font-bold text-sm">{selectedPlace.name}</h4>
                        <p className="text-xs">{selectedPlace.vicinity}</p>
                    </div>
                </InfoWindow>
            )}
        </GoogleMap>

        {/* INTERACTIVE LIST */}
        <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-widest flex justify-between items-center">
                <span>What's Nearby (2km)</span>
                <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-1 rounded">Click for Directions</span>
            </h4>
            <div className="grid gap-3">
                {places.map((place) => (
                    <a 
                        key={place.place_id}
                        href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between bg-neutral-900 p-3 rounded-xl border border-white/5 hover:border-blue-500/50 hover:bg-white/5 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {place.types?.includes('restaurant') ? <Utensils size={16}/> : 
                                 place.types?.includes('cafe') ? <Coffee size={16}/> :
                                 place.types?.includes('school') ? <School size={16}/> : 
                                 <ShoppingBag size={16}/>}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">{place.name}</p>
                                <p className="text-xs text-gray-500 truncate">{place.vicinity}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                             {place.rating && <span className="text-xs font-bold text-green-400 whitespace-nowrap">{place.rating} ★</span>}
                             <ExternalLink size={14} className="text-gray-600 group-hover:text-white"/>
                        </div>
                    </a>
                ))}
                {places.length === 0 && <p className="text-gray-500 text-sm italic">Searching nearby spots...</p>}
            </div>
        </div>
    </div>
  );
}