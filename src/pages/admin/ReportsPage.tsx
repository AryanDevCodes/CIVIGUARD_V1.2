import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  FileText, 
  AlertCircle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  ChevronFirst, 
  ChevronLast, 
  FileWarning, 
  AlertTriangle, 
  ArrowUpDown, 
  Check, 
  X,
  BarChart as BarChartIcon,
  Table as TableIcon,
  AlertOctagon,
  CalendarIcon,
  FileBarChart,
  FilterIcon,
  HeartPulse,
  RefreshCw,
  Volume2,
  Wrench,
  XIcon,
} from 'lucide-react';
import { BadgeVariant } from '@/components/StatusBadge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AdminPagePlaceholder from './AdminPagePlaceholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { reportsService } from '@/services/reportsService';
import DashboardLayout from '@/components/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import StatusBadge, { StatusVariant } from '@/components/StatusBadge';
import { officersService } from '@/services/apiService';

// Type definitions
type ReportStatus = 'PENDING' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CONVERTED';
type ReportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ReportType = 'SECURITY' | 'UTILITY' | 'MAINTENANCE' | 'DISTURBANCE' | 'HEALTH';
type OfficerStatus = 'ACTIVE' | 'ON_LEAVE' | 'TRAINING' | 'SUSPENDED';
type OfficerRank = 
  | 'CONSTABLE' | 'HEAD_CONSTABLE' | 'ASSISTANT_SUB_INSPECTOR' 
  | 'SUB_INSPECTOR' | 'INSPECTOR' | 'DEPUTY_SUPERINTENDENT' 
  | 'SUPERINTENDENT' | 'SENIOR_SUPERINTENDENT' | 'DEPUTY_COMMISSIONER'
  | 'JOINT_COMMISSIONER' | 'ADDITIONAL_COMMISSIONER' | 'COMMISSIONER' 
  | 'INSPECTOR_GENERAL' | 'ADDITIONAL_DIRECTOR_GENERAL' | 'DIRECTOR_GENERAL';

interface BaseOfficer {
  id: number;
  name: string;
  badgeNumber: string;
  rank?: OfficerRank;
  department?: string;
  status: OfficerStatus;
  district?: string;
  joinDate?: string;
  avatar?: string;
  contactNumber?: string;
  email?: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  role?: string;
}

interface Officer extends BaseOfficer {
  // Additional officer-specific properties can be added here
}

const CHART_COLORS = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  RESOLVED: '#10b981',
  REJECTED: '#ef4444',
  CONVERTED: '#8b5cf6',
  LOW: '#10b981',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#7c3aed',
  SECURITY: '#ef4444',
  UTILITY: '#3b82f6',
  MAINTENANCE: '#f59e0b',
  DISTURBANCE: '#8b5cf6',
  HEALTH: '#10b981',
};

interface Report {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  priority: ReportPriority;
  type: ReportType;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  location: string;
  evidence: string[];
  notes: string;
}

// Officer interface is now defined above as an extension of BaseOfficer

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  summary?: {
    byStatus: Record<ReportStatus, number>;
    byPriority: Record<ReportPriority, number>;
    byType: Record<ReportType, number>;
    dailyCount: Array<{ date: string; count: number }>;
  };
}

interface ReportFilters {
  search: string;
  type: string;
  status: string;
  priority: string;
  createdBy: string;
  dateFrom: string;
  dateTo: string;
}

// Default report values
const defaultReport: Omit<Report, 'id' | 'title' | 'createdAt'> = {
  type: 'SECURITY',
  status: 'PENDING',
  priority: 'MEDIUM',
  createdBy: 'Unknown',
  description: '',
  location: '',
  evidence: [],
  notes: '',
  updatedAt: new Date().toISOString(),
};

