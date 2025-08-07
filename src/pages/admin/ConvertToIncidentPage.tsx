// src/pages/admin/ConvertToIncidentPage.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { officersService } from '@/services/apiService';
import { reportsService, ReportData } from '@/services/reportsService';
import { Loader2, ArrowLeft, Check, AlertTriangle } from 'lucide-react';

// Types
interface Officer {
  id: number;
  name: string;
  badgeNumber: string;
  region: string;
  department: string;
  contactNumber?: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
  };
}

interface OfficerResponse {
  content: Officer[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

interface Filters {
  region: string;
  department: string;
  search: string;
}

const ConvertToIncidentPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [selectedOfficerIds, setSelectedOfficerIds] = useState<number[]>([]);
  const [conversionNotes, setConversionNotes] = useState('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    region: '',
    department: '',
  });

  // Fetch report details
  const { data: report, isLoading: isReportLoading, error: reportError } = useQuery<ReportData>({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) throw new Error('No report ID provided');
      return await reportsService.getById(reportId);
    },
    enabled: !!reportId,
    onError: (error: Error) => {
      sonnerToast.error(error.message || 'Failed to load report details');
    },
  });

  // Log when component mounts and when filters change
  React.useEffect(() => {
    console.log('ConvertToIncidentPage mounted or filters changed', { filters });
    
    // Manually trigger a refetch when filters change
    queryClient.invalidateQueries({ queryKey: ['officers'] });
  }, [filters, queryClient]);

  // Add a ref to track if this is the initial render
  const isInitialMount = React.useRef(true);

  // Fetch available officers with filters
  const { 
    data: officersResponse, 
    isLoading: isOfficersLoading,
    error: officersError,
    isError: isOfficersError,
    refetch: refetchOfficers
  } = useQuery<OfficerResponse>({
    queryKey: ['officers', filters],
    // Ensure the query is always executed, even if there's cached data
    staleTime: 0,
    gcTime: 0, // cacheTime was renamed to gcTime in newer versions
    retry: 1, // Will retry failed requests once
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    queryFn: async () => {
      console.log('Query function for officers is being executed');
      try {
        console.log('Fetching officers with filters:', JSON.stringify(filters, null, 2));
        
        // Log the service being used
        console.log('Using officersService:', officersService);
        
        const response = await officersService.getAll({
          page: 0,
          size: 100,
          sort: 'name,asc',
          status: 'ACTIVE',
          ...filters,
        });
        
        console.log('Raw officers API response:', JSON.stringify(response, null, 2));
        
        // Handle different possible response structures
        const content = response?.content || response?.data?.content || response?.data || [];
        console.log('Processed content:', content);
        
        // Check if content is an array
        if (!Array.isArray(content)) {
          console.error('Expected content to be an array, got:', typeof content);
          throw new Error('Invalid response format: expected an array of officers');
        }
        
        const processedResponse: OfficerResponse = {
          content: content.map((officer: any) => ({
            id: officer.id,
            name: officer.name || `${officer.user?.firstName || ''} ${officer.user?.lastName || ''}`.trim() || 'Unnamed Officer',
            email: officer.email || '',
            badgeNumber: officer.badgeNumber || 'N/A',
            region: officer.region || 'Unassigned',
            department: officer.department || 'General',
            contactNumber: officer.contactNumber,
            user: officer.user,
          })),
          totalElements: response?.totalElements || response?.data?.totalElements || 0,
          totalPages: response?.totalPages || response?.data?.totalPages || 1,
          page: response?.page || response?.data?.page || 0,
          size: response?.size || response?.data?.size || 100,
          first: response?.first ?? true,
          last: response?.last ?? true,
          numberOfElements: response?.numberOfElements || response?.data?.numberOfElements || 0,
        };
        
        console.log('Processed officers response:', processedResponse);
        return processedResponse;
      } catch (error) {
        console.error('Error in officers queryFn:', error);
        sonnerToast.error(`Failed to load officers: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
  });
  
  // Handle query errors
  useEffect(() => {
    if (officersError) {
      console.error('Officers query error:', officersError);
      sonnerToast.error(`Failed to load officers: ${officersError instanceof Error ? officersError.message : 'Unknown error'}`);
    }
  }, [officersError]);
  
  // Log query state changes with department information
  React.useEffect(() => {
    if (officersResponse?.content) {
      // Log department distribution
      const departmentCounts = officersResponse.content.reduce((acc, officer) => {
        const dept = officer.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('Officers by department:', departmentCounts);
      
      // Log sample officers with their department info
      const sampleOfficers = officersResponse.content.slice(0, 5).map(o => ({
        id: o.id,
        name: o.name,
        department: o.department || 'Unassigned',
        region: o.region || 'Unassigned',
        badgeNumber: o.badgeNumber || 'N/A'
      }));
      
      console.log('Sample officers with departments:', sampleOfficers);
    }
    
    console.log('Officers query state:', {
      isLoading: isOfficersLoading,
      isError: isOfficersError,
      error: officersError,
      data: officersResponse ? {
        totalElements: officersResponse.totalElements,
        contentLength: officersResponse.content?.length || 0,
        departmentDistribution: officersResponse.content?.reduce((acc, o) => {
          const dept = o.department || 'Unassigned';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      } : 'No data'
    });
  }, [isOfficersLoading, isOfficersError, officersError, officersResponse]);
  
  // Debug function to manually refresh officers
  const handleRefreshOfficers = async () => {
    console.log('Manually refreshing officers...');
    try {
      const result = await refetchOfficers();
      console.log('Manual refresh result:', {
        status: result.status,
        data: result.data ? {
          totalElements: result.data.totalElements,
          contentLength: result.data.content?.length || 0
        } : 'No data',
        error: result.error
      });
    } catch (error) {
      console.error('Error during manual refresh:', error);
    }
  };

  // Handle conversion to incident
  const convertToIncident = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error('No report selected');
      if (selectedOfficerIds.length === 0) throw new Error('Please select at least one officer');
      
      const response = await reportsService.convertToIncident(reportId, {
        officerIds: selectedOfficerIds,
        notes: conversionNotes.trim() || undefined,
        status: 'IN_PROGRESS' // Explicitly set the status
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to convert report to incident');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      sonnerToast.success('Report converted to incident successfully');
      navigate('/admin/incidents');
    },
    onError: (error: Error) => {
      sonnerToast.error(error.message || 'Failed to convert report to incident');
      console.error('Conversion error:', error);
    },
  });

  // Handle officer selection
  const handleOfficerSelect = (officerId: number) => {
    setSelectedOfficerIds((prev) =>
      prev.includes(officerId) ? prev.filter((id) => id !== officerId) : [...prev, officerId]
    );
  };

  // Get unique regions and departments
  const uniqueRegions = useMemo(() => {
    return Array.from(
      new Set(officersResponse?.content?.map((officer) => officer.region).filter(Boolean) || [])
    ).sort();
  }, [officersResponse]);

  const uniqueDepartments = useMemo(() => {
    return Array.from(
      new Set(officersResponse?.content?.map((officer) => officer.department).filter(Boolean) || [])
    ).sort();
  }, [officersResponse]);

  // Handle filter changes
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  // Combined loading and error state
  if (isReportLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reportError || !report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Report not found</h2>
          <Button
            className="mt-4"
            onClick={() => navigate('/admin/reports')}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Debug button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            console.log('Debug button clicked');
            handleRefreshOfficers();
          }}
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
        >
          🔍 Debug: Refresh Officers
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Convert Report to Incident</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Details */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
              <CardDescription>Information about the report being converted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <p className="font-medium">{report.title || 'No title'}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="whitespace-pre-line">{report.description || 'No description'}</p>
              </div>
              <div>
                <Label>Location</Label>
                <p>{(report as any).location?.address || 'No location'}</p>
              </div>
              <div>
                <Label>Reported On</Label>
                <p>
                  {(report as any).createdAt
                    ? new Date((report as any).createdAt).toLocaleString()
                    : 'Unknown date'}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={report.status === 'PENDING' ? 'default' : 'secondary'}>
                  {report.status || 'UNKNOWN'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Officer Assignment */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assign Officers</CardTitle>
              <CardDescription>Select officers to assign to this incident</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={filters.region || 'all'}
                    onValueChange={(value) => handleFilterChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Regions</SelectItem>
                      {uniqueRegions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={filters.department || 'all'}
                    onValueChange={(value) => handleFilterChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {uniqueDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Search officers..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              {/* Officers List */}
              {isOfficersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !officersResponse?.content ? (
                <div className="text-center py-8 text-muted-foreground">
                  No officers data available
                </div>
              ) : officersResponse.content.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {officersResponse.content.map((officer) => (
                    <div
                      key={officer.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedOfficerIds.includes(officer.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleOfficerSelect(officer.id)}
                      role="checkbox"
                      aria-checked={selectedOfficerIds.includes(officer.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleOfficerSelect(officer.id);
                          e.preventDefault();
                        }
                      }}
                    >
                      <div className="flex items-center h-5">
                        <div className="flex items-center justify-center h-5 w-5 rounded border border-gray-300">
                          {selectedOfficerIds.includes(officer.id) && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">
                          {officer.name}{' '}
                          <span className="text-muted-foreground text-sm ml-2">
                            {officer.badgeNumber && `#${officer.badgeNumber}`}
                          </span>
                        </p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {officer.department !== 'General' && (
                            <>
                              <span>{officer.department}</span>
                              {officer.region !== 'Unassigned' && <span className="mx-1">•</span>}
                            </>
                          )}
                          {officer.region !== 'Unassigned' && <span>{officer.region}</span>}
                          {officer.department === 'General' && officer.region === 'Unassigned' && (
                            <span className="text-xs">No additional info</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No officers found</p>
              )}
            </CardContent>
          </Card>

          {/* Conversion Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Incident Notes</CardTitle>
              <CardDescription>Add any additional notes for this incident</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter any additional information about this incident..."
                rows={4}
                value={conversionNotes}
                onChange={(e) => setConversionNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={convertToIncident.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => convertToIncident.mutate()}
              disabled={selectedOfficerIds.length === 0 || convertToIncident.isPending}
            >
              {convertToIncident.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Convert to Incident
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertToIncidentPage;