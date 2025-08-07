import React, { useEffect, useState } from 'react';
import { patrolService } from '@/services/patrolService';
import { PatrolVehicle } from '@/types/patrol';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

export const PatrolVehicleList: React.FC = () => {
  const [vehicles, setVehicles] = useState<PatrolVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        const data = await patrolService.getPatrolVehicles();
        setVehicles(data);
      } catch (error) {
        console.error('Failed to load patrol vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();

    // Cleanup function
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Format vehicle type for better display
  const formatVehicleType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">Active</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'ASSIGNED':
        return <Badge variant="outline">Assigned</Badge>;
      case 'OUT_OF_SERVICE':
        return <Badge variant="destructive">Out of Service</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading patrol vehicles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Patrol Vehicles</h2>
          <p className="text-sm text-muted-foreground">
            {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vehicles..."
            className="pl-9 h-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[120px]">Vehicle #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="font-semibold">{vehicle.vehicleNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {vehicle.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatVehicleType(vehicle.type)}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.model}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{vehicle.model}</div>
                      {vehicle.assignedOfficerId && (
                        <div className="text-xs text-muted-foreground">
                          Officer: {vehicle.assignedOfficerId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{vehicle.location.district || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.location.city || vehicle.location.state || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-medium">
                        {vehicle.lastLocationUpdate 
                          ? new Date(vehicle.lastLocationUpdate).toLocaleDateString()
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vehicle.lastLocationUpdate 
                          ? new Date(vehicle.lastLocationUpdate).toLocaleTimeString()
                          : ''}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {vehicles.length === 0 ? (
                      'No patrol vehicles found.'
                    ) : (
                      'No vehicles match your search.'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
