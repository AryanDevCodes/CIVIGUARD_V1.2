import React, { useEffect, useState, FC, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar, Download, Eye, Filter, Layers,
  PlusCircle, Search, UserCircle, Loader2, AlertCircle,
  ClipboardCheck, FolderOpen, FileText, Clock, CheckCircle2,
  ChevronLeft, ChevronRight, MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { incidentsService } from '@/services/apiService';
import { Label } from '@/components/ui/label';
import styles from './CasesPage.module.css';

// Define types for our data
interface Officer {
  id: string;
  name: string;
  avatar?: string;
  badgeNumber?: string;
  department?: string;
  rank?: string;
}

type CaseStatus = 'REPORTED' | 'UNDER_INVESTIGATION' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface CaseItem {
  id: string;
  title: string;
  type: string;
  status: CaseStatus;
  priority: Priority;
  description: string;
  createdAt?: string;
  dateOpened: string;
  reportDate: string;
  resolutionDate?: string;
  reportedBy: { name: string; email: string } | null;
  reporterContactInfo: string | null;
  location: {
    address: string;
    city: string;
    state: string;
    district: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  tags: string[];
  evidence: { name: string; url?: string }[];
  assignedOfficers: Officer[];
  leadOfficer?: Officer;
  updates: Array<{
    createdAt: string;
    updatedBy: { name: string; role?: string } | null;
    content: string;
    notes: string;
    timestamp: string;
  }>;
  images: string[];
  incidentType: string;
  reportDetails?: {
    reportDate: string;
    reportTime: string;
    evidence?: string[];
    witnesses?: string[];
  };
  resolutionNotes?: string;
  progress: number;
  files: number;
  tasks: { total: number; completed: number };
  nextAction: string;
}

// Map API incident status to our case status
const mapStatus = (status: string): CaseItem['status'] => {
  const statusMap: Record<string, CaseItem['status']> = {
    reported: 'REPORTED',
    under_investigation: 'UNDER_INVESTIGATION',
    in_progress: 'IN_PROGRESS',
    resolved: 'RESOLVED',
    closed: 'CLOSED',
  };
  const mappedStatus = statusMap[status.toLowerCase()];
  if (!mappedStatus) {
    console.warn(`Unrecognized status: ${status}, defaulting to REPORTED`);
    return 'REPORTED';
  }
  return mappedStatus;
};

// Map API incident to our case format
const mapIncidentToCase = (incident: any): CaseItem => {
  const getProgress = (status: string): number => {
    switch (status) {
      case 'REPORTED': return 25;
      case 'UNDER_INVESTIGATION': return 50;
      case 'IN_PROGRESS': return 75;
      case 'RESOLVED':
      case 'CLOSED': return 100;
      default: return 0;
    }
  };

  return {
    id: incident.id.toString(),
    title: incident.title || 'Untitled Case',
    type: incident.incidentType || 'Incident',
    status: mapStatus(incident.status),
    priority: (incident.priority || 'MEDIUM') as CaseItem['priority'],
    dateOpened: incident.reportDate || new Date().toISOString(),
    createdAt: incident.createdAt || incident.reportDate,
    description: incident.description || 'No description provided.',
    assignedOfficers: incident.assignedOfficers || [],
    leadOfficer: incident.assignedOfficers?.[0],
    updates: incident.updates || [],
    images: incident.images || [],
    evidence: (incident.evidence || incident.reportDetails?.evidence || []).map((e: any) => ({
      name: e.name || `Evidence ${e.id || ''}`,
      url: e.url,
    })),
    incidentType: incident.incidentType || 'Unknown',
    reportDate: incident.reportDate || new Date().toISOString(),
    reportDetails: incident.reportDetails || {
      reportDate: incident.reportDate || new Date().toISOString(),
      reportTime: new Date().toISOString().split('T')[1].split('.')[0],
      evidence: incident.images || [],
      witnesses: [],
    },
    resolutionDate: incident.resolutionDate,
    resolutionNotes: incident.resolutionNotes,
    progress: getProgress(incident.status),
    files: incident.images?.length || 0,
    tasks: {
      total: 5,
      completed: incident.updates?.length || 0,
    },
    nextAction: getNextAction(incident.status),
    reportedBy: incident.reportedBy || null,
    reporterContactInfo: incident.reporterContactInfo || null,
    location: incident.location || {
      address: '',
      city: '',
      state: '',
      district: '',
      postalCode: '',
      country: '',
      latitude: 0,
      longitude: 0,
    },
    tags: incident.tags || [],
  };
};

// Helper to determine next action based on status
const getNextAction = (status: string): string => {
  switch (status) {
    case 'REPORTED': return 'Assign to investigating officer';
    case 'UNDER_INVESTIGATION': return 'Gather evidence and statements';
    case 'IN_PROGRESS': return 'Complete investigation report';
    case 'RESOLVED': return 'Close the case';
    case 'CLOSED': return 'Case closed';
    default: return 'Review case details';
  }
};

// Helper functions for UI components
const getStatusBadge = (status: CaseItem['status']) => {
  const statusConfig: Record<CaseItem['status'], { variant: string; label: string }> = {
    REPORTED: { variant: 'default', label: 'Reported' },
    UNDER_INVESTIGATION: { variant: 'secondary', label: 'Under Investigation' },
    IN_PROGRESS: { variant: 'default', label: 'In Progress' },
    RESOLVED: { variant: 'success', label: 'Resolved' },
    CLOSED: { variant: 'success', label: 'Closed' },
  };
  const config = statusConfig[status];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
};

const getPriorityBadge = (priority: CaseItem['priority']) => {
  const priorityConfig: Record<CaseItem['priority'], { variant: string; label: string }> = {
    LOW: { variant: 'outline', label: 'Low' },
    MEDIUM: { variant: 'default', label: 'Medium' },
    HIGH: { variant: 'destructive', label: 'High' },
    CRITICAL: { variant: 'destructive', label: 'Critical' },
  };
  const config = priorityConfig[priority];
  return <Badge variant={config.variant as any}>{config.label}</Badge>;
};

const CasesPage: FC = () => {
  // State for cases and loading
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    totalPages: 1,
    totalElements: 0,
  });

  // Modal and form state
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Auth and UI hooks
  const { toast } = useToast();
  const { user } = useAuth();

  // Memoized filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter((caseItem) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        caseItem.title.toLowerCase().includes(query) ||
        caseItem.description.toLowerCase().includes(query) ||
        caseItem.id.toString().includes(query) ||
        caseItem.assignedOfficers.some((officer) =>
          officer.name.toLowerCase().includes(query)
        ) ||
        caseItem.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        caseItem.location.address.toLowerCase().includes(query);

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'active' &&
          ['REPORTED', 'UNDER_INVESTIGATION', 'IN_PROGRESS'].includes(caseItem.status)) ||
        (activeTab === 'pending' && caseItem.status === 'REPORTED') ||
        (activeTab === 'resolved' && ['RESOLVED', 'CLOSED'].includes(caseItem.status));

      return matchesSearch && matchesTab;
    });
  }, [cases, searchQuery, activeTab]);

  // Event handlers
  const handlePageChange = useCallback((newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  }, []);

  const handleViewCase = useCallback((caseItem: CaseItem) => {
    setSelectedCase(caseItem);
    setIsViewModalOpen(true);
  }, []);

  const handleViewReport = useCallback((caseItem: CaseItem) => {
    setSelectedCase(caseItem);
    setIsReportModalOpen(true);
  }, []);

  const handleAddUpdate = useCallback((caseItem: CaseItem) => {
    setSelectedCase(caseItem);
    setIsUpdateModalOpen(true);
  }, []);

  // Fetch cases
  const fetchCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const response = await incidentsService.getByOfficerId(user.id, {
        page: pagination.page - 1, // API expects 0-based page
        size: pagination.size,
      });

      // Handle the API response format
      const responseData = response?.data || response;
      const incidents = responseData.content || responseData.data?.content || [];
      const totalElements = responseData.totalElements || responseData.data?.totalElements || 0;
      const totalPages = responseData.totalPages || responseData.data?.totalPages || 1;

      if (!Array.isArray(incidents)) {
        throw new Error('Invalid API response format: Expected an array of incidents');
      }

      const mappedCases = incidents.map(mapIncidentToCase);
      setCases(mappedCases);
      setPagination((prev) => ({
        ...prev,
        totalPages,
        totalElements,
      }));
    } catch (err: any) {
      console.error('Error fetching cases:', err);
      setError(err.message || 'Failed to load cases. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load cases. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, pagination.page, pagination.size, toast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const renderCaseCard = (caseItem: CaseItem) => (
    <Card key={caseItem.id} className="overflow-hidden mb-6">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(caseItem.status)}
                  {getPriorityBadge(caseItem.priority)}
                  <Badge variant="outline">{caseItem.incidentType}</Badge>
                </div>
                <h3 className="text-xl font-semibold">{caseItem.title}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Reported: {new Date(caseItem.reportDate).toLocaleDateString()}</span>
                  <span className="text-xs">•</span>
                  <span>ID: {caseItem.id}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{caseItem.description}</p>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{caseItem.progress}%</span>
              </div>
              <Progress
                value={caseItem.progress}
                className="h-2"
                indicatorClassName={
                  caseItem.progress === 100
                    ? 'bg-green-500'
                    : caseItem.progress > 50
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }
              />
            </div>

            <div className="pt-3">
              <p className="text-sm font-medium mb-2">Assigned Team</p>
              <div className="flex items-center gap-4">
                {caseItem.leadOfficer ? (
                  <div className="flex items-center gap-2 bg-primary/10 py-1 px-3 rounded-full">
                    <UserCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{caseItem.leadOfficer.name}</span>
                    <Badge variant="outline" className="text-xs bg-white">Lead</Badge>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No lead officer</span>
                )}
                <div className="flex -space-x-2">
                  {caseItem.assignedOfficers.map((officer, index) => (
                    <Avatar key={index} className="border-2 border-background h-8 w-8">
                      <AvatarImage src={officer.avatar || ''} alt={officer.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-64 flex flex-col gap-4">
            <Card className="bg-muted border-none shadow-none">
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Next Action</p>
                  <p className="text-xs text-muted-foreground">
                    {caseItem.nextAction || 'No action required'}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-background rounded-lg border">
                    <p className="text-lg font-semibold">{caseItem.updates.length}</p>
                    <p className="text-xs text-muted-foreground">Updates</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg border">
                    <p className="text-lg font-semibold">{caseItem.images.length}</p>
                    <p className="text-xs text-muted-foreground">Files</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg border">
                    <p className="text-lg font-semibold">
                      {caseItem.tasks?.completed || 0}/{caseItem.tasks?.total || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                size="sm"
                onClick={() => handleViewCase(caseItem)}
              >
                <Eye className="mr-2 h-4 w-4" /> View Case
              </Button>
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => {
                  if (caseItem.status === 'RESOLVED' || caseItem.status === 'CLOSED') {
                    handleViewReport(caseItem);
                  } else {
                    handleAddUpdate(caseItem);
                  }
                }}
              >
                {caseItem.status === 'RESOLVED' || caseItem.status === 'CLOSED' ? (
                  <>
                    <ClipboardCheck className="mr-2 h-4 w-4" /> View Report
                  </>
                ) : (
                  <>
                    <Layers className="mr-2 h-4 w-4" /> Add Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderEmptyState = (message: string, description: string) => (
    <div className="text-center py-12">
      <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-medium">{message}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );

  // View Case Modal Component
  const ViewCaseModal: FC = () => {
    if (!selectedCase) {
      return (
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent>
            <div>No case selected</div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={isViewModalOpen} onOpenChange={() => { setIsViewModalOpen(false); setSelectedCase(null); }}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Case Details: {selectedCase.title}</DialogTitle>
            <DialogDescription>
              {selectedCase.id} • Created on {new Date(selectedCase.createdAt || selectedCase.reportDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Basic Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Case Details</h3>
              <div className="text-sm text-muted-foreground">Case ID: {selectedCase.id}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Incident Type</Label>
                  <div className="col-span-3">
                    <Badge variant="outline" className="text-sm">{selectedCase.incidentType || 'Not specified'}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Priority</Label>
                  <div className="col-span-3">{getPriorityBadge(selectedCase.priority)}</div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">{getStatusBadge(selectedCase.status)}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Reported On</Label>
                  <div className="col-span-3 text-sm">
                    {selectedCase.reportDate ? new Date(selectedCase.reportDate).toLocaleString() : 'N/A'}
                  </div>
                </div>
                {selectedCase.resolutionDate && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Resolved On</Label>
                    <div className="col-span-3 text-sm">{new Date(selectedCase.resolutionDate).toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Location</Label>
              <div className="col-span-3 space-y-2">
                {selectedCase.location.address ? (
                  <div className="space-y-1">
                    <p className="font-medium">{selectedCase.location.address}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>
                        <p>{selectedCase.location.city}, {selectedCase.location.state}</p>
                        <p>{selectedCase.location.district}</p>
                      </div>
                      <div className="text-right">
                        <p>{selectedCase.location.postalCode}</p>
                        <p>{selectedCase.location.country}</p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedCase.location.latitude},${selectedCase.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      View on Map
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No location information available</p>
                )}
              </div>
            </div>

            {/* Tags */}
            {selectedCase.tags.length > 0 && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Tags</Label>
                <div className="col-span-3 flex flex-wrap gap-2">
                  {selectedCase.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Reporter Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Reporter Information</h4>
              <div className="grid grid-cols-4 items-start gap-4 bg-muted/30 p-4 rounded-lg">
                <Label className="text-right pt-2">Reported By</Label>
                <div className="col-span-3 space-y-2">
                  {selectedCase.reportedBy ? (
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{selectedCase.reportedBy.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedCase.reportedBy.email}</p>
                      </div>
                    </div>
                  ) : selectedCase.reporterContactInfo ? (
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm">{selectedCase.reporterContactInfo}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Anonymous Reporter</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence & Files */}
            {(selectedCase.images.length > 0 || selectedCase.evidence.length > 0) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Evidence & Files</h4>
                <div className="grid grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
                  <Label className="text-right pt-2">Media</Label>
                  <div className="col-span-3">
                    {selectedCase.images.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {selectedCase.images.map((image, index) => (
                          <div key={index} className="relative group aspect-square rounded-md overflow-hidden border">
                            <img
                              src={`/api/incidents/${selectedCase.id}/images/${image}`}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/20"
                                onClick={() => window.open(`/api/incidents/${selectedCase.id}/images/${image}`, '_blank')}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No media files attached</p>
                    )}
                  </div>

                  {selectedCase.evidence.length > 0 && (
                    <>
                      <Label className="text-right pt-2">Attachments</Label>
                      <div className="col-span-3 space-y-2">
                        {selectedCase.evidence.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            {file.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Assigned Officers */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Assigned Team</h4>
              <div className="grid grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg">
                <Label className="text-right pt-2">Officers</Label>
                <div className="col-span-3">
                  {selectedCase.assignedOfficers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCase.assignedOfficers.map((officer) => (
                        <div
                          key={officer.id}
                          className={`flex items-center gap-3 p-3 rounded-md border ${
                            officer.id === selectedCase.leadOfficer?.id
                              ? 'border-primary/20 bg-primary/5'
                              : 'border-transparent hover:border-border'
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={officer.avatar} alt={officer.name} />
                            <AvatarFallback className="text-xs">
                              {officer.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate">
                                {officer.name}
                                {officer.id === selectedCase.leadOfficer?.id && (
                                  <span className="ml-2 text-xs text-primary">(Lead)</span>
                                )}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {officer.badgeNumber && (
                                <Badge variant="secondary" className="text-xs font-mono">{officer.badgeNumber}</Badge>
                              )}
                              {officer.rank && (
                                <Badge variant="outline" className="text-xs">{officer.rank}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <UserCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No officers assigned to this case</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Assign Officer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Case Description */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Case Description</h4>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">{selectedCase.description || 'No description provided'}</p>
              </div>
            </div>

            {/* Case Updates & Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Case Activity</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleAddUpdate(selectedCase);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Update
                </Button>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                {selectedCase.updates.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                    {selectedCase.updates
                      .sort((a, b) => new Date(b.createdAt || b.timestamp).getTime() - new Date(a.createdAt || a.timestamp).getTime())
                      .map((update, index) => (
                        <div key={index} className="relative pl-9 pb-6 last:pb-2 group">
                          <div className="absolute left-0 w-10 h-10 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            {update.content.includes('Status changed to') ? (
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                            ) : update.content.includes('assigned') ? (
                              <UserCircle className="h-4 w-4 text-primary" />
                            ) : update.content.includes('file') ? (
                              <FileText className="h-4 w-4 text-primary" />
                            ) : (
                              <Clock className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="bg-background p-3 rounded-lg border shadow-sm hover:shadow transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{update.updatedBy?.name || 'System'}</span>
                                {update.updatedBy?.role && (
                                  <Badge variant="outline" className="text-xs">{update.updatedBy.role}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(update.createdAt || update.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm">{update.content || update.notes || 'No content'}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ClipboardCheck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add updates to track the progress of this case</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsViewModalOpen(false); setSelectedCase(null); }}>
              Close
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setIsViewModalOpen(false);
                setTimeout(() => setIsReportModalOpen(true), 100);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // View Report Modal Component
  const ViewReportModal: FC = () => {
    if (!selectedCase) {
      return (
        <Dialog open={isReportModalOpen} onOpenChange={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
          <DialogContent className="max-w-3xl">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No case selected</h3>
              <p className="text-sm text-muted-foreground mt-2">Please select a case to view its report.</p>
              <Button className="mt-4" onClick={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (!selectedCase.reportDetails) {
      return (
        <Dialog open={isReportModalOpen} onOpenChange={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
          <DialogContent className="max-w-3xl">
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No report available</h3>
              <p className="text-sm text-muted-foreground mt-2">This case doesn't have a report yet.</p>
              <Button className="mt-4" onClick={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    const { reportDetails } = selectedCase;

    return (
      <Dialog open={isReportModalOpen} onOpenChange={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Case Report: {selectedCase.title}</DialogTitle>
            <DialogDescription>
              Report generated on {new Date(reportDetails.reportDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Case Summary</h4>
              <p className="text-sm">{selectedCase.description || 'No summary provided.'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Report Date</h4>
                <p>{reportDetails.reportDate}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Report Time</h4>
                <p>{reportDetails.reportTime}</p>
              </div>
            </div>

            {reportDetails.evidence?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h4>
                <div className="grid grid-cols-2 gap-2">
                  {reportDetails.evidence.map((evidence, index) => (
                    <div key={index} className="rounded-md border p-3">
                      <p className="text-sm">{evidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportDetails.witnesses?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Witnesses</h4>
                <div className="space-y-2">
                  {reportDetails.witnesses.map((witness, index) => (
                    <div key={index} className="rounded-md border p-3">
                      <p className="text-sm">{witness}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCase.resolutionNotes && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Resolution Notes
                </h4>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">{selectedCase.resolutionNotes}</p>
                {selectedCase.resolutionDate && (
                  <p className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Resolved on: {new Date(selectedCase.resolutionDate).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsReportModalOpen(false); setSelectedCase(null); }}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Add Update Modal Component
  const AddUpdateModal: FC = () => {
    const [formData, setFormData] = useState({
      notes: '',
      status: selectedCase?.status || 'IN_PROGRESS',
      priority: selectedCase?.priority || 'MEDIUM',
      evidenceUrls: [] as string[],
      newEvidenceUrl: '',
    });

    const handleAddEvidence = () => {
      if (formData.newEvidenceUrl.trim()) {
        setFormData({
          ...formData,
          evidenceUrls: [...formData.evidenceUrls, formData.newEvidenceUrl],
          newEvidenceUrl: '',
        });
      }
    };

    const handleRemoveEvidence = (urlToRemove: string) => {
      setFormData({
        ...formData,
        evidenceUrls: formData.evidenceUrls.filter((url) => url !== urlToRemove),
      });
    };

    const handleSubmit = async () => {
      const notes = formData.notes.trim();
      const status = formData.status;
      const evidenceUrls = [...formData.evidenceUrls];

      if (!notes && evidenceUrls.length === 0) {
        toast({
          title: 'Error',
          description: 'Please provide either an update note or evidence URL',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      try {
        // If status changed, update it first
        if (status !== selectedCase?.status) {
          await incidentsService.updateStatus(
            selectedCase?.id || '',
            status,
            notes || 'Status updated'
          );
        }

        // Add the main update with notes if provided
        if (notes) {
          // If status changed, we already included the note in the status update
          if (status === selectedCase?.status) {
            await incidentsService.addUpdate(
              selectedCase?.id || '',
              notes
            );
          }
        }

        // Add evidence URLs as separate updates if any
        for (const url of evidenceUrls) {
          await incidentsService.addUpdate(
            selectedCase?.id || '',
            `Added evidence: ${url}`
          );
          // Optionally, you might want to update the incident with the evidence URLs
          // This would require a separate API endpoint
        }

        let successMessage = 'Update added successfully';
        if (formData.evidenceUrls.length > 0) {
          successMessage += '\n\nEvidence URLs added:\n' + formData.evidenceUrls.map((url, index) => `${index + 1}. ${url}`).join('\n');
        }

        toast({
          title: 'Success',
          description: successMessage,
          duration: formData.evidenceUrls.length > 0 ? 8000 : 5000,
          className: 'whitespace-pre-line',
        });

        setIsUpdateModalOpen(false);
        setSelectedCase(null);
        setFormData({
          notes: '',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          evidenceUrls: [],
          newEvidenceUrl: '',
        });
        await fetchCases();
      } catch (error: any) {
        console.error('Error adding update:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to add update',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog open={isUpdateModalOpen} onOpenChange={() => { setIsUpdateModalOpen(false); setSelectedCase(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Update</DialogTitle>
            <DialogDescription>Add a new update for {selectedCase?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CaseStatus })}
                disabled={isLoading}
              >
                <option value="REPORTED">Reported</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                disabled={isLoading}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <div className="space-y-2">
                <Textarea
                  id="notes"
                  placeholder="Enter update details..."
                  rows={5}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            <div className="space-y-2">
              <Label>Evidence URLs</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="Add evidence URL..."
                  value={formData.newEvidenceUrl}
                  onChange={(e) => setFormData({ ...formData, newEvidenceUrl: e.target.value })}
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEvidence()}
                />
                <Button
                  type="button"
                  onClick={handleAddEvidence}
                  disabled={!formData.newEvidenceUrl.trim() || isLoading}
                >
                  Add
                </Button>
              </div>

              {formData.evidenceUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {formData.evidenceUrls.map((url, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {url}
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEvidence(url)}
                        disabled={isLoading}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <DialogFooter className="gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData({
                    notes: '',
                    status: selectedCase?.status || 'IN_PROGRESS',
                    priority: selectedCase?.priority || 'MEDIUM',
                    evidenceUrls: [],
                    newEvidenceUrl: '',
                  });
                  setIsUpdateModalOpen(false);
                  setSelectedCase(null);
                }}
                disabled={isLoading}
                className="w-full sm:w-32"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                onClick={handleSubmit}
                disabled={(!formData.notes.trim() && formData.evidenceUrls.length === 0) || isLoading}
                className="w-full sm:w-40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit Update
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Pagination Controls Component
  const PaginationControls = () => (
    <div className="flex justify-between items-center mt-4">
      <Button
        variant="outline"
        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
        disabled={pagination.page === 1}
        className="gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      <span className="text-sm text-gray-600">
        Page {pagination.page} of {Math.max(1, pagination.totalPages)}
      </span>
      <Button
        variant="outline"
        onClick={() => handlePageChange(pagination.page + 1)}
        disabled={pagination.page >= pagination.totalPages}
        className="gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading cases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{error}</span>
        <Button variant="outline" className="mt-4" onClick={fetchCases}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ViewCaseModal />
      <ViewReportModal />
      <AddUpdateModal />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Case Management</h1>
          <p className="text-muted-foreground">View and manage all assigned cases</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'active', 'pending', 'resolved'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="whitespace-nowrap"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {filteredCases.length > 0 ? (
          filteredCases.map((caseItem) => renderCaseCard(caseItem))
        ) : (
          <Card>
            <CardContent className="p-6">
              {renderEmptyState(
                'No cases found',
                searchQuery || activeTab !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'There are no cases assigned to you at this time.'
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls />
        </div>
      )}
    </div>
  );
};

export default CasesPage;