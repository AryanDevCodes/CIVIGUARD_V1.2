
import React from 'react';
import ComprehensiveBarChart from '@/components/charts/ComprehensiveBarChart';
import { useQuery } from '@tanstack/react-query';
import { incidentsService } from '@/services/apiService';
import { mapIncidentFromBackend } from '@/utils/dataMappers';
import { Loader2 } from 'lucide-react';

const IncidentsTab = () => {
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['incidents', 'summary'],
    queryFn: async () => {
      const response = await incidentsService.getAll();
      return response.data.map((incident: any) => mapIncidentFromBackend(incident));
    }
  });

  // Calculate incident counts from the real data
  const reportedCount = incidentsData?.filter((incident: any) => incident.status === 'reported').length || 0;
  const resolvedCount = incidentsData?.filter((incident: any) => incident.status === 'resolved').length || 0;
  const ongoingCount = incidentsData?.filter((incident: any) => incident.status === 'investigating').length || 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      <h4 className="font-medium text-lg">Monthly Incident Trends</h4>
      <div className="p-4 bg-white rounded-xl shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <ComprehensiveBarChart
  endpoint="/api/analytics/incidents-monthly"
  labelKey="month"
  valueKeys={["reported", "resolved", "ongoing"]}
  title="Incidents by Month"
/>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <div className="border rounded-lg p-6 text-center bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md">
          <div className="text-xs text-muted-foreground mb-2 uppercase font-medium">Reported</div>
          <div className="text-2xl font-semibold text-blue-600">{reportedCount}</div>
        </div>
        <div className="border rounded-lg p-6 text-center bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md">
          <div className="text-xs text-muted-foreground mb-2 uppercase font-medium">Resolved</div>
          <div className="text-2xl font-semibold text-green-600">{resolvedCount}</div>
        </div>
        <div className="border rounded-lg p-6 text-center bg-white/80 hover:bg-white transition-colors shadow-sm hover:shadow-md">
          <div className="text-xs text-muted-foreground mb-2 uppercase font-medium">Ongoing</div>
          <div className="text-2xl font-semibold text-amber-600">{ongoingCount}</div>
        </div>
      </div>
    </div>
  );
};

export default IncidentsTab;