// Utility functions
const parseResponseData = (response: any): PaginatedResponse<Report> => {
  const warnings: string[] = [];
  
  // Helper function to normalize report data
  const normalizeReport = (item: any): Report => {
    const reportId = String(item.id || 'unknown');
    
    // Validate status
    let status: ReportStatus = 'PENDING';
    if (item.status) {
      const upperStatus = String(item.status).toUpperCase();
      if (['PENDING', 'IN_REVIEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CONVERTED'].includes(upperStatus)) {
        status = upperStatus as ReportStatus;
      } else {
        warnings.push(`Report ${reportId}: Invalid status '${item.status}', using 'PENDING'`);
      }
    }

    // Validate priority
    let priority: ReportPriority = 'MEDIUM';
    if (item.priority) {
      const upperPriority = String(item.priority).toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upperPriority)) {
        priority = upperPriority as ReportPriority;
      } else if (item.priority) {
        warnings.push(`Report ${reportId}: Invalid priority '${item.priority}', using 'MEDIUM'`);
      }
    }

    // Validate type
    let type: ReportType = 'SECURITY';
    if (item.type) {
      const upperType = String(item.type).toUpperCase();
      // Map CRIME to SECURITY without warning since they are considered the same
      if (upperType === 'CRIME' || upperType === 'SECURITY') {
        type = 'SECURITY';
      } else if (['UTILITY', 'MAINTENANCE', 'DISTURBANCE', 'HEALTH'].includes(upperType)) {
        type = upperType as ReportType;
      } else {
        warnings.push(`Report ${reportId}: Invalid type '${item.type}', using 'SECURITY'`);
      }
    }

    return {
      ...defaultReport,
      id: reportId,
      title: item.title || 'Untitled Report',
      description: item.description || '',
      status,
      priority,
      type,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
      createdBy: typeof item.createdBy === 'object' 
        ? (item.createdBy.name || item.createdBy.email || 'Unknown')
        : String(item.createdBy || 'Unknown'),
      location: item.location || 'Unknown',
      evidence: Array.isArray(item.evidence) ? item.evidence : [],
      notes: item.notes || '',
    };
  };

  if (!response) {
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: 10,
      first: true,
      last: true,
      numberOfElements: 0,
    };
  }

  // Get the data from response
  const data = response.data || response;
  
  // Parse content
  const content = Array.isArray(data.content) 
    ? data.content.map(normalizeReport)
    : [];

  // Parse summary if available
  const summary = data.summary ? {
    byStatus: data.summary.byStatus || {},
    byPriority: data.summary.byPriority || {},
    byType: data.summary.byType || {},
    dailyCount: Array.isArray(data.summary.dailyCount) 
      ? data.summary.dailyCount.map((item: any) => ({
          date: item.date,
          count: typeof item.count === 'number' ? item.count : 0,
        }))
      : [],
  } : undefined;

  // Show warnings if any
  if (warnings.length > 0) {
    console.warn('Data normalization warnings:', warnings);
    toast.warning(`Data issues detected in reports. Check console for details.`);
  }

  return {
    content,
    totalElements: typeof data.totalElements === 'number' ? data.totalElements : content.length,
    totalPages: typeof data.totalPages === 'number' ? data.totalPages : 1,
    page: typeof data.number === 'number' ? data.number : 0,
    size: typeof data.size === 'number' ? data.size : 10,
    first: data.first !== undefined ? data.first : true,
    last: data.last !== undefined ? data.last : true,
    numberOfElements: typeof data.numberOfElements === 'number' 
      ? data.numberOfElements 
      : content.length,
    summary,
  };
};

// Map report status to status variant
const getStatusVariant = (status: ReportStatus): StatusVariant => {
  switch (status) {
    case 'PENDING': 
    case 'IN_REVIEW':
      return 'secondary';
    case 'IN_PROGRESS': 
      return 'default';
    case 'RESOLVED': 
      return 'default';
    case 'REJECTED': 
      return 'destructive';
    case 'CONVERTED': 
      return 'outline';
    default: 
      return 'default';
  }
};

const getPriorityVariant = (priority: ReportPriority): BadgeVariant => {
  switch (priority) {
    case 'HIGH':
    case 'CRITICAL': return 'destructive';
    case 'MEDIUM': return 'default';
    case 'LOW': return 'secondary';
    default: return 'default';
  }
};

const getStatusBadge = (status: ReportStatus, className: string = '') => {
  return (
    <div className={`inline-flex ${className}`}>
      <StatusBadge status={status} />
    </div>
  );
};

const getTypeIcon = (type: ReportType) => {
  const typeIconMap: Record<ReportType, JSX.Element> = {
    SECURITY: <AlertOctagon className="h-4 w-4 mr-2" />,
    UTILITY: <FileText className="h-4 w-4 mr-2" />,
    MAINTENANCE: <Wrench className="h-4 w-4 mr-2" />,
    DISTURBANCE: <Volume2 className="h-4 w-4 mr-2" />,
    HEALTH: <HeartPulse className="h-4 w-4 mr-2" />,
  };
  return typeIconMap[type] || <FileText className="h-4 w-4 mr-2" />;
};

