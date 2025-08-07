
import React from 'react';
import { ShieldAlert, Activity, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { alertsService } from '@/services/apiService';
import { mapAlertFromBackend } from '@/utils/dataMappers';

const ImportantAlerts = () => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', 'important'],
    queryFn: async () => {
      const response = await alertsService.getAll({ important: true });
      return response.data.map((alert: any) => mapAlertFromBackend(alert));
    }
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-2">
          <CardTitle className="text-xl text-red-800">Important Alerts</CardTitle>
          <CardDescription className="text-red-700/70">System notifications requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If no alerts, show a placeholder
  if (!alerts || alerts.length === 0) {
    return (
      <Card className="overflow-hidden border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-2">
          <CardTitle className="text-xl text-red-800">Important Alerts</CardTitle>
          <CardDescription className="text-red-700/70">System notifications requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No important alerts at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show real alerts
  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 pb-2">
        <CardTitle className="text-xl text-red-800">Important Alerts</CardTitle>
        <CardDescription className="text-red-700/70">System notifications requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {alerts.slice(0, 2).map((alert: any) => (
            <div 
              key={alert.id} 
              className={`flex items-start gap-3 p-4 ${
                alert.severity === 'high' 
                  ? 'bg-red-50 border border-red-100' 
                  : 'bg-amber-50 border border-amber-100'
              } rounded-lg shadow-sm hover:shadow-md transition-all`}
            >
              {alert.severity === 'high' ? (
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
              ) : (
                <Activity className="h-5 w-5 text-warning mt-0.5" />
              )}
              <div>
                <h4 className="font-medium text-sm">{alert.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                <Button size="sm" variant={alert.severity === 'high' ? "destructive" : "outline"} className="mt-2">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantAlerts;
