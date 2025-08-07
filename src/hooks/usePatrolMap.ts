import { useState, useEffect, useCallback } from 'react';
import { Officer, Incident, PatrolRoute } from '@/types/patrol';
import { patrolService } from '@/services/patrolService';
import { useToast } from '@/hooks/use-toast';

export const usePatrolMap = () => {
  const { toast } = useToast();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [patrolRoutes, setPatrolRoutes] = useState<PatrolRoute[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [layers, setLayers] = useState({
    officers: true,
    patrolRoutes: true,
    incidents: true,
    heatmap: false,
    traffic: false,
  });

  // Fetch all data
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [officersData, incidentsData, routesData] = await Promise.all([
        patrolService.getOfficers(),
        patrolService.getIncidents(),
        patrolService.getPatrolRoutes(),
      ]);

      setOfficers(officersData);
      setIncidents(incidentsData);
      setPatrolRoutes(routesData);

      if (isRefresh) {
        toast({
          title: 'Map updated',
          description: 'Patrol data has been refreshed.',
        });
      }
    } catch (err) {
      console.error('Error fetching patrol data:', err);
      setError('Failed to load patrol data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load patrol data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [toast]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter officers based on search query and status
  const filteredOfficers = useCallback(() => {
    return officers.filter(officer => {
      const matchesSearch = 
        officer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        officer.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || officer.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [officers, searchQuery, statusFilter]);

  // Filter incidents based on search query and status
  const filteredIncidents = useCallback(() => {
    return incidents.filter(incident => {
      const matchesSearch = 
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || incident.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchQuery, statusFilter]);

  // Handle officer selection
  const handleSelectOfficer = useCallback((officer: Officer | null) => {
    setSelectedOfficer(officer);
    if (officer) {
      setSelectedIncident(null);
    }
  }, []);

  // Handle incident selection
  const handleSelectIncident = useCallback((incident: Incident | null) => {
    setSelectedIncident(incident);
    if (incident) {
      setSelectedOfficer(null);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    return fetchData(true);
  }, [fetchData]);

  // Handle layer toggle
  const handleLayerToggle = useCallback((newLayers: any) => {
    setLayers(prev => ({
      ...prev,
      ...newLayers,
    }));
  }, []);

  return {
    // State
    officers: filteredOfficers(),
    incidents: filteredIncidents(),
    patrolRoutes,
    selectedOfficer,
    selectedIncident,
    isLoading,
    isRefreshing,
    error,
    searchQuery,
    statusFilter,
    layers,
    
    // Actions
    setSearchQuery,
    setStatusFilter,
    onOfficerSelect: handleSelectOfficer,
    onIncidentSelect: handleSelectIncident,
    onRefresh: handleRefresh,
    onLayersChange: handleLayerToggle,
  };
};
