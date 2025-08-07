import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Menu, PanelLeft, RefreshCw, Route, Search, Siren, Truck, UserCircle, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Incident, Officer, OfficerStatus, PatrolRoute, PatrolVehicle, IncidentStatus } from '@/types/patrol';
import { patrolService } from '@/services/patrolService';
import RealTimeMap from '@/components/maps/RealTimeMap';

interface MapLayers {
  officers: boolean;
  patrolRoutes: boolean;
  incidents: boolean;
  patrolVehicles: boolean;
  heatmap: boolean;
  traffic: boolean;
}

const LayerControls: React.FC<{
  layers: MapLayers;
  onLayersChange: (newLayers: MapLayers) => void;
}> = ({ layers, onLayersChange }) => {
  const toggleLayer = (layer: keyof MapLayers) => {
    onLayersChange({
      ...layers,
      [layer]: !layers[layer]
    });
  };

  return (
    <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-md shadow-md flex gap-2">
      <Button
        variant={layers.officers ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('officers')}
        className="flex items-center gap-1"
      >
        <UserCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Officers</span>
      </Button>
      <Button
        variant={layers.incidents ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('incidents')}
        className="flex items-center gap-1"
      >
        <AlertTriangle className="h-4 w-4" />
        <span className="hidden sm:inline">Incidents</span>
      </Button>
      <Button
        variant={layers.patrolVehicles ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('patrolVehicles')}
        className="flex items-center gap-1"
      >
        <Truck className="h-4 w-4" />
        <span className="hidden sm:inline">Vehicles</span>
      </Button>
      <Button
        variant={layers.patrolRoutes ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('patrolRoutes')}
        className="flex items-center gap-1"
      >
        <Route className="h-4 w-4" />
        <span className="hidden sm:inline">Routes</span>
      </Button>
    </div>
  );
};

// Define map layer state
interface MapLayers {
  officers: boolean;
  patrolRoutes: boolean;
  incidents: boolean;
  patrolVehicles: boolean;
  heatmap: boolean;
  traffic: boolean;
}

