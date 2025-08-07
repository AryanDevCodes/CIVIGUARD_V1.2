
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, FileText, MapPin, Phone, TrendingDown, TrendingUp, Shield, Loader2 } from "lucide-react";
import IncidentDashboard from './IncidentDashboard';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { incidentsService, alertsService } from '@/services/apiService';
import { mapIncidentFromBackend, mapAlertFromBackend } from '@/utils/dataMappers';
import { useNavigate } from 'react-router-dom';
import { useStompSubscription } from '@/hooks/useStompSubscription';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Fetch incidents for crime rate calculation
  const [incidents, setIncidents] = React.useState<any[]>([]);
const [alerts, setAlerts] = React.useState<any[]>([]);

const { data: incidentsData, isLoading: isIncidentsLoading } = useQuery({
  queryKey: ['incidents', 'citizen', 'summary'],
  queryFn: async () => {
    const response = await incidentsService.getAll();
    return response.data.map((incident: any) => mapIncidentFromBackend(incident));
  }
});

const { data: alertsData, isLoading: isAlertsLoading } = useQuery({
  queryKey: ['alerts', 'citizen', 'active'],
  queryFn: async () => {
    const response = await alertsService.getAllActive();
    // Support both paginated and direct array responses
    const arr = response.data?.content || response.data?.data?.content || response.data?.data || response.data || [];
    return arr.map((alert: any) => mapAlertFromBackend(alert));
  }
});

// Sync REST data to local state for real-time updates
React.useEffect(() => {
  if (incidentsData) setIncidents(incidentsData);
}, [incidentsData]);
React.useEffect(() => {
  if (alertsData) setAlerts(alertsData);
}, [alertsData]);

// Real-time incident updates
useStompSubscription({
  topic: '/topic/incidents',
  onMessage: (msg) => {
    setIncidents((prev) => [msg, ...prev]);
  },
});

// Real-time alert updates (if topic exists)
useStompSubscription({
  topic: '/topic/alerts',
  onMessage: (msg) => {
    setAlerts((prev) => [msg, ...prev]);
  },
});


  const isLoading = isIncidentsLoading || isAlertsLoading;

return (
  <div className="space-y-6 animate-in fade-in duration-500">
    {/* Welcome Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground">Here are your recent incidents and alerts.</p>
      </div>
      <Button className="w-full md:w-auto">
        <Phone className="mr-2 h-4 w-4" />
        Emergency Contact
      </Button>
    </div>

    {/* Incident Dashboard (system-wide) */}
    <IncidentDashboard />

    {/* Quick Actions */}
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Tools to help keep you safe</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-24 flex-col" onClick={() => navigate("/citizen/report")}> 
            <FileText className="h-6 w-6 mb-2" />
            <span>Report Incident</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col" onClick={() => navigate("/citizen/map")}> 
            <MapPin className="h-6 w-6 mb-2" />
            <span>View Crime Map</span>
          </Button>
          <Button variant="outline" className="h-24 flex-col" onClick={() => navigate("/citizen/alerts")}> 
            <Bell className="h-6 w-6 mb-2" />
            <span>Safety Alerts</span>
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Real Incidents List */}
    <Card>
      <CardHeader>
        <CardTitle>Your Reported Incidents</CardTitle>
        <CardDescription>All incidents you have reported, with live updates</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No incidents reported yet.</div>
        ) : (
          <ul className="divide-y divide-muted">
            {incidents.map((incident: any) => (
              <li key={incident.id} className="py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-lg">{incident.title}</div>
                    <div className="text-sm text-muted-foreground">{incident.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span>Status: {incident.status}</span> | <span>Type: {incident.incidentType}</span> | <span>Date: {incident.reportDate ? new Date(incident.reportDate).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                  {incident.images && incident.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                      {incident.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt="Incident" className="w-16 h-16 object-cover rounded-md border" />
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>

    {/* Real Alerts List */}
    <Card>
      <CardHeader>
        <CardTitle>Active Safety Alerts</CardTitle>
        <CardDescription>Stay informed about alerts in your area</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No active alerts in your area.</div>
        ) : (
          <ul className="divide-y divide-muted">
            {alerts.map((alert: any) => (
              <li key={alert.id} className="py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold text-lg">{alert.title}</div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <span>Severity: {alert.severity || 'N/A'}</span> | <span>Date: {alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>

    {/* Safety Tips */}
    <Card>
      <CardHeader>
        <CardTitle>Safety Tips</CardTitle>
        <CardDescription>Stay informed and protected</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Secure Your Home</h4>
            <p className="text-sm text-muted-foreground">Always lock doors and windows when leaving your house, even for a short time.</p>
          </div>
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Stay Alert in Public</h4>
            <p className="text-sm text-muted-foreground">Be aware of your surroundings and keep valuables secure when in public spaces.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
};

export default CitizenDashboard;
