import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { Officer, Incident, PatrolRoute, PatrolVehicle } from '@/types/patrol';
import { MapPin, User, AlertTriangle, Car, Route, Badge as BadgeIcon } from 'lucide-react';

type LatLng = {
  lat: number;
  lng: number;
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

interface MapRoute {
  id: string;
  coordinates: MapCoordinate[];
  name: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px'
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090 // Delhi coordinates
};

interface GoogleMapComponentProps {
  officers?: Officer[];
  incidents?: Incident[];
  patrolRoutes?: PatrolRoute[];
  patrolVehicles?: PatrolVehicle[];
  selectedOfficer?: Officer | null;
  selectedIncident?: Incident | null;
  selectedVehicle?: PatrolVehicle | null;
  onOfficerSelect?: (officer: Officer | null) => void;
  onIncidentSelect?: (incident: Incident | null) => void;
  onVehicleSelect?: (vehicle: PatrolVehicle | null) => void;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  className?: string;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  officers = [],
  incidents = [],
  patrolRoutes = [],
  patrolVehicles = [],
  selectedOfficer = null,
  selectedIncident = null,
  selectedVehicle = null,
  onOfficerSelect,
  onIncidentSelect,
  onVehicleSelect,
  center = defaultCenter,
  zoom = 12,
  className = ''
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places', 'geometry']
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    type: 'officer' | 'incident' | 'vehicle' | null;
    data: Officer | Incident | PatrolVehicle | null;
  }>({ type: null, data: null });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback((type: 'officer' | 'incident' | 'vehicle', data: Officer | Incident | PatrolVehicle) => {
    setSelectedMarker({ type, data });
    
    // Call the appropriate select handler
    if (type === 'officer' && onOfficerSelect) {
      onOfficerSelect(data as Officer);
    } else if (type === 'incident' && onIncidentSelect) {
      onIncidentSelect(data as Incident);
    } else if (type === 'vehicle' && onVehicleSelect) {
      onVehicleSelect(data as PatrolVehicle);
    }
  }, [onOfficerSelect, onIncidentSelect, onVehicleSelect]);

  // Close info window
  const handleInfoWindowClose = useCallback(() => {
    setSelectedMarker({ type: null, data: null });
    
    // Reset the selected items
    if (onOfficerSelect) onOfficerSelect(null);
    if (onIncidentSelect) onIncidentSelect(null);
    if (onVehicleSelect) onVehicleSelect(null);
  }, [onOfficerSelect, onIncidentSelect, onVehicleSelect]);

  // Get marker icon based on status
  const getOfficerIcon = useCallback((status: string) => {
    const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
    switch (status) {
      case 'ON_DUTY':
        return `${baseUrl}green-dot.png`;
      case 'OFF_DUTY':
        return `${baseUrl}blue-dot.png`;
      case 'ON_BREAK':
        return `${baseUrl}yellow-dot.png`;
      case 'IN_EMERGENCY':
        return `${baseUrl}red-dot.png`;
      default:
        return `${baseUrl}purple-dot.png`;
    }
  }, []);

  // Fit map to bounds when data changes
  useEffect(() => {
    if (map && (officers.length > 0 || incidents.length > 0 || patrolVehicles.length > 0)) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Add officer locations
      officers.forEach(officer => {
        if (officer.latitude && officer.longitude) {
          bounds.extend({ lat: officer.latitude, lng: officer.longitude });
        }
      });
      
      // Add incident locations
      incidents.forEach(incident => {
        if (incident.latitude && incident.longitude) {
          bounds.extend({ lat: incident.latitude, lng: incident.longitude });
        }
      });
      
      // Add vehicle locations
      patrolVehicles.forEach(vehicle => {
        if (vehicle.latitude && vehicle.longitude) {
          bounds.extend({ lat: vehicle.latitude, lng: vehicle.longitude });
        }
      });
      
      // Only fit bounds if we have valid locations
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    }
  }, [map, officers, incidents, patrolVehicles]);

  // Render officer markers
  const renderOfficerMarkers = useMemo(() => {
    return officers.map((officer) => {
      if (!officer.latitude || !officer.longitude) return null;
      
      return (
        <Marker
          key={`officer-${officer.id}`}
          position={{
            lat: officer.latitude,
            lng: officer.longitude
          }}
          icon={{
            url: getOfficerIcon(officer.status),
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          onClick={() => handleMarkerClick('officer', officer)}
        >
          {selectedMarker.type === 'officer' && selectedMarker.data?.id === officer.id && (
            <InfoWindow onCloseClick={handleInfoWindowClose}>
              <div className="p-3 max-w-xs">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-gray-100 rounded-full p-2">
                    <User className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{officer.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BadgeIcon className="h-3.5 w-3.5" />
                      <span>{officer.badgeNumber}</span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        {officer.rank || 'Officer'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">Department</p>
                    <p>{officer.department || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      officer.status === 'ON_DUTY' ? 'bg-green-100 text-green-800' :
                      officer.status === 'IN_EMERGENCY' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {officer.status.split('_').join(' ')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">Contact</p>
                    <a href={`tel:${officer.contactNumber}`} className="text-blue-600 hover:underline">
                      {officer.contactNumber || 'N/A'}
                    </a>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">Email</p>
                    <a href={`mailto:${officer.email}`} className="text-blue-600 hover:underline truncate block">
                      {officer.email || 'N/A'}
                    </a>
                  </div>
                  {officer.currentPosting && (
                    <div className="col-span-2 space-y-1">
                      <p className="font-medium text-gray-700">Current Posting</p>
                      <p className="text-sm">{officer.currentPosting}</p>
                    </div>
                  )}
                </div>
                
                {officer.performance && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-medium text-sm text-gray-700 mb-1">Performance</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="font-medium">{officer.performance.casesSolved || 0}</p>
                        <p className="text-gray-500">Cases</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium">{officer.performance.commendations || 0}</p>
                        <p className="text-gray-500">Commendations</p>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <p className="font-medium">{officer.performance.performanceRating || 'N/A'}</p>
                        <p className="text-gray-500">Rating</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Marker>
      );
    });
  }, [officers, selectedMarker, handleMarkerClick, handleInfoWindowClose, getOfficerIcon]);

  // Render incident markers
  const renderIncidentMarkers = useMemo(() => {
    return incidents.map((incident) => {
      if (!incident.latitude || !incident.longitude) return null;
      
      return (
        <Marker
          key={`incident-${incident.id}`}
          position={{
            lat: incident.latitude,
            lng: incident.longitude
          }}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          onClick={() => handleMarkerClick('incident', incident)}
        >
          {selectedMarker.type === 'incident' && selectedMarker.data?.id === incident.id && (
            <InfoWindow onCloseClick={handleInfoWindowClose}>
              <div className="p-2">
                <h3 className="font-bold">{incident.title}</h3>
                <p>Type: {incident.type}</p>
                <p>Status: {incident.status}</p>
                <p>Priority: {incident.priority}</p>
                <p>Description: {incident.description}</p>
              </div>
            </InfoWindow>
          )}
        </Marker>
      );
    });
  }, [incidents, selectedMarker, handleMarkerClick, handleInfoWindowClose]);

  // Render vehicle markers
  const renderVehicleMarkers = useMemo(() => {
    return patrolVehicles.map((vehicle) => {
      if (!vehicle.latitude || !vehicle.longitude) return null;
      
      return (
        <Marker
          key={`vehicle-${vehicle.id}`}
          position={{
            lat: vehicle.latitude,
            lng: vehicle.longitude
          }}
          icon={{
            url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            scaledSize: new window.google.maps.Size(32, 32)
          }}
          onClick={() => handleMarkerClick('vehicle', vehicle)}
        >
          {selectedMarker.type === 'vehicle' && selectedMarker.data?.id === vehicle.id && (
            <InfoWindow onCloseClick={handleInfoWindowClose}>
              <div className="p-2">
                <h3 className="font-bold">{vehicle.vehicleNumber}</h3>
                <p>Type: {vehicle.type}</p>
                <p>Model: {vehicle.model}</p>
                <p>Status: {vehicle.status}</p>
                {vehicle.assignedOfficer && (
                  <p>Assigned Officer: {vehicle.assignedOfficer.name}</p>
                )}
              </div>
            </InfoWindow>
          )}
        </Marker>
      );
    });
  }, [patrolVehicles, selectedMarker, handleMarkerClick, handleInfoWindowClose]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  // Render patrol routes
  const renderPatrolRoutes = useMemo(() => {
    return patrolRoutes.map((route) => {
      if (!route.coordinates || route.coordinates.length < 2) return null;
      
      const path = route.coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude
      }));
      
      return (
        <Polyline
          key={`route-${route.id || 'unknown'}`}
          path={path}
          options={{
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            clickable: true,
            zIndex: 1
          }}
        />
      );
    });
  }, [patrolRoutes]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-2"></div>
          <p>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {renderOfficerMarkers}
        {renderIncidentMarkers}
        {renderVehicleMarkers}
        {renderPatrolRoutes}
      </GoogleMap>
    </div>
  );
};

export default GoogleMapComponent;
