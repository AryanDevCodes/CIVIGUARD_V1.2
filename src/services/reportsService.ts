import { apiService } from './apiService';

export interface ReportData {
  id?: string | number;
  title: string;
  description: string;
  incidentType: string;
  date: string;
  time: string;
  location: string | {
    latitude?: number;
    longitude?: number;
    address: string;
  };
  witnesses?: string;
  evidence?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  status?: string;
  priority?: string;
  createdBy?: string | number;
  assignedTo?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface Officer {
  id: number;
  name: string;
  badgeNumber: string;
  email: string;
  role: string;
}

interface ConvertToIncidentResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

export const reportsService = {
  getAll: async (params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    type?: string;
    priority?: string;
    createdBy?: number;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<PaginatedResponse<ReportData>> => {
    try {
      // Ensure pagination parameters are numbers with defaults
      const pageSize = params.size !== undefined ? Number(params.size) : 10;
      const pageNumber = params.page !== undefined ? Number(params.page) : 0;
      
      // Prepare query parameters for the API
      const queryParams = { ...params };
      
      // Remove pagination parameters from the query params
      delete queryParams.page;
      delete queryParams.size;
      
      // Remove any undefined or empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined || queryParams[key] === '') {
          delete queryParams[key];
        }
      });
      
      console.log('Fetching reports with params:', { ...queryParams, page: pageNumber, size: pageSize });
      
      // Make the API call with query parameters
      const response = await apiService.get('/reports', {
        ...queryParams,
        page: pageNumber,
        size: pageSize
      });
      
      console.log('Raw response from /reports:', response);
      
      // Handle nested response structure (response.data) if it exists
      const responseData = response?.data || response;
      
      // Map the response to our PaginatedResponse format
      return {
        content: responseData?.content || [],
        totalElements: responseData?.totalElements || 0,
        totalPages: responseData?.totalPages || 0,
        page: responseData?.number || response?.number || 0,
        size: responseData?.size || response?.size || pageSize,
        first: responseData?.first || response?.first || false,
        last: responseData?.last || response?.last || false,
        numberOfElements: responseData?.numberOfElements || response?.numberOfElements || 0
      };
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },
  getById: async (id: string): Promise<ReportData> => {
    try {
      const response = await apiService.get(`/reports/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching report ${id}:`, error);
      throw error;
    }
  },
  
  convertToIncident: async (reportId: string | number, data: { officerIds?: number[]; notes?: string; status?: string } = {}): Promise<ConvertToIncidentResponse> => {
    try {
      // Include the status field with a default value if not provided
      const payload = {
        ...data,
        status: data.status || 'IN_PROGRESS' // Default status if not provided
      };
      
      const response = await apiService.post(`/reports/${reportId}/convert-to-incident`, payload);
      return {
        success: true,
        message: response.message || 'Report converted to incident successfully',
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to convert report to incident',
        error: error.response?.data
      };
    }
  },
  
  create: async (data: Omit<ReportData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportData> => {
    try {
      const response = await apiService.post('/reports', data);
      return response; // The API directly returns the ReportData
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }
};
