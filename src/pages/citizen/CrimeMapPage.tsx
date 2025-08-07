import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus as PlusIcon, Minus as MinusIcon, Filter, MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { incidentsService } from '@/services/apiService';
import { Loader } from '@googlemaps/js-api-loader';

// Use Google Maps API key and Map ID from environment variables
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'YOUR_MAP_ID';

interface CrimeIncident {
  id: string;
  type: string;
  title: string;
  location: string;
  date: string;
  severity: 'low' | 'medium' | 'high';
  status: 'reported' | 'investigating' | 'resolved';
  latitude: number;
  longitude: number;
  description?: string;
  reportedBy?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const mapSeverityFromBackend = (priority: string): 'low' | 'medium' | 'high' => {
  switch (priority?.toUpperCase()) {
    case 'LOW':
      return 'low';
    case 'MEDIUM':
      return 'medium';
    case 'HIGH':
    case 'CRITICAL':
      return 'high';
    default:
      console.warn(`Unknown priority: ${priority}, defaulting to 'low'`);
      return 'low';
  }
};

const mapStatusFromBackend = (status: string): 'reported' | 'investigating' | 'resolved' => {
  switch (status?.toUpperCase()) {
    case 'REPORTED':
      return 'reported';
    case 'INVESTIGATING':
    case 'UNDER_INVESTIGATION':
      return 'investigating';
    case 'RESOLVED':
    case 'CLOSED':
      return 'resolved';
    default:
      console.warn(`Unknown status: ${status}, defaulting to 'reported'`);
      return 'reported';
  }
};

const mapIncidentFromBackend = (backendIncident: any): CrimeIncident | null => {
  if (!backendIncident || !backendIncident.id) {
    console.warn('Invalid or missing incident data:', backendIncident);
    return null;
  }

  return {
    id: backendIncident.id.toString(),
    type: backendIncident.incidentType || 'Unknown',
    title: backendIncident.title || backendIncident.description?.substring(0, 50) || 'Untitled Incident',
    location: backendIncident.location?.address || 'Unknown Location',
    date: backendIncident.reportDate || backendIncident.createdAt || new Date().toISOString(),
    severity: mapSeverityFromBackend(backendIncident.priority),
    status: mapStatusFromBackend(backendIncident.status),
    latitude: backendIncident.location?.latitude ?? 0,
    longitude: backendIncident.location?.longitude ?? 0,
    description: backendIncident.description || '',
    reportedBy: backendIncident.reportedBy?.name || backendIncident.reporterContactInfo || 'Anonymous',
  };
};

// Haversine formula to calculate distance between two points in kilometers
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getSeverityBadge = (severity: 'low' | 'medium' | 'high') => {
  switch (severity) {
    case 'low':
      return <Badge className="bg-yellow-500">Low</Badge>;
    case 'medium':
      return <Badge className="bg-orange-500">Medium</Badge>;
    case 'high':
      return <Badge className="bg-red-500">High</Badge>;
    default:
      return null;
  }
};

const getStatusBadge = (status: 'reported' | 'investigating' | 'resolved') => {
  switch (status) {
    case 'reported':
      return <Badge variant="outline" className="border-blue-500 text-blue-500">Reported</Badge>;
    case 'investigating':
      return <Badge variant="outline" className="border-purple-500 text-purple-500">Investigating</Badge>;
    case 'resolved':
      return <Badge variant="outline" className="border-green-500 text-green-500">Resolved</Badge>;
    default:
      return null;
  }
};

// Calculate neighborhood safety metrics
const calculateSafetyMetrics = (incidents: CrimeIncident[], filterRadius: number) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Count incidents in current and previous months
  const currentMonthIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    return incidentDate >= currentMonthStart && incidentDate <= now;
  });
  const prevMonthIncidents = incidents.filter(incident => {
    const incidentDate = new Date(incident.date);
    return incidentDate >= prevMonthStart && incidentDate <= prevMonthEnd;
  });

  // Calculate crime trend (% change)
  const currentCount = currentMonthIncidents.length;
  const prevCount = prevMonthIncidents.length;
  const crimeTrend = prevCount === 0
    ? (currentCount > 0 ? 100 : 0)
    : ((currentCount - prevCount) / prevCount) * 100;

  // Calculate safety score (0–100)
  const severityWeights = { low: 5, medium: 10, high: 20 };
  const totalRisk = incidents.reduce((sum, incident) => sum + severityWeights[incident.severity], 0);
  const safetyScore = Math.max(0, 100 - totalRisk);

  // Get most frequent incident type for alert
  const incidentTypes = incidents.reduce((acc, incident) => {
    acc[incident.type] = (acc[incident.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostFrequentType = Object.entries(incidentTypes).reduce(
    (max, entry) => (entry[1] > max[1] ? entry : max),
    ['Unknown', 0]
  )[0];

  // Generate safety alert
  const alertMessage = incidents.length > 0
    ? `Recent ${mostFrequentType.toLowerCase()} incidents reported within ${filterRadius} km. Stay vigilant and take necessary precautions.`
    : `No recent incidents reported within ${filterRadius} km. Continue to stay cautious.`;

  return {
    crimeTrend: Math.round(crimeTrend * 10) / 10, // Round to 1 decimal
    safetyScore: Math.round(safetyScore),
    incidentCount: incidents.length,
    alertMessage,
  };
};

const CrimeMapPage: React.FC = () => {
  const [filter, setFilter] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13);
  const [selectedIncident, setSelectedIncident] = useState<CrimeIncident | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filterRadius, setFilterRadius] = useState(5); // Default 5 km
  const [useLocationFilter, setUseLocationFilter] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markers = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const userMarker = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug component lifecycle
  useEffect(() => {
    console.log('CrimeMapPage mounted');
    return () => {
      console.log('CrimeMapPage unmounted');
    };
  }, []);

  // Fetch incidents from the backend
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const response = await incidentsService.getAll();
        console.log('API Response:', response);
        const incidentsArr = response.data?.content || [];
        console.log('Incidents Array:', incidentsArr);
        const mappedIncidents = incidentsArr
          .map((incident: any) => mapIncidentFromBackend(incident))
          .filter((incident: CrimeIncident | null): incident is CrimeIncident => incident !== null);
        console.log('Mapped Incidents:', mappedIncidents);
        return mappedIncidents;
      } catch (err) {
        console.error('Error fetching incidents:', err);
        throw new Error('Failed to fetch incidents');
      }
    },
  });

  // Handle query error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading incidents",
        description: "Failed to load incident data. Please try again later.",
        variant: "destructive",
      });
      console.error("Query error:", error);
    }
  }, [error, toast]);

  // Debug: Log incidents when data changes
  useEffect(() => {
    console.log('Fetched Data:', data);
    console.log('Incidents:', data || []);
  }, [data]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          console.log('User location acquired:', { latitude, longitude });
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat: latitude, lng: longitude });
          }
        },
        (err) => {
          console.warn('Geolocation failed:', err.message);
          toast({
            title: "Location Access Denied",
            description: "Unable to get your location. Showing all incidents.",
            variant: "destructive",
          });
          setUseLocationFilter(false);
        }
      );
    } else {
      console.warn('Geolocation not supported by browser');
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support location services. Showing all incidents.",
        variant: "destructive",
      });
      setUseLocationFilter(false);
    }
  }, []);

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return;

    console.log('Starting Google Maps initialization...');
    const startTime = performance.now();

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'marker'],
    });

    loader
      .load()
      .then(async () => {
        console.log('Google Maps API loaded successfully');
        try {
          if (!google.maps.marker) {
            throw new Error('Google Maps Marker library not loaded');
          }

          mapInstance.current = new google.maps.Map(mapRef.current!, {
            center: userLocation
              ? { lat: userLocation.latitude, lng: userLocation.longitude }
              : { lat: 28.608553, lng: 77.123744 },
            zoom: zoom,
            mapTypeId: 'roadmap',
            mapId: GOOGLE_MAPS_MAP_ID,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
              { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
            ],
          });

          console.log('Map instance created:', !!mapInstance.current);
          setMapLoaded(true);
          console.log('Map instance after setMapLoaded:', !!mapInstance.current);

          const endTime = performance.now();
          console.log(`Map load time: ${(endTime - startTime).toFixed(2)} ms`);

          mapInstance.current.setOptions({
            zoomControl: true,
            zoomControlOptions: {
              position: google.maps.ControlPosition.RIGHT_BOTTOM,
            },
          });
        } catch (err) {
          console.error('Error creating map instance:', err);
          throw err;
        }
      })
      .catch((err) => {
        console.error('Google Maps loading error:', err);
        setMapError("Failed to load Google Maps. Please check your API key, Map ID, and network connection.");
        toast({
          title: "Map Loading Error",
          description: "Unable to load the map. Retrying in 5 seconds...",
          variant: "destructive",
        });
        setTimeout(() => {
          setMapLoaded(false);
          console.log('Retrying map initialization...');
        }, 5000);
      });
  }, [mapLoaded, zoom, userLocation]);

  // Update zoom level
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.setZoom(zoom);
    }
  }, [zoom]);

  // Add user location marker
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !userLocation) {
      console.log('Skipping user marker creation:', { map: !!mapInstance.current, mapLoaded, userLocation: !!userLocation });
      return;
    }

    // Remove existing user marker if it exists
    if (userMarker.current) {
      userMarker.current.map = null;
      userMarker.current = null;
    }

    // Create a div element for the user marker
    const userMarkerElement = document.createElement('div');
    userMarkerElement.style.width = '15px';
    userMarkerElement.style.height = '15px';
    userMarkerElement.style.borderRadius = '50%';
    userMarkerElement.style.backgroundColor = '#3b82f6'; // Blue
    userMarkerElement.style.border = '2px solid #ffffff';
    userMarkerElement.title = 'Your Location';

    // Create the user marker
    userMarker.current = new google.maps.marker.AdvancedMarkerElement({
      map: mapInstance.current,
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      content: userMarkerElement,
    });

    console.log('User marker created:', { lat: userLocation.latitude, lng: userLocation.longitude });

    // Cleanup on unmount or location change
    return () => {
      if (userMarker.current) {
        userMarker.current.map = null;
        userMarker.current = null;
        console.log('User marker removed');
      }
    };
  }, [mapLoaded, userLocation]);

  // Filter incidents based on user location and radius
  const filteredIncidents = useLocationFilter && userLocation && Array.isArray(data)
    ? data.filter((incident: CrimeIncident) => {
        if (!incident.latitude || !incident.longitude) {
          console.warn('Invalid coordinates for incident:', incident);
          return false;
        }
        const distance = haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          incident.latitude,
          incident.longitude
        );
        return distance <= filterRadius;
      })
    : Array.isArray(data)
      ? data
      : [];

  // Calculate safety metrics
  const safetyMetrics = React.useMemo(
    () => calculateSafetyMetrics(filteredIncidents, filterRadius),
    [filteredIncidents, filterRadius]
  );

  // Add incident markers
  useEffect(() => {
    if (!mapInstance.current) {
      console.log('Skipping marker creation: mapInstance.current is null');
      return;
    }
    if (!filteredIncidents.length && !isLoading) {
      console.log('Skipping marker creation: no filtered incidents');
      return;
    }
    if (isLoading) {
      console.log('Skipping marker creation: isLoading is true');
      return;
    }
    if (!mapLoaded) {
      console.log('Skipping marker creation: mapLoaded is false');
      return;
    }

    console.log('Creating markers for incidents:', filteredIncidents.length);
    Object.values(markers.current).forEach(marker => marker.map = null);
    markers.current = {};

    filteredIncidents.forEach((incident: CrimeIncident) => {
      if (!incident.latitude || !incident.longitude) {
        console.warn('Invalid coordinates for incident:', incident);
        return;
      }

      const markerElement = document.createElement('div');
      markerElement.style.width = '20px';
      markerElement.style.height = '20px';
      markerElement.style.borderRadius = '50%';
      markerElement.style.backgroundColor = incident.severity === 'low' ? '#eab308' : incident.severity === 'medium' ? '#f97316' : '#ef4444';
      markerElement.style.border = '2px solid #ffffff';
      markerElement.title = `${incident.type} - ${incident.location}`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstance.current,
        position: { lat: incident.latitude, lng: incident.longitude },
        content: markerElement,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; padding: 8px;">
            <strong>${incident.type}</strong><br>
            <span>Location: ${incident.location}</span><br>
            <span>Date: ${incident.date ? new Date(incident.date).toLocaleDateString() : 'Unknown'}</span>
          </div>
        `,
      });

      marker.addEventListener('gmp-click', () => {
        console.log('Marker clicked:', { id: incident.id, location: incident.location, lat: incident.latitude, lng: incident.longitude });
        setSelectedIncident(incident);
        infoWindow.open(mapInstance.current, marker);
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat: incident.latitude, lng: incident.longitude });
          mapInstance.current.setZoom(15);
        }
      });

      markers.current[incident.id] = marker;
    });

    console.log('Markers created:', Object.keys(markers.current).length);
  }, [filteredIncidents, isLoading, mapLoaded]);

  // Handle zoom in/out
  const handleZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      setZoom(prev => Math.min(prev + 1, 18));
    } else {
      setZoom(prev => Math.max(prev - 1, 10));
    }
  };

  // Handle incident click in list
  const handleIncidentClick = (incident: CrimeIncident) => {
    console.log('Incident clicked:', { id: incident.id, location: incident.location, lat: incident.latitude, lng: incident.longitude });
    if (!mapLoaded || !mapInstance.current) {
      console.warn('Map not loaded yet, cannot handle incident click', { mapLoaded, mapInstance: !!mapInstance.current });
      toast({
        title: "Map Not Ready",
        description: "The map is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    if (!incident.latitude || !incident.longitude) {
      console.warn('Invalid coordinates for incident:', incident);
      toast({
        title: "Invalid Location",
        description: "This incident has invalid location data.",
        variant: "destructive",
      });
      return;
    }

    setSelectedIncident(incident);
    mapInstance.current.setCenter({ lat: incident.latitude, lng: incident.longitude });
    mapInstance.current.setZoom(15);

    const marker = markers.current[incident.id];
    if (marker) {
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: black; font-family: Arial, sans-serif; padding: 8px;">
            <strong>${incident.type}</strong><br>
            <span>Location: ${incident.location}</span><br>
            <span>Date: ${incident.date ? new Date(incident.date).toLocaleDateString() : 'Unknown'}</span>
          </div>
        `,
      });
      infoWindow.open(mapInstance.current, marker);
    } else {
      console.warn('No marker found for incident:', incident.id);
      toast({
        title: "Marker Not Found",
        description: "No map marker exists for this incident, but the map has been centered on the location.",
        variant: "default",
      });
    }
  };

  // Handle map loading error
  if (mapError) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Crime Map</h1>
              <p className="text-muted-foreground">View reported incidents in your area</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to load map</h2>
              <p className="text-muted-foreground text-center mb-4">
                {mapError}
              </p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Handle query error
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Crime Map</h1>
              <p className="text-muted-foreground">View reported incidents in your area</p>
            </div>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Failed to load incident data</h2>
              <p className="text-muted-foreground text-center mb-4">
                There was a problem fetching incident data. Please try again later.
              </p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Crime Map</h1>
            <p className="text-muted-foreground">View reported incidents in your area</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="location-filter"
                checked={useLocationFilter}
                onCheckedChange={setUseLocationFilter}
                disabled={!userLocation}
              />
              <Label htmlFor="location-filter">Filter by Location</Label>
            </div>
            {useLocationFilter && userLocation && (
              <div className="w-48">
                <Label htmlFor="radius-slider" className="text-sm">
                  Radius: {filterRadius} km
                </Label>
                <Slider
                  id="radius-slider"
                  min={1}
                  max={20}
                  step={1}
                  value={[filterRadius]}
                  onValueChange={(value) => setFilterRadius(value[0])}
                  className="mt-2"
                />
              </div>
            )}
            <Button variant="outline" className="w-full md:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Filter Incidents
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>Click on markers or incidents to view details</CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="aspect-video bg-black/5 rounded-md flex items-center justify-center relative">
                <div
                  ref={mapRef}
                  className="absolute inset-0 rounded-md overflow-hidden"
                  style={{ width: '100%', height: '100%' }}
                />

                {!mapLoaded && (
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
                    disabled={!mapLoaded || !mapInstance.current}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white shadow-md"
                    onClick={() => handleZoom('out')}
                    disabled={!mapLoaded || !mapInstance.current}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                {useLocationFilter && userLocation
                  ? `Incidents within ${filterRadius} km`
                  : 'Latest reported crimes near you'}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground ml-2">Loading incidents...</p>
                </div>
              ) : filteredIncidents.length === 0 && !isLoading ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No incidents found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {useLocationFilter && userLocation
                      ? `No incidents found within ${filterRadius} km. Try increasing the radius.`
                      : 'There are no reported incidents in your area.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIncidents.map((incident: CrimeIncident) => {
                    if (!incident.id || !incident.type || !incident.location || !incident.date) {
                      console.warn('Invalid incident data:', incident);
                      return null;
                    }
                    return (
                      <div
                        key={incident.id}
                        className={`p-3 border rounded-lg hover:bg-accent/50 transition-colors ${
                          selectedIncident?.id === incident.id ? 'border-primary ring-1 ring-primary' : ''
                        } ${!mapLoaded || !mapInstance.current ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        onClick={() => mapLoaded && mapInstance.current && handleIncidentClick(incident)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{incident.type}</p>
                          {getSeverityBadge(incident.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{incident.location}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {incident.date ? new Date(incident.date).toLocaleDateString() : 'Unknown Date'}
                          </p>
                          {getStatusBadge(incident.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neighborhood Safety</CardTitle>
            <CardDescription>
              {useLocationFilter && userLocation
                ? `Safety metrics within ${filterRadius} km`
                : 'Crime statistics in your area'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-4 border border-border/50 rounded-lg space-y-2 text-center">
                <h3 className="text-2xl font-bold text-primary">
                  {safetyMetrics.crimeTrend >= 0 ? '+' : ''}{safetyMetrics.crimeTrend}%
                </h3>
                <p className="text-muted-foreground">Crime trend vs last month</p>
              </div>
              <div className="p-4 border border-border/50 rounded-lg space-y-2 text-center">
                <h3 className="text-2xl font-bold text-primary">{safetyMetrics.safetyScore}/100</h3>
                <p className="text-muted-foreground">Safety score</p>
              </div>
              <div className="p-4 border border-border/50 rounded-lg space-y-2 text-center">
                <h3 className="text-2xl font-bold text-primary">{safetyMetrics.incidentCount}</h3>
                <p className="text-muted-foreground">Incidents nearby</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-black/5 border border-border/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-foreground">Safety Alert</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {safetyMetrics.alertMessage}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CrimeMapPage;