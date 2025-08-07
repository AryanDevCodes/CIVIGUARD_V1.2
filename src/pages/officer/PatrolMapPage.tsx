import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapLayers } from '@/components/patrol/MapControls';
import { Search, UserCircle, AlertTriangle, RefreshCw, Users, Menu, X, Route as RouteIcon, Siren } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Officer, Incident, PatrolRoute, OfficerStatus, IncidentStatus } from '@/types/patrol';
import { IncidentList } from '@/components/patrol/IncidentList';
import { OfficerList } from '@/components/patrol/OfficerList';
import RealTimeMap from '@/components/maps/RealTimeMap';
import { patrolService } from '@/services/patrolService';

// Get the active tab title
const getActiveTabTitle = (activeTab: string) => {
  return activeTab === 'officers' ? 'Officers' : 'Incidents';
};

// Layer controls component
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
        variant={layers.patrolRoutes ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('patrolRoutes')}
        className="flex items-center gap-1"
      >
        <RouteIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Routes</span>
      </Button>
      <Button
        variant={layers.incidents ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleLayer('incidents')}
        className="flex items-center gap-1"
      >
        <Siren className="h-4 w-4" />
        <span className="hidden sm:inline">Incidents</span>
      </Button>
    </div>
  );
};

const PatrolMapPage: React.FC = () => {
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

  // Hooks
  const { toast } = useToast();
  const { user } = useAuth();

  // Debug: Log user authentication status
  console.log('User authenticated:', !!user?.id);
  
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
    data: incidentsData, 
    isLoading: isLoadingIncidents, 
    refetch: refetchIncidents 
  } = useQuery({
    queryKey: ['incidents'],
    queryFn: patrolService.getIncidents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Process incidents to handle both array and paginated response formats
  const incidents = useMemo(() => {
    if (!incidentsData) return [];
    return Array.isArray(incidentsData) ? incidentsData : (incidentsData as any)?.content || [];
  }, [incidentsData]);

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

  const isLoading = isLoadingOfficers || isLoadingIncidents || isLoadingRoutes;

  // Filter officers and incidents based on search query and status
  const filteredOfficers = useMemo(() => {
    console.log('Filtering officers:', { officers, searchQuery, officerStatusFilter });
    // Ensure officers is an array before filtering
    const officersArray = Array.isArray(officers) ? officers : [];
    console.log('Officers array:', officersArray);
    return officersArray.filter((officer: Officer) => {
      if (!officer) return false;
      
      const matchesSearch = 
        (officer.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (officer.badgeNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = officerStatusFilter === 'ALL' || officer.status === officerStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [officers, searchQuery, officerStatusFilter]);

  const filteredIncidents = useMemo(() => {
    console.log('Filtering incidents:', { incidents, searchQuery, incidentStatusFilter });
    
    // incidents is already processed to be an array at this point
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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refetchOfficers(),
        refetchIncidents(),
        refetchRoutes()
      ]);
      toast({
        title: 'Success',
        description: 'Data refreshed successfully',
      });
    } catch (err) {
      console.error('Error refreshing data:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh data',
        variant: 'destructive',
      });
    }
  }, [refetchOfficers, refetchIncidents, refetchRoutes, toast]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle officer selection
  const handleOfficerSelect = (officer: Officer | null) => {
    setSelectedOfficer(officer);
    setSelectedIncident(null);
  };
  
  // Handle incident selection
  const handleIncidentSelect = (incident: Incident | null) => {
    setSelectedIncident(incident);
    setSelectedOfficer(null);
  };

  return (
    
      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-card border-r`}>
          {isSidebarOpen && (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-xl font-semibold">Patrol Map</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="md:hidden"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${getActiveTabTitle(activeTab).toLowerCase()}...`}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <Tabs 
                value={activeTab} 
                onValueChange={handleTabChange}
                className="flex-1 flex flex-col"
              >
                <TabsList className="grid grid-cols-2 rounded-none border-b">
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

                <div className="flex-1 overflow-auto">
                  <TabsContent value="officers" className="m-0 h-full">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Debug: {filteredOfficers.length} officers found
                      </div>
                      <OfficerList
                        officers={filteredOfficers}
                        onSelectOfficer={handleOfficerSelect}
                        statusFilter={officerStatusFilter}
                        onStatusFilterChange={(status) => {
                          console.log('Officer status filter changed:', status);
                          setOfficerStatusFilter(status as OfficerStatus | 'ALL');
                        }}
                        selectedOfficerId={selectedOfficer?.id || null}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="incidents" className="m-0 h-full">
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Debug: {filteredIncidents.length} incidents found
                      </div>
                      <IncidentList
                        incidents={filteredIncidents}
                        onSelectIncident={handleIncidentSelect}
                        statusFilter={incidentStatusFilter}
                        onStatusFilterChange={(status) => {
                          console.log('Incident status filter changed:', status);
                          setIncidentStatusFilter(status as IncidentStatus | 'ALL');
                        }}
                        selectedIncidentId={selectedIncident?.id || null}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h2 className="text-lg font-semibold">
                {getActiveTabTitle(activeTab)} Map
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="flex-1 relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="flex flex-col items-center gap-2">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading map data...</p>
                </div>
              </div>
            ) : null}
            
            <RealTimeMap
              officers={layers.officers ? filteredOfficers : []}
              incidents={layers.incidents ? filteredIncidents : []}
              patrolRoutes={layers.patrolRoutes ? patrolRoutes : []}
              onRefresh={handleRefresh}
              className="h-full"
            />
            
            <LayerControls
              layers={layers}
              onLayersChange={setLayers}
            />
          </div>
        </div>
      </div>
  );
};

export default PatrolMapPage;
