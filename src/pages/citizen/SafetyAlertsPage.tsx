import React, { useState, useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, AlertTriangle, AlertCircle, Info, MessageSquare as MessageSquareIcon, Mail as MailIcon, Save as SaveIcon, Loader2, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '@/services/apiService';
import { mapAlertFromBackend } from '@/utils/dataMappers';
import { AlertType, AlertsResponse } from '@/types';



const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    case 'medium':
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case 'low':
      return <Info className="h-5 w-5 text-primary" />;
    default:
      return <Info className="h-5 w-5 text-primary" />;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'high':
      return <Badge variant="destructive">Critical</Badge>;
    case 'medium':
      return <Badge variant="outline" className="bg-amber-500 text-white border-amber-500">Important</Badge>;
    case 'low':
      return <Badge variant="outline">Informational</Badge>;
    default:
      return <Badge variant="outline">Informational</Badge>;
  }
};

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  const months = Math.floor(days / 30);
  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
};

const SafetyAlertsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null);

  interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
  }

  interface AlertsData {
    content: any[];
    totalElements: number;
  }



  const { 
    data: alertsResponse = { content: [], totalElements: 0 }, 
    isLoading, 
    error,
    isError,
    refetch,
    isRefetching
  } = useQuery<AlertsResponse<AlertType>>({
    queryKey: ['alerts', 'safety'],
    queryFn: async (): Promise<AlertsResponse<AlertType>> => {
      console.log('[SafetyAlertsPage] Fetching alerts...');
      try {
        // Make the API call
        console.log('[SafetyAlertsPage] Making API request to fetch alerts...');
        const response = await alertsService.getAll({ 
          page: 0, 
          size: 100, // Adjust page size as needed
          sort: 'createdAt,desc' 
        });
        
        console.log('[SafetyAlertsPage] API Response Status:', response?.status);
        console.log('[SafetyAlertsPage] API Response Headers:', response?.headers);
        console.log('[SafetyAlertsPage] Raw API Response Data:', response?.data);
        
        if (!response) {
          console.error('[SafetyAlertsPage] Empty response received from API');
          throw new Error('No response received from server');
        }
        
        // Handle different response formats
        let alertsData: any;
        if (response && response.data) {
          // If response is wrapped in a data property (common pattern)
          alertsData = response.data;
        } else if (response && 'content' in response) {
          // If response follows the expected format directly
          alertsData = response;
        } else {
          console.warn('[SafetyAlertsPage] Unexpected API response format:', response);
          throw new Error('Unexpected response format from server');
        }
        
        // Validate the response data structure
        if (!alertsData || !Array.isArray(alertsData.content)) {
          console.warn('[SafetyAlertsPage] Invalid alerts data format:', alertsData);
          throw new Error('Invalid data format received from server');
        }
        
        // Map and validate each alert
        const mappedAlerts = alertsData.content
          .map((alert: any) => {
            try {
              const mapped = mapAlertFromBackend(alert);
              if (!mapped?.id || !mapped.title) {
                console.warn('[SafetyAlertsPage] Skipping invalid alert:', alert);
                return null;
              }
              return {
                ...mapped,
                isRead: alert.readByUsers && alert.readByUsers.length > 0,
              } as AlertType;
            } catch (error) {
              console.error('[SafetyAlertsPage] Error mapping alert:', error, alert);
              return null;
            }
          })
          .filter((alert: AlertType | null): alert is AlertType => alert !== null);
          
        console.log('[SafetyAlertsPage] Successfully mapped alerts:', mappedAlerts);
        
        return {
          content: mappedAlerts,
          totalElements: alertsData.totalElements || mappedAlerts.length
        };
        
      } catch (error: any) {
        console.error('[SafetyAlertsPage] Error in queryFn:', error);
        
        // Log detailed error information
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('[SafetyAlertsPage] Error response data:', error.response.data);
          console.error('[SafetyAlertsPage] Error response status:', error.response.status);
          console.error('[SafetyAlertsPage] Error response headers:', error.response.headers);
          
          // Log validation errors if they exist
          if (error.response.data?.errors) {
            console.error('[SafetyAlertsPage] Validation errors:', error.response.data.errors);
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('[SafetyAlertsPage] No response received:', error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('[SafetyAlertsPage] Request setup error:', error.message);
        }
        
        // Get user-friendly error message
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Failed to load safety alerts. Please check your connection and try again.';
        
        // Show error toast with retry option
        toast({
          title: 'Error Loading Alerts',
          description: errorMessage,
          variant: 'destructive',
          action: (
            <Button 
              variant="ghost" 
              onClick={() => {
                console.log('[SafetyAlertsPage] Retrying fetch...');
                refetch();
              }}
              className="text-white hover:bg-white/20"
            >
              Retry
            </Button>
          ),
        });
        
        // Return empty data structure to prevent UI from breaking
        return { content: [], totalElements: 0 };
      }
    },
  });

  const alerts = alertsResponse?.content || [];
  
  const filteredAlerts = useMemo(() => {
    if (!alertsResponse?.content) return [];
    
    let alerts = [...alertsResponse.content];
    
    // Filter by active tab
    if (activeTab === 'unread') {
      alerts = alerts.filter(alert => !alert.isRead);
    } else if (activeTab === 'read') {
      alerts = alerts.filter(alert => alert.isRead);
    }
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      alerts = alerts.filter(alert => {
        return (
          alert.title?.toLowerCase().includes(query) ||
          alert.description?.toLowerCase().includes(query) ||
          alert.area?.toLowerCase().includes(query) ||
          alert.type?.toLowerCase().includes(query) ||
          (alert.severity && alert.severity.toLowerCase().includes(query))
        );
      });
    }
    
    return alerts;
  }, [alertsResponse, searchQuery, activeTab]);

  const markAsRead = async (id: string) => {
    try {
      await alertsService.markAsRead(id);
      
      // Update the query cache to reflect the read status
      queryClient.setQueryData<AlertsResponse<AlertType>>(
        ['alerts', 'safety'],
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            content: oldData.content.map(alert => 
              alert.id.toString() === id 
                ? { ...alert, isRead: true } 
                : alert
            )
          };
        }
      );
      
      toast({
        title: "Success",
        description: "Alert marked as read",
      });
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as read",
        variant: "destructive",
      });
    }
  };
  
  // Make sure to get the queryClient at the top of your component
  const queryClient = useQueryClient();

  const viewDetails = (id: string) => {
    console.log(`Opening details popup for alert ID: ${id}`);
    // Make sure we're using the correct ID format (string or number)
    const alert = alerts.find((a: AlertType) => a.id.toString() === id.toString());
    if (alert) {
      setSelectedAlert(alert);
      
      // Mark the alert as read when viewing details
      if (!alert.isRead) {
        alertsService.markAsRead(alert.id.toString())
          .then(() => {
            // Update the local state to reflect the read status
            alert.isRead = true;
          })
          .catch(error => {
            console.error('Failed to mark alert as read:', error);
          });
      }
    } else {
      console.warn(`Alert with ID ${id} not found`);
      toast({
        title: 'Error',
        description: 'Alert not found.',
        variant: 'destructive',
      });
    }
  };

  const closeDialog = () => {
    setSelectedAlert(null);
  };

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    sms: false,
    desktop: true
  });

  const handleSavePreferences = () => {
    toast({
      title: "Preferences Saved",
      description: "Your notification preferences have been updated."
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Safety Alerts</h1>
            <p className="text-muted-foreground">Stay informed about safety alerts in your area</p>
          </div>
          <div className="w-full md:w-auto flex items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search alerts..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading || isRefetching}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
            >
              {isLoading || isRefetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Tabs 
          defaultValue="all" 
          onValueChange={(value) => setActiveTab(value)}
          className={isLoading || isRefetching ? 'opacity-50 pointer-events-none' : ''}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" disabled={isLoading || isRefetching}>All Alerts</TabsTrigger>
            <TabsTrigger value="critical" disabled={isLoading || isRefetching}>Critical</TabsTrigger>
            <TabsTrigger value="unread" disabled={isLoading || isRefetching}>Unread</TabsTrigger>
          </TabsList>

          {/* Error State */}
          {isError && (
            <div className="rounded-md bg-destructive/10 p-4 border border-destructive/30">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-destructive">
                    Failed to load alerts
                  </h3>
                  <div className="mt-2 text-sm text-destructive">
                    <p className="mb-2">
                      {error?.message || 'An error occurred while loading alerts. Please try again.'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      disabled={isRefetching}
                      className="mt-2"
                    >
                      {isRefetching ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Retrying...
                        </>
                      ) : 'Retry'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isLoading || isRefetching) && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading safety alerts...</p>
            </div>
          )}

          <TabsContent value="all" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert: AlertType) => (
                  <Card key={alert.id} className={`overflow-hidden ${!alert.isRead ? 'border-primary/50' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <CardDescription>{alert.area} • {timeAgo(alert.createdAt)}</CardDescription>
                          </div>
                        </div>
                        {getSeverityBadge(alert.severity)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                          {!alert.isRead && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(alert.id)}>
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(alert.id)}
                            aria-label={`View details for alert ${alert.title}`}
                          >
                            View Details
                          </Button>
                        </div>
                        <Badge variant="outline">{alert.type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 border rounded-lg">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No critical alerts found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? 'Try a different search term' : 'There are no critical alerts at this time.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="unread" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {isLoading ? (
                <div className="md:col-span-2 flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert: AlertType) => (
                  <Card key={alert.id} className={`overflow-hidden ${!alert.isRead ? 'border-primary/50' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <CardTitle className="text-lg">{alert.title}</CardTitle>
                            <CardDescription>{alert.area} • {timeAgo(alert.createdAt)}</CardDescription>
                          </div>
                        </div>
                        {getSeverityBadge(alert.severity)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{alert.message}</p>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                          {!alert.isRead && (
                            <Button size="sm" variant="outline" onClick={() => markAsRead(alert.id)}>
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewDetails(alert.id)}
                            aria-label={`View details for alert ${alert.title}`}
                          >
                            View Details
                          </Button>
                        </div>
                        <Badge variant="outline">{alert.type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-12 border rounded-lg">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium">No unread alerts found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ? 'Try a different search term' : 'There are no unread alerts at this time.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedAlert} onOpenChange={closeDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  {selectedAlert && getSeverityIcon(selectedAlert.severity)}
                  <div>
                    <DialogTitle>{selectedAlert?.title}</DialogTitle>
                    <DialogDescription>
                      {selectedAlert?.area} • {selectedAlert && timeAgo(selectedAlert.createdAt)}
                    </DialogDescription>
                  </div>
                </div>
                {selectedAlert && getSeverityBadge(selectedAlert.severity)}
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Message</h3>
                <p className="text-sm text-muted-foreground">{selectedAlert?.message}</p>
              </div>
              <div>
                <h3 className="font-medium">Details</h3>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-medium">ID:</dt>
                    <dd>{selectedAlert?.id}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Type:</dt>
                    <dd>{selectedAlert?.type}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Status:</dt>
                    <dd>{selectedAlert?.isActive ? 'Active' : 'Inactive'}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium">Read:</dt>
                    <dd>{selectedAlert?.isRead ? 'Yes' : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to receive safety alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <MailIcon className="h-5 w-5 text-primary" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notificationPrefs.email}
                  onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, email: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notificationPrefs.push}
                  onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, push: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <MessageSquareIcon className="h-5 w-5 text-primary" />
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notificationPrefs.sms}
                  onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, sms: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <Label htmlFor="desktop-notifications">Desktop Alerts</Label>
                </div>
                <Switch
                  id="desktop-notifications"
                  checked={notificationPrefs.desktop}
                  onCheckedChange={(checked) => setNotificationPrefs({...notificationPrefs, desktop: checked})}
                />
              </div>
            </div>
            
            <Button onClick={handleSavePreferences}>
              <SaveIcon className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SafetyAlertsPage;