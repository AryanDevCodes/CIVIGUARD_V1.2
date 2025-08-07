import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, MapPin, Calendar, User, AlertTriangle, Clock, FileText, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { incidentsService } from '@/services/apiService';
import IncidentUpdates from '@/components/incident/IncidentUpdates';
import AddIncidentUpdate from '@/components/incident/AddIncidentUpdate';
import { useAuth } from '@/context/AuthContext';

interface IncidentDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  incidentType: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  reportedBy: {
    name: string;
    email: string;
  };
  assignedOfficers: Array<{
    id: string;
    name: string;
    badgeNumber: string;
    rank: string;
  }>;
  reportDate: string;
  resolutionDate: string | null;
  resolutionNotes: string | null;
  updates: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedBy: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

const IncidentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [incident, setIncident] = useState<IncidentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('updates');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchIncident = async () => {
    try {
      setIsLoading(true);
      const response = await incidentsService.getById(id!);
      setIncident(response.data);
    } catch (error: any) {
      console.error('Error fetching incident:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load incident details',
        variant: 'destructive',
      });
      navigate('/officer/incidents');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchIncident();
    }
  }, [id]);

  const handleUpdate = async () => {
    setIsRefreshing(true);
    await fetchIncident();
    toast({
      title: 'Success',
      description: 'Incident updated successfully',
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-green-500">Low Priority</Badge>;
      default:
        return <Badge variant="outline">Unknown Priority</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'reported':
        return <Badge variant="outline">Reported</Badge>;
      case 'under_investigation':
        return <Badge className="bg-blue-500">Under Investigation</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-500">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>;
      default:
        return <Badge variant="outline">Unknown Status</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6">
        <p>Incident not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/officer/incidents')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Incidents
        </Button>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => fetchIncident()}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Incident details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl font-bold">{incident.title}</CardTitle>
                  <CardDescription>
                    Incident ID: {incident.id}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(incident.status)}
                  {getPriorityBadge(incident.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{incident.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </h4>
                    <p className="text-muted-foreground">
                      {incident.location.address}<br />
                      {incident.location.city}, {incident.location.state}<br />
                      {incident.location.country}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Reported On
                    </h4>
                    <p className="text-muted-foreground">
                      {format(new Date(incident.reportDate), 'PPPpp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Reported By
                    </h4>
                    <p className="text-muted-foreground">
                      {incident.reportedBy.name}<br />
                      {incident.reportedBy.email}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Incident Type
                    </h4>
                    <p className="text-muted-foreground">
                      {incident.incidentType.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="updates">
                <FileText className="h-4 w-4 mr-2" />
                Updates
              </TabsTrigger>
              <TabsTrigger value="officers">
                <Shield className="h-4 w-4 mr-2" />
                Assigned Officers
              </TabsTrigger>
            </TabsList>
            <TabsContent value="updates" className="mt-4">
              <div className="space-y-6">
                {user && (
                  <AddIncidentUpdate 
                    incidentId={incident.id} 
                    currentStatus={incident.status}
                    onUpdate={handleUpdate}
                  />
                )}
                <IncidentUpdates 
                  updates={incident.updates || []} 
                  className="mt-6"
                />
              </div>
            </TabsContent>
            <TabsContent value="officers" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  {incident.assignedOfficers && incident.assignedOfficers.length > 0 ? (
                    <ul className="space-y-4">
                      {incident.assignedOfficers.map((officer) => (
                        <li key={officer.id} className="flex items-center p-3 border rounded-lg">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <p className="font-medium">{officer.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {officer.rank} • Badge: {officer.badgeNumber}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No officers assigned to this incident.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right column - Timeline and actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Incident Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incident.updates && incident.updates.length > 0 ? (
                  <ul className="space-y-4">
                    {[...incident.updates]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((update) => (
                        <li key={update.id} className="relative pl-6 pb-4 border-l-2 border-primary/20">
                          <div className="absolute -left-2 top-2 h-3 w-3 rounded-full bg-primary"></div>
                          <div className="text-sm">
                            <p className="font-medium">{update.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {update.updatedBy.name} • {format(new Date(update.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No updates available.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {incident.resolutionDate && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Resolution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-green-800">
                    <span className="font-medium">Resolved on:</span>{' '}
                    {format(new Date(incident.resolutionDate), 'PPPpp')}
                  </p>
                  {incident.resolutionNotes && (
                    <div>
                      <p className="text-sm font-medium text-green-800">Resolution Notes:</p>
                      <p className="text-sm text-green-700 mt-1">{incident.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailsPage;
