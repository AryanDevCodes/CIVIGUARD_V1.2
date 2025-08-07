import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsService } from '@/services/apiService';
import { Loader2, Bell, Plus, Edit2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { mapAlertFromBackend } from '@/utils/dataMappers';

const OfficerAlertsPage: React.FC = () => {
  const { data: alertsRaw = [], isLoading, error } = useQuery({
    queryKey: ['alerts', 'officer'],
    queryFn: async () => {
      try {
        const response = await alertsService.getAll();
        return response.data.map(mapAlertFromBackend);
      } catch (error) {
        return [];
      }
    },
  });

  // Filtering logic can be added here (reuse admin logic if required)
  const [showCreate, setShowCreate] = React.useState(false);
  const [editAlertId, setEditAlertId] = React.useState<string | null>(null);

  // Placeholder for create/edit modal logic
  // ...

  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-lg text-gray-600">Loading alerts...</div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center py-24">
        <Bell className="h-12 w-12 text-destructive mb-4" />
        <div className="text-xl font-semibold text-destructive mb-2">Failed to load alerts</div>
        <div className="text-gray-500">Please try again later.</div>
      </div>
    );
  } else if (alertsRaw.length === 0) {
    content = (
      <div className="flex flex-col items-center justify-center py-24">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <div className="text-xl font-semibold text-gray-500 mb-2">No alerts found</div>
        <div className="text-gray-400">Try adjusting your filters or check back later.</div>
      </div>
    );
  } else {
    content = (
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-extrabold flex items-center gap-4 text-gray-900">
            <Bell className="h-9 w-9 text-primary" /> Officer Alerts
          </h2>
          <button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-5 w-5" /> Create Alert
          </button>
        </div>
        <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
          {alertsRaw.map((alert: any) => (
            <div
              key={alert.id}
              className="flex flex-col bg-white shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bell className={`h-5 w-5 ${alert.severity === 'high' ? 'text-destructive' : alert.severity === 'medium' ? 'text-amber-500' : 'text-primary'}`} />
                  <span className="font-semibold text-lg text-gray-800">{alert.title}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${alert.severity === 'high' ? 'bg-red-100 text-red-700' : alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{alert.severity}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{alert.status}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">{alert.area}</span>
                </div>
                <p className="text-sm text-gray-500 truncate">{alert.message || alert.description}</p>
                <div className="text-xs text-gray-400">Created: {alert.createdAt}</div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between text-sm text-gray-400 bg-gray-50 border-t">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Created By:</span> {alert.createdBy}
                </span>
                <button
                  className="flex items-center gap-1 px-2 py-1 rounded text-primary border border-primary hover:bg-primary/10 transition"
                  onClick={() => setEditAlertId(alert.id)}
                  title="Edit Alert"
                >
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* TODO: Add create/edit modal here */}
      </div>
    );
  }

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default OfficerAlertsPage;
