import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsService } from '@/services/apiService';
import { mapIncidentFromBackend, mapSeverityToBackend, mapStatusToBackend } from '@/utils/dataMappers';
import { ShieldAlert, AlertTriangle, AlertCircle, Info, Download, CheckCircle, Loader2, User, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { LoadScript } from '@react-google-maps/api';
const GOOGLE_MAPS_LIBRARIES: Array<"places" | "geometry" | "drawing" | "visualization" | "marker"> = ['marker'];

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent as RadixDialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import AdminPagePlaceholder from './AdminPagePlaceholder';
import DashboardLayout from '@/components/DashboardLayout';
import { cn } from '@/lib/utils';

// Custom DialogContent
const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof RadixDialogContent> & { onMount?: () => void }
>(({ className, children, onMount, ...props }, forwardedRef) => {
  const internalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (internalRef.current) {
      onMount?.();
    }
  }, []);

  return (
    <RadixDialogContent
      ref={(node) => {
        internalRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      }}
      className={cn('sm:max-w-[600px] min-h-[400px] max-h-[80vh] flex flex-col overflow-visible', className)}
      {...props}
    >
      {children}
    </RadixDialogContent>
  );
});
DialogContent.displayName = 'DialogContent';

interface OfficerType {
  id: string;
  name: string;
  badgeNumber?: string;
  rank?: string;
  email?: string;
}

interface UpdateType {
  id: string;
  content: string;
  createdAt: string;
  updatedBy?: {
    id: string;
    name: string;
    email?: string;
  };
}

interface ReportDetailsType {
  witnesses?: string;
  evidence?: string;
  reportDate?: string;
  reportTime?: string;
  originalDescription?: string;
  originalType?: string;
  originalStatus?: string;
  conversionNotes?: string;
}

interface IncidentType {
  id: string;
  type: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  severity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  status: 'reported' | 'investigating' | 'resolved';
  reportedAt: string;
  createdAt: string;
  updatedAt: string;
  resolutionDate: string | null;
  resolutionNotes: string | null;
  reportedBy: string;
  reportedByEmail?: string;
  reportedById: string;
  reporterContactInfo: string;
  anonymous: boolean;
  assignedOfficers: OfficerType[] | string[];
  images: string[];
  tags: string[];
  updates: UpdateType[];
  reportDetails?: ReportDetailsType;
}

type SortKey = keyof IncidentType;
type SortOrder = 'asc' | 'desc';

const AdminIncidentsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dialogContentRef = useRef<HTMLDivElement | null>(null);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('reportedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIncident, setSelectedIncident] = useState<IncidentType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<IncidentType>>({});
  const isModalOpenRef = useRef(false);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // MapComponent
  const MapComponent = ({
    center,
    zoom,
    position,
    title,
  }: {
    center: google.maps.LatLngLiteral;
    zoom: number;
    position: google.maps.LatLngLiteral;
    title: string;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);

    useEffect(() => {
      if (ref.current && !map) {
        const newMap = new window.google.maps.Map(ref.current, {
          center,
          zoom,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeId: 'satellite',
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: window.google.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [
              window.google.maps.MapTypeId.ROADMAP,
              window.google.maps.MapTypeId.SATELLITE,
              window.google.maps.MapTypeId.HYBRID,
              window.google.maps.MapTypeId.TERRAIN,
            ],
          },
        });
        setMap(newMap);
      }
    }, [ref, map]);

    useEffect(() => {
      if (!map) return;

      if (!markerRef.current) {
        markerRef.current = new window.google.maps.Marker({
          position,
          map,
          title,
        });
      } else {
        markerRef.current.setPosition(position);
        markerRef.current.setTitle(title);
      }

      return () => {
        if (markerRef.current) {
          markerRef.current.setMap(null);
        }
      };
    }, [map, position, title]);

    return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
  };

  useEffect(() => {
    if (dialogContentRef.current && selectedIncident) {
      const timeout = setTimeout(() => {}, 300);
      return () => clearTimeout(timeout);
    }
  }, [selectedIncident]);

  const handleDialogContentMount = () => {};

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setSelectedIncident(null);
      }, 200);
    }
  }, []);

  useEffect(() => {
    return () => {
      setSelectedIncident(null);
    };
  }, []);

  const queryKey = ['admin-incidents', page, pageSize, statusFilter, severityFilter];

  const { data, isLoading, error } = useQuery({
    queryKey: queryKey,
    queryFn: async () => {
      const params = {
        page,
        size: pageSize,
        status: statusFilter !== 'ALL' ? mapStatusToBackend(statusFilter) : undefined,
        priority: severityFilter !== 'ALL' ? mapSeverityToBackend(severityFilter) : undefined,
      };
      const response = await incidentsService.getAll(params);
      let incidentsArr = [];
      if (Array.isArray(response.data?.content)) {
        incidentsArr = response.data.content;
      } else if (Array.isArray(response.content)) {
        incidentsArr = response.content;
      } else if (Array.isArray(response.data?.incidents)) {
        incidentsArr = response.data.incidents;
      }
      const totalPages = response.data?.totalPages || response.totalPages || 1;
      const totalElements = response.data?.totalElements || response.totalElements || incidentsArr.length;
      const mappedIncidents = incidentsArr
        .map((incident: any) => mapIncidentFromBackend(incident))
        .filter((incident: IncidentType | null): incident is IncidentType => incident !== null);
      return { incidents: mappedIncidents, totalPages, totalElements };
    },
    retry: 2,
  });

  const incidents = data?.incidents || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || incidents.length;

  const updateMutation = useMutation({
    mutationFn: (updatedIncident: Partial<IncidentType>) => {
      const backendData = {
        title: updatedIncident.title,
        description: updatedIncident.description,
        incidentType: updatedIncident.type,
        location: {
          address: updatedIncident.location || '',
          latitude: updatedIncident.latitude || 0,
          longitude: updatedIncident.longitude || 0,
        },
        priority: updatedIncident.severity?.toUpperCase(),
        tags: updatedIncident.tags || [],
      };
      return incidentsService.update(updatedIncident.id!, backendData);
    },
    onMutate: async (updatedIncident) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.incidents) {
          return old;
        }
        return {
          ...old,
          incidents: old.incidents.map((inc: IncidentType) =>
            inc.id === updatedIncident.id ? { ...inc, ...updatedIncident } : inc
          ),
        };
      });
      return { previousData };
    },
    onError: (error: any, _, context) => {
      queryClient.setQueryData(queryKey, context?.previousData);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update incident.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast({
        title: 'Success',
        description: 'Incident updated successfully.',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: IncidentType['status'] }) => {
      const backendStatus = mapStatusToBackend(status);
      const notes = status === 'resolved' ? 'Status updated to resolved' : undefined;
      return incidentsService.updateStatus(id, backendStatus, notes);
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.incidents) {
          return old;
        }
        const now = new Date().toISOString();
        return {
          ...old,
          incidents: old.incidents.map((inc: IncidentType) =>
            inc.id === id
              ? {
                  ...inc,
                  status,
                  updatedAt: now,
                  ...(status === 'resolved'
                    ? { resolutionDate: now, resolutionNotes: 'Status updated to resolved' }
                    : {}),
                }
              : inc
          ),
        };
      });
      return { previousData };
    },
    onError: (error: any, { id }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update incident status.';
      toast({
        title: 'Failed to update status',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onSuccess: (response, { status }) => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast({
        title: 'Status Updated',
        description: `Incident marked as ${status}`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => incidentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      toast({
        title: 'Success',
        description: 'Incident deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete incident.',
        variant: 'destructive',
      });
    },
  });

  const debouncedSetSearchQuery = useCallback(
    debounce((value: string) => setSearchQuery(value), 300),
    []
  );

  const filteredIncidents = useMemo(() => {
    let result = [...incidents];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inc) =>
          inc.title.toLowerCase().includes(query) ||
          inc.description.toLowerCase().includes(query) ||
          inc.location.toLowerCase().includes(query) ||
          inc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    result.sort((a, b) => {
      const aValue = a[sortKey as keyof typeof a];
      const bValue = b[sortKey as keyof typeof b];
      if (sortKey === 'reportedAt' || sortKey === 'createdAt' || sortKey === 'updatedAt') {
        const aDate = aValue ? new Date(aValue as string).getTime() : 0;
        const bDate = bValue ? new Date(bValue as string).getTime() : 0;
        return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
      }
      const aString = aValue !== undefined && aValue !== null ? String(aValue) : '';
      const bString = bValue !== undefined && bValue !== null ? String(bValue) : '';
      return sortOrder === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
    return result;
  }, [incidents, searchQuery, sortKey, sortOrder]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityIcon = (severity: string) => {
    if (!severity) return <Info className="h-5 w-5 text-gray-500" />;

    switch (severity.toLowerCase()) {
      case 'high':
        return <ShieldAlert className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = (incident: IncidentType) => {
    setSelectedIncident(incident);
    isModalOpenRef.current = true;
  };

  const handleEdit = (incident: IncidentType) => {
    const locationData = typeof incident.location === 'object'
      ? incident.location
      : { address: incident.location || '', latitude: 0, longitude: 0 };

    setEditForm({
      id: incident.id,
      title: incident.title || '',
      description: incident.description || '',
      type: incident.type || '',
      location: locationData.address || '',
      latitude: incident.latitude || locationData.latitude || 0,
      longitude: incident.longitude || locationData.longitude || 0,
      severity: incident.severity || 'medium',
      tags: Array.isArray(incident.tags) ? incident.tags : [],
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (incident: IncidentType) => {
    setSelectedIncident(incident);
    setIsDeleteModalOpen(true);
  };

  const handleStatusChange = (id: string, status: IncidentType['status']) => {
    try {
      updateStatusMutation.mutate({ id, status });
    } catch (error) {
    }
  };

  const handleEditSubmit = () => {
    if (
      !editForm.id ||
      !editForm.title?.trim() ||
      !editForm.description?.trim() ||
      !editForm.type?.trim() ||
      !editForm.location?.trim() ||
      isNaN(editForm.latitude!) ||
      isNaN(editForm.longitude!) ||
      !editForm.severity
    ) {
      toast({
        title: 'Error',
        description: 'All fields are required and must be valid.',
        variant: 'destructive',
      });
      return;
    }
    if (editForm.latitude < -90 || editForm.latitude > 90) {
      toast({
        title: 'Error',
        description: 'Latitude must be between -90 and 90.',
        variant: 'destructive',
      });
      return;
    }
    if (editForm.longitude < -180 || editForm.longitude > 180) {
      toast({
        title: 'Error',
        description: 'Longitude must be between -180 and 180.',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate(editForm);
    setIsEditModalOpen(false);
    setEditForm({});
  };

  const handleDeleteConfirm = () => {
    if (selectedIncident) {
      deleteMutation.mutate(selectedIncident.id);
      setIsDeleteModalOpen(false);
      setSelectedIncident(null);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID,Type,Title,Description,Status,Severity,Location,Latitude,Longitude,Reported By,Reporter Contact,Anonymous,Reported At,Tags',
    ];
    const rows = filteredIncidents.map((inc) =>
      [
        inc.id,
        inc.type,
        `"${inc.title.replace(/"/g, '""')}"`,
        `"${inc.description.replace(/"/g, '""')}"`,
        inc.status,
        inc.severity,
        `"${inc.location.replace(/"/g, '""')}"`,
        inc.latitude,
        inc.longitude,
        `"${inc.reportedBy.replace(/"/g, '""')}"`,
        `"${inc.reporterContactInfo.replace(/"/g, '""')}"`,
        inc.anonymous,
        formatDate(inc.reportedAt),
        `"${inc.tags.join(', ')}"`,
      ].join(',')
    );
    const csv = [...headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'incidents.csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AdminPagePlaceholder
        title="Incidents Management"
        description="Loading incidents..."
        icon={<ShieldAlert className="h-8 w-8 text-blue-500" />}
      />
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load incidents.';
    return (
      <AdminPagePlaceholder
        title="Incidents Management"
        description={`Error: ${errorMessage}. Check the console and Network tab for details.`}
        icon={<ShieldAlert className="h-8 w-8 text-blue-500" />}
      />
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-blue-500" />
            Incidents Management
          </h2>
          <Button onClick={exportToCSV} variant="outline" className="border-gray-300 hover:bg-gray-100">
            <Download className="mr-2 h-4 w-4" />
            Export to CSV
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            placeholder="Search by title, description, location, or tags..."
            onChange={(e) => debouncedSetSearchQuery(e.target.value)}
            className="sm:col-span-1 border-gray-300 focus:ring-blue-500"
            aria-label="Search incidents"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status" className="border-gray-300 focus:ring-blue-500">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger aria-label="Filter by severity" className="border-gray-300 focus:ring-blue-500">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredIncidents.length === 0 ? (
          <AdminPagePlaceholder
            title="No Incidents Found"
            description="No incidents are available. Check the API response in the Network tab or adjust the filters."
            icon={<ShieldAlert className="h-8 w-8 text-blue-500" />}
          />
        ) : (
          <div className="border rounded-lg overflow-x-auto border-gray-300">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('title')} className="hover:bg-gray-100">
                      Title {sortKey === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('location')} className="hover:bg-gray-100">
                      Location {sortKey === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableHead>
                  <TableHead>Reported By</TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('reportedAt')} className="hover:bg-gray-100">
                      Reported At {sortKey === 'reportedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </Button>
                  </TableHead>
                  <TableHead>Assigned Officers</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{incident.title}</TableCell>
                    <TableCell>
                      <Select
                        value={incident.status}
                        onValueChange={(value) =>
                          handleStatusChange(incident.id, value as IncidentType['status'])
                        }
                        disabled={updateStatusMutation.isPending || incident.status === 'resolved'}
                      >
                        <SelectTrigger
                          className={`w-[140px] border-gray-300 focus:ring-blue-500 ${incident.status === 'resolved' ? 'bg-gray-100' : ''
                            }`}
                          aria-label={`Status for ${incident.title}`}
                        >
                          <div className="flex items-center">
                            {incident.status === 'reported' && <AlertCircle className="h-3 w-3 mr-2 text-blue-500" />}
                            {incident.status === 'investigating' && (
                              <Loader2 className="h-3 w-3 mr-2 text-amber-500 animate-spin" />
                            )}
                            {incident.status === 'resolved' && <CheckCircle className="h-3 w-3 mr-2 text-green-500" />}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reported">
                            <div className="flex items-center">
                              <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                              <span>Reported</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="investigating">
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 text-amber-500" />
                              <span>Investigating</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="resolved">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              <span>Resolved</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{incident.location}</TableCell>
                    <TableCell>{incident.reportedBy}</TableCell>
                    <TableCell>{formatDate(incident.reportedAt)}</TableCell>
                    <TableCell>
                      {incident.assignedOfficers.length > 0
                        ? incident.assignedOfficers
                          .map((officer: any) => (typeof officer === 'string' ? officer : officer.name))
                          .join(', ')
                        : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(incident)}
                          aria-label={`View details for ${incident.title}`}
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          View
                        </Button>
                        <div className="relative group">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(incident)}
                            disabled={incident.status === 'resolved'}
                            aria-label={`Edit ${incident.title}`}
                            className={`border-gray-300 ${incident.status === 'resolved' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                              }`}
                          >
                            Edit
                          </Button>
                          {incident.status === 'resolved' && (
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2 whitespace-nowrap">
                              Cannot edit resolved incidents
                            </div>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(incident)}
                          aria-label={`Delete ${incident.title}`}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Showing {filteredIncidents.length} of {totalElements} incidents
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-[100px] border-gray-300 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-gray-300 hover:bg-gray-100"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="border-gray-300 hover:bg-gray-100"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <Dialog
          open={!!selectedIncident}
          onOpenChange={handleOpenChange}
        >
          <DialogContent
            ref={dialogContentRef}
            onMount={handleDialogContentMount}
            className="sm:max-w-[600px] min-h-[400px] max-h-[80vh] flex flex-col overflow-visible"
          >
            {selectedIncident ? (
              <>
                <DialogHeader className="flex-shrink-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-2">
                      {getSeverityIcon(selectedIncident.severity)}
                      <div>
                        <DialogTitle>{selectedIncident.title}</DialogTitle>
                        <DialogDescription>
                          {selectedIncident.type} • {formatDate(selectedIncident.reportedAt)}
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Description</h3>
                      <p className="text-sm text-gray-500">{selectedIncident.description}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Details</h3>
                      <dl className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">ID:</dt>
                          <dd>{selectedIncident.id}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Status:</dt>
                          <dd>{selectedIncident.status}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Severity:</dt>
                          <dd>{selectedIncident.severity}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Location:</dt>
                          <dd>{selectedIncident.location}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Coordinates:</dt>
                          <dd>
                            {selectedIncident.latitude && selectedIncident.longitude
                              ? `${selectedIncident.latitude}, ${selectedIncident.longitude}`
                              : 'N/A'}
                          </dd>
                        </div>

                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700 flex items-start gap-1">
                            <User className="h-4 w-4 mt-0.5" />
                            Reported By:
                          </dt>
                          <dd>
                            <div>{selectedIncident.reportedBy}</div>
                            {selectedIncident.reportedByEmail && (
                              <div className="text-sm text-gray-500">{selectedIncident.reportedByEmail}</div>
                            )}
                            {selectedIncident.reportedById && (
                              <div className="text-xs text-gray-400">ID: {selectedIncident.reportedById}</div>
                            )}
                          </dd>
                        </div>
                        {selectedIncident.latitude && selectedIncident.longitude && (
                          <div className="mt-4">
                            <h3 className="font-medium text-gray-900 mb-2">Location on Map</h3>
                            <div className="h-64 w-full rounded-md overflow-hidden border">
                              {isMapLoaded ? (
                                <LoadScript
                                  googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                                  libraries={['marker']}
                                  loadingElement={<div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading map...</div>}
                                  onLoad={() => setIsMapLoaded(true)}
                                >
                                  <MapComponent
                                    center={{
                                      lat: selectedIncident.latitude,
                                      lng: selectedIncident.longitude,
                                    }}
                                    zoom={15}
                                    position={{
                                      lat: selectedIncident.latitude,
                                      lng: selectedIncident.longitude,
                                    }}
                                    title={selectedIncident.location || 'Incident Location'}
                                  />
                                </LoadScript>
                              ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                  <button
                                    onClick={() => setIsMapLoaded(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                  >
                                    Load Map
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedIncident.reportDetails && (
                          <div className="flex gap-2">
                            <dt className="font-medium text-gray-700 flex items-start gap-1">
                              <UserCog className="h-4 w-4 mt-0.5" />
                              Report Details:
                            </dt>
                            <dd className="space-y-2">
                              {selectedIncident.reportDetails.witnesses && (
                                <div>
                                  <span className="font-medium">Witnesses:</span> {selectedIncident.reportDetails.witnesses}
                                </div>
                              )}
                              {selectedIncident.reportDetails.evidence && (
                                <div>
                                  <span className="font-medium">Evidence:</span> {selectedIncident.reportDetails.evidence}
                                </div>
                              )}
                              {selectedIncident.reportDetails.reportDate && (
                                <div>
                                  <span className="font-medium">Report Date:</span>{' '}
                                  {new Date(selectedIncident.reportDetails.reportDate).toLocaleString()}
                                </div>
                              )}
                              {selectedIncident.reportDetails.conversionNotes && (
                                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                  <div className="font-medium">Conversion Notes:</div>
                                  <div className="text-sm">{selectedIncident.reportDetails.conversionNotes}</div>
                                </div>
                              )}
                            </dd>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Contact Info:</dt>
                          <dd>{selectedIncident.reporterContactInfo}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Anonymous:</dt>
                          <dd>{selectedIncident.anonymous ? 'Yes' : 'No'}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Assigned Officers:</dt>
                          <dd>
                            {selectedIncident.assignedOfficers.length > 0
                              ? selectedIncident.assignedOfficers
                                .map((officer) => (typeof officer === 'string' ? officer : officer.name))
                                .join(', ')
                              : 'None'}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Tags:</dt>
                          <dd>
                            {selectedIncident.tags.length > 0
                              ? selectedIncident.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="mr-1 bg-gray-200">
                                  {tag}
                                </Badge>
                              ))
                              : 'None'}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Images:</dt>
                          <dd>
                            {selectedIncident.images.length > 0 ? selectedIncident.images.join(', ') : 'None'}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Resolution Date:</dt>
                          <dd>{selectedIncident.resolutionDate ? formatDate(selectedIncident.resolutionDate) : 'N/A'}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Resolution Notes:</dt>
                          <dd>{selectedIncident.resolutionNotes || 'N/A'}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="font-medium text-gray-700">Updates:</dt>
                          <dd>
                            {selectedIncident.updates.length > 0
                              ? selectedIncident.updates.map((update, index) => (
                                <p key={index} className="text-sm">
                                  {JSON.stringify(update)}
                                </p>
                              ))
                              : 'None'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedIncident(null)}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p>No incident data available</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] min-h-[400px] max-h-[80vh] flex flex-col overflow-visible">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Incident</DialogTitle>
              <DialogDescription>Update the incident details below.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-gray-700">
                    Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editForm.title || ''}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-gray-700">
                    Description
                  </Label>
                  <Input
                    id="edit-description"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type" className="text-gray-700">
                    Type
                  </Label>
                  <Input
                    id="edit-type"
                    value={editForm.type || ''}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-severity" className="text-gray-700">
                    Severity
                  </Label>
                  <Select
                    value={editForm.severity || ''}
                    onValueChange={(value) =>
                      setEditForm({
                        ...editForm,
                        severity: value as IncidentType['severity'],
                        priority: value as IncidentType['priority'],
                      })
                    }
                  >
                    <SelectTrigger id="edit-severity" className="border-gray-300 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location" className="text-gray-700">
                    Location
                  </Label>
                  <Input
                    id="edit-location"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-latitude" className="text-gray-700">
                    Latitude
                  </Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    value={editForm.latitude ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, latitude: Number(e.target.value) })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                    min="-90"
                    max="90"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude" className="text-gray-700">
                    Longitude
                  </Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="any"
                    value={editForm.longitude ?? ''}
                    onChange={(e) => setEditForm({ ...editForm, longitude: Number(e.target.value) })}
                    className="border-gray-300 focus:ring-blue-500"
                    required
                    min="-180"
                    max="180"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 border-t border-gray-200 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateMutation.isPending}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Incident</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedIncident?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminIncidentsPage;