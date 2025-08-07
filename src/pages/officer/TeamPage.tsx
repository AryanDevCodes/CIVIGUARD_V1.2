// TeamPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical,
  Eye,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  CheckCircle2,
  PauseCircle,
  CalendarX2,
  Activity,
  CheckCircle,
  Lock,
  HelpCircle,
  RefreshCw,
  X,
  Users,
  AlertTriangle,
  Calendar,
  User,
  MapPin as MapPinIcon,
  Clock as ClockIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  IncidentTeam, 
  TeamMember, 
  OfficerSummary, 
  IncidentStatus, 
  IncidentPriority 
} from '@/models/Incident';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DashboardLayout from '@/components/DashboardLayout';
import { apiService, incidentsService } from '@/services/apiService';

const TeamPage: React.FC = (): JSX.Element => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
    

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isNewTeamDialogOpen, setIsNewTeamDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Define query function for fetching assigned incidents
  const fetchAssignedIncidents = useCallback(async () => {
    if (!user?.id) return { data: { content: [] } };
    
    try {
      const response = await apiService.get(`/incidents/assigned-to/${user.id}`, {
        includeOfficers: true,
        size: 100,
        sort: 'createdAt,desc'
      });
      
      const incidentsWithOfficers = response.data?.content?.filter((incident: any) => 
        incident.assignedOfficers?.length > 0
      ) || [];
      
      return { data: { content: incidentsWithOfficers } };
    } catch (err) {
      console.error('Error fetching assigned incidents:', err);
      toast.error('Failed to load your assigned incidents');
      return { data: { content: [] } };
    }
  }, [user?.id]);

  // Fetch only incidents assigned to the current officer
  const { 
    data: apiResponse, 
    isLoading, 
    error: teamsError,
    refetch 
  } = useQuery({
    queryKey: ['assignedIncidents', user?.id],
    queryFn: fetchAssignedIncidents,
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Extract teams from the API response
  const teams = useMemo(() => {
    return apiResponse?.data?.content || [];
  }, [apiResponse]);

  // Debug effect for modal state
  useEffect(() => {
    console.log('Modal state changed:', { isTeamModalOpen, selectedTeam });
  }, [isTeamModalOpen, selectedTeam]);

  // Handle team selection - separated the logic from the hook
  const handleTeamSelect = useCallback((member: any) => {
    console.log('handleTeamSelect called with member:', member);
    const team = teams.find((t: any) => t.id === member.incidentId);
    if (team) {
      console.log('Found team:', team);
      // Update the team with fallback values
      const updatedTeam = {
        ...team,
        title: team.title || `Incident #${team.id || 'N/A'}`,
        status: team.status || 'UNKNOWN',
        description: team.description || 'No description available',
        createdAt: team.createdAt || new Date().toISOString(),
        assignedOfficers: team.assignedOfficers || []
      };
      
      // Use a single state update with the callback form
      setSelectedTeam(updatedTeam);
      // Set modal open in the next tick to ensure state is updated
      requestAnimationFrame(() => {
        setIsTeamModalOpen(true);
      });
    } else {
      console.warn('No team found for member:', member);
      toast.error('Could not load team details');
    }
  }, [teams]);

  // Alias for backward compatibility
  const handleViewTeamDetails = useCallback((member: any) => {
    handleTeamSelect(member);
  }, [handleTeamSelect]);

  // Handle query errors
  const hasError = !!teamsError;
  useEffect(() => {
    if (hasError) {
      console.error('Query error:', teamsError);
      toast.error('Failed to load teams. Please try again.');
    }
  }, [hasError, teamsError]);
  
  // Loading state
  const renderLoadingState = useCallback(() => (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your teams...</p>
      </div>
    </div>
  ), []);

  // Manual refresh function that can be called by the user
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast.success('Teams data refreshed');
    } catch (error) {
      console.error('Error refreshing teams:', error);
      toast.error('Failed to refresh teams data');
    }
  }, [refetch]);

  // Flatten members for the table view with proper type safety
  const allMembers = React.useMemo(() => {
    if (!Array.isArray(teams)) {
      console.log('Teams is not an array');
      return [];
    }
    
    console.log('Processing teams:', teams);
    
    const members = teams.flatMap((team: any) => {
      // Log the team to debug its structure
      console.log('Processing team:', team.id, team.title);
      
      // Safely get assigned officers (excluding the current user)
      const officers = Array.isArray(team.assignedOfficers) 
        ? team.assignedOfficers.filter((o: any) => o.id !== user?.id && o._id !== user?.id)
        : [];
      
      console.log(`Team ${team.id} has ${officers.length} other officers`);
      
      // Include the team even if no other officers (shows just the current user)
      if (officers.length === 0) {
        console.log(`No other officers in team ${team.id}`);
      }
      
      // Map each officer to a TeamMember
      return officers.map((officer: any) => {
        // Extract first and last name from the officer object
        const firstName = officer.firstName || officer.name?.split(' ')[0] || 'Officer';
        const lastName = officer.lastName || officer.name?.split(' ').slice(1).join(' ') || officer.id;
        const fullName = `${firstName} ${lastName}`.trim();
        const email = officer.email || 
          `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}`.replace(/\s+/g, '') + 
          '@civiguard.com';
        
        const member = {
          id: officer.id?.toString() || `officer-${Math.random().toString(36).substr(2, 9)}`,
          name: fullName,
          email: email,
          role: officer.role || 'OFFICER',
          status: officer.status || 'ACTIVE',
          department: officer.department || 'Patrol',
          incidentId: team.id?.toString() || 'unknown',
          incidentTitle: team.title || `Incident #${team.id || 'N/A'}`,
          joinDate: team.createdAt || new Date().toISOString(),
          lastActive: new Date().toISOString(),
          phone: officer.phone || 'N/A',
          badgeNumber: officer.badgeNumber || officer.id?.toString() || 'N/A',
          rank: officer.rank || 'Officer',
          incidentStatus: team.status,
          incidentPriority: team.priority || 'MEDIUM',
          incidentType: team.type || 'INCIDENT',
          incidentLocation: team.location?.address || team.location || 'Location not specified',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
        };
        
        console.log('Created member:', member);
        return member as TeamMember;
      });
    });
    
    console.log('Total members after mapping:', members.length);
    return members;
  }, [teams]);

  // Debug: Log the teams and members data
  React.useEffect(() => {
    console.log('Teams data:', teams);
    console.log('All members:', allMembers);
  }, [teams, allMembers]);

  // Filter members based on search term and status
  const filteredMembers = React.useMemo(() => {
    if (!Array.isArray(allMembers)) {
      console.error('allMembers is not an array');
      return [];
    }
    
    // If no teams found for the user, show a message
    if (teams.length === 0 && !isLoading) {
      toast.info('You are not currently assigned to any teams.');
    }
    
    console.log(`Filtering ${allMembers.length} members with search: "${searchTerm}", status: ${statusFilter}`);
    
    try {
      const searchLower = searchTerm.toLowerCase();
      
      const filtered = allMembers.filter(member => {
        if (!member) {
          console.warn('Found null/undefined member in allMembers');
          return false;
        }
        
        // Debug log for each member being filtered
        console.log('Filtering member:', {
          id: member.id,
          name: member.name,
          status: member.status,
          searchFields: {
            name: member.name?.toLowerCase(),
            email: member.email?.toLowerCase(),
            rank: member.rank?.toLowerCase(),
            department: member.department?.toLowerCase(),
            incidentTitle: member.incidentTitle?.toLowerCase()
          }
        });
        
        // Check if member matches search term (case-insensitive)
        const matchesSearch = searchTerm === '' || [
          member.name?.toLowerCase(),
          member.email?.toLowerCase(),
          member.rank?.toLowerCase(),
          member.department?.toLowerCase(),
          member.incidentTitle?.toLowerCase(),
          member.badgeNumber?.toLowerCase()
        ].some(field => field?.includes(searchLower));
        
        // Check if member matches status filter
        const matchesStatus = statusFilter === 'ALL' || 
          member.status?.toUpperCase() === statusFilter.toUpperCase();
        
        console.log(`Member ${member.id} - matchesSearch: ${matchesSearch}, matchesStatus: ${matchesStatus}`);
        return matchesSearch && matchesStatus;
      });
      
      console.log(`Filtered to ${filtered.length} members`);
      return filtered;
      
    } catch (error) {
      console.error('Error filtering members:', error);
      // Return empty array on error to prevent UI breakage
      return [];
    }
  }, [allMembers, searchTerm, statusFilter]);

  // Create a new team
  const createTeam = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      return await incidentsService.create({
        title: data.title,
        description: data.description || '',
        status: 'PENDING',
        priority: 'MEDIUM',
        location: 'To be determined',
        type: 'PATROL_TEAM',
        assignedTo: []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentTeams'] });
      setIsNewTeamDialogOpen(false);
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      console.error('Error creating team:', error);
      toast.error(error.response?.data?.message || 'Failed to create team');
    }
  });

  // Add team member
  const addTeamMember = useMutation({
    mutationFn: async (data: { teamId: string; officerId: string; role: string }) => {
      const team = await incidentsService.getById(data.teamId);
      const updatedOfficers = [
        ...(team.assignedTo || []).map((id: string | number) => id.toString()),
        data.officerId
      ];
      
      return await incidentsService.assignOfficers(
        data.teamId,
        updatedOfficers.map(id => parseInt(id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentTeams'] });
      setIsAddDialogOpen(false);
      toast.success('Team member added successfully');
    },
    onError: (error: any) => {
      console.error('Error adding team member:', error);
      toast.error(error.response?.data?.message || 'Failed to add team member');
    }
  });

  // Remove team member
  const removeTeamMember = useMutation({
    mutationFn: async (data: { teamId: string; officerId: string }) => {
      const team = await incidentsService.getById(data.teamId);
      const updatedOfficers = (team.assignedTo || [])
        .filter((id: string | number) => id.toString() !== data.officerId)
        .map((id: string | number) => id.toString());
      
      return await incidentsService.assignOfficers(
        data.teamId,
        updatedOfficers.map(id => parseInt(id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidentTeams'] });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      console.error('Error removing team member:', error);
      toast.error(error.response?.data?.message || 'Failed to remove team member');
    }
  });

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'default';
      case 'RESOLVED':
        return 'secondary';
      case 'CLOSED':
        return 'destructive';
      case 'ON_LEAVE':
      case 'PENDING':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Handle member removal
  const handleRemoveMember = (teamId: string, officerId: string) => {
    if (window.confirm('Are you sure you want to remove this team member from the incident?')) {
      removeTeamMember.mutate({ teamId, officerId });
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <ShieldCheck className="h-4 w-4 mr-1" />;
      case 'INACTIVE':
        return <ShieldAlert className="h-4 w-4 mr-1" />;
      case 'ON_LEAVE':
        return <Clock className="h-4 w-4 mr-1" />;
      default:
        return <ShieldQuestion className="h-4 w-4 mr-1" />;
    }
  };

  // Format date with time
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date only
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get role badge variant
  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'SUPERVISOR':
        return 'default';
      default:
        return 'secondary';
    }
  };

  // Handle form submission for adding/editing members
  const handleSaveMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const teamId = formData.get('teamId') as string;
    const officerId = formData.get('officerId') as string;
    
    if (!teamId || !officerId) {
      toast.error('Please select both team and officer');
      return;
    }
    
    if (selectedMember) {
      // Update existing member
      // In a real app, you would update the member's role or other details
      toast.info('Updating team members is not yet implemented');
    } else {
      // Add new member
      addTeamMember.mutate({ 
        teamId,
        officerId,
        role: 'OFFICER' // Default role
      });
    }
  };

  // Handle team creation
  const handleCreateTeam = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    if (!title) {
      toast.error('Team name is required');
      return;
    }
    
    createTeam.mutate({ title, description });
  };

  // Status badge component with better type safety
  const StatusBadge = ({ status }: { status: string }) => {
    const statusMap = {
      'ACTIVE': { label: 'Active', variant: 'default' as const, icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> },
      'INACTIVE': { label: 'Inactive', variant: 'secondary' as const, icon: <PauseCircle className="h-3.5 w-3.5 mr-1" /> },
      'ON_LEAVE': { label: 'On Leave', variant: 'outline' as const, icon: <CalendarX2 className="h-3.5 w-3.5 mr-1" /> },
      'PENDING': { label: 'Pending', variant: 'outline' as const, icon: <Clock className="h-3.5 w-3.5 mr-1" /> },
      'IN_PROGRESS': { label: 'In Progress', variant: 'default' as const, icon: <Activity className="h-3.5 w-3.5 mr-1" /> },
      'RESOLVED': { label: 'Resolved', variant: 'secondary' as const, icon: <CheckCircle className="h-3.5 w-3.5 mr-1" /> },
      'CLOSED': { label: 'Closed', variant: 'destructive' as const, icon: <Lock className="h-3.5 w-3.5 mr-1" /> }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { 
      label: status || 'Unknown', 
      variant: 'outline' as const, 
      icon: <HelpCircle className="h-3.5 w-3.5 mr-1" /> 
    };
    
    return (
      <Badge 
        variant={statusInfo.variant} 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full capitalize"
      >
        {statusInfo.icon}
        {statusInfo.label}
      </Badge>
    );
  };

  // Handle loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading team members...</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Team Details Modal */}
        <Dialog 
          open={isTeamModalOpen} 
          onOpenChange={(open) => {
            console.log('Dialog onOpenChange:', open);
            setIsTeamModalOpen(open);
            if (!open) {
              // Reset selected team when dialog is closed
              setSelectedTeam(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            {selectedTeam ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Team Details: {selectedTeam.title || 'Untitled Team'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Status
                      </h3>
                      <Badge variant={selectedTeam.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {selectedTeam.status || 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Created At
                      </h3>
                      <p className="text-sm">{formatDate(selectedTeam.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTeam.description || 'No description provided'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Assigned Officers</h3>
                    <div className="space-y-2">
                      {selectedTeam.assignedOfficers?.length > 0 ? (
                        selectedTeam.assignedOfficers.map((officer: { id: string; avatar?: string; name?: string; email?: string; role?: string }) => (
                          <div key={officer.id} className="flex items-center gap-3 p-2 border rounded-lg">
                            <div className="flex-shrink-0">
                              <Avatar>
                                <AvatarImage src={officer.avatar} alt={officer.name} />
                                <AvatarFallback>
                                  {officer.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{officer.name || 'Unknown Officer'}</p>
                              <p className="text-sm text-muted-foreground truncate">{officer.email || 'No email'}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {officer.role || 'Officer'}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No officers assigned</p>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTeamModalOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Teams</h1>
            <p className="text-muted-foreground">
              Teams you're currently assigned to
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsNewTeamDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
            <Button 
              onClick={() => {
                setSelectedMember(null);
                setIsAddDialogOpen(true);
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or rank..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Team Members Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[250px]">Incident</TableHead>
                <TableHead>Team Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[60px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                      <p className="text-muted-foreground">Loading team members...</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetch()}
                        className="mt-2"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : teamsError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
                      <AlertCircle className="h-12 w-12 text-destructive" />
                      <div>
                        <h3 className="text-lg font-medium">Failed to load team members</h3>
                        <p className="text-muted-foreground mt-1">
                          {teamsError instanceof Error ? teamsError.message : 'An unknown error occurred'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
                      <Users className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-medium">No team members found</h3>
                        <p className="text-muted-foreground mt-1">
                          {searchTerm || statusFilter !== 'ALL' 
                            ? 'Try adjusting your search or filter criteria' 
                            : 'No team members have been assigned to incidents yet'}
                        </p>
                      </div>
                      {allMembers.length > 0 && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMembers.map((member) => (
                  <TableRow key={`${member.incidentId}-${member.id}`} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <Button 
                          variant="link" 
                          className="h-auto p-0 text-left font-medium line-clamp-1 justify-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTeamSelect(member);
                          }}
                        >
                          {member.incidentTitle}
                        </Button>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-xs font-medium">
                            {member.incidentType || 'Incident'}
                          </span>
                          <span className="mx-1.5 text-muted-foreground/50">•</span>
                          <span className="capitalize">{member.incidentPriority?.toLowerCase()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-primary/5">
                            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <div className="font-medium flex items-center gap-1.5">
                            {member.name}
                            {member.role === 'ADMIN' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                </TooltipTrigger>
                                <TooltipContent>Administrator</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {member.department}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <a 
                          href={`mailto:${member.email}`} 
                          className="inline-flex items-center text-sm hover:underline hover:text-primary transition-colors"
                        >
                          <Mail className="mr-2 h-3.5 w-3.5 opacity-70" />
                          <span className="truncate max-w-[180px]">{member.email}</span>
                        </a>
                        {member.phone && member.phone !== 'N/A' && (
                          <a 
                            href={`tel:${member.phone}`}
                            className="inline-flex items-center text-sm text-muted-foreground hover:underline hover:text-primary transition-colors"
                          >
                            <Phone className="mr-2 h-3.5 w-3.5 opacity-70" />
                            {member.phone}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {member.rank && (
                            <Badge variant="outline" className="h-5 text-xs">
                              {member.rank}
                            </Badge>
                          )}
                          {member.badgeNumber && member.badgeNumber !== 'N/A' && (
                            <Badge variant="outline" className="h-5 text-xs">
                              Badge: {member.badgeNumber}
                            </Badge>
                          )}
                        </div>
                        {member.incidentLocation && (
                          <div className="flex items-start text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3.5 w-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-1">{member.incidentLocation}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewTeamDetails(member);
                              }}
                              className="w-full flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </button>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMember(member);
                              setIsAddDialogOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(member.incidentId, member.id);
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Member Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSaveMember}>
              <DialogHeader>
                <DialogTitle>
                  {selectedMember ? 'Edit Team Member' : 'Add Team Member'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="incidentId">Team/Incident</Label>
                  <Select 
                    name="incidentId"
                    defaultValue={selectedMember?.incidentId?.toString()}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team/incident" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.title} ({team.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officerId">Officer</Label>
                  <Select 
                    name="officerId"
                    defaultValue={selectedMember?.id?.toString()}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select officer" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* In a real app, you would fetch available officers here */}
                      <SelectItem value="1">John Doe (Badge #1234)</SelectItem>
                      <SelectItem value="2">Jane Smith (Badge #5678)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addTeamMember.isPending}>
                  {addTeamMember.isPending ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* New Team Dialog */}
        <Dialog open={isNewTeamDialogOpen} onOpenChange={setIsNewTeamDialogOpen}>
          <DialogContent>
            <form onSubmit={handleCreateTeam}>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Team Name</Label>
                  <Input 
                    id="title"
                    name="title"
                    required
                    placeholder="e.g., Patrol Team Alpha" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description"
                    name="description"
                    placeholder="Brief description of the team's purpose" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewTeamDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTeam.isPending}
                >
                  {createTeam.isPending ? 'Creating...' : 'Create Team'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TeamPage;