const AdminReportsPage: React.FC = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(true);  // State for selected report
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [convertingReport, setConvertingReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'grid' | 'table' | 'analytics'>('grid');
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    type: '',
    status: '',
    priority: '',
    createdBy: '',
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
  });
  type SortableField = 'title' | 'status' | 'type' | 'priority' | 'createdAt';
  const [sortConfig, setSortConfig] = useState<{ key: SortableField; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });



  // Memoize query params to prevent unnecessary re-renders
  const queryParams = React.useMemo(() => ({
    ...filters,
    page: pagination.page - 1,
    size: pagination.pageSize,
    sort: `${sortConfig.key},${sortConfig.direction}`
  }), [filters, pagination.page, pagination.pageSize, sortConfig.key, sortConfig.direction]);

  // Fetch reports with proper typing
  const { data, isLoading, isError, error, refetch } = useQuery<PaginatedResponse<Report>, Error>({
    queryKey: ['reports', queryParams],
    queryFn: async ({ queryKey }) => {
      const params = queryKey[1] as any;
      
      console.log('Fetching reports with params:', {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        page: params.page,
        size: params.size,
      });
      
      const response = await reportsService.getAll({
        page: params.page,
        size: params.size,
        search: params.search,
        type: params.type,
        status: params.status,
        priority: params.priority,
        createdBy: params.createdBy ? Number(params.createdBy) : undefined,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      });
      
      console.log('Raw response from /reports:', response);
      const parsedData = parseResponseData(response);
      setPagination(prev => ({
        ...prev,
        total: parsedData.totalElements,
        totalPages: parsedData.totalPages,
        page: parsedData.page,
        pageSize: parsedData.size,
      }));
      return parsedData;
    },
    // Keep previous data while fetching new data for smoother transitions
    keepPreviousData: true as const,
    initialData: (): PaginatedResponse<Report> => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      page: 0,
      size: pagination.pageSize,
      first: true,
      last: true,
      numberOfElements: 0,
      summary: {
        byStatus: {} as Record<ReportStatus, number>,
        byPriority: {} as Record<ReportPriority, number>,
        byType: {} as Record<ReportType, number>,
        dailyCount: [] as Array<{ date: string; count: number }>
      }
    }),
  });

  // Officer and OfficersResponse types are now defined at the top level




  const handleFilterChange = useCallback((updates: Partial<ReportFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      pageSize: parseInt(newPageSize, 10),
    }));
  }, []);

const handleSort = useCallback((key: string, e?: React.MouseEvent) => {
  e?.preventDefault();
  if (isSortableField(key)) {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }
}, []);

  // Type guard to check if a string is a valid SortableField
