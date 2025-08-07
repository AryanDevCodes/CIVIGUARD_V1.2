import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patrolService } from '@/services/patrolService';
import { PatrolVehicle, Officer, Incident } from '@/types/patrol';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapLayers } from './MapControls';
import { ArrowLeft, MapPin, Clock, User, Car, Wrench, AlertTriangle, Map as MapIcon, FileText, Fuel, Phone, Mail } from 'lucide-react';
import PatrolMap from './PatrolMap';

export const PatrolVehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<PatrolVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLayers, setMapLayers] = useState<MapLayers>({
    officers: false,
    incidents: false,
    patrolRoutes: false,
    patrolVehicles: true,
    heatmap: false,
    traffic: false,
  });

  
  useEffect(() => {
    const loadVehicle = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await patrolService.getPatrolVehicleById(id);
        setVehicle(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load vehicle details:', err);
        setError('Failed to load vehicle details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadVehicle();
  }, [id]);

  const getStatusIcon = () => {
    switch (vehicle?.status) {
      case 'ACTIVE':
        return <Car className="h-5 w-5 text-green-500" />;
      case 'MAINTENANCE':
        return <Wrench className="h-5 w-5 text-yellow-500" />;
      case 'OUT_OF_SERVICE':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Car className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading vehicle details...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-gray-900">Error loading vehicle</p>
        <p className="text-sm text-gray-500">{error}</p>
        <div className="flex space-x-2">
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
          <Button onClick={() => navigate('/officer/patrol-vehicles')} variant="outline">
            Back to Vehicles
          </Button>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Car className="h-12 w-12 text-gray-400" />
        <p className="text-lg font-medium text-gray-900">Vehicle not found</p>
        <p className="text-sm text-gray-500">The requested vehicle could not be found.</p>
        <Button onClick={() => navigate('/officer/patrol-vehicles')} variant="outline">
          Back to Vehicles
        </Button>
      </div>
    );
  }

  // Prepare map data
  const mapOfficers: Officer[] = [];
  const mapIncidents: Incident[] = [];
  
  if (vehicle.assignedOfficer) {
    mapOfficers.push(vehicle.assignedOfficer);
  }

  function formatLastUpdate(lastLocationUpdate: string): React.ReactNode {
    throw new Error('Function not implemented.');
  }

  function getOfficerStatusVariant(status: string): "default" | "destructive" | "outline" | "secondary" {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Vehicle Details</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/officer/patrol-vehicles/edit/${vehicle.id}`)}>
            Edit Vehicle
          </Button>
        </div>
      </div>
      
      {/* Vehicle Header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Car className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{vehicle.vehicleNumber}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon()}
                  <span className="text-sm text-muted-foreground capitalize">
                    {vehicle.status.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button size="sm" onClick={() => navigate(`/officer/patrol-vehicles/edit/${vehicle.id}`)}>
                Edit Vehicle
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Map View */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <MapIcon className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-medium">Vehicle Location</h3>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full">
            {vehicle.location ? (
              <PatrolMap
                officers={mapOfficers}
                incidents={mapIncidents}
                patrolRoutes={[]}
                patrolVehicles={[vehicle]}
                selectedOfficer={null}
                selectedIncident={null}
                selectedVehicle={vehicle}
                onVehicleSelect={() => {}}
                onOfficerSelect={() => {}}
                onIncidentSelect={() => {}}
                layers={mapLayers}
                onLayersChange={setMapLayers}
                onRefresh={() => {}}
                isRefreshing={false}
                className="h-full w-full rounded-b-lg"
                initialCenter={[vehicle.location.lat, vehicle.location.lng]}
                initialZoom={15}
                showControls={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/50">
                <div className="text-center space-y-2">
                  <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Location data not available</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Vehicle Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center space-x-2">
              <Car className="h-5 w-5 text-muted-foreground" />
              <span>Vehicle Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium">{vehicle.type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium">{vehicle.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mileage</p>
                <p className="font-medium">
                  {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fuel Level</p>
                <div className="flex items-center space-x-2">
                  {vehicle.fuelLevel !== undefined ? (
                    <>
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${vehicle.fuelLevel < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${vehicle.fuelLevel}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{vehicle.fuelLevel}%</span>
                    </>
                  ) : (
                    <span className="text-sm">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Information */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center space-x-2">
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <span>Maintenance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Last Service</p>
                <p className="font-medium">
                  {vehicle.lastMaintenanceDate 
                    ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Next Service</p>
                <p className={`font-medium ${
                  vehicle.nextMaintenanceDate && 
                  new Date(vehicle.nextMaintenanceDate) < new Date() 
                    ? 'text-red-500' 
                    : ''
                }`}>
                  {vehicle.nextMaintenanceDate 
                    ? new Date(vehicle.nextMaintenanceDate).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fuel Efficiency</p>
                <p className="font-medium">
                  {vehicle.fuelEfficiency ? `${vehicle.fuelEfficiency} km/L` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center space-x-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span>Documentation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Registration</p>
                <p className="font-medium">
                  {vehicle.registrationExpiry
                    ? `Expires ${new Date(vehicle.registrationExpiry).toLocaleDateString()}`
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Insurance</p>
                <p className="font-medium">
                  {vehicle.insuranceExpiry
                    ? `Expires ${new Date(vehicle.insuranceExpiry).toLocaleDateString()}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Location</CardTitle>
            <CardDescription>Current vehicle location</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicle.location ? (
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p>{vehicle.location.address || 'No address available'}</p>
                    {vehicle.location.city && (
                      <p className="text-sm text-muted-foreground">
                        {[vehicle.location.city, vehicle.location.state, vehicle.location.postalCode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                    {vehicle.location.lat && vehicle.location.lng && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {vehicle.location.lat.toFixed(6)}, {vehicle.location.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
                {vehicle.lastLocationUpdate && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Last updated: {formatLastUpdate(vehicle.lastLocationUpdate)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No location data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <span>Assigned Officer</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicle.assignedOfficer ? (
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-base">{vehicle.assignedOfficer.name}</p>
                      <Badge variant={getOfficerStatusVariant(vehicle.assignedOfficer.status)} className="text-xs">
                        {vehicle.assignedOfficer.status.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Badge: {vehicle.assignedOfficer.badgeNumber}
                    </p>
                    {vehicle.assignedOfficer.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        <span className="truncate">
                          {vehicle.assignedOfficer.location.address || 
                           `${vehicle.assignedOfficer.location.lat.toFixed(4)}, ${vehicle.assignedOfficer.location.lng.toFixed(4)}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 pt-2 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => navigate(`/officer/officers/${vehicle.assignedOfficer.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement unassign officer
                    }}
                  >
                    Unassign
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No officer assigned to this vehicle</p>
                <Button 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    // TODO: Implement assign officer modal
                  }}
                >
                  Assign Officer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    </div>
  );
};
