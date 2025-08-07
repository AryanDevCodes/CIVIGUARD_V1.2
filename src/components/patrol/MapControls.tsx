import React from 'react';
import { Layers, Users, Route, AlertTriangle, RefreshCw, MapPin, ZoomIn, ZoomOut, Layers3, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface MapLayers {
  officers: boolean;
  patrolRoutes: boolean;
  patrolVehicles: boolean;
  incidents: boolean;
  heatmap: boolean;
  traffic: boolean;
}

const defaultLayers: MapLayers = {
  officers: true,
  patrolRoutes: true,
  patrolVehicles: true,
  incidents: true,
  heatmap: false,
  traffic: false,
};

interface MapControlsProps {
  layers: MapLayers;
  onLayersChange: (layers: MapLayers) => void;
  onRefresh: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitBounds: () => void;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomChange: (zoom: number) => void;
  isRefreshing: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layers,
  onLayersChange,
  onRefresh,
  onZoomIn,
  onZoomOut,
  onFitBounds,
  zoom,
  minZoom,
  maxZoom,
  onZoomChange,
  isRefreshing,
}) => {
  const handleLayerToggle = (key: keyof MapLayers) => {
    onLayersChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      {/* Refresh Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>

      {/* Fit Bounds Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={onFitBounds}
        className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
      >
        <MapPin className="h-4 w-4" />
      </Button>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-background/80 backdrop-blur-sm rounded-md border p-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          disabled={zoom >= maxZoom}
          className="h-7 w-7"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="px-2 py-1">
          <Slider
            value={[zoom]}
            min={minZoom}
            max={maxZoom}
            step={0.5}
            onValueChange={([value]) => onZoomChange(value)}
            orientation="vertical"
            className="h-24"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          disabled={zoom <= minZoom}
          className="h-7 w-7"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Layers Control */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
          >
            <Layers3 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="end">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Map Layers</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="officers"
                  checked={layers.officers}
                  onCheckedChange={() => handleLayerToggle('officers')}
                />
                <Label htmlFor="officers" className="flex items-center gap-2 text-sm">
                  <Users className="h-3.5 w-3.5 text-blue-500" />
                  Officers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="patrolRoutes"
                  checked={layers.patrolRoutes}
                  onCheckedChange={() => handleLayerToggle('patrolRoutes')}
                />
                <Label htmlFor="patrolRoutes" className="flex items-center gap-2 text-sm">
                  <Route className="h-3.5 w-3.5 text-purple-500" />
                  Patrol Routes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="patrolVehicles"
                  checked={layers.patrolVehicles}
                  onCheckedChange={() => handleLayerToggle('patrolVehicles')}
                />
                <Label htmlFor="patrolVehicles" className="flex items-center gap-2 text-sm">
                  <Car className="h-3.5 w-3.5 text-green-500" />
                  Patrol Vehicles
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incidents-layer"
                  checked={layers.incidents}
                  onCheckedChange={() => handleLayerToggle('incidents')}
                />
                <Label htmlFor="incidents-layer" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Incidents
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <Checkbox
                  id="heatmap-layer"
                  checked={layers.heatmap}
                  onCheckedChange={() => handleLayerToggle('heatmap')}
                  disabled
                />
                <Label htmlFor="heatmap-layer" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  Heatmap (Coming Soon)
                </Label>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <Checkbox
                  id="traffic-layer"
                  checked={layers.traffic}
                  onCheckedChange={() => handleLayerToggle('traffic')}
                  disabled
                />
                <Label htmlFor="traffic-layer" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  Traffic (Coming Soon)
                </Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
