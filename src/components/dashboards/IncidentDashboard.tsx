import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { incidentsService } from '@/services/apiService';
import { mapIncidentFromBackend } from '@/utils/dataMappers';
import DashboardLayout from '../DashboardLayout';
      

const IncidentDashboard: React.FC = () => {
  const { data: incidents = [], isLoading, error } = useQuery({
    queryKey: ['incidents', 'dashboard', 'all'],
    queryFn: async () => {
      const response = await incidentsService.getAll();
      // Support both paginated and direct array responses
      const arr = response.data?.data?.content || response.data?.data || response.data || [];
      return arr.map((incident: any) => mapIncidentFromBackend(incident));
    }
  });

  if (isLoading) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Incidents Dashboard</CardTitle>
          <CardDescription>Loading all incidents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  if (error) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Incidents Dashboard</CardTitle>
          <CardDescription>Failed to load incidents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive py-8">Error loading incidents.</div>
        </CardContent>
      </Card>
    );
  }
  if (!incidents.length) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Incidents Dashboard</CardTitle>
          <CardDescription>No incidents found.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">No incidents in the system.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DashboardLayout>
    <Card className="my-6">
      <CardHeader>
        <CardTitle>Incidents Dashboard</CardTitle>
        <CardDescription>All reported incidents in the system</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
    </DashboardLayout>
  );
};

export default IncidentDashboard;
