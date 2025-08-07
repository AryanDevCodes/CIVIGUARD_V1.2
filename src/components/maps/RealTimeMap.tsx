import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, Marker, InfoWindow, useLoadScript, Polyline } from '@react-google-maps/api';
import { Loader2, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Officer, Incident, PatrolVehicle, OfficerStatus, PatrolRoute } from '@/types/patrol';

// Define libraries array outside the component to prevent unnecessary reloads
const LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '500px',
  borderRadius: '8px',
};

// Default to New Delhi if geolocation is not available
const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

interface RealTimeMapProps {
  officers?: Officer[];
  incidents?: Incident[];
  patrolVehicles?: PatrolVehicle[];
  patrolRoutes?: PatrolRoute[];
  refreshInterval?: number;
  onRefresh?: () => Promise<void>;
  className?: string;
  zoom?: number;
}

const RealTimeMap: React.FC<RealTimeMapProps> = ({
  officers = [],
  incidents = [],
  patrolVehicles = [],
  patrolRoutes = [],
  refreshInterval = 300000, // 5 minutes
  onRefresh,
  className = '',
  zoom = 13,
}) => {
  const [selectedItem, setSelectedItem] = useState<{
    type: 'officer' | 'incident' | 'vehicle' | 'route';
    data: Officer | Incident | PatrolVehicle | PatrolRoute;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [center, setCenter] = useState(defaultCenter);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES,
  });

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCenter({
            lat: latitude,
            lng: longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting user location:', error);
          setLocationError('Unable to retrieve your location. Using default location.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Using default location.');
    }
  }, []);

  // Auto-refresh data
  useEffect(() => {
    if (!onRefresh) return;
    
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing map data:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [onRefresh, refreshInterval]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing map data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const getMarkerIcon = useCallback((type: 'officer' | 'incident' | 'vehicle', status?: string) => {
    const size = type === 'incident' ? 40 : 32;
    const color = {
      officer: {
        ON_DUTY: '#2e8aea',
        IN_EMERGENCY: '#ff0000',
        default: '#9ca0ae',
      },
      incident: '#ff3b30', // Brighter red for better visibility
      vehicle: '#4caf50',
    };

    let fillColor = '';
    if (type === 'officer') {
      fillColor = color.officer[status as keyof typeof color.officer] || color.officer.default;
    } else {
      fillColor = color[type];
    }

    // Custom SVG for incident marker
    if (type === 'incident') {
      return {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>`
        )}`,
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size),
      };
    }

    // Default marker for officers and vehicles
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${fillColor}">
          ${type === 'officer' ? 
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.08-6.32-2.82.2-.13.4-.26.6-.38h11.44c.18.62.38 1.24.6 1.82-1.61 1.74-3.82 2.82-6.32 2.82z"/>' : 
            '<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>'}
        </svg>`
      )}`,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size),
    };
  }, []);

  const renderInfoWindow = useCallback(() => {
    if (!selectedItem) return null;

    const { type, data } = selectedItem;
    
    // For routes, we need to get a position from the first waypoint
    if (type === 'route') {
      const route = data as PatrolRoute;
      const firstWaypoint = route.waypoints[0];
      if (!firstWaypoint) return null;
      
      return (
        <InfoWindow
          position={{
            lat: firstWaypoint.lat,
            lng: firstWaypoint.lng
          }}
          onCloseClick={() => setSelectedItem(null)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-lg">
              {route.name}
            </h3>
            <p className="text-sm text-gray-600">
              Status: {route.status}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Waypoints: {route.waypoints.length}
            </p>
            {route.assignedOfficer && (
              <p className="text-xs text-gray-500">
                Assigned Officer: {route.assignedOfficer}
              </p>
            )}
          </div>
        </InfoWindow>
      );
    }

    // For other marker types (officer, incident, vehicle)
    const position = (data as any).location 
      ? { 
          lat: Number((data as any).location.lat), 
          lng: Number((data as any).location.lng) 
        }
      : null;

    if (!position) return null;

    if (type === 'officer') {
      const officer = data as Officer;
      return (
        <InfoWindow
          position={position}
          onCloseClick={() => setSelectedItem(null)}
        >
          <div className="p-3 max-w-xs">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-gray-100 rounded-full p-2">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{officer.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Badge: {officer.badgeNumber}</span>
                  {officer.rank && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                      {officer.rank}
                    </span>
                  )}
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
                  {officer.status?.split('_').join(' ') || 'UNKNOWN'}
                </span>
              </div>
              {officer.contactNumber && (
                <div className="space-y-1">
                  <p className="font-medium text-gray-700">Contact</p>
                  <a href={`tel:${officer.contactNumber}`} className="text-blue-600 hover:underline">
                    {officer.contactNumber}
                  </a>
                </div>
              )}
              {officer.email && (
                <div className="space-y-1">
                  <p className="font-medium text-gray-700">Email</p>
                  <a href={`mailto:${officer.email}`} className="text-blue-600 hover:underline truncate block">
                    {officer.email}
                  </a>
                </div>
              )}
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
      );
    }

    // For incident and vehicle markers
    return (
      <InfoWindow
        position={position}
        onCloseClick={() => setSelectedItem(null)}
      >
        <div className="p-2 max-w-xs">
          <h3 className="font-semibold text-lg">
            {type === 'incident' ? (data as Incident).title :
             (data as PatrolVehicle).vehicleNumber}
          </h3>
          <p className="text-sm text-gray-600">
            {type === 'incident' && `Status: ${(data as Incident).status}`}
            {type === 'vehicle' && `Type: ${(data as PatrolVehicle).type}`}
          </p>
          {(data as any).location?.address && (
            <p className="text-xs text-gray-500 mt-1">
              {(data as any).location.address}
            </p>
          )}
        </div>
      </InfoWindow>
    );
  }, [selectedItem]);

  if (loadError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 text-center ${className}`}>
        <p className="text-red-600">Error loading Google Maps. Please try again later.</p>
      </div>
    );
  }

  if (locationError) {
    console.warn(locationError);
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ minHeight: '500px' }}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ height: '100%', minHeight: '500px' }}>
      

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {/* Officers */}
        {officers.map((officer) => {
          // Debug info for development
          const debugInfo = {
            id: officer.id,
            name: officer.name,
            hasLocation: !!officer.location,
            location: officer.location,
            rawLat: officer.location?.lat ?? officer.location?.latitude,
            rawLng: officer.location?.lng ?? officer.location?.longitude,
            status: officer.status
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Processing officer:', debugInfo);
          }

          // Skip if no valid location data
          const lat = officer.location?.lat ?? officer.location?.latitude;
          const lng = officer.location?.lng ?? officer.location?.longitude;
          
          if (!lat || !lng) {
            console.warn('Skipping officer due to missing location data:', {
              id: officer.id,
              name: officer.name,
              location: officer.location
            });
            return null;
          }
          
          // Convert to numbers and validate
          const latNum = Number(lat);
          const lngNum = Number(lng);
          
          if (isNaN(latNum) || isNaN(lngNum)) {
            console.error('Invalid coordinates for officer:', {
              id: officer.id,
              name: officer.name,
              lat: lat,
              lng: lng,
              location: officer.location
            });
            return null;
          }
          
          // Create a clean location object
          const location = {
            lat: latNum,
            lng: lngNum,
            address: officer.location?.address || officer.address,
            ...officer.location
          };
          
          // Create a clean officer object with consistent location
          const officerWithLocation = {
            ...officer,
            location
          };

          return (
            <Marker
              key={`officer-${officer.id}`}
              position={{
                lat: location.lat,
                lng: location.lng,
              }}
              icon={getMarkerIcon('officer', officer.status)}
              onClick={() => setSelectedItem({ type: 'officer', data: officerWithLocation })}
              zIndex={800}
              title={`${officer.name} (${officer.badgeNumber})`}
            />
          );
        })}

        {/* Incidents */}
        {incidents.map((incident) => {
          // Debug logging for incident data
          const debugInfo = {
            id: incident.id,
            hasLocation: !!incident.location,
            location: incident.location,
            rawLat: incident.location?.lat || incident.location?.latitude,
            rawLng: incident.location?.lng || incident.location?.longitude,
            hasValidCoords: (incident.location?.lat || incident.location?.latitude) && 
                          (incident.location?.lng || incident.location?.longitude)
          };
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Processing incident:', debugInfo);
          }

          // Extract coordinates, trying both formats
          const lat = Number(incident.location?.lat ?? incident.location?.latitude);
          const lng = Number(incident.location?.lng ?? incident.location?.longitude);

          // Skip if coordinates are invalid
          if (isNaN(lat) || isNaN(lng)) {
            console.warn('Skipping incident due to invalid coordinates:', {
              id: incident.id,
              lat,
              lng,
              location: incident.location
            });
            return null;
          }

          return (
            <Marker
              key={`incident-${incident.id}`}
              position={{
                lat: lat,
                lng: lng,
              }}
              icon={getMarkerIcon('incident')}
              onClick={() => setSelectedItem({ type: 'incident', data: incident })}
              zIndex={1000}
              animation={window.google.maps.Animation.DROP}
            />
          );
        })}

        {/* Patrol Vehicles */}
        {patrolVehicles.map((vehicle) => {
          if (!vehicle?.location?.lat || !vehicle?.location?.lng) return null;
          return (
            <Marker
              key={`vehicle-${vehicle.id}`}
              position={{
                lat: Number(vehicle.location.lat),
                lng: Number(vehicle.location.lng),
              }}
              icon={getMarkerIcon('vehicle')}
              onClick={() => setSelectedItem({ type: 'vehicle', data: vehicle })}
            />
          );
        })}

        {/* Patrol Routes */}
        {patrolRoutes.map((route) => {
          if (!route.waypoints?.length) return null;
          
          // Convert waypoints to Google Maps LatLngLiteral format
          const path = route.waypoints
            .filter(wp => wp?.lat != null && wp?.lng != null)
            .map(wp => ({
              lat: Number(wp.lat),
              lng: Number(wp.lng)
            }));
          
          if (path.length < 2) return null;
          
          // Add the first point at the end to close the route if needed
          const isClosedPath = path.length > 2 && 
            (path[0].lat === path[path.length - 1].lat && 
             path[0].lng === path[path.length - 1].lng);
          
          if (!isClosedPath && path.length > 2) {
            path.push({...path[0]});
          }
          
          return (
            <div key={`route-${route.id}`}>
              <Polyline
                path={path}
                options={{
                  strokeColor: '#3b82f6', // blue-500
                  strokeOpacity: 0.8,
                  strokeWeight: 6,
                  clickable: true,
                  zIndex: 10,
                  icons: [{
                    icon: {
                      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      strokeColor: '#ffffff',
                      fillColor: '#3b82f6',
                      fillOpacity: 1,
                      scale: 3,
                      strokeWeight: 1
                    },
                    offset: '100%',
                    repeat: '100px'
                  }]
                }}
                onClick={() => setSelectedItem({ type: 'route', data: route })}
              />
              {/* Add markers for start and end points */}
              {path.length > 0 && (
                <Marker
                  position={path[0]}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 6,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeWeight: 1,
                    strokeColor: '#ffffff',
                  }}
                  onClick={() => setSelectedItem({ type: 'route', data: route })}
                />
              )}
            </div>
          );
        })}

        {selectedItem && renderInfoWindow()}
      </GoogleMap>
    </div>
  );
};

export default RealTimeMap;
