
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Clock, FileBarChart, FileEdit, FolderSearch, Loader2, MapPin, X, Search, Filter as FilterIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/apiService';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';
import { Libraries } from '@react-google-maps/api';

// Define libraries for Google Maps
const libraries = ['places', 'marker'] as const;

interface Report {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  date: string;
  time: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  location?: string;
  witnesses?: string;
  evidence?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
}

// Form validation schema
const reportFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.string().min(1, 'Please select a report type'),
  priority: z.string().min(1, 'Please select a priority'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(1, 'Location is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  witnesses: z.string().optional(),
  evidence: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const ReportsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 23.2599, lng: 77.4126 }); // Default to Bhopal coordinates
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  });
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  
  // Load Google Maps API
  const { isLoaded: isMapApiLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as unknown as Libraries,
  });

  // Validate API key
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key is missing. Please contact support.');
    }
  }, []);
  
  // Reset selected report when component unmounts or when navigating away
  useEffect(() => {
    return () => setSelectedReport(null);
  }, []);
  
  const handleReportClick = useCallback((report: Report) => {
    setSelectedReport(report);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const handleBackToList = useCallback(() => {
    setSelectedReport(null);
  }, []);
  
  const handleShowMap = useCallback(
    debounce(() => setShowMap(prev => !prev), 100),
    []
  );

  // Clean up markers
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      markersRef.current = [];
    };
  }, []);
  
  // Build query params from filters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    return params;
  };

  // Fetch reports from the API
  const { data: reportsData, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    queryFn: async () => {
      try {
        console.log('Fetching reports with filters:', filters);
        const params = buildQueryParams();
        const response = await apiService.get(`/reports?${params.toString()}`);
        console.log('Raw API response:', response);
        
        // Handle different response structures
        let reports = [];
        if (Array.isArray(response)) {
          reports = response;
        } else if (response && Array.isArray(response.content)) {
          reports = response.content; // Handle paged response
        } else if (response && Array.isArray(response.data)) {
          reports = response.data; // Handle data wrapper
        } else if (response && response.data && Array.isArray(response.data.content)) {
          reports = response.data.content; // Handle nested paged response
        }
        
        console.log('Processed reports:', reports);
        return reports;
      } catch (error) {
        console.error('Error fetching reports:', error);
        toast({
          title: 'Error',
          description: 'Failed to load reports. Please try again later.',
          variant: 'destructive',
        });
        return [];
      }
    }
  });

  // Form handling
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'CRIME',
      priority: 'MEDIUM',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      location: '',
      witnesses: '',
      evidence: ''
    }
  });

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle map click for location selection
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newPosition = { lat, lng };
    
    setMarkerPosition(newPosition);
    // Update form values
    form.setValue('latitude', lat, { shouldValidate: true });
    form.setValue('longitude', lng, { shouldValidate: true });
    
    // Show loading state
    form.setValue('location', 'Getting address...');
    
    // Reverse geocode to get address
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: newPosition }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        form.setValue('location', results[0].formatted_address, { shouldValidate: true });
      } else {
        form.setValue('location', 'Address not found', { shouldValidate: true });
      }
    });
  };

  // Handle form submission
  const onSubmit = async (data: ReportFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Ensure we have coordinates
      if (!markerPosition) {
        toast({
          title: 'Location Required',
          description: 'Please select a location on the map',
          variant: 'destructive',
        });
        return;
      }

      // Basic form validation
      if (!data.title || !data.description || !data.location) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Prepare location data in the expected format
      const locationData: any = {
        address: data.location || 'No address provided',
      };

      // Add coordinates if available
      if (markerPosition) {
        locationData.lat = markerPosition.lat;
        locationData.lng = markerPosition.lng;
        locationData.latitude = markerPosition.lat;
        locationData.longitude = markerPosition.lng;
      }

      const reportData = {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: 'PENDING',
        location: locationData,
        date: data.date,
        time: data.time,
        witnesses: data.witnesses || '',
        evidence: data.evidence || '',
        createdAt: new Date().toISOString(),
        // Include locationString as a fallback for older API versions
        locationString: data.location || 'No address provided',
      };

      const response = await apiService.post('/reports', reportData);
      
      if (response.data) {
        toast({
          title: 'Success',
          description: 'Report created successfully',
          variant: 'default',
        });
        
        setIsCreateDialogOpen(false);
        form.reset();
        refetch(); // Refresh the reports list
      } else {
        throw new Error('No data returned from server');
      }
    } catch (error: any) {
      console.error('Error creating report:', error);
      
      let errorMessage = 'Failed to create report. Please try again.';
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support geolocation',
        variant: 'destructive',
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
        
        // Update form values
        form.setValue('latitude', latitude);
        form.setValue('longitude', longitude);
        
        // Get address from coordinates
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: newPosition }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            form.setValue('location', results[0].formatted_address);
          }
          setIsGettingLocation(false);
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        toast({
          title: 'Error getting location',
          description: 'Could not get your current location. Using default location instead.',
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }, [form]);

  // Open create dialog
  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
    getUserLocation(); // Get user's location when dialog opens
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      status: '',
      type: '',
      priority: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Debug: Log the current state
  useEffect(() => {
    console.log('Reports data:', reportsData);
    console.log('Is loading:', isLoading);
    console.log('Error:', error);
  }, [reportsData, isLoading, error]);

  // Ensure reports is always an array
  const reports = Array.isArray(reportsData) ? reportsData : [];
  
  // Render the detailed view when a report is selected
  if (selectedReport) {
    return (
      <DashboardLayout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <Button 
            variant="ghost" 
            className="mb-4" 
            onClick={handleBackToList}
          >
            ← Back to Reports
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{selectedReport.title}</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="capitalize">{selectedReport.type.toLowerCase()}</span> • 
                    <span className="ml-1 capitalize">{selectedReport.status.toLowerCase()}</span>
                  </CardDescription>
                </div>
                <span className="text-sm text-muted-foreground">
                  Created: {new Date(selectedReport.createdAt).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                  <p>{selectedReport.date ? new Date(selectedReport.date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Time</h4>
                  <p>{selectedReport.time || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Priority</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedReport.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                    selectedReport.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {selectedReport.priority || 'N/A'}
                  </span>
                </div>
                {selectedReport.location && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                    <p>{selectedReport.location}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                  <div className="p-4 bg-muted/50 rounded-md">
                    {selectedReport.description || 'No description provided.'}
                  </div>
                </div>
                
                {selectedReport.witnesses && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Witnesses</h4>
                    <div className="p-4 bg-muted/50 rounded-md">
                      {selectedReport.witnesses}
                    </div>
                  </div>
                )}
                
                {selectedReport.evidence && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Evidence</h4>
                    <div className="p-4 bg-muted/50 rounded-md">
                      {selectedReport.evidence}
                    </div>
                  </div>
                )}
                
                {selectedReport.resolutionNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Resolution Notes</h4>
                    <div className="p-4 bg-muted/50 rounded-md">
                      {selectedReport.resolutionNotes}
                    </div>
                    {selectedReport.resolvedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Resolved on: {new Date(selectedReport.resolvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {selectedReport.latitude && selectedReport.longitude && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Location on Map</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleShowMap}
                      className="text-xs"
                    >
                      {showMap ? 'Hide Map' : 'Show Fullscreen'}
                    </Button>
                  </div>
                  <div className="h-48 bg-muted/50 rounded-md overflow-hidden">
                    {isMapApiLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{
                          lat: selectedReport.latitude || 0,
                          lng: selectedReport.longitude || 0,
                        }}
                        zoom={15}
                        options={{
                          disableDefaultUI: true,
                          zoomControl: true,
                          fullscreenControl: false,
                        }}
                      >
                        <Marker
                          position={{
                            lat: selectedReport.latitude || 0,
                            lng: selectedReport.longitude || 0,
                          }}
                          icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#4285F4',
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 2,
                            scale: 10,
                          }}
                        />
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-muted-foreground text-sm">
                          Loading map...
                        </p>
                      </div>
                    )}
                  </div>
                  {mapError && (
                    <p className="text-xs text-red-500 mt-2">{mapError}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }
  
  // Render the list view when no report is selected
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">Access and create incident reports and documentation</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <FilterIcon className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button className="w-full md:w-auto" onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Report
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="relative">
                    <Select
                      value={filters.status || 'ALL'}
                      onValueChange={(value) => handleFilterChange('status', value === 'ALL' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="REJECTED">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <div className="relative">
                    <Select
                      value={filters.type || 'ALL'}
                      onValueChange={(value) => handleFilterChange('type', value === 'ALL' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="CRIME">Crime</SelectItem>
                        <SelectItem value="ACCIDENT">Accident</SelectItem>
                        <SelectItem value="HAZARD">Hazard</SelectItem>
                        <SelectItem value="NOISE">Noise Complaint</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="relative">
                    <Select
                      value={filters.priority || 'ALL'}
                      onValueChange={(value) => handleFilterChange('priority', value === 'ALL' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Priorities</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    min={filters.dateFrom}
                  />
                </div>

                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>Latest documentation submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="space-y-2">
                  {reports.map((report: Report) => (
                    <div 
                      key={report.id} 
                      className="p-4 border rounded-lg mb-3 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleReportClick(report)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {report.type} • {report.status}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-2">
                        {report.description?.substring(0, 120)}{report.description?.length > 120 ? '...' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {report.date && (
                          <span className="inline-flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        )}
                        {report.time && (
                          <span className="inline-flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {report.time}
                          </span>
                        )}
                        {report.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            report.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                            report.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {report.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                    <FolderSearch className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Reports Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The reporting system is currently under development and will be available soon.
                    This feature will allow you to create, view, and manage detailed incident reports.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={openCreateDialog}
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Create New Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Fullscreen Map Modal */}
      <Dialog open={showMap} onOpenChange={setShowMap}>
        <DialogContent className="max-w-6xl w-full h-[80vh] p-0">
          <div className="relative w-full h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full w-8 h-8"
              onClick={() => setShowMap(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedReport?.latitude && selectedReport?.longitude && isMapApiLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={{
                  lat: selectedReport.latitude || 0,
                  lng: selectedReport.longitude || 0,
                }}
                zoom={15}
                options={{
                  streetViewControl: true,
                  mapTypeControl: true,
                  fullscreenControl: true,
                }}
              >
                <Marker
                  position={{
                    lat: selectedReport.latitude || 0,
                    lng: selectedReport.longitude || 0,
                  }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                    scale: 10,
                  }}
                />
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Report Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input 
                  id="title" 
                  placeholder="Enter report title"
                  {...form.register('title')} 
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select 
                  onValueChange={(value) => form.setValue('type', value)}
                  value={form.watch('type')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRIME">Crime</SelectItem>
                    <SelectItem value="ACCIDENT">Accident</SelectItem>
                    <SelectItem value="HAZARD">Hazard</SelectItem>
                    <SelectItem value="NOISE">Noise Complaint</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500">{form.formState.errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  onValueChange={(value) => form.setValue('priority', value)}
                  value={form.watch('priority')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.priority && (
                  <p className="text-sm text-red-500">{form.formState.errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input 
                  id="date" 
                  type="date" 
                  {...form.register('date')}
                />
                {form.formState.errors.date && (
                  <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input 
                  id="time" 
                  type="time" 
                  {...form.register('time')}
                />
                {form.formState.errors.time && (
                  <p className="text-sm text-red-500">{form.formState.errors.time.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Location *</Label>
                <Input 
                  id="location" 
                  placeholder="Enter location or click on the map"
                  {...form.register('location')}
                />
                {form.formState.errors.location && (
                  <p className="text-sm text-red-500">{form.formState.errors.location.message}</p>
                )}
              </div>


              <div className="space-y-2 md:col-span-2">
                <Label>Description *</Label>
                <Textarea 
                  placeholder="Enter detailed description" 
                  className="min-h-[100px]"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="witnesses">Witnesses (Optional)</Label>
                <Input 
                  id="witnesses" 
                  placeholder="Names of witnesses"
                  {...form.register('witnesses')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidence">Evidence (Optional)</Label>
                <Input 
                  id="evidence" 
                  type="file" 
                  onChange={(e) => form.setValue('evidence', e.target.files?.[0]?.name || '')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex justify-between items-center">
                  <Label>Click on the map to set location</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={getUserLocation}
                    disabled={isGettingLocation}
                    className="flex items-center gap-1.5"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5" />
                    )}
                    {isGettingLocation ? 'Getting location...' : 'Use my location'}
                  </Button>
                </div>
                <div className="h-64 relative">
                {isMapApiLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={mapCenter}
                    zoom={15}
                    onClick={handleMapClick}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                    }}
                  >
                    {markerPosition && (
                      <Marker
                        position={markerPosition}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          fillColor: '#4285F4',
                          fillOpacity: 1,
                          strokeColor: '#FFFFFF',
                          strokeWeight: 2,
                          scale: 10,
                        }}
                      />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="h-full flex items-center justify-center bg-muted/50 rounded-md">
                    <p className="text-muted-foreground">Loading map...</p>
                  </div>
                )}
                </div>
                {form.formState.errors.latitude && (
                  <p className="text-sm text-red-500">Please select a location on the map</p>
                )}
                {isGettingLocation && (
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center rounded-md">
                    <div className="bg-white p-2 rounded-md shadow-md flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-sm">Getting your location...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ReportsPage;
