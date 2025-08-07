import L, { bounds } from 'leaflet';
import { Officer, Incident, PatrolVehicle } from '@/types/patrol';

// Create custom icons
export const createOfficerIcon = (status: string) => {
  const color = {
    ON_DUTY: '#10B981',    // green-500
    ON_BREAK: '#F59E0B',   // amber-500
    IN_EMERGENCY: '#EF4444', // red-500
    OFF_DUTY: '#9CA3AF',   // gray-400
  }[status] || '#6B7280';  // gray-500

  return L.divIcon({
    html: `
      <div class="relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" class="drop-shadow-lg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        ${status === 'IN_EMERGENCY' ? `
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
        ` : ''}
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

export const createIncidentIcon = (priority: string) => {
  const color = {
    LOW: '#3B82F6',      // blue-500
    MEDIUM: '#F59E0B',   // amber-500
    HIGH: '#F97316',     // orange-500
    CRITICAL: '#EF4444', // red-500
  }[priority] || '#6B7280'; // gray-500

  return L.divIcon({
    html: `
      <div class="relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" class="drop-shadow-lg">
          <path d="M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 5v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

export const createVehicleIcon = (status: string) => {
  const color = {
    ACTIVE: '#10B981',      // green-500
    ASSIGNED: '#3B82F6',    // blue-500
    MAINTENANCE: '#F59E0B', // amber-500
    OUT_OF_SERVICE: '#EF4444', // red-500
  }[status] || '#6B7280';   // gray-500

  return L.divIcon({
    html: `
      <div class="relative">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="${color}" class="drop-shadow-lg">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    className: 'bg-transparent border-none',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
};

// Calculate bounds to fit all markers
export const getMapBounds = (
  officers: Officer[], 
  incidents: Incident[], 
  vehicles: PatrolVehicle[] = []
): L.LatLngBounds | null => {
  const points: [number, number][] = [];
  
  // Add officer locations
  officers.forEach(officer => {
    if (officer?.location?.lat && officer?.location?.lng) {
      points.push([officer.location.lat, officer.location.lng]);
    }
  });
  
  // Add incident locations
  incidents.forEach(incident => {
    if (incident?.location?.lat && incident?.location?.lng) {
      points.push([incident.location.lat, incident.location.lng]);
    }
  });
  
  // Add patrol vehicle locations
  vehicles.forEach(vehicle => {
    if (vehicle?.location?.lat && vehicle?.location?.lng) {
      points.push([vehicle.location.lat, vehicle.location.lng]);
    }
  });
  
  if (points.length === 0) return null;
  
  // Create bounds from all points
  return L.latLngBounds(points);
};