const RealTimeMapPage: React.FC = () => {
  // State for UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('officers');
  const [searchQuery, setSearchQuery] = useState('');
  const [officerStatusFilter, setOfficerStatusFilter] = useState<OfficerStatus | 'ALL'>('ALL');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Map layer visibility
  const [layers, setLayers] = useState<MapLayers>({
    officers: true,
    patrolRoutes: true,
    incidents: true,
    patrolVehicles: true,
    heatmap: false,
    traffic: false,
  });


  // State
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch data using React Query
  const {
    data: officers = [],
    isLoading: isLoadingOfficers,
    refetch: refetchOfficers
  } = useQuery<Officer[]>({
    queryKey: ['officers'],
    queryFn: () => patrolService.getOfficers(),
    enabled: !!user?.id,
    refetchOnWindowFocus: false
  });

  // Fetch incidents data
  const { 
    data: incidents = [],
    isLoading: isLoadingIncidents, 
    refetch: refetchIncidents 
  } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: patrolService.getIncidents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id,
  });

  // Fetch patrol routes
  const {
    data: patrolRoutes = [],
    isLoading: isLoadingRoutes,
    refetch: refetchRoutes
  } = useQuery<PatrolRoute[]>({
    queryKey: ['patrolRoutes'],
    queryFn: () => patrolService.getPatrolRoutes(),
    enabled: !!user?.id,
    refetchOnWindowFocus: false
  });

  // Fetch patrol vehicles
  const {
    data: patrolVehicles = [],
    isLoading: isLoadingVehicles,
    refetch: refetchVehicles
  } = useQuery<PatrolVehicle[]>({
    queryKey: ['patrolVehicles'],
    queryFn: () => patrolService.getPatrolVehicles(),
    enabled: !!user?.id,
    refetchOnWindowFocus: false
  });

  // Combined loading state
  const isLoading = isLoadingOfficers || isLoadingIncidents || isLoadingRoutes || isLoadingVehicles;
  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchOfficers(),
        refetchIncidents(),
        refetchVehicles(),
        refetchRoutes()
      ]);
      setLastUpdated(new Date());
      toast({
        title: 'Map data refreshed',
        description: 'The map data has been updated.',
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error refreshing data:', error);
      }
      toast({
        title: 'Error',
        description: 'Failed to refresh map data',
        variant: 'destructive',
      });
    }
  }, [refetchOfficers, refetchIncidents, refetchVehicles, refetchRoutes, toast]);

  // Auto-refresh data
  useEffect(() => {
    const refreshData = async () => {
      try {
        await Promise.all([
          refetchOfficers(),
          refetchIncidents(),
          refetchVehicles(),
          refetchRoutes()
        ]);
        setLastUpdated(new Date());
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error refreshing data:', error);
        }
      }
    };

    // Initial fetch
    refreshData();
    
    // Set up auto-refresh (5 minutes)
    const interval = setInterval(refreshData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetchOfficers, refetchIncidents, refetchVehicles, refetchRoutes]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchQuery(''); // Reset search when changing tabs
  }, []);

  // Filter officers and incidents based on search query and status
  const filteredOfficers = useMemo(() => {
    return officers.filter((officer: Officer) => {
      if (!officer) return false;
      
      const matchesSearch = 
        (officer.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (officer.badgeNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = officerStatusFilter === 'ALL' || officer.status === officerStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [officers, searchQuery, officerStatusFilter]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident: Incident) => {
      if (!incident) return false;
      
      const matchesSearch = 
        (incident.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (incident.id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (incident.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = incidentStatusFilter === 'ALL' || incident.status === incidentStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchQuery, incidentStatusFilter]);

  const filteredVehicles = useMemo(() => {
    return patrolVehicles.filter((vehicle: PatrolVehicle) => {
      if (!vehicle) return false;
      
      const matchesSearch = 
        (vehicle.vehicleNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (vehicle.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [patrolVehicles, searchQuery]);

  // Toggle layer visibility
  const toggleLayer = (layer: keyof MapLayers) => {
    setLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeItems = {
    officers: filteredOfficers,
    incidents: filteredIncidents,
    vehicles: filteredVehicles,
    routes: patrolRoutes || []
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r overflow-hidden`}>
        <div className="p-4 space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Patrol Dashboard</h2>
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-9"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="officers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Officers
                <Badge variant="secondary" className="ml-auto">
                  {filteredOfficers.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="incidents" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incidents
                <Badge variant="secondary" className="ml-auto">
                  {filteredIncidents.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="officers" className="flex-1 overflow-auto">
              <div className="space-y-2 py-2">
                {filteredOfficers.map((officer) => (
                  <div key={officer.id} className="p-2 border rounded hover:bg-accent cursor-pointer">
                    <div className="font-medium">{officer.name}</div>
                    <div className="text-sm text-muted-foreground">{officer.badgeNumber}</div>
                    <Badge variant={officer.status === 'ON_DUTY' ? 'default' : 'outline'} className="mt-1">
                      {officer.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="incidents" className="flex-1 overflow-auto">
              <div className="space-y-2 py-2">
                {filteredIncidents.map((incident) => (
                  <div key={incident.id} className="p-2 border rounded hover:bg-accent cursor-pointer">
                    <div className="font-medium">{incident.title}</div>
                    <div className="text-sm text-muted-foreground">{incident.status}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {incident.description}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={isLoadingOfficers || isLoadingIncidents}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingOfficers || isLoadingIncidents ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-xs text-gray-500 bg-white/90 px-2 py-1 rounded">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </div>
            </div>
          </div>
        </header>

        <div className="flex-1 relative">
          <LayerControls layers={layers} onLayersChange={setLayers} />
          <RealTimeMap
            officers={layers.officers ? filteredOfficers : []}
            incidents={layers.incidents ? filteredIncidents : []}
            patrolVehicles={layers.patrolVehicles ? filteredVehicles : []}
            patrolRoutes={layers.patrolRoutes ? patrolRoutes : []}
          />
        </div>
      </div>

    </div>
  );
};

export default RealTimeMapPage;
