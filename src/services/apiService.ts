import axios from 'axios';
import { toast } from '@/components/ui/sonner';

// Base API URL - would be set from environment variables in production
const API_BASE_URL = '/api';

/**
 * Base API delete function
 * @param endpoint - API endpoint
 * @returns Promise with the deletion result
 */
export const apiService = {
  /**
   * Generic fetch function
   * @param endpoint - API endpoint to fetch from
   * @param params - Query parameters
   * @returns Promise with the response data
   */
  async get(endpoint: string, params: any = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] GET ${url}`, { params });
    
    try {
      const response = await axios.get(url, { 
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout and withCredentials if needed
        timeout: 10000, // 10 seconds
        withCredentials: true
      });
      
      console.log(`[API] Response from ${url}:`, response.data);
      return response.data;
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error(`[API] Error in GET ${url}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: errorMessage,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        }
      });
      
      // Show user-friendly error message
      if (error.response?.status === 401) {
        // Handle unauthorized
        toast.error('Session expired. Please login again.');
        // Optionally redirect to login
      } else if (error.response?.status === 404) {
        toast.error('Requested resource not found');
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timeout. Please check your connection.');
      } else if (!navigator.onLine) {
        toast.error('No internet connection');
      } else if (!endpoint.startsWith('/system/')) {
        // Only show error toast for non-system endpoints to avoid spamming the user
        toast.error(`Failed to load data: ${errorMessage}`);
      }
      
      // Return empty array for list endpoints to prevent UI breakage
      if (endpoint.includes('officers') || endpoint.includes('incidents') || endpoint.includes('routes')) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Partially update a document
   * @param endpoint - API endpoint
   * @param data - Partial document data to update
   * @returns Promise with the updated document
   */
  async patch(endpoint: string, data: any = {}) {
    try {
      console.log(`Patching data to ${endpoint} with data:`, data);
      const response = await axios.patch(`${API_BASE_URL}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data?.success === false) {
        throw new Error(response.data.message || 'Update failed');
      }
      return response.data?.data !== undefined ? response.data.data : response.data;
    } catch (error: any) {
      console.error(`Error patching to ${endpoint}:`, error.response?.data || error.message);
      toast.error(`Failed to update data: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  },

  /**
   * Create a new document
   * @param endpoint - API endpoint
   * @param data - Document data
   * @returns Promise with the created document
   */
  async post(endpoint: string, data: any) {
    try {
      console.log(`Creating document at ${endpoint} with data:`, data);
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Error creating document at ${endpoint}:`, error.response?.data || error.message);
      toast.error(`Failed to create document at ${endpoint}: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  },

  /**
   * Update a document
   * @param endpoint - API endpoint
   * @param data - Updated document data
   * @returns Promise with the updated document
   */
  async put(endpoint: string, data: any = {}) {
    try {
      console.log(`Updating document at ${endpoint} with data:`, data);
      const response = await axios.put(`${API_BASE_URL}${endpoint}`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error updating document at ${endpoint}:`, error.response?.data || error.message);
      toast.error(`Failed to update document at ${endpoint}: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  },

  /**
   * Delete a document
   * @param endpoint - API endpoint
   * @returns Promise with the deletion result
   */
  async delete(endpoint: string) {
    try {
      console.log(`Deleting document at ${endpoint}`);
      const response = await axios.delete(`${API_BASE_URL}${endpoint}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error deleting document at ${endpoint}:`, error.response?.data || error.message);
      toast.error(`Failed to delete document at ${endpoint}: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
};

/**
 * Specialized services for specific data types
 */
export const incidentsService = {
  getMine(params = {}) {
    return apiService.get('/incidents/user', params);
  },
  getAll(params = {}) {
    return apiService.get('/incidents', params);
  },
  getByOfficerId(officerId: string | number, params = {}) {
    return apiService.get(`/incidents/assigned-to/${officerId}`, params);
  },
  getById: (id: string) => apiService.get(`/incidents/${id}`),
  create: (data: any) => apiService.post('/incidents', data),
  update: (id: string, data: any) => {
    // Transform evidenceUrls to images if present
    const updateData = { ...data };
    if (updateData.evidenceUrls) {
      updateData.images = updateData.evidenceUrls;
      delete updateData.evidenceUrls;
    }
    return apiService.put(`/incidents/${id}`, updateData);
  },
  updateStatus: (id: string, status: string, notes?: string) => 
    apiService.put(`/incidents/${id}/status`, { 
      status, 
      notes: notes || '' 
    }),
  delete: (id: string) => apiService.delete(`/incidents/${id}`),
  assignOfficers: (id: string, officerIds: number[]) => 
    apiService.put(`/incidents/${id}/assign`, officerIds),
  
  // Incident Updates
  getUpdates: (incidentId: string) => 
    apiService.get(`/officer/incidents/${incidentId}/updates`),
  addUpdate: (incidentId: string, notes: string, status?: string) => {
    const data: any = { notes };
    if (status) {
      data.status = status;
    }
    return apiService.post(`/officer/incidents/${incidentId}/updates`, data);
  },
  // Get incident timeline (includes status changes and updates)
  getTimeline: (incidentId: string) => 
    apiService.get(`/officer/incidents/${incidentId}/timeline`)
};

export const officersService = {
  getAll: (params = {}) => apiService.get('/officers', params),
  getById: (id: string) => apiService.get(`/officers/${id}`),
};

interface AlertQueryParams {
  page?: number;
  size?: number;
  sort?: string;
  [key: string]: any;
}

export const alertsService = {
getAll: async (params: AlertQueryParams = {}) => {
  try {
    console.log('[alertsService] Fetching all alerts with params:', params);
    const response = await apiService.get('/alerts', params);
    console.log('[alertsService] Alerts response:', response);
    return response;
  } catch (error) {
    console.error('[alertsService] Error fetching alerts:', error);
    throw error;
  }
},
  
getAllActive: (params: AlertQueryParams = {}) => {
  console.log('[alertsService] Fetching active alerts with params:', params);
  return apiService.get('/alerts/public', params);
},
  
getById: (id: string) => {
  console.log(`[alertsService] Fetching alert with id: ${id}`);
  return apiService.get(`/alerts/${id}`);
},
  
create: (data: any) => {
  console.log('[alertsService] Creating new alert:', data);
  return apiService.post('/alerts', data);
},
  
update: (id: string, data: any) => {
  console.log(`[alertsService] Updating alert ${id}:`, data);
  return apiService.put(`/alerts/${id}`, data);
},
  
delete: (id: string) => {
  console.log(`[alertsService] Deleting alert: ${id}`);
  return apiService.delete(`/alerts/${id}`);
},
  
filter: (params: any) => {
  console.log('[alertsService] Filtering alerts with params:', params);
  return apiService.get('/alerts/filter', params);
},
  
markAsRead: async (id: string) => {
  try {
    console.log(`[alertsService] Marking alert ${id} as read`);
    // Using PATCH method with the correct endpoint format
    const response = await apiService.patch(`/alerts/${id}/read`, {});
    console.log(`[alertsService] Marked alert ${id} as read:`, response);
    return response;
  } catch (error) {
    console.error(`[alertsService] Error marking alert ${id} as read:`, error);
    throw error;
  }
}
};

export const userService = {
  getProfile: () => apiService.get('/users/me'),
  updateProfile: (data: any) => apiService.put('/users/me', data),
  getAllUsers: (params = {}) => apiService.get('/users/admin', params)
};