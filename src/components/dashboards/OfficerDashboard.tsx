
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, MapPin, Bell, Calendar, Users, Clock, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { incidentsService, officersService } from '@/services/apiService';
import { mapIncidentFromBackend, mapOfficerFromBackend } from '@/utils/dataMappers';
import { useNavigate } from 'react-router-dom';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch incidents assigned to the officer
  const { data: assignedIncidents, isLoading: isIncidentsLoading } = useQuery({
    queryKey: ['incidents', 'officer', 'assigned'],
    queryFn: async () => {
      const response = await incidentsService.getAll({ assignedTo: user?.id });
      return response.data.map((incident: any) => mapIncidentFromBackend(incident));
    }
  });

  // Fetch officer performance stats
  const { data: officerStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['officers', 'stats', user?.id],
    queryFn: async () => {
      try {
        const response = await officersService.getById(user?.id || '');
        return response.data;
      } catch (error) {
        console.warn('Officer stats API not available, using fallback data');
        // Fallback data if API not implemented
        return {
          activeCases: 14,
          highPriorityCases: 4,
          resolvedThisWeek: 9,
          changeFromLastWeek: 2,
          patrolHours: 36.5,
          teamPerformance: 92
        };
      }
    }
  });

  // Cases in progress - would come from a specific API endpoint
  const casesInProgress = [
    {
      id: "4501",
      title: "Vandalism Case",
      progress: 75
    },
    {
      id: "4492",
      title: "Theft Investigation",
      progress: 40
    },
    {
      id: "4487",
      title: "Traffic Incident",
      progress: 90
    },
    {
      id: "4480",
      title: "Disturbance Report",
      progress: 10
    }
  ];

  // Schedule data - would come from officer schedule API
  const scheduleItems = [
    { 
      time: "08:00 AM", 
      title: "Morning Briefing", 
      location: "Station Conference Room", 
      completed: true
    },
    { 
      time: "10:30 AM", 
      title: "Downtown Patrol", 
      location: "Main Street to Commerce Ave", 
      completed: true
    },
    { 
      time: "02:00 PM", 
      title: "Community Meeting", 
      location: "Westside Community Center", 
      completed: false
    },
    { 
      time: "05:00 PM", 
      title: "End of Shift", 
      location: "Handover to Night Team", 
      completed: false 
    }
  ];

  const isLoading = isIncidentsLoading || isStatsLoading;
  
  // Extract active incidents from the fetched data
  const activeIncidents = assignedIncidents?.filter(incident => 
    incident.status !== 'resolved'
  ).slice(0, 3) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-card">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Welcome, Officer {user?.name?.split(' ')?.[1] || user?.name}!</h1>
          <p className="text-muted-foreground">Here's your activity summary for today.</p>
        </div>
        <Button className="w-full md:w-auto bg-red-500 hover:bg-red-600" variant="destructive">
          <Bell className="mr-2 h-4 w-4" />
          Emergency Dispatch
        </Button>
      </div>
      
      {/* Stats Cards */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardDescription>Active Cases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="stats-value">{officerStats?.activeCases || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {officerStats?.highPriorityCases || 0} high priority
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardDescription>Resolved This Week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="stats-value">{officerStats?.resolvedThisWeek || 0}</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="stats-change-positive">+{officerStats?.changeFromLastWeek || 0} from last week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardDescription>Patrol Hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="stats-value">{officerStats?.patrolHours || 0}</div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">This week</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stats-card">
            <CardHeader className="pb-2">
              <CardDescription>Team Performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="stats-value">{officerStats?.teamPerformance || 0}%</div>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Response time</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Active Incidents */}
      <Card className="shadow-card border-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 rounded-t-xl">
          <div>
            <CardTitle className="text-primary">Active Incidents</CardTitle>
            <CardDescription>Recent reports requiring attention</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary" onClick={() => navigate('/officer/incidents')}>
            View All
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {isIncidentsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : activeIncidents.length > 0 ? (
              activeIncidents.map((incident) => (
                <div key={incident.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className={`p-2 rounded-full ${
                    incident.severity === 'high' ? 'bg-red-100' : 
                    incident.severity === 'medium' ? 'bg-amber-100' : 'bg-green-100'
                  }`}>
                    <Shield className={`h-5 w-5 ${
                      incident.severity === 'high' ? 'text-red-500' : 
                      incident.severity === 'medium' ? 'text-amber-500' : 'text-green-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{incident.title || incident.type}</h4>
                        <Badge variant={
                          incident.severity === 'high' ? 'destructive' : 
                          incident.severity === 'medium' ? 'secondary' : 'outline'
                        } className="capitalize">
                          {incident.severity}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(incident.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1 gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{incident.location}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium">#{incident.id}</span>
                      <Badge variant="outline">
                        {incident.status === 'investigating' ? 'Assigned' : 
                         incident.status === 'reported' ? 'Pending' : 'Dispatched'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium">No Active Incidents</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You have no incidents assigned to you at this time.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Today's Schedule and Case Progress */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-card border-none">
          <CardHeader className="bg-primary/5 rounded-t-xl">
            <CardTitle className="text-primary">Today's Schedule</CardTitle>
            <CardDescription>Upcoming activities and shifts</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {scheduleItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 border-l-2 ${item.completed ? 'border-primary' : 'border-muted'} pl-4 ${
                    index < scheduleItems.length - 1 ? 'pb-5' : ''
                  } relative`}
                >
                  <div className={`absolute -left-1.5 top-0 h-3 w-3 rounded-full ${item.completed ? 'bg-primary' : 'bg-muted'}`}></div>
                  <div className="w-16 text-xs font-medium">{item.time}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card border-none">
          <CardHeader className="bg-primary/5 rounded-t-xl">
            <CardTitle className="text-primary">Case Progress</CardTitle>
            <CardDescription>Your assigned cases this week</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {casesInProgress.map((caseItem) => (
                <div key={caseItem.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{caseItem.title} #{caseItem.id}</div>
                    <div className="text-xs text-muted-foreground">{caseItem.progress}%</div>
                  </div>
                  <Progress value={caseItem.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OfficerDashboard;
