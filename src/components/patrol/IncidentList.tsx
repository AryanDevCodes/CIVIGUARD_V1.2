import React from 'react';
import { AlertTriangle, MapPin, Clock, User, Siren, Search } from 'lucide-react';
import { Incident, Officer, OfficerStatus, Priority, AssignedOfficer } from "@/types/patrol";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Helper function to check if a date is valid
const isValidDate = (dateString: string | Date): boolean => {
  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch (e) {
    return false;
  }
};

// Helper function to format date in a user-friendly way
const formatDate = (dateString: string | Date): string => {
  if (!isValidDate(dateString)) return 'Invalid date';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today - show time only
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    // Yesterday - show 'Yesterday' and time
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays < 7) {
    // Within a week - show day and time
    return `${date.toLocaleDateString([], { weekday: 'short' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Older than a week - show date and time
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

interface IncidentListProps {
  incidents: Incident[];
  selectedIncidentId: string | null;
  onSelectIncident: (incident: Incident) => void;
  className?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: string) => void;
  statusFilter: string;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  className = '',
  searchQuery,
  onSearchChange,
  onStatusFilterChange,
  statusFilter,
}) => {
  const getPriorityVariant = (priority: Priority) => {
    switch (priority) {
      case 'LOW':
        return 'outline';
      case 'MEDIUM':
        return 'default';
      case 'HIGH':
        return 'secondary';
      case 'CRITICAL':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'REPORTED':
        return 'destructive';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'RESOLVED':
        return 'default';
      case 'CLOSED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const filteredIncidents = React.useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = 
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || incident.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchQuery, statusFilter]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Incidents
            </CardTitle>
            <Badge variant="outline" className="px-2 py-1">
              {filteredIncidents.length} {filteredIncidents.length === 1 ? 'Incident' : 'Incidents'}
            </Badge>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search incidents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Badge
              variant={statusFilter === 'ALL' ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => onStatusFilterChange('ALL')}
            >
              All
            </Badge>
            {['REPORTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                className={`whitespace-nowrap cursor-pointer ${
                  status === 'REPORTED' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                  status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' :
                  status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                  'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                }`}
                onClick={() => onStatusFilterChange(status)}
              >
                {status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="space-y-2 max-h-[500px] overflow-y-auto p-2">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Siren className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
              <p>No incidents found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${
                  selectedIncidentId === incident.id
                    ? 'border-primary bg-accent/30'
                    : 'border-transparent'
                }`}
                onClick={() => onSelectIncident(incident)}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-medium line-clamp-1">{incident.title}</h4>
                  <div className="flex gap-2">
                    <Badge variant={getStatusVariant(incident.status)} className="whitespace-nowrap">
                      {incident.status.split('_').map(word => 
                        word.charAt(0) + word.slice(1).toLowerCase()
                      ).join(' ')}
                    </Badge>
                    <Badge variant={getPriorityVariant(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </div>
                </div>
                
                {incident.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {incident.description}
                  </p>
                )}
                
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <User className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span>
                      {incident.assignedOfficers?.length > 0 
                        ? `Assigned to ${incident.assignedOfficers.length} officer${incident.assignedOfficers.length !== 1 ? 's' : ''}`
                        : 'Unassigned'}
                    </span>
                  </div>
                  {incident.assignedOfficers?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {incident.assignedOfficers.slice(0, 3).map((officer, idx) => {
                        // If officer is a string, just display it
                        if (typeof officer === 'string') {
                          return (
                            <Badge 
                              key={`${officer}-${idx}`}
                              variant="outline" 
                              className="text-xs h-5 px-1.5 py-0.5"
                              title={officer}
                            >
                              {officer}
                            </Badge>
                          );
                        }
                        
                        // If we have officer data as an object
                        const officerName = officer.name || 
                                         officer.user?.name || 
                                         `Officer ${officer.id || idx + 1}`;
                        const firstName = officerName.split(' ')[0];
                        const badgeNumber = officer.badgeNumber;
                        
                        return (
                          <Badge 
                            key={`${officer.id || idx}-${badgeNumber || ''}`}
                            variant="outline" 
                            className="text-xs h-5 px-1.5 py-0.5 flex items-center gap-1"
                            title={`${officerName}${badgeNumber ? ` (${badgeNumber})` : ''}${officer.rank ? ` | ${officer.rank}` : ''}`}
                          >
                            <span className="font-medium">{firstName}</span>
                            {badgeNumber && <span className="text-[10px] opacity-75">{badgeNumber}</span>}
                          </Badge>
                        );
                      })}
                      {incident.assignedOfficers.length > 3 && (
                        <Badge 
                          variant="outline" 
                          className="text-xs h-5 px-1.5 py-0.5"
                          title={incident.assignedOfficers.slice(3).map(o => 
                            typeof o === 'string' ? o : o.name || `Officer ${o.id || ''}`
                          ).join(', ')}
                        >
                          +{incident.assignedOfficers.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate max-w-[120px]">
                      {incident.location.address || 'Location not specified'}
                    </span>
                  </div>
                  <div className="flex items-center" title={new Date(incident.reportedAt).toLocaleString()}>
                    <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="whitespace-nowrap">
                      {isValidDate(incident.reportedAt) 
                        ? formatDate(incident.reportedAt) 
                        : 'Invalid date'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