const isSortableField = (key: string): key is SortableField => {
  return ['title', 'status', 'type', 'priority', 'createdAt'].includes(key);
};

  const reports = data?.content || [];
  const total = data?.totalElements || 0;
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  
  // Update selected report when it changes
  useEffect(() => {
    if (selectedReport) {
      setIsDetailOpen(true);
    }
  }, [selectedReport]);

  const { uniqueTypes, uniqueStatuses, uniquePriorities, uniqueCreators } = useMemo(() => {
    const types = new Set<ReportType>();
    const statuses = new Set<ReportStatus>();
    const priorities = new Set<ReportPriority>();
    const creators = new Set<string>();

    reports.forEach((report) => {
      if (report.type) types.add(report.type);
      if (report.status) statuses.add(report.status);
      if (report.priority) priorities.add(report.priority);
      if (report.createdBy) creators.add(report.createdBy);
    });

    return {
      uniqueTypes: Array.from(types).sort(),
      uniqueStatuses: Array.from(statuses).sort(),
      uniquePriorities: Array.from(priorities).sort(),
      uniqueCreators: Array.from(creators).sort(),
    };
  }, [reports]);

  const paginationButtons = useMemo(() => {
    const buttons = [];
    const maxButtons = Math.min(5, totalPages);
    for (let i = 0; i < maxButtons; i++) {
      let pageNum;
      if (totalPages <= 5) {
        pageNum = i + 1;
      } else if (pagination.page <= 3) {
        pageNum = i + 1;
      } else if (pagination.page >= totalPages - 2) {
        pageNum = totalPages - 4 + i;
      } else {
        pageNum = pagination.page - 2 + i;
      }
      buttons.push(pageNum);
    }
    return buttons;
  }, [pagination.page, totalPages]);

  if (isLoading) {
    return (
      <AdminPagePlaceholder
        title="Reports Dashboard"
        description="Loading reports..."
        icon={<Loader2 className="h-8 w-8 animate-spin text-primary" />}
      />
    );
  }

  if (isError) {
    return (
      <AdminPagePlaceholder
        title="Reports Dashboard"
        description={`Failed to load reports: ${error?.message || 'Unknown error'}`}
        icon={<FileBarChart className="h-8 w-8 text-primary" />}
      />
    );
  }

  return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart className="h-6 w-6" />
            Reports
          </h1>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              aria-label="Refresh reports"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-label={isFilterOpen ? 'Collapse filters' : 'Expand filters'}
              >
                {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {isFilterOpen && (
            <CardContent className="p-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search by title, description..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange({ search: e.target.value })}
                    autoComplete="off"
                    aria-label="Search reports"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => handleFilterChange({ type: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger aria-label="Select report type">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {uniqueTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0) + type.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange({ status: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger aria-label="Select report status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {uniqueStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .split('_')
                            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                            .join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) => handleFilterChange({ priority: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger aria-label="Select report priority">
                      <SelectValue placeholder="All Priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      {uniquePriorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {priority.charAt(0) + priority.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createdBy">Created By</Label>
                  <Select
                    value={filters.createdBy}
                    onValueChange={(value) => handleFilterChange({ createdBy: value === 'all' ? '' : value })}
                  >
                    <SelectTrigger aria-label="Select report creator">
                      <SelectValue placeholder="All Creators" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Creators</SelectItem>
                      {uniqueCreators.map((creator) => (
                        <SelectItem key={creator} value={creator}>
                          {creator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        aria-label="Select date range"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom || filters.dateTo ? (
                          `${filters.dateFrom || 'Start'} - ${filters.dateTo || 'End'}`
                        ) : (
                          <span>Select date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{
                          from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                          to: filters.dateTo ? new Date(filters.dateTo) : undefined,
                        }}
                        onSelect={(range) => {
                          if (range?.from) {
                            handleFilterChange({
                              dateFrom: format(range.from, 'yyyy-MM-dd'),
                              dateTo: range.to
                                ? format(range.to, 'yyyy-MM-dd')
                                : format(range.from, 'yyyy-MM-dd'),
                            });
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleFilterChange({
                        search: '',
                        type: '',
                        status: '',
                        priority: '',
                        createdBy: '',
                        dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                        dateTo: format(new Date(), 'yyyy-MM-dd'),
                      })
                    }
                    className="w-full"
                    aria-label="Clear all filters"
                  >
                    <XIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="grid" aria-label="Grid view">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="table" aria-label="Table view">
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
            <TabsTrigger value="analytics" aria-label="Analytics view">
              <BarChartIcon className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grid">
            {reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <Card key={report.id} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3
                          className="text-xl font-semibold text-gray-800 flex items-center cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsDetailOpen(true)
                            setSelectedReport(report)
                          }}
                          aria-label={`View details for ${report.title}`}
                        >
                          {getTypeIcon(report.type)}
                          {report.title}
                        </h3>
                        {getStatusBadge(report.status, 'mt-1')}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span>{' '}
                          {report.type.charAt(0) + report.type.slice(1).toLowerCase()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Created:</span>{' '}
                          {format(new Date(report.createdAt), 'PP')}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Priority:</span>{' '}
                          <Badge variant={getPriorityVariant(report.priority)}>
                            {report.priority.charAt(0) + report.priority.slice(1).toLowerCase()}
                          </Badge>
                        </p>
                        {report.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-medium">Details:</span> {report.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          <span className="font-medium text-gray-700">By:</span>{' '}
                          {report.createdBy}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground mt-4">
                No reports found for the current filters.
              </div>
            )}
          </TabsContent>
          <TabsContent value="table">
            {reports.length > 0 ? (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        onClick={(e) => handleSort('title', e)}
                        className="cursor-pointer"
                      >
                        Title {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        onClick={(e) => {
                          e.preventDefault();
                          handleSort('status', e);
                        }} 
                        className="cursor-pointer"
                      >
                        Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        onClick={(e) => {
                          e.preventDefault();
                          handleSort('type');
                        }} 
                        className="cursor-pointer"
                      >
                        Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        onClick={(e) => {
                          e.preventDefault();
                          handleSort('priority');
                        }} 
                        className="cursor-pointer"
                      >
                        Priority {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead 
                        onClick={(e) => handleSort('createdAt', e)}
                        className="cursor-pointer"
                      >
                        Created {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow 
                        key={report.id}
                        className="hover:bg-muted/50"
                        onClick={() => {
                          setSelectedReport(report);
                          setIsDetailOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(report.type)}
                            <span>{report.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status, 'ml-2')}</TableCell>
                        <TableCell>
                          <span className="capitalize">
                            {report.type.toLowerCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityVariant(report.priority)}>
                            {report.priority.charAt(0) + report.priority.slice(1).toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(report.createdAt), 'PPpp')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReport(report);
                                setIsDetailOpen(true);
                              }}
                              aria-label={`View details for ${report.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConvertingReport(report);
                                navigate(`/admin/reports/convert/${report.id}`);
                              }}
                              aria-label={`Convert ${report.title} to incident`}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Convert to Incident
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="text-center text-muted-foreground mt-4">
                No reports found for the current filters.
              </div>
            )}
          </TabsContent>
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Status</CardTitle>
                <CardDescription>Distribution of reports by their current status</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.summary?.byStatus ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data?.summary?.byStatus ? Object.entries(data.summary.byStatus).map(([name, count]) => ({
                          name: name
                            .split('_')
                            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                            .join(' '),
                          count: count as number,
                        })) : []}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Count"
                          fill="#8884d8"
                          fillOpacity={0.8}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No status data available for analytics.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {totalPages} • Showing {reports.length} of {total} reports
            </div>
            <div className="flex items-center space-x-2">
              <Select value={String(pagination.pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20" aria-label="Select page size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      Show {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {paginationButtons.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                ))}
                {totalPages > 5 && pagination.page < totalPages - 2 && (
                  <span className="px-2">...</span>
                )}
                {totalPages > 5 && pagination.page < totalPages - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    aria-label={`Go to page ${totalPages}`}
                  >
                    {totalPages}
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <Dialog 
          open={isDetailOpen} 
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) {
              setViewingReport(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingReport?.title}</DialogTitle>
              <DialogDescription>Details for report #{viewingReport?.id}</DialogDescription>
            </DialogHeader>
            {viewingReport && (
              <div className="space-y-4">
                <div>
                  <strong>Status:</strong> {getStatusBadge(viewingReport.status, 'ml-2 inline-block')}
                </div>
                <div>
                  <strong>Type:</strong>{' '}
                  {viewingReport.type.charAt(0) + viewingReport.type.slice(1).toLowerCase()}
                </div>
                <div>
                  <strong>Priority:</strong>{' '}
                  <Badge variant={getPriorityVariant(viewingReport.priority)}>
                    {viewingReport.priority.charAt(0) + viewingReport.priority.slice(1).toLowerCase()}
                  </Badge>
                </div>
                <div>
                  <strong>Description:</strong> {viewingReport.description || 'N/A'}
                </div>
                <div>
                  <strong>Created By:</strong> {viewingReport.createdBy}
                </div>
                <div>
                  <strong>Created At:</strong> {format(new Date(viewingReport.createdAt), 'PPp')}
                </div>
                <div>
                  <strong>Last Updated:</strong> {format(new Date(viewingReport.updatedAt), 'PPp')}
                </div>
                {viewingReport.location && (
                  <div>
                    <strong>Location:</strong> {viewingReport.location}
                  </div>
                )}
                {viewingReport.notes && (
                  <div>
                    <strong>Notes:</strong> {viewingReport.notes}
                  </div>
                )}
                {viewingReport.evidence && viewingReport.evidence.length > 0 && (
                  <div>
                    <strong>Evidence:</strong>
                    <ul className="list-disc pl-5 mt-2">
                      {viewingReport.evidence.map((item, index) => (
                        <li key={index} className="break-all">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Close details dialog"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AdminReportsPage;