import { apiService } from './apiService';
import { webSocketService, SystemUpdate } from './websocketService';
import { BehaviorSubject, Observable } from 'rxjs';
import { cn } from '@/lib/utils';

// Types
export type ComponentStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE';

export interface SystemStatus {
  id: string;
  componentName: string;
  status: ComponentStatus;
  description: string;
  version: string;
  lastChecked: string;
  updatedAt: string;
  category?: string;
  critical?: boolean;
  documentationUrl?: string;
}

export interface SystemMetrics {
  timestamp: string;
  cpu: {
    load: number[];
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cache: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  os: {
    name: string;
    version: string;
    arch: string;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  jvm?: {
    name: string;
    version: string;
    uptime: number;
  };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  source: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  components: Record<string, {
    status: 'UP' | 'DOWN' | 'UNKNOWN';
    details?: Record<string, unknown>;
  }>;
}



export interface SystemUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'AUDITOR' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';
  lastLogin?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

class SystemService {
  private metricsSubject = new BehaviorSubject<SystemMetrics | null>(null);
  private statusSubject = new BehaviorSubject<SystemStatus[]>([]);
  private isConnected = false;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket(): void {
    webSocketService.getMessages().subscribe({
      next: (message: SystemUpdate) => {
        try {
          // Handle STOMP protocol messages
          if ('type' in message && message.type === 'MESSAGE' && message.destination) {
            try {
              const data = message.body ? JSON.parse(message.body) : null;
              if (data) {
                if (message.destination.includes('system-metrics')) {
                  this.metricsSubject.next(data);
                } else if (message.destination.includes('system-status')) {
                  this.handleStatusUpdate(data);
                }
              }
            } catch (parseError) {
              console.error('Error parsing WebSocket message body:', parseError);
            }
          } 
          // Handle direct metrics updates (legacy format)
          else if ('type' in message && message.type === 'metrics' && 'data' in message) {
            this.metricsSubject.next(message.data);
          } 
          // Handle status updates (legacy format)
          else if ('type' in message && message.type === 'status' && 'data' in message) {
            this.handleStatusUpdate(message.data);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      },
      error: (err: Error) => console.error('WebSocket error:', err),
    });
  }

  private handleStatusUpdate(update: { componentName: string; status: ComponentStatus; timestamp: string }): void {
    const currentStatus = this.statusSubject.getValue();
    const existingIndex = currentStatus.findIndex(s => s.componentName === update.componentName);
    
    const newStatus: SystemStatus = {
      ...(existingIndex >= 0 ? currentStatus[existingIndex] : {} as SystemStatus),
      componentName: update.componentName,
      status: update.status,
      lastChecked: update.timestamp,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      const updated = [...currentStatus];
      updated[existingIndex] = newStatus;
      this.statusSubject.next(updated);
    } else {
      this.statusSubject.next([...currentStatus, newStatus]);
    }
  }

  // Real-time data access methods
  public getRealtimeMetrics(): Observable<SystemMetrics | null> {
    return this.metricsSubject.asObservable();
  }

  public getRealtimeStatus(): Observable<SystemStatus[]> {
    return this.statusSubject.asObservable();
  }

  public getCurrentMetrics(): SystemMetrics | null {
    return this.metricsSubject.getValue();
  }

  public getCurrentStatus(): SystemStatus[] {
    return this.statusSubject.getValue();
  }

  // Manually trigger a metrics update
  public async refreshMetrics(): Promise<void> {
    try {
      const metrics = await apiService.get('/system/metrics');
      this.metricsSubject.next(metrics.data);
    } catch (error) {
      console.error('Error refreshing metrics:', error);
    }
  }

  // Public Endpoints (No authentication required)
  public async getSystemStatus(): Promise<SystemStatus[]> {
    try {
      const response = await apiService.get('/system/status');
      // Handle both array response and response with data property
      return Array.isArray(response) ? response : (response?.data || response || []);
    } catch (error) {
      console.error('Error fetching system status:', error);
      return [];
    }
  }

  public async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      const response = await apiService.get('/system/metrics');
      const data = response?.data || response;
      
      if (!data) return null;
      
      // Handle disk I/O metrics from either disk or diskIo
      const diskReadBytes = data.disk?.readBytes ?? data.diskIo?.readBytes ?? 0;
      const diskWriteBytes = data.disk?.writeBytes ?? data.diskIo?.writeBytes ?? 0;
      
      // Transform the response to match the SystemMetrics interface
      const metrics: SystemMetrics = {
        timestamp: data.timestamp || new Date().toISOString(),
        cpu: {
          load: Array.isArray(data.cpu?.load) ? data.cpu.load : 
               (data.cpu?.load ? [data.cpu.load] : [0]),
          cores: data.cpu?.cores || 1,
          usage: data.cpu?.usage || 0
        },
        memory: {
          total: data.memory?.total || 0,
          used: data.memory?.used || 0,
          free: data.memory?.free || 0,
          cache: data.memory?.cache || 0
        },
        disk: {
          total: data.disk?.total || 0,
          used: data.disk?.used || 0,
          free: data.disk?.free || 0,
          readBytes: diskReadBytes,
          writeBytes: diskWriteBytes
        },
        os: data.os || { name: '', version: '', arch: '' },
        network: {
          bytesIn: data.network?.bytesIn ?? data.network?.rxBytes ?? 0,
          bytesOut: data.network?.bytesOut ?? data.network?.txBytes ?? 0
        },
        jvm: data.jvm || {
          name: data.jvm?.name || 'JVM',
          version: data.jvm?.version || '',
          uptime: data.jvm?.uptime || 0
        },
        // For backward compatibility
        diskIo: {
          readBytes: diskReadBytes,
          writeBytes: diskWriteBytes
        }
      };
      
      return metrics;
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      return null;
    }
  }

 // In systemService.ts, update the getSystemLogs method
async getSystemLogs(params: {
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
} = {}): Promise<{ content: SystemLog[]; totalElements: number }> {
  try {
    console.log('Preparing to fetch system logs with params:', params);
    
    // Create URLSearchParams to properly encode query parameters
    const queryParams = new URLSearchParams();
    
    // Add only defined parameters
    if (params.level) queryParams.append('level', params.level);
    if (params.search) queryParams.append('search', params.search);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    
    // Build the URL with query parameters
    const queryString = queryParams.toString();
    const url = `/admin/system/logs${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiService.get(url);
    return {
      content: response.content || [],
      totalElements: response.totalElements || 0
    };
  } catch (error) {
    console.error('Error fetching system logs:', error);
    throw error;
  }
}



  // Admin Endpoints (Requires authentication)
  public async updateComponentStatus(componentName: string, status: ComponentStatus): Promise<SystemStatus> {
    try {
      const response = await apiService.put('/admin/system/status', { componentName, status });
      return response.data;
    } catch (error) {
      console.error('Error updating component status:', error);
      throw error;
    }
  }

  public async getComponentStatus(componentName: string): Promise<SystemStatus> {
    try {
      const response = await apiService.get(`/admin/system/status/${componentName}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching status for component ${componentName}:`, error);
      throw error;
    }
  }

  public async getFilteredComponents(status: ComponentStatus): Promise<SystemStatus[]> {
    try {
      const response = await apiService.get('/admin/system/status/filter', { params: { status } });
      return response.data || [];
    } catch (error) {
      console.error('Error filtering components by status:', error);
      return [];
    }
  }

  public async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiService.get('/admin/system/health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  public async getAdminSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await apiService.get('/admin/system/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin system metrics:', error);
      throw error;
    }
  }

  public async getAdminSystemLogs(params: {
    level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Promise<{ content: SystemLog[]; totalElements: number }> {
    try {
      const response = await apiService.get('/admin/system/logs', { params });
      return {
        content: response.data?.content || [],
        totalElements: response.data?.totalElements || 0
      };
    } catch (error) {
      console.error('Error fetching admin system logs:', error);
      return { content: [], totalElements: 0 };
    }
  }
}

export const systemService = new SystemService();
