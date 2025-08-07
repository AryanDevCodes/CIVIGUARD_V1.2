// System Status Types
export interface SystemStatus {
  id: number;
  componentName: string;
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'MAINTENANCE' | string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  uptime?: string;
  responseTime?: number;
  lastError?: string;
}

// System Metrics Types
export interface SystemMetrics {
  memory: MemoryMetrics;
  cpu: CpuMetrics;
  disk: DiskMetrics & {
    readBytes?: number;
    writeBytes?: number;
  };
  network?: {
    bytesIn: number;
    bytesOut: number;
  };
  // For backward compatibility
  diskIo?: {
    readBytes?: number;
    writeBytes?: number;
  };
  jvm?: {
    name: string;
    version: string;
    uptime: number;
  };
  uptime?: number;
  timestamp: string;
}

export interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  cache: number; // Added cache property to match the metrics data
}

export interface CpuMetrics {
  load: number[]; // Array of CPU load values (1min, 5min, 15min averages)
  cores: number; // Number of CPU cores
  usage?: number; // Optional CPU usage percentage (0-100)
}

export interface DiskMetrics {
  total: number;
  used: number;
  free: number;
}

// System Logs Types
export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | string;
  component: string;
  message: string;
  stackTrace?: string;
}

// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
