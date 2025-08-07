export interface AlertType {
  id: string;
  title: string;
  message: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  createdAt: string;
  area: string;
  isActive: boolean;
  type: string;
  isRead: boolean;
  // Location fields
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  // User info
  createdBy?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AlertsData {
  content: any[];
  totalElements: number;
}

export interface AlertsResponse<T = any> {
  content: T[];
  totalElements: number;
}
