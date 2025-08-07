import React, { useEffect, useRef, useState } from 'react';

interface MapSelectorProps {
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  provider?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const defaultCoordinates = { lat: 34.0522, lng: -118.2437 }; // Los Angeles

const MapSelector: React.FC<MapSelectorProps> = ({ onLocationSelect, initialCoordinates, provider = 'google' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [coordinates, setCoordinates] = useState(initialCoordinates || defaultCoordinates);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapLoaded || !window.google?.maps || provider !== 'google') {
      if (!window.google?.maps && !mapLoaded && provider === 'google') {
        setMapError('Google Maps API not loaded. Please check your API key and network connection.');
      }
      return;
    }

    let map: google.maps.Map | null = null;
    let marker: google.maps.Marker | null = null;
    let watchId: number | null = null;
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('Initializing map in MapSelector');
        const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
        const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
        const { PlacesService } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        const setMapAndMarker = (lat: number, lng: number) => {
          map = new Map(mapRef.current!, {
            center: { lat, lng },
            zoom: 12,
            mapTypeId: 'roadmap',
            mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          });
          setMapLoaded(true);

          marker = new Marker({
            position: { lat, lng },
            map,
            draggable: true,
          });

          marker.addListener('dragend', () => {
            const pos = marker!.getPosition();
            if (pos) {
              const lat = pos.lat();
              const lng = pos.lng();
              setCoordinates({ lat, lng });
              getAddressFromCoordinates(lat, lng);
            }
          });

          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              marker!.setPosition({ lat, lng });
              setCoordinates({ lat, lng });
              getAddressFromCoordinates(lat, lng);
            }
          });
        };

        if (navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (!isMounted) return;
              const { latitude, longitude } = pos.coords;
              setCoordinates({ lat: latitude, lng: longitude });
              if (!map) setMapAndMarker(latitude, longitude);
              else {
                map.setCenter({ lat: latitude, lng: longitude });
                marker!.setPosition({ lat: latitude, lng: longitude });
              }
            },
            () => {
              setMapAndMarker(coordinates.lat, coordinates.lng);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
        } else {
          setMapAndMarker(coordinates.lat, coordinates.lng);
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setMapError('Failed to initialize Google Maps');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (marker) marker.setMap(null);
      if (map) map = null;
    };
  }, [mapLoaded, coordinates, provider]);

  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results[0]) {
        onLocationSelect(data.results[0].formatted_address, { lat, lng });
      } else {
        onLocationSelect(`Lat: ${lat}, Lng: ${lng}`, { lat, lng });
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      onLocationSelect(`Lat: ${lat}, Lng: ${lng}`, { lat, lng });
    }
  };

  return (
    <div className="relative">
      {mapError && <p className="text-red-600 mb-2">{mapError}</p>}
      <div
        ref={mapRef}
        style={{ width: '100%', height: '400px', borderRadius: '12px', marginBottom: 16 }}
      />
      <div className="text-sm text-muted-foreground w-full sm:w-auto truncate">
        {coordinates && `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
      </div>
      {!mapLoaded && !mapError && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default MapSelector;