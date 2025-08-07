import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileCheck, FileText, Filter, Plus, Search, Loader2, MapPin, Clock, Calendar, ArrowLeft, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { reportsService } from '@/services/reportsService';
import { useAuth } from '@/context/AuthContext';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

// Define libraries for Google Maps
const libraries = ['places', 'marker'] as const;

// Consolidated Report interface with stricter typing
interface Report {
  id: string | number;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED' | 'CONVERTED';
  type: string;
  date: string;
  time: string;
  location: string;
  coordinates: { lat: number; lng: number } | null;
  assignedOfficers: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  latitude: number | null;
  longitude: number | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  witnesses: string[];
  evidence: string[];
  resolutionNotes: string | null;
  resolvedAt: string | null;
  reportedBy: { name: string; email: string } | null;
  resolvedBy: { name: string; email: string } | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

// Status badge rendering function
const getStatusBadge = (status: Report['status']) => {
  const variantMap: Record<Report['status'], { className: string; label: string }> = {
    PENDING: { className: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Pending' },
    IN_REVIEW: { className: 'bg-blue-50 text-blue-800 border-blue-200', label: 'In Review' },
    IN_PROGRESS: { className: 'bg-purple-50 text-purple-800 border-purple-200', label: 'In Progress' },
    RESOLVED: { className: 'bg-green-50 text-green-800 border-green-200', label: 'Resolved' },
    REJECTED: { className: 'bg-red-50 text-red-800 border-red-200', label: 'Rejected' },
    CONVERTED: { className: 'bg-indigo-50 text-indigo-800 border-indigo-200', label: 'Converted' },
  };
  const { className, label } = variantMap[status] || { className: 'bg-gray-50 text-gray-800 border-gray-200', label: 'Unknown' };
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

const MyReportsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); // Added for search functionality
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  // Map refs
  const mapRef = useRef<HTMLDivElement>(null);
  const detailMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]); // Store markers for cleanup

  // Load Google Maps API
  const { isLoaded: isMapApiLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  // Validate API key
  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
      setMapError('Google Maps API key is missing. Please contact support.');
    }
  }, []);

  // Fetch reports
  useEffect(() => {
    const parseCoordinate = (coord: any): number | null => {
      if (coord === null || coord === undefined) return null;
      const num = Number(coord);
      return isNaN(num) ? null : num;
    };

    const fetchReports = async () => {
      if (!user?.id) {
        console.log('[MyReportsPage] User ID not available, skipping fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('[MyReportsPage] Fetching reports...');
        const response = await reportsService.getAll({ createdBy: user.id });
        const reportsData = response.content || [];

        // Map and normalize reports
        const mappedReports: Report[] = reportsData.map((report: any) => {
          // First check root level coordinates, then location object, then coordinates object
          const latitude = parseCoordinate(
            report.latitude ?? report.location?.latitude ?? report.coordinates?.lat
          );
          const longitude = parseCoordinate(
            report.longitude ?? report.location?.longitude ?? report.coordinates?.lng
          );
          
          return {
            id: report.id,
            title: report.title || 'Untitled Report',
            description: report.description || '',
            status: report.status || 'PENDING',
            type: report.incidentType || 'Other',
            date: report.date || '',
            time: report.time || '',
            location: typeof report.location === 'string' 
              ? report.location 
              : report.location?.address || '',
            // Add both formats for backward compatibility
            latitude: latitude,
            longitude: longitude,
            coordinates: latitude !== null && longitude !== null 
              ? { lat: latitude, lng: longitude } 
              : null,
            assignedOfficers: Array.isArray(report.assignedOfficers) ? report.assignedOfficers : [],
            priority: report.priority || 'MEDIUM',
            severity: report.severity || 'MEDIUM',
            witnesses: Array.isArray(report.witnesses) ? report.witnesses : report.witnesses ? [report.witnesses] : [],
            evidence: Array.isArray(report.evidence) ? report.evidence : report.evidence ? [report.evidence] : [],
            createdAt: report.createdAt || null,
            updatedAt: report.updatedAt || null,
            resolvedAt: report.resolvedAt || null,
            resolutionNotes: report.resolutionNotes || null,
            reportedBy: report.reportedBy || null,
            resolvedBy: report.resolvedBy || null,
            latitude,
            longitude,
          };
        });

        console.debug('[MyReportsPage] Mapped reports:', mappedReports);
        setReports(mappedReports);
      } catch (err) {
        console.error('[MyReportsPage] Error fetching reports:', err);
        setError('Failed to fetch reports. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user?.id]);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('[MyReportsPage] Geolocation not supported by browser');
      setMapError('Geolocation is not supported by this browser.');
      setUserLocation({ latitude: 28.608553, longitude: 77.123744 });
      return;
    }

    const handlePosition = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      console.log('[MyReportsPage] User location set:', { latitude, longitude });
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('[MyReportsPage] Geolocation error:', err.message);
      setMapError('Failed to get user location. Using default location.');
      setUserLocation({ latitude: 28.608553, longitude: 77.123744 });
    };

    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Initialize main map
  useEffect(() => {
    if (!mapRef.current || mapLoaded || !isMapApiLoaded) return;

    const initializeMap = async () => {
      try {
        console.log('[MyReportsPage] Initializing main map...');
        const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
        const mapOptions: google.maps.MapOptions = {
          center: userLocation
            ? { lat: userLocation.latitude, lng: userLocation.longitude }
            : { lat: 28.608553, lng: 77.123744 },
          zoom,
          mapTypeId: 'roadmap',
          zoomControl: true,
          zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        };

        mapInstance.current = new Map(mapRef.current, mapOptions);
        setMapLoaded(true);
        console.log('[MyReportsPage] Main map initialized successfully');
      } catch (err) {
        console.error('[MyReportsPage] Main map initialization error:', err);
        setMapError('Failed to initialize Google Maps. Please check your network connection.');
      }
    };

    initializeMap();
  }, [isMapApiLoaded, userLocation, zoom, mapLoaded]);

  // Render report markers and user marker
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !isMapApiLoaded) return;

    // Clean up existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add user marker
    if (userLocation) {
      const userMarker = new google.maps.Marker({
        map: mapInstance.current,
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Your Location',
      });
      markersRef.current.push(userMarker);
    }

    // Add report markers
    const bounds = new google.maps.LatLngBounds();
    let hasValidPositions = false;

    reports.forEach(report => {
      if (!report.latitude || !report.longitude) {
        console.warn(`[MyReportsPage] Skipping marker for report ${report.id}: Missing coordinates`);
        return;
      }

      const marker = new google.maps.Marker({
        map: mapInstance.current,
        position: { lat: report.latitude, lng: report.longitude },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: report.status === 'RESOLVED' ? '#22c55e' : '#eab308',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `${report.title} - ${report.location}`,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; padding: 8px;">
            <strong>${report.title}</strong><br>
            <span>Status: ${report.status}</span><br>
            <span>Type: ${report.type}</span><br>
            <span>Location: ${report.location}</span><br>
            <span>Date: ${report.date ? format(new Date(report.date), 'PPP') : 'Unknown'}</span><br>
            <span>Severity: ${report.severity}</span>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker);
        mapInstance.current?.setCenter({ lat: report.latitude, lng: report.longitude });
        mapInstance.current?.setZoom(15);
        setSelectedReport(report);
        setIsDetailOpen(true);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: report.latitude, lng: report.longitude });
      hasValidPositions = true;
    });

    // Fit bounds if there are valid markers
    if (hasValidPositions) {
      mapInstance.current.fitBounds(bounds, 50);
    } else if (userLocation) {
      mapInstance.current.setCenter({ lat: userLocation.latitude, lng: userLocation.longitude });
      mapInstance.current.setZoom(12);
    }

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'bg-white p-2 rounded-md shadow-md text-xs flex flex-col gap-1';
    legend.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#eab308]"></div>
        <span>Active Report</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#22c55e]"></div>
        <span>Resolved Report</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
        <span>Your Location</span>
      </div>
    `;
    mapInstance.current.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (legend.parentNode) legend.parentNode.removeChild(legend);
    };
  }, [mapLoaded, isMapApiLoaded, userLocation, reports]);

  // Initialize detail map
  useEffect(() => {
    if (!isDetailOpen || !selectedReport || !isMapApiLoaded || !detailMapRef.current) return;
    
    // Fallback to default position if coordinates are not available
    const defaultPosition = { lat: 28.608553, lng: 77.123744 };
    const reportPosition = selectedReport.latitude && selectedReport.longitude
      ? { lat: selectedReport.latitude, lng: selectedReport.longitude }
      : defaultPosition;

    const map = new google.maps.Map(detailMapRef.current, {
      zoom: 12,
      center: reportPosition,
      mapTypeId: 'roadmap',
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Create report marker only if coordinates exist
    let reportMarker: google.maps.Marker | null = null;
    if (selectedReport.latitude && selectedReport.longitude) {
      reportMarker = new google.maps.Marker({
        map,
        position: reportPosition,
        title: `Report Location: ${selectedReport.title}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10,
        },
      });
    }

    // Create user marker
    let userMarker: google.maps.Marker | null = null;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(reportPosition);

    if (userLocation) {
      userMarker = new google.maps.Marker({
        map,
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        title: 'Your Current Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#0F9D58',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 10,
        },
      });
      bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
    }

    // Fit bounds to show markers or set center
    if (reportMarker && userMarker) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(reportMarker.getPosition()!);
      bounds.extend(userMarker.getPosition()!);
      map.fitBounds(bounds, 50);
    } else if (reportMarker) {
      map.setCenter(reportMarker.getPosition()!);
      map.setZoom(15);
    } else if (userMarker) {
      map.setCenter(userMarker.getPosition()!);
      map.setZoom(12);
    } else {
      map.setCenter(reportPosition);
      map.setZoom(12);
    }

    // Add legend
    const legend = document.createElement('div');
    legend.className = 'bg-white p-2 rounded-md shadow-md text-xs flex flex-col gap-1';
    legend.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#4285F4]"></div>
        <span>Report Location</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-[#0F9D58]"></div>
        <span>Your Location</span>
      </div>
    `;
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);

    return () => {
      if (reportMarker) reportMarker.setMap(null);
      if (userMarker) userMarker.setMap(null);
      if (legend.parentNode) legend.parentNode.removeChild(legend);
    };
  }, [isDetailOpen, selectedReport, isMapApiLoaded, userLocation]);

  // Event handlers
  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => direction === 'in' ? Math.min(prev + 1, 18) : Math.max(prev - 1, 10));
  };

  const handleReportClick = useCallback(
    debounce((report: Report) => {
      setSelectedReport(report);
      setIsDetailOpen(true);
      if (report.latitude && report.longitude && mapInstance.current) {
        mapInstance.current.setCenter({ lat: report.latitude, lng: report.longitude });
        mapInstance.current.setZoom(15);
      }
    }, 100),
    []
  );

  const handleShowMap = useCallback(
    debounce(() => setShowMap(prev => !prev), 100),
    []
  );

  const handleNewReport = useCallback(
    debounce(() => navigate('/citizen/report'), 100),
    [navigate]
  );

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not available';
    try {
      return format(new Date(dateString), 'PPPp');
    } catch {
      return dateString;
    }
  };

  // Filter reports based on search query
  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
            <p className="text-muted-foreground">Track and manage your submitted incident reports</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleShowMap} aria-label={showMap ? 'Hide map view' : 'Show map view'}>
              {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
            <Button onClick={handleNewReport} aria-label="Create new report">
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          </div>
        </div>

        <Card className="md:col-span-2" style={{ display: showMap ? 'block' : 'none' }}>
          <CardHeader className="pb-2">
            <CardTitle>Report Map</CardTitle>
            <CardDescription>View locations of your submitted reports</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                <div className="bg-white p-4 rounded-md">
                  <p className="text-red-600">{mapError}</p>
                </div>
              </div>
            )}
            <div className="aspect-video bg-black/5 rounded-md flex items-center justify-center relative">
              <div ref={mapRef} className="absolute inset-0 rounded-md overflow-hidden" />
              {!mapLoaded && !mapError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="text-white mt-2">Loading map...</span>
                  </div>
                </div>
              )}
              <div className="absolute right-2 top-2 flex flex-col space-y-2 z-10">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white shadow-md"
                  onClick={() => handleZoom('in')}
                  disabled={!mapLoaded}
                  aria-label="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-white shadow-md"
                  onClick={() => handleZoom('out')}
                  disabled={!mapLoaded}
                  aria-label="Zoom out"
                >
                  <ChevronRight className="h-4 w-4" style={{ transform: 'rotate(90deg)' }} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Report History</CardTitle>
            <CardDescription>All reports you've submitted to CIVIGUARD</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                <TabsList>
                  <TabsTrigger value="all">All Reports</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search reports"
                    />
                  </div>
                  <Button variant="outline" size="icon" aria-label="Filter reports">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <TabsContent value="all" className="mt-0">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12 text-red-600">{error}</div>
                  ) : filteredReports.length > 0 ? (
                    filteredReports.map(report => (
                      <div
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => handleReportClick(report)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            {report.status === 'RESOLVED' || report.status === 'CONVERTED' ? (
                              <FileCheck className="h-5 w-5 text-green-600" />
                            ) : report.status === 'REJECTED' ? (
                              <XCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <FileText className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-muted-foreground">#{report.id}</span>
                              {getStatusBadge(report.status)}
                              {report.priority && (
                                <Badge variant="outline">{report.priority}</Badge>
                              )}
                            </div>
                            <h4 className="font-medium mt-1">{report.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1 text-sm">
                              <span className="flex items-center text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                {report.date || 'No date'}
                              </span>
                              {report.time && (
                                <span className="flex items-center text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {report.time}
                                </span>
                              )}
                              {report.location && (
                                <span className="flex items-center text-muted-foreground">
                                  <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]">{report.location}</span>
                                </span>
                              )}
                            </div>
                            {report.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0">
                          <Button variant="ghost" size="sm" className="ml-auto">
                            View Details <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="bg-muted p-3 rounded-full mb-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h4 className="font-medium">No Reports Found</h4>
                      <p className="text-sm text-muted-foreground mt-1">You haven't submitted any reports yet.</p>
                      <Button onClick={handleNewReport} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> Create New Report
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="active" className="mt-0">
                <div className="space-y-4">
                  {filteredReports
                    .filter(r => r.status !== 'RESOLVED' && r.status !== 'CONVERTED')
                    .map(report => (
                      <div
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => handleReportClick(report)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">#{report.id}</span>
                              {getStatusBadge(report.status)}
                            </div>
                            <h4 className="font-medium mt-1">{report.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1 text-sm">
                              <span className="text-muted-foreground">
                                Filed: {report.date ? format(new Date(report.date), 'PPP') : 'Unknown'}
                              </span>
                              <span className="text-muted-foreground">
                                Assigned: {report.assignedOfficers.length > 0 ? report.assignedOfficers.join(', ') : 'Unassigned'}
                              </span>
                              <span className="text-muted-foreground">Severity: {report.severity}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0">
                          <Button variant="ghost" size="sm" className="ml-auto">
                            View Details <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              <TabsContent value="resolved" className="mt-0">
                <div className="space-y-4">
                  {filteredReports
                    .filter(r => r.status === 'RESOLVED' || r.status === 'CONVERTED')
                    .map(report => (
                      <div
                        key={report.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        onClick={() => handleReportClick(report)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <FileCheck className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">#{report.id}</span>
                              {getStatusBadge(report.status)}
                            </div>
                            <h4 className="font-medium mt-1">{report.title}</h4>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1 text-sm">
                              <span className="text-muted-foreground">
                                Filed: {report.date ? format(new Date(report.date), 'PPP') : 'Unknown'}
                              </span>
                              <span className="text-muted-foreground">
                                Assigned: {report.assignedOfficers.length > 0 ? report.assignedOfficers.join(', ') : 'Unassigned'}
                              </span>
                              <span className="text-muted-foreground">Severity: {report.severity}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{report.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center mt-4 md:mt-0">
                          <Button variant="ghost" size="sm" className="ml-auto">
                            View Details <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2"
                    onClick={() => setIsDetailOpen(false)}
                    aria-label="Back to reports"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <DialogTitle className="text-xl">Report Details</DialogTitle>
                    <DialogDescription>#{selectedReport.id} • {formatDate(selectedReport.createdAt)}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    <div>{getStatusBadge(selectedReport.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Priority</span>
                    <div>
                      <Badge variant="outline">{selectedReport.priority || 'Not specified'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedReport.title}</h3>
                    <p className="text-muted-foreground">{selectedReport.description}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Report Type</span>
                      <p>{selectedReport.type || 'Not specified'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-medium text-muted-foreground">Date & Time</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedReport.date || 'Not specified'}</span>
                        {selectedReport.time && (
                          <>
                            <span>•</span>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedReport.time}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {selectedReport.location && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-muted-foreground">Location</span>
                      <div className="flex items-start gap-2 p-3 border rounded-md bg-muted/50">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span>{selectedReport.location}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-64 w-full rounded-md overflow-hidden border">
                          {selectedReport.latitude && selectedReport.longitude ? (
                            <div ref={detailMapRef} className="w-full h-full" style={{ minHeight: '256px' }} />
                          ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
                              <MapPin className="h-8 w-8 mb-2 opacity-50" />
                              <p>No location data available</p>
                              <p className="text-xs mt-1">This report doesn't have location information</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
                            <span>Report Location</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#0F9D58]" />
                            <span>Your Location</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {(selectedReport.witnesses.length > 0 || selectedReport.evidence.length > 0) && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Additional Information</h4>
                      {selectedReport.witnesses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Witnesses</span>
                          <p className="whitespace-pre-line">{selectedReport.witnesses.join('\n')}</p>
                        </div>
                      )}
                      {selectedReport.evidence.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">Evidence</span>
                          <p className="whitespace-pre-line">{selectedReport.evidence.join('\n')}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedReport.status === 'RESOLVED' && selectedReport.resolutionNotes && (
                    <div className="space-y-2 p-4 bg-green-50 rounded-md border border-green-100">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Resolution Notes</span>
                      </div>
                      <p className="text-sm text-green-800">{selectedReport.resolutionNotes}</p>
                      {selectedReport.resolvedAt && (
                        <p className="text-xs text-green-600 mt-1">Resolved on: {formatDate(selectedReport.resolvedAt)}</p>
                      )}
                    </div>
                  )}
                  {selectedReport.status === 'REJECTED' && selectedReport.resolutionNotes && (
                    <div className="space-y-2 p-4 bg-red-50 rounded-md border-red-100">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Rejection Reason</span>
                      </div>
                      <p className="text-sm text-red-800">{selectedReport.resolutionNotes}</p>
                      {selectedReport.resolvedAt && (
                        <p className="text-xs text-red-600 mt-1">Rejected on: {formatDate(selectedReport.resolvedAt)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MyReportsPage;