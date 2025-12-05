'use client'

import { useEffect, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { ShoppingBag, Utensils, Coffee, School, Loader2, MapPin, ExternalLink, Trees, Dumbbell } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%',
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
        
        // Added 'park' and 'gym' to request
        const request = {
          location: center,
          radius: 1500, // 1.5km
          type: 'point_of_interest' // General fallback, we filter below
        };

        service.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Priority Filter
            const priorityTypes = ['shopping_mall', 'restaurant', 'cafe', 'school', 'park', 'gym', 'hospital'];
            const relevant = results
                .filter(p => p.types?.some(t => priorityTypes.includes(t)))
                .slice(0, 5); 
            setPlaces(relevant);
          }
        });
    } catch (error) {
        console.error("Maps Error:", error);
    }
  }, [isLoaded, lat, lng]);

  if (!isLoaded) return <div className="h-full bg-neutral-900 rounded-2xl flex items-center justify-center text-gray-500"><Loader2 className="animate-spin mr-2"/> Loading Map...</div>;

  return (
    <div className="flex flex-col h-full gap-6">
        {/* MAP CONTAINER */}
        <div className="h-[350px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={15}
                options={{ styles: DARK_MAP_STYLE, disableDefaultUI: true }}
            >
                <Marker position={center} />
                {places.map((place) => (
                    <Marker 
                        key={place.place_id}
                        position={place.geometry.location}
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 6,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        }}
                        onClick={() => setSelectedPlace(place)}
                    />
                ))}
                {selectedPlace && (
                    <InfoWindow position={selectedPlace.geometry.location} onCloseClick={() => setSelectedPlace(null)}>
                        <div className="text-black p-1 max-w-[150px]">
                            <h4 className="font-bold text-xs">{selectedPlace.name}</h4>
                            <p className="text-[10px] line-clamp-2">{selectedPlace.vicinity}</p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>

        {/* NEARBY LIST */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin size={12}/> What's Nearby (1.5km)
            </h4>
            <div className="space-y-3">
                {places.map((place) => (
                    <div key={place.place_id} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-neutral-800 rounded-lg text-blue-400 border border-white/5">
                                {place.types?.includes('park') ? <Trees size={14}/> :
                                 place.types?.includes('restaurant') ? <Utensils size={14}/> : 
                                 place.types?.includes('cafe') ? <Coffee size={14}/> :
                                 place.types?.includes('school') ? <School size={14}/> : 
                                 place.types?.includes('gym') ? <Dumbbell size={14}/> :
                                 <ShoppingBag size={14}/>}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{place.name}</p>
                                <p className="text-[10px] text-gray-500 truncate">{place.vicinity}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-green-500 bg-green-900/20 px-2 py-1 rounded border border-green-900/50">
                            {place.rating ? place.rating + " ★" : "Nearby"}
                        </span>
                    </div>
                ))}
                {places.length === 0 && <p className="text-gray-600 text-xs italic">Searching for amenities...</p>}
            </div>
        </div>
    </div>
  );
}