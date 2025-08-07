import { apiService } from './apiService';
import { Officer, Incident, PatrolRoute, PatrolVehicle } from '@/types/patrol';

const ENDPOINTS = {
  OFFICERS: '/officers',
  INCIDENTS: '/incidents',
  ROUTES: '/patrol-routes',
  VEHICLES: '/patrol-vehicles',
};

// Simple in-memory cache for geocoding results
const geocodeCache = new Map<string, { lat: number; lng: number }>();

// Mock geocoding function - in a real app, replace with actual geocoding service
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  // Check cache first
  const cached = geocodeCache.get(address);
  if (cached) return cached;

  try {
    // For Bhopal, MP (approximate center)
    const defaultCoords = {
      lat: 23.2599 + (Math.random() * 0.1 - 0.05),  // Add some random offset
      lng: 77.4126 + (Math.random() * 0.1 - 0.05)   // Add some random offset
    };

    // In a real app, you would use a geocoding service like:
    // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
    // const data = await response.json();
    // if (data.results && data.results[0]) {
    //   const { lat, lng } = data.results[0].geometry.location;
    //   return { lat, lng };
    // }
    
    // For now, use default coords for Bhopal with slight randomization
    geocodeCache.set(address, defaultCoords);
    return defaultCoords;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const patrolService = {
  // Patch method for partial updates
  patch: async (endpoint: string, data: any) => {
    const response = await apiService.patch(endpoint, data);
    return response.data;
  },
  
  // Officer endpoints
  getOfficers: async (): Promise<Officer[]> => {
    try {
      const response = await apiService.get(ENDPOINTS.OFFICERS);
      let officers: Officer[] = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        officers = response;
      } else if (response?.data?.content) {
        officers = response.data.content;
      } else if (response?.success && response?.data?.content) {
        officers = response.data.content;
      } else {
        console.warn('Unexpected officers response format:', response);
        return [];
      }

      // Process officers to ensure consistent location data
      const processedOfficers = await Promise.all(officers.map(async (officer) => {
        const processedOfficer = { ...officer };
        
        // If officer has address but no location, try to geocode it
        if (officer.address && (!officer.location || (!officer.location.lat && !officer.location.latitude))) {
          const coords = await geocodeAddress(officer.address);
          if (coords) {
            processedOfficer.location = {
              ...processedOfficer.location,
              ...coords,
              address: officer.address
            };
            console.log(`Geocoded address for officer ${officer.id}:`, {
              address: officer.address,
              coords
            });
          } else {
            console.warn(`Failed to geocode address for officer ${officer.id}:`, officer.address);
          }
        }
        
        // Ensure location object has proper format
        if (processedOfficer.location) {
          processedOfficer.location = {
            ...processedOfficer.location,
            lat: processedOfficer.location.lat ?? processedOfficer.location.latitude,
            lng: processedOfficer.location.lng ?? processedOfficer.location.longitude,
            address: processedOfficer.location.address ?? officer.address
          };
        } else {
          // If still no location, use default Bhopal coordinates with some randomization
          processedOfficer.location = {
            lat: 23.2599 + (Math.random() * 0.2 - 0.1),  // Randomize around Bhopal
            lng: 77.4126 + (Math.random() * 0.2 - 0.1),  // Randomize around Bhopal
            address: officer.address
          };
          console.warn(`Using default location for officer ${officer.id} (${officer.name})`);
        }
        
        return processedOfficer;
      }));

      return processedOfficers;
    } catch (error) {
      console.error('Error fetching officers:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  },

  updateOfficerStatus: async (officerId: string, status: string): Promise<void> => {
    try {
      await apiService.patch(`${ENDPOINTS.OFFICERS}/${officerId}/status`, { status });
    } catch (error) {
      console.error('Error updating officer status:', error);
      throw error;
    }
  },

  // Incident endpoints
  getIncidents: async (): Promise<Incident[]> => {
    try {
      const response = await apiService.get(ENDPOINTS.INCIDENTS);
      let incidents: any[] = [];
      
      // Handle different response formats
      if (Array.isArray(response)) {
        incidents = response;
      } else if (response?.data?.content) {
        incidents = response.data.content;
      } else if (response?.success && response?.data?.content) {
        incidents = response.data.content;
      } else {
        console.warn('Unexpected incidents response format:', response);
        return [];
      }

      // Transform the incidents to ensure consistent location structure
      return incidents.map(incident => {
        // Create a copy of the incident to avoid mutating the original
        const transformedIncident = { ...incident };
        
        // Handle case where location is at root level with latitude/longitude
        if ((!incident.location) && (incident.latitude && incident.longitude)) {
          transformedIncident.location = {
            lat: Number(incident.latitude),
            lng: Number(incident.longitude),
            address: incident.address || '',
          };
          return transformedIncident;
        }
        
        // Handle case where location exists but uses latitude/longitude
        if (incident.location && incident.location.latitude && incident.location.longitude) {
          transformedIncident.location = {
            ...incident.location,
            lat: Number(incident.location.latitude),
            lng: Number(incident.location.longitude),
          };
          return transformedIncident;
        }
        
        // Handle case with standard lat/lng
        if (incident.location && (incident.location.lat || incident.location.lng)) {
          transformedIncident.location = {
            ...incident.location,
            lat: Number(incident.location.lat || 0),
            lng: Number(incident.location.lng || 0),
          };
          return transformedIncident;
        }
        
        // If no valid location found, log a warning
        console.warn('No valid location found for incident:', incident.id);
        return transformedIncident;
      });
    } catch (error) {
      console.error('Error fetching incidents:', error);
      // Log more detailed error information
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
        console.error('Error headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  },

  updateIncidentStatus: async (incidentId: string, status: string): Promise<void> => {
    try {
      await apiService.patch(`${ENDPOINTS.INCIDENTS}/${incidentId}/status`, { status });
    } catch (error) {
      console.error('Error updating incident status:', error);
      throw error;
    }
  },

  // Patrol route endpoints
  getPatrolRoutes: async (): Promise<PatrolRoute[]> => {
    try {
      const response = await apiService.get(ENDPOINTS.ROUTES);
      
      // Handle different response formats consistently with other endpoints
      let routesData = [];
      if (Array.isArray(response)) {
        routesData = response;
      } else if (response?.data?.content) {
        routesData = response.data.content;
      } else if (response?.success && response?.data?.content) {
        routesData = response.data.content;
      } else if (Array.isArray(response?.data)) {
        routesData = response.data;
      } else {
        console.warn('Unexpected patrol routes response format:', response);
        return [];
      }
      
      // Transform the response to match the PatrolRoute type
      return routesData.map((route: any) => ({
        id: route.id.toString(),
        name: route.name,
        waypoints: route.waypoints || [],
        status: route.status,
        assignedOfficer: route.assignedOfficerId?.toString(),
        patrolVehicle: route.patrolVehicle ? {
          id: route.patrolVehicle.id.toString(),
          vehicleNumber: route.patrolVehicle.vehicleNumber,
          type: route.patrolVehicle.type,
          model: route.patrolVehicle.model,
          status: route.patrolVehicle.status,
          location: {
            lat: route.patrolVehicle.latitude || 0,
            lng: route.patrolVehicle.longitude || 0,
            address: route.patrolVehicle.address,
            city: route.patrolVehicle.city,
            state: route.patrolVehicle.state,
            country: route.patrolVehicle.country,
            district: route.patrolVehicle.district,
            postalCode: route.patrolVehicle.postalCode,
            lastUpdated: route.patrolVehicle.lastUpdated || route.patrolVehicle.lastLocationUpdate
          }
        } : undefined,
        // Add required coordinates field for PatrolRoute type
        coordinates: route.waypoints?.map((wp: any) => ({
          lat: wp.lat || 0,
          lng: wp.lng || 0
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching patrol routes:', error);
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  },

  getPatrolVehicleById: async (id: string): Promise<PatrolVehicle> => {
    try {
      const response = await apiService.get(`${ENDPOINTS.VEHICLES}/${id}`);
      const vehicle = response.data;
      return {
        id: vehicle.id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        type: vehicle.type,
        model: vehicle.model,
        status: vehicle.status,
        location: {
          lat: vehicle.latitude,
          lng: vehicle.longitude,
          address: vehicle.address,
          city: vehicle.city,
          state: vehicle.state,
          country: vehicle.country,
          district: vehicle.district,
          postalCode: vehicle.postalCode,
          lastUpdated: vehicle.lastLocationUpdate,
        },
        lastLocationUpdate: vehicle.lastLocationUpdate,
        assignedOfficerId: vehicle.assignedOfficerId?.toString(),
      };
    } catch (error) {
      console.error(`Error fetching patrol vehicle ${id}:`, error);
      throw error;
    }
  },

  updatePatrolVehicleLocation: async (vehicleId: string, location: { lat: number; lng: number }): Promise<PatrolVehicle> => {
    try {
      const response = await apiService.put(`${ENDPOINTS.VEHICLES}/${vehicleId}/location`, location);
      const vehicle = response.data;
      return {
        id: vehicle.id.toString(),
        vehicleNumber: vehicle.vehicleNumber,
        type: vehicle.type,
        model: vehicle.model,
        status: vehicle.status,
        location: {
          lat: vehicle.latitude,
          lng: vehicle.longitude,
          address: vehicle.address,
          city: vehicle.city,
          state: vehicle.state,
          country: vehicle.country,
          district: vehicle.district,
          postalCode: vehicle.postalCode,
          lastUpdated: vehicle.lastLocationUpdate,
        },
        lastLocationUpdate: vehicle.lastLocationUpdate,
        assignedOfficerId: vehicle.assignedOfficerId?.toString(),
      };
    } catch (error) {
      console.error(`Error updating vehicle ${vehicleId} location:`, error);
      throw error;
    }
  },

  assignOfficerToVehicle: async (vehicleId: string, officerId: string | null): Promise<void> => {
    try {
      const url = `${ENDPOINTS.VEHICLES}/${vehicleId}/assign-officer`;
      if (officerId) {
        await apiService.put(`${url}/${officerId}`, {});
      } else {
        await apiService.put(url, {});
      }
    } catch (error) {
      console.error(`Error assigning officer to vehicle ${vehicleId}:`, error);
      throw error;
    }
  },

  // Get all patrol vehicles
  getPatrolVehicles: async (): Promise<PatrolVehicle[]> => {
    try {
      const response = await apiService.get(ENDPOINTS.VEHICLES);
      
      // Handle different response formats
      let vehicles = [];
      if (Array.isArray(response)) {
        vehicles = response;
      } else if (response?.data?.content) {
        vehicles = response.data.content;
      } else if (response?.success && response?.data?.content) {
        vehicles = response.data.content;
      } else if (Array.isArray(response?.data)) {
        vehicles = response.data;
      } else {
        console.warn('Unexpected patrol vehicles response format:', response);
        return [];
      }

      // Transform the response to match the PatrolVehicle type
      return vehicles.map((vehicle: any) => ({
        id: vehicle.id?.toString() || '',
        vehicleNumber: vehicle.vehicleNumber || 'N/A',
        type: vehicle.type || 'UNKNOWN',
        model: vehicle.model || 'N/A',
        status: vehicle.status || 'OUT_OF_SERVICE',
        location: {
          lat: vehicle.latitude || vehicle.location?.lat || 0,
          lng: vehicle.longitude || vehicle.location?.lng || 0,
          address: vehicle.address || vehicle.location?.address,
          city: vehicle.city || vehicle.location?.city,
          state: vehicle.state || vehicle.location?.state,
          country: vehicle.country || vehicle.location?.country || 'India',
          district: vehicle.district || vehicle.location?.district,
          postalCode: vehicle.postalCode || vehicle.location?.postalCode,
          lastUpdated: vehicle.lastLocationUpdate || vehicle.location?.lastUpdated || new Date().toISOString()
        },
        assignedOfficerId: vehicle.assignedOfficerId?.toString(),
        assignedOfficer: vehicle.assignedOfficer ? {
          id: vehicle.assignedOfficer.id?.toString(),
          name: vehicle.assignedOfficer.name || 'Unknown Officer',
          badgeNumber: vehicle.assignedOfficer.badgeNumber || 'N/A',
          status: vehicle.assignedOfficer.status || 'UNKNOWN',
          location: {
            lat: vehicle.assignedOfficer.latitude || vehicle.assignedOfficer.location?.lat || 0,
            lng: vehicle.assignedOfficer.longitude || vehicle.assignedOfficer.location?.lng || 0,
            address: vehicle.assignedOfficer.address || vehicle.assignedOfficer.location?.address,
            city: vehicle.assignedOfficer.city || vehicle.assignedOfficer.location?.city,
            state: vehicle.assignedOfficer.state || vehicle.assignedOfficer.location?.state,
            country: vehicle.assignedOfficer.country || vehicle.assignedOfficer.location?.country || 'India',
            district: vehicle.assignedOfficer.district || vehicle.assignedOfficer.location?.district,
            postalCode: vehicle.assignedOfficer.postalCode || vehicle.assignedOfficer.location?.postalCode,
            lastUpdated: vehicle.assignedOfficer.lastLocationUpdate || vehicle.assignedOfficer.location?.lastUpdated || new Date().toISOString()
          }
        } : undefined,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt
      }));
    } catch (error) {
      console.error('Error fetching patrol vehicles:', error);
      return [];
    }
  },

  // Real-time updates (WebSocket would be better for production)
  subscribeToUpdates: (callback: () => void) => {
    // In a real app, this would set up a WebSocket connection
    const interval = setInterval(callback, 30000); // Simulate updates every 30 seconds
    return () => clearInterval(interval);
  },
};
