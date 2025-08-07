import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsService } from '@/services/apiService';
import { toast } from 'react-hot-toast';
import { mapAlertFromBackend, mapAlertToBackend } from '@/utils/dataMappers';
import AlertForm from '@/components/admin/AlertForm';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Loader2, Bell } from 'lucide-react';

const AdminAlertsPage: React.FC = () => {
  const [severityFilter, setSeverityFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [areaFilter, setAreaFilter] = React.useState('');
  const [createdByFilter, setCreatedByFilter] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [editAlert, setEditAlert] = React.useState<any | null>(null);

  const { data: alertsRaw = [], isLoading, error } = useQuery({
    queryKey: ['alerts', 'admin', { severityFilter, statusFilter, areaFilter, createdByFilter, dateFrom, dateTo }],
    queryFn: async () => {
      try {
        const params: Record<string, any> = {};
        if (severityFilter) params.severity = severityFilter;
        if (statusFilter) params.status = statusFilter;
        if (areaFilter) params.area = areaFilter;
        if (createdByFilter) params.createdBy = createdByFilter;
        if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString();
        if (dateTo) params.dateTo = new Date(dateTo).toISOString();
        
        console.log('Fetching alerts with params:', params);
        const response = await alertsService.filter(params);
        console.log('Alerts API Response:', response);
        
        // Handle different response formats
        let alerts = [];
        if (Array.isArray(response)) {
          alerts = response;
        } else if (response && Array.isArray(response.content)) {
          alerts = response.content;
        } else if (response && response.data) {
          alerts = Array.isArray(response.data) ? response.data : [response.data];
        }
        
        console.log('Mapped alerts:', alerts);
        return alerts.map(mapAlertFromBackend);
      } catch (err) {
        console.error('Error fetching alerts:', err);
        toast.error('Failed to load alerts');
        return [];
      }
    },
  });

  const uniqueSeverities = Array.from(new Set(alertsRaw.map((a: any) => String(a.severity)))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(alertsRaw.map((a: any) => String(a.status)))).filter(Boolean);
  const uniqueAreas = Array.from(new Set(alertsRaw.map((a: any) => String(a.area)))).filter(Boolean);
  const uniqueCreators = Array.from(new Set(alertsRaw.map((a: any) => String(a.createdBy)))).filter(Boolean);

  const handleCreate = async (data: any) => {
    try {
      // Map frontend data to backend format before sending
      const backendData = mapAlertToBackend(data);
      console.log('ALERT PAYLOAD SENT TO BACKEND:', backendData);
      await alertsService.create(backendData);
      setShowCreate(false);
      toast.success('Alert created successfully!');
    } catch (error) {
      toast.error('Failed to create alert');
      console.error(error);
    }
  };

  const handleEdit = async (data: any) => {
    try {
      await alertsService.update(data.id, data);
      setEditAlert(null);
      toast.success('Alert updated successfully!');
    } catch (error) {
      toast.error('Failed to update alert');
      console.error(error);
    }
  };

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
          <h2 className="text-4xl font-extrabold flex items-center gap-6 text-gray-900">
            <Bell className="h-10 w-10 text-primary" /> Alerts Dashboard
          </h2>
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setShowCreate(true)}
            aria-label="Create Alert"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowCreate(true); }}
          >
            + Create Alert
          </Button>
        </div>
        {/* FILTERS UI */}
        <div className="flex flex-wrap gap-4 mb-8 items-end bg-white/80 p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select className="border rounded px-2 py-1 w-32" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
              <option value="">All</option>
              {uniqueSeverities.map((severity: string) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="border rounded px-2 py-1 w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              {uniqueStatuses.map((status: string) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Area</label>
            <select className="border rounded px-2 py-1 w-32" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
              <option value="">All</option>
              {uniqueAreas.map((area: string) => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Created By</label>
            <select className="border rounded px-2 py-1 w-32" value={createdByFilter} onChange={e => setCreatedByFilter(e.target.value)}>
              <option value="">All</option>
              {uniqueCreators.map((creator: string) => <option key={creator} value={creator}>{creator}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input type="date" className="border rounded px-2 py-1 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input type="date" className="border rounded px-2 py-1 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        {/* END FILTERS UI */}
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
                <p className="text-sm text-gray-500 truncate mb-2">{alert.message || alert.description}</p>
                {/* Only render maps if the modal is not open */}
                {alert.latitude && alert.longitude && !showCreate && !editAlert && (
                  <div className="h-48 rounded-md overflow-hidden border">
                    <MapContainer
                      center={[alert.latitude, alert.longitude]}
                      zoom={13}
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[alert.latitude, alert.longitude]}>
                        <Popup>{alert.title || 'Alert Location'}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                )}
                <div className="text-xs text-gray-400">Created: {alert.createdAt}</div>
              </div>
              <div className="px-6 py-4 flex items-center justify-between text-sm text-gray-400 bg-gray-50 border-t">
                <span className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Created By:</span> 
                  {typeof alert.createdBy === 'object' ? (
                    alert.createdBy?.name || 'System'
                  ) : (
                    alert.createdBy || 'System'
                  )}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditAlert(alert)}
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      {/* Popup/modal for creating alert */}
      {showCreate && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          tabIndex={-1}
          onClick={() => setShowCreate(false)}
          onKeyDown={e => { if (e.key === 'Escape') setShowCreate(false); }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
              aria-label="Close"
              onClick={() => setShowCreate(false)}
            >
              ×
            </button>
            <AlertForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
            />
          </div>
        </div>
      )}
      {/* Alert Modal (Edit) */}
      {editAlert && (
        <AlertForm
          open={!!editAlert}
          onClose={() => setEditAlert(null)}
          onSubmit={handleEdit}
          initialValues={editAlert}
          isEdit={!!editAlert}
        />
      )}
    </>
  );
};

export default AdminAlertsPage;