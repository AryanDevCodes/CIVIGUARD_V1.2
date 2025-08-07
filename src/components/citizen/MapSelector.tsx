
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import GoogleMapSelector from './GoogleMapSelector';

interface MapSelectorProps {
  onLocationSelect: (location: string, coordinates: { lat: number; lng: number }) => void;
  initialCoordinates?: { lat: number; lng: number };
  provider?: 'mapbox' | 'google';
}

// Use Mapbox token from environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';


const MapSelector: React.FC<MapSelectorProps> = ({ onLocationSelect, initialCoordinates, provider = 'mapbox' }) => {
  if (provider === 'google') {
    return <GoogleMapSelector onLocationSelect={onLocationSelect} initialCoordinates={initialCoordinates} />;
  }

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default to Los Angeles if no coordinates provided
  const defaultCoordinates = { lat: 34.0522, lng: -118.2437 };
  const [coordinates, setCoordinates] = useState(initialCoordinates || defaultCoordinates);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coordinates.lng, coordinates.lat],
      zoom: 12
    });

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add marker on initial load
      marker.current = new mapboxgl.Marker({
        draggable: true,
        color: '#3b82f6'
      })
        .setLngLat([coordinates.lng, coordinates.lat])
        .addTo(map.current!);
      
      // Update coordinates when marker is dragged
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        setCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
        getAddressFromCoordinates(lngLat.lat, lngLat.lng);
      });
      
      // Add click event to place marker
      map.current!.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current!.setLngLat([lng, lat]);
        setCoordinates({ lat, lng });
        getAddressFromCoordinates(lat, lng);
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCoordinates({ lat, lng });
        
        if (map.current && marker.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 15 });
          marker.current.setLngLat([lng, lat]);
        }
        
        getAddressFromCoordinates(lat, lng);
        setLoading(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to retrieve your location");
        setLoading(false);
      }
    );
  };

  // Get address from coordinates using Mapbox Geocoding API
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address`
      );
      
      if (!response.ok) throw new Error('Geocoding request failed');
      
      const data = await response.json();
      let address = 'Unknown location';
      
      if (data.features && data.features.length > 0) {
        address = data.features[0].place_name;
      }
      
      onLocationSelect(address, { lat, lng });
    } catch (error) {
      console.error('Error fetching address:', error);
      onLocationSelect(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
    }
  };

  return (
    <div className="space-y-4">
      <div 
        ref={mapContainer} 
        className="w-full h-[300px] rounded-md border border-border overflow-hidden"
      />
      
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <Button 
          type="button" 
          variant="outline" 
          className="w-full sm:w-auto flex items-center gap-2"
          onClick={getUserLocation}
          disabled={loading || !mapLoaded}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          Use My Current Location
        </Button>
        
        <div className="text-sm text-muted-foreground w-full sm:w-auto truncate">
          {coordinates && `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`}
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
