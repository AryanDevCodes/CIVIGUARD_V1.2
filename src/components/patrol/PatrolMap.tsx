// src/components/patrol/PatrolMap.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript } from '@react-google-maps/api';
import { Officer, Incident, PatrolVehicle } from '@/types/patrol';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '10px',
};

const defaultCenter = {
  lat: 28.6139, // Default to Delhi
  lng: 77.2090,
};

interface PatrolMapProps {
  officers?: Officer[];
  incidents?: Incident[];
  patrolVehicles?: PatrolVehicle[];
  selectedOfficer?: Officer | null;
  selectedIncident?: Incident | null;
  selectedVehicle?: PatrolVehicle | null;
  onOfficerSelect?: (officer: Officer | null) => void;
  onIncidentSelect?: (incident: Incident | null) => void;
  onVehicleSelect?: (vehicle: PatrolVehicle | null) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  className?: string;
}

const PatrolMap: React.FC<PatrolMapProps> = ({
  officers = [],
  incidents = [],
  patrolVehicles = [],
  selectedOfficer = null,
  selectedIncident = null,
  selectedVehicle = null,
  onOfficerSelect,
  onIncidentSelect,
  onVehicleSelect,
  center = defaultCenter,
  zoom = 10,
  className = '',
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMarkerClick = useCallback((type: 'officer' | 'incident' | 'vehicle', id: string) => {
    setActiveInfoWindow(`${type}-${id}`);
  }, []);

  const handleInfoClose = useCallback(() => {
    setActiveInfoWindow(null);
  }, []);

  // Debug log to check incidents data
 // Inside PatrolMap component, add this effect
 React.useEffect(() => {
   console.log('PatrolMap - Incidents received:', incidents.length);
   incidents.forEach((incident, idx) => {
     console.log(`Incident ${idx + 1}:`, {
       id: incident.id,
       title: incident.title,
       location: incident.location,
       hasLatLng: {
         lat: incident.location?.lat,
         lng: incident.location?.lng
       }
     });
   });
 }, [incidents]);

  const renderMarkers = useCallback(() => {
    return (
      <>
        {officers.map((officer) => (
          <Marker
            key={`officer-${officer.id}`}
            position={{ lat: officer.latitude, lng: officer.longitude }}
            icon={{
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${officer.status === 'ON_DUTY' ? '#2e8aea' : '#9ca0ae'}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.08-6.32-2.82.2-.13.4-.26.6-.38h11.44c.18.62.38 1.24.6 1.82-1.61 1.74-3.82 2.82-6.32 2.82z"/></svg>`
              )}`,
              scaledSize: new window.google.maps.Size(32, 32),
              anchor: new window.google.maps.Point(16, 32),
            }}
            onClick={() => {
              handleMarkerClick('officer', officer.id);
              onOfficerSelect?.(officer);
            }}
          >
            {activeInfoWindow === `officer-${officer.id}` && (
              <InfoWindow onCloseClick={handleInfoClose}>
                <div className="p-2">
                  <h3 className="font-semibold">{officer.name}</h3>
                  <p className="text-sm">{officer.status}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        // In the renderMarkers function, update the incident marker part
        {incidents.map((incident) => {
          if (!incident?.location?.lat || !incident?.location?.lng) {
            console.warn('Skipping incident - missing coordinates:', incident.id, incident.title);
            return null;
          }
          
          console.log('Rendering incident marker:', incident.id, 'at', incident.location);
          
          return (
            <Marker
              key={`incident-${incident.id}`}
              position={{
                lat: Number(incident.location.lat),
                lng: Number(incident.location.lng),
              }}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e53e3e">
                    <path d="M12 2L2 22h20L12 2zm0 3l8 14H4l8-14z"/>
                  </svg>`
                )}`,
                scaledSize: new window.google.maps.Size(28, 28),
                anchor: new window.google.maps.Point(14, 28),
              }}
              onClick={() => handleMarkerClick('incident', incident.id)}
              zIndex={1000}
              animation={window.google.maps.Animation.DROP}
            />
          );
        })}

        {patrolVehicles.map((vehicle) => (
          <Marker
            key={`vehicle-${vehicle.id}`}
            position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
            icon={{
              path: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z',
              fillColor: vehicle.status === 'ACTIVE' ? '#2e8aea' : 
                         vehicle.status === 'MAINTENANCE' ? '#e53e3e' : 
                         vehicle.status === 'ASSIGNED' ? '#dd6b20' : '#9ca0ae',
              fillOpacity: 1,
              strokeWeight: 0,
              scale: 1,
              anchor: new window.google.maps.Point(12, 12),
              rotation: vehicle.heading || 0,
            }}
            onClick={() => {
              handleMarkerClick('vehicle', vehicle.id);
              onVehicleSelect?.(vehicle);
            }}
          >
            {activeInfoWindow === `vehicle-${vehicle.id}` && (
              <InfoWindow onCloseClick={handleInfoClose}>
                <div className="p-2">
                  <h3 className="font-semibold">Vehicle: {vehicle.licensePlate}</h3>
                  <p className="text-sm">Status: {vehicle.status}</p>
                  <p className="text-sm">Type: {vehicle.type}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}
      </>
    );
  }, [officers, incidents, patrolVehicles, activeInfoWindow, handleMarkerClick, handleInfoClose, onOfficerSelect, onIncidentSelect, onVehicleSelect]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps</div>;

  return (
    <div className={`w-full h-full ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {renderMarkers()}
      </GoogleMap>
    </div>
  );
};

export default PatrolMap;