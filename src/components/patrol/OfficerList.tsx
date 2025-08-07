import React, {  useMemo } from 'react';
import { Users, MapPin, Clock, Badge as BadgeIcon, Route } from 'lucide-react';
import { Officer } from '@/types/patrol';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { OfficerStatus } from '@/types/patrol';

interface OfficerListProps {
  officers: Officer[];
  selectedOfficerId: string | null;
  onSelectOfficer: (officer: Officer) => void;
  className?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onStatusFilterChange?: (status: string) => void;
  statusFilter?: OfficerStatus | 'ALL';
}

export const OfficerList: React.FC<OfficerListProps> = ({
  officers,
  selectedOfficerId,
  onSelectOfficer,
  className = '',
  searchQuery = '',
  onSearchChange = () => {},
  onStatusFilterChange = () => {},
  statusFilter = 'ALL',
}) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ON_DUTY':
        return 'default';
      case 'ON_BREAK':
        return 'secondary';
      case 'IN_EMERGENCY':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Filter out any invalid officers (missing required fields)
  const validOfficers = useMemo(() => {
    return officers.filter(officer => 
      officer && 
      officer.id && 
      officer.name && 
      officer.badgeNumber && 
      officer.status
    );
  }, [officers]);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Officers on Duty
            </CardTitle>
            <Badge variant="outline" className="px-2 py-1">
              {validOfficers.length} Active
            </Badge>
          </div>
          
          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search officers..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
            <div className="relative">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ON_DUTY">On Duty</option>
                <option value="ON_BREAK">On Break</option>
                <option value="IN_EMERGENCY">In Emergency</option>
                <option value="OFF_DUTY">Off Duty</option>
              </select>
              <Filter className="absolute right-2 top-2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 max-h-[600px] overflow-y-auto p-2">
          {validOfficers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No officers currently on duty
            </div>
          ) : (
            validOfficers.map((officer) => (
              <div
                key={officer.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50 ${
                  selectedOfficerId === officer.id
                    ? 'border-primary bg-accent/30'
                    : 'border-transparent'
                }`}
                onClick={() => onSelectOfficer(officer)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={officer.avatar || `/avatars/${officer.id}.jpg`} 
                        alt={officer.name} 
                      />
                      <AvatarFallback>
                        {officer.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{officer.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <BadgeIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate" title={`Badge: ${officer.badgeNumber}`}>
                          {officer.badgeNumber}
                        </span>
                      </div>
                      {officer.rank && (
                        <div className="text-xs text-muted-foreground truncate" title={`Rank: ${officer.rank}`}>
                          {officer.rank}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={getStatusVariant(officer.status)}
                      className="whitespace-nowrap text-xs h-5"
                      title={`Status: ${getStatusText(officer.status)}`}
                    >
                      {getStatusText(officer.status)}
                    </Badge>
                    {officer.department && (
                      <Badge 
                        variant="outline" 
                        className="text-xs h-5 mt-0.5 bg-secondary/50"
                        title={`Department: ${officer.department}`}
                      >
                        {officer.department.split(' ').map(w => w[0]).join('')}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {officer.currentPatrolRoute && (
                  <div className="mt-2 pt-2 border-t text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Route className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span className="truncate">
                        {officer.currentPatrolRoute.name}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center min-w-0">
                      <MapPin className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span 
                        className="truncate max-w-[140px]" 
                        title={officer.currentLocation?.address || officer.location?.address || 'Location tracking inactive'}
                      >
                        {officer.currentLocation?.address || officer.location?.address || 'Location tracking inactive'}
                      </span>
                    </div>
                    <div className="flex items-center ml-2">
                      <Clock className="h-3 w-3 mr-1.5 flex-shrink-0" />
                      <span 
                        className="whitespace-nowrap" 
                        title={officer.lastUpdated ? `Last updated: ${new Date(officer.lastUpdated).toLocaleString()}` : 'No update time'}
                      >
                        {officer.lastUpdated 
                          ? `${new Date(officer.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                          : 'No update'}
                      </span>
                    </div>
                  </div>
                  {officer.designation && (
                    <div className="mt-1 text-xs text-muted-foreground truncate" title={`Designation: ${officer.designation}`}>
                      {officer.designation}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
