import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { systemService, type SystemStatus, type SystemMetrics } from '@/services/systemService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Clock, 
  Activity, 
  Network, 
  Upload, 
  Download, 
  Lock, 
  AlertTriangle, 
  Users, 
  Bell, 
  MapPin, 
  Car, 
  Siren, 
  BarChart2, 
  Server, 
  BookOpen,
  Cloud,
  AlertCircle
} from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import type { ApexOptions } from 'apexcharts';
import { Client } from '@stomp/stompjs';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/DashboardLayout';

// Types
interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  component: string;
  message: string;
  context?: Record<string, unknown>;
}

interface SystemUser {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'AUDITOR' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED';
  lastLogin?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemLogsResponse {
  logs: SystemLog[];
  total: number;
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Format bytes to human readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Format uptime to human readable format
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  
  return parts.join(' ');
};

// Format network speed
const formatNetworkSpeed = (bytes: number, decimals = 2, isRate = true): string => {
  if (bytes === 0) return `0 B${isRate ? '/s' : ''}`;
  return `${formatBytes(bytes, decimals)}${isRate ? '/s' : ''}`;
};

// Calculate rate between two metric points
const calculateRate = (current: number, previous: number, timeDiffMs: number): number => {
  if (!previous || !timeDiffMs) return 0;
  const diff = current - previous;
  return diff > 0 ? (diff * 1000) / timeDiffMs : 0; // Convert to bytes per second
};

// Component for system metrics chart
interface ChartData {
  series: ApexAxisChartSeries;
  categories: string[];
}

interface SystemMetricsChartProps {
  data: SystemMetrics[];
}

const SystemMetricsChart: React.FC<SystemMetricsChartProps> = ({ data = [] }) => {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [activeTab, setActiveTab] = useState<'overview' | 'cpu' | 'memory' | 'disk'>('overview');

  // Calculate CPU usage percentage from load average and cores
  const calculateCpuUsage = (cpu: SystemMetrics['cpu']) => {
    if (!cpu) return 0;
    
    // If we have direct usage percentage, use that (ensuring it's within 0-100)
    if (typeof cpu.usage === 'number' && !isNaN(cpu.usage)) {
      return Math.min(100, Math.max(0, Number(cpu.usage.toFixed(2))));
    }
    
    // Fallback to load average calculation if available
    if (Array.isArray(cpu.load) && cpu.load.length > 0 && cpu.cores) {
      // Get 1-minute load average and scale by number of cores
      const loadAverage = cpu.load[0];
      // Calculate usage percentage (capped at 100%)
      const usage = Math.min(100, (loadAverage / cpu.cores) * 100);
      return Number(usage.toFixed(2));
    }
    
    return 0; // Default to 0 if no valid data
  };

  // Calculate memory usage percentage
  const calculateMemoryUsage = (memory: SystemMetrics['memory']) => {
    if (!memory || memory.total <= 0) return 0;
    
    try {
      // Ensure used doesn't exceed total
      const used = Math.min(memory.used, memory.total);
      // Calculate percentage and ensure it's between 0 and 100
      const usage = (used / memory.total) * 100;
      return Math.min(100, Math.max(0, Number(usage.toFixed(2))));
    } catch (error) {
      console.error('Error calculating memory usage:', error);
      return 0;
    }
  };

  // Calculate disk usage percentage
  const calculateDiskUsage = (disk: SystemMetrics['disk']) => {
    if (!disk || disk.total <= 0) return 0;
    
    try {
      // Ensure used doesn't exceed total
      const used = Math.min(disk.used, disk.total);
      // Calculate percentage and ensure it's between 0 and 100
      const usage = (used / disk.total) * 100;
      return Math.min(100, Math.max(0, Number(usage.toFixed(2))));
    } catch (error) {
      console.error('Error calculating disk usage:', error);
      return 0;
    }
  };

  // Process data for ApexCharts
  const chartData = React.useMemo<ChartData>(() => {
    const emptyState: ChartData = { series: [], categories: [] };
    if (!data || data.length === 0) {
      console.warn('No metrics data available yet');
      return emptyState;
    }

    console.log('Processing metrics data:', data);

    // Filter by time range and validate data
    const now = Date.now();
    const rangeMs = timeRange === '1h' ? 3600000 : timeRange === '6h' ? 21600000 : 86400000;
    
    const validData = data
      .filter((item): item is SystemMetrics => {
        if (!item || !item.timestamp) return false;
        
        // Validate timestamp
        const timestamp = new Date(item.timestamp).getTime();
        if (isNaN(timestamp) || timestamp < now - rangeMs) return false;
        
        // Validate CPU data
        if (!item.cpu || !Array.isArray(item.cpu.load) || item.cpu.load.length === 0) return false;
        
        // Validate memory data
        if (!item.memory || 
            typeof item.memory.total !== 'number' || 
            typeof item.memory.used !== 'number') return false;
            
        // Validate disk data
        if (!item.disk || 
            typeof item.disk.total !== 'number' || 
            typeof item.disk.used !== 'number') return false;
            
        return true;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (validData.length === 0) {
      console.warn('No valid metrics data found after filtering');
      return emptyState;
    }

    console.log('Valid metrics data:', validData);
    
    // Generate categories for x-axis labels
    const categories = validData.map(item => {
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString();
    });

    // Prepare series data based on active tab
    const seriesMap = {
      cpu: [{
        name: 'CPU Usage (%)',
        type: 'line',
        data: validData.map(item => ({
          x: new Date(item.timestamp).getTime(),
          y: calculateCpuUsage(item.cpu)
        }))
      }],
      
      memory: [{
        name: 'Memory Usage',
        type: 'line',
        data: validData.map(item => ({
          x: new Date(item.timestamp).getTime(),
          y: calculateMemoryUsage(item.memory)
        }))
      }],
      
      disk: [{
        name: 'Disk Usage',
        type: 'line',
        data: validData.map(item => ({
          x: new Date(item.timestamp).getTime(),
          y: calculateDiskUsage(item.disk)
        }))
      }],
      
      overview: [
        {
          name: 'CPU Usage',
          type: 'line',
          data: validData.map(item => ({
            x: new Date(item.timestamp).getTime(),
            y: calculateCpuUsage(item.cpu)
          }))
        },
        {
          name: 'Memory Usage',
          type: 'line',
          data: validData.map(item => ({
            x: new Date(item.timestamp).getTime(),
            y: calculateMemoryUsage(item.memory)
          }))
        },
        {
          name: 'Disk Usage',
          type: 'line',
          data: validData.map(item => ({
            x: new Date(item.timestamp).getTime(),
            y: calculateDiskUsage(item.disk)
          }))
        }
      ]
    };

    return {
      series: seriesMap[activeTab],
      categories
    };
  }, [data, timeRange, activeTab]);

  // Chart options
  const options: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        },
        autoSelected: 'zoom'
      },
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 100
        },
        dynamicAnimation: {
          enabled: true,
          speed: 1000
        }
      }
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2, lineCap: 'round' },
    title: { text: 'System Metrics', align: 'left', style: { fontSize: '14px', color: 'hsl(var(--foreground))' } },
    colors: ['#3b82f6', '#8b5cf6', '#f59e0b'],
    xaxis: {
      type: 'category',
      categories: chartData.categories,
      labels: { style: { colors: 'hsl(var(--muted-foreground))' } },
      title: { text: 'Time', style: { color: 'hsl(var(--muted-foreground))' } },
      axisBorder: { show: true, color: 'hsl(var(--border))' },
      axisTicks: { show: true, color: 'hsl(var(--border))' }
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        style: { colors: 'hsl(var(--muted-foreground))' },
        formatter: (value) => `${Math.round(value)}%`
      },
      title: { text: 'Usage %', style: { color: 'hsl(var(--muted-foreground))' } },
      axisBorder: { show: true, color: 'hsl(var(--border))' },
      axisTicks: { show: true, color: 'hsl(var(--border))' }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (value) => `${value.toFixed(2)}%` }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: 'hsl(var(--muted-foreground))' },
      markers: { size: 4, strokeWidth: 0, radius: 4 },
      itemMargin: { horizontal: 10, vertical: 5 },
      onItemClick: { toggleDataSeries: true },
      onItemHover: { highlightDataSeries: true }
    },
    grid: {
      borderColor: 'hsl(var(--border))',
      strokeDashArray: 4,
      padding: { top: 0, right: 10, bottom: 0, left: 10 }
    },
    responsive: [
      { breakpoint: 1024, options: { chart: { height: 300 } } },
      { breakpoint: 768, options: { chart: { height: 250 }, legend: { position: 'bottom', horizontalAlign: 'center' } } }
    ]
  };

  const handleTabChange = (tab: 'overview' | 'cpu' | 'memory' | 'disk') => {
    setActiveTab(tab);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>System Metrics</CardTitle>
          <Select value={timeRange} onValueChange={(v: '1h' | '6h' | '24h') => setTimeRange(v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2 mt-2 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'cpu', label: 'CPU' },
            { id: 'memory', label: 'Memory' },
            { id: 'disk', label: 'Disk' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              className={`text-xs h-8 px-3 rounded-full ${activeTab === tab.id ? 'bg-primary/10 hover:bg-primary/20' : ''}`}
              onClick={() => handleTabChange(tab.id as any)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.series.length > 0 ? (
          <div className="h-[400px] w-full">
            <ReactApexChart options={options} series={chartData.series} type="line" height="100%" width="100%" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] border border-dashed rounded-lg">
            <div className="text-center space-y-2">
              <BarChart2 className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No metrics data available</p>
              <p className="text-xs text-muted-foreground">
                {data.length > 0 ? 'No valid data points to display' : 'Waiting for data...'}
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <MetricCard
            title="CPU Usage"
            value={`${Math.min(100, data[data.length - 1]?.cpu?.usage || 0).toFixed(1)}%`}
            change={calculateChange(data, 'cpu.usage')}
            icon={<Cpu className="h-5 w-5 text-blue-500" />}
            color="blue"
            subtitle={`${data[data.length - 1]?.cpu?.cores || 'N/A'} Cores`}
          />
          <MetricCard
            title="Memory Usage"
            value={`${data[data.length - 1]?.memory ? ((data[data.length - 1].memory.used / data[data.length - 1].memory.total) * 100).toFixed(1) : 0}%`}
            change={calculateChange(data, 'memory.used')}
            icon={<MemoryStick className="h-5 w-5 text-purple-500" />}
            color="purple"
            subtitle={data[data.length - 1]?.memory ? 
              `${formatBytes(data[data.length - 1].memory.used)} / ${formatBytes(data[data.length - 1].memory.total)}` : 'N/A'}
          />
          <MetricCard
            title="Disk Usage"
            value={`${data[data.length - 1]?.disk ? ((data[data.length - 1].disk.used / data[data.length - 1].disk.total) * 100).toFixed(1) : 0}%`}
            change={calculateChange(data, 'disk.used')}
            icon={<HardDrive className="h-5 w-5 text-amber-500" />}
            color="amber"
            subtitle={data[data.length - 1]?.disk ? 
              `${formatBytes(data[data.length - 1].disk.used)} / ${formatBytes(data[data.length - 1].disk.total)}` : 'N/A'}
          />
          <MetricCard
            title="System Uptime"
            value={data[data.length - 1]?.uptime ? formatUptime(data[data.length - 1].uptime) : 'N/A'}
            change={0}
            icon={<Clock className="h-5 w-5 text-emerald-500" />}
            color="emerald"
            subtitle="Time since last restart"
          />
        </div>

        {/* Network and I/O Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Activity className="h-4 w-4 mr-2 text-blue-500" />
                CPU Load Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 5, 15].map((minutes, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{minutes}m</span>
                    <div className="flex items-center">
                      <span className="font-mono">
                        {data[data.length - 1]?.cpu?.load?.[i]?.toFixed(2) || '0.00'}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({Math.min(100, ((data[data.length - 1]?.cpu?.load?.[i] || 0) / (data[data.length - 1]?.cpu?.cores || 1)) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <HardDrive className="h-4 w-4 mr-2 text-purple-500" />
                Disk I/O
                <span className="ml-auto text-xs text-muted-foreground">
                  {data.length > 1 ? 'Current rate' : 'Cumulative'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Download className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Read</span>
                  </div>
                  <span className="font-mono">
                    {data.length > 1 
                      ? formatNetworkSpeed(calculateRate(
                          data[data.length - 1]?.disk?.readBytes ?? data[data.length - 1]?.diskIo?.readBytes ?? 0,
                          data[data.length - 2]?.disk?.readBytes ?? data[data.length - 2]?.diskIo?.readBytes ?? 0,
                          new Date(data[data.length - 1].timestamp).getTime() - 
                          new Date(data[data.length - 2].timestamp).getTime()
                        ))
                      : formatNetworkSpeed(
                          data[0]?.disk?.readBytes ?? data[0]?.diskIo?.readBytes ?? 0, 
                          2, 
                          false
                        )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Upload className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Write</span>
                  </div>
                  <span className="font-mono">
                    {data.length > 1
                      ? formatNetworkSpeed(calculateRate(
                          data[data.length - 1]?.disk?.writeBytes ?? data[data.length - 1]?.diskIo?.writeBytes ?? 0,
                          data[data.length - 2]?.disk?.writeBytes ?? data[data.length - 2]?.diskIo?.writeBytes ?? 0,
                          new Date(data[data.length - 1].timestamp).getTime() - 
                          new Date(data[data.length - 2].timestamp).getTime()
                        ))
                      : formatNetworkSpeed(
                          data[0]?.disk?.writeBytes ?? data[0]?.diskIo?.writeBytes ?? 0, 
                          2, 
                          false
                        )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Network className="h-4 w-4 mr-2 text-amber-500" />
                Network
                <span className="ml-auto text-xs text-muted-foreground">
                  {data.length > 1 ? 'Current rate' : 'Cumulative'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Download className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Received</span>
                  </div>
                  <span className="font-mono">
                    {data.length > 1
                      ? formatNetworkSpeed(calculateRate(
                          data[data.length - 1]?.network?.bytesIn || 0,
                          data[data.length - 2]?.network?.bytesIn || 0,
                          new Date(data[data.length - 1].timestamp).getTime() - 
                          new Date(data[data.length - 2].timestamp).getTime()
                        ))
                      : formatNetworkSpeed(data[0]?.network?.bytesIn || 0, 2, false)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Upload className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Sent</span>
                  </div>
                  <span className="font-mono">
                    {data.length > 1
                      ? formatNetworkSpeed(calculateRate(
                          data[data.length - 1]?.network?.bytesOut || 0,
                          data[data.length - 2]?.network?.bytesOut || 0,
                          new Date(data[data.length - 1].timestamp).getTime() - 
                          new Date(data[data.length - 2].timestamp).getTime()
                        ))
                      : formatNetworkSpeed(data[0]?.network?.bytesOut || 0, 2, false)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Details Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Detailed system metrics and information</CardDescription>
          </CardHeader>
          <CardContent>
            {data.length > 0 && data[data.length - 1] && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* CPU Details */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">CPU</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Cores</span>
                      <span className="font-mono">{data[data.length - 1].cpu?.cores || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Load Average (1m)</span>
                      <span className="font-mono">
                        {data[data.length - 1].cpu?.load?.[0]?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Load Average (5m)</span>
                      <span className="font-mono">
                        {data[data.length - 1].cpu?.load?.[1]?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Memory Details */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Memory</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Used</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].memory?.used || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Free</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].memory?.free || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].memory?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disk Details */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Disk</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Used</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].disk?.used || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Free</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].disk?.free || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total</span>
                      <span className="font-mono">
                        {formatBytes(data[data.length - 1].disk?.total || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Uptime */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">System</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Uptime</span>
                      <span className="font-mono">
                        {data[data.length - 1].jvm?.uptime 
                          ? formatUptime(data[data.length - 1].jvm.uptime / 1000) // Convert ms to seconds
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Last Updated</span>
                      <span className="font-mono text-xs">
                        {new Date(data[data.length - 1].timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

// Helper component for metric cards
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color,
  subtitle = ''
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/50'
  }[color];

  return (
    <div className="bg-card border rounded-lg p-4 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`p-1.5 rounded-lg ${colorClasses}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>}
      <div className="mt-2 flex items-center">
        <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-xs text-muted-foreground ml-1">vs last period</span>
      </div>
    </div>
  );
};

// Helper function to get nested property using dot notation
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) || 0;
};

// Helper function to calculate percentage change
const calculateChange = (data: any[], key: string) => {
  if (!data || data.length < 2) return 0;
  const current = getNestedValue(data[data.length - 1], key);
  const previous = getNestedValue(data[0], key);
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Import the correct type from systemService
import { type SystemStatus as SystemStatusType } from '@/services/systemService';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from 'antd';

// Component for system status cards
interface SystemStatusCardProps {
  status: SystemStatusType;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP':
        return 'bg-green-500';
      case 'DEGRADED':
      case 'MAINTENANCE':
        return 'bg-yellow-500';
      case 'DOWN':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (componentName: string) => {
    const name = componentName.toLowerCase();
    if (name.includes('auth')) return <Lock className="h-5 w-5" />;
    if (name.includes('incident')) return <AlertTriangle className="h-5 w-5" />;
    if (name.includes('officer')) return <Users className="h-5 w-5" />;
    if (name.includes('notif')) return <Bell className="h-5 w-5" />;
    if (name.includes('file') || name.includes('storage')) return <HardDrive className="h-5 w-5" />;
    if (name.includes('weather')) return <Cloud className="h-5 w-5" />;
    if (name.includes('geo')) return <MapPin className="h-5 w-5" />;
    if (name.includes('vehicle')) return <Car className="h-5 w-5" />;
    if (name.includes('emergency')) return <Siren className="h-5 w-5" />;
    if (name.includes('analytics')) return <BarChart2 className="h-5 w-5" />;
    return <Server className="h-5 w-5" />;
  };

  const lastChecked = status.lastChecked || status.updatedAt;
  const lastCheckedTime = lastChecked ? formatDistanceToNow(new Date(lastChecked), { addSuffix: true }) : 'Never';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-3 w-3 rounded-full ${getStatusColor(status.status)}`} />
            <CardTitle className="text-lg">{status.componentName}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.componentName)}
            <Badge variant="outline" className="capitalize">
              {status.status.toLowerCase()}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          v{status.version} • Last checked: {lastCheckedTime}
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {status.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {status.description}
          </p>
        )}
        <div className="mt-auto space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Category:</span>
            <span className="font-medium">{status.category || 'General'}</span>
          </div>
          {status.critical !== undefined && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Critical:</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                status.critical 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              )}>
                {status.critical ? 'Yes' : 'No'}
              </span>
            </div>
          )}
          {status.documentationUrl && (
            <a 
              href={status.documentationUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-blue-600 hover:underline mt-2"
            >
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              View Documentation
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// System logs table component
const SystemLogsTable: React.FC<{ logs: SystemLog[] }> = ({ logs }) => (
  <Card>
    <CardHeader>
      <CardTitle>System Logs</CardTitle>
    </CardHeader>
    <CardContent>
      {logs.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2">Timestamp</th>
              <th className="text-left py-2">Level</th>
              <th className="text-left py-2">Component</th>
              <th className="text-left py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td className="py-2">{format(new Date(log.timestamp), 'PPp')}</td>
                <td className="py-2">
                  <Badge variant={log.level === 'ERROR' ? 'destructive' : 'default'}>
                    {log.level}
                  </Badge>
                </td>
                <td className="py-2">{log.component}</td>
                <td className="py-2">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-muted-foreground">No logs available</p>
      )}
    </CardContent>
  </Card>
);

// System logs hook with real-time updates
const useSystemLogs = (level: string, search: string) => {
  return useQuery({
    queryKey: ['systemLogs', level, search],
    queryFn: async () => {
      try {
        const params: Record<string, string | number> = {};
        if (level && level !== 'ALL') params.level = level;
        if (search) params.search = search;
        params.page = 0;
        params.size = 100;
        const queryString = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryString.append(key, value.toString());
          }
        });
        const response = await systemService.getSystemLogs(params);
        return {
          logs: (response.content || []).map((log: any) => ({
            id: log.id?.toString() || '',
            timestamp: log.timestamp && !isNaN(new Date(log.timestamp).getTime())
              ? new Date(log.timestamp).toISOString()
              : new Date().toISOString(),
            level: log.level || 'INFO',
            component: log.component || 'system',
            message: log.message || '',
            context: log.context
          })),
          total: response.totalElements || 0
        };
      } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }
    },
    refetchInterval: document.hidden ? false : 30000
  });
};

// Helper function to map API response to SystemMetrics type
const mapToSystemMetrics = (data: any): SystemMetrics => {
  if (!data) {
    console.warn('No data provided to mapToSystemMetrics');
    const now = new Date().toISOString();
    return {
      timestamp: now,
      cpu: { load: [0], cores: 1, usage: 0 },
      memory: { total: 0, used: 0, free: 0, cache: 0 },
      disk: { total: 0, used: 0, free: 0 }
    };
  }

  const metrics = data.data || data;
  let cpuLoad: number[] = [0];
  if (metrics.cpu?.load !== undefined) {
    if (Array.isArray(metrics.cpu.load) && metrics.cpu.load.length > 0) {
      cpuLoad = metrics.cpu.load.map(Number).filter(n => !isNaN(n));
      if (cpuLoad.length === 0) cpuLoad = [0];
    } else if (typeof metrics.cpu.load === 'number') {
      cpuLoad = [metrics.cpu.load];
    }
  } else if (Array.isArray(metrics.loadAverage) && metrics.loadAverage.length > 0) {
    cpuLoad = metrics.loadAverage.map(Number).filter(n => !isNaN(n));
    if (cpuLoad.length === 0) cpuLoad = [0];
  }

  const cpuCores = metrics.cpu?.cores || metrics.cpuCores || 1;
  // Use cpuUsage if available, otherwise calculate from load average (load average per core)
  const cpuUsage = metrics.cpu?.usage !== undefined 
    ? Math.min(100, metrics.cpu.usage) // Ensure it doesn't exceed 100%
    : (cpuLoad.length > 0 ? Math.min(100, (cpuLoad[0] / cpuCores) * 100) : 0);
  const memoryTotal = metrics.memory?.total || metrics.memoryTotal || 0;
  const memoryUsed = metrics.memory?.used || metrics.memoryUsed || 0;
  const memoryFree = metrics.memory?.free || Math.max(0, memoryTotal - memoryUsed);
  const memoryCache = metrics.memory?.cache || 0;
  const diskTotal = metrics.disk?.total || metrics.diskTotal || 0;
  const diskUsed = metrics.disk?.used || metrics.diskUsed || 0;
  const diskFree = metrics.disk?.free || Math.max(0, diskTotal - diskUsed);

  return {
    timestamp: metrics.timestamp && !isNaN(new Date(metrics.timestamp).getTime()) ? metrics.timestamp : new Date().toISOString(),
    cpu: { load: cpuLoad, cores: cpuCores, usage: cpuUsage },
    memory: { total: memoryTotal, used: memoryUsed, free: memoryFree, cache: memoryCache },
    disk: { total: diskTotal, used: diskUsed, free: diskFree }
  };
};

// Generate sample data for testing
const generateSampleData = (count: number = 10): SystemMetrics[] => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  return Array.from({ length: count }, (_, i) => {
    const timeOffset = (count - i - 1) * (hour / count);
    const timestamp = new Date(now - timeOffset).toISOString();
    const cpuUsage = 20 + Math.sin(i) * 30 + Math.random() * 20;
    const memoryUsage = 40 + Math.cos(i * 0.5) * 20 + Math.random() * 10;
    const diskUsage = 30 + Math.sin(i * 0.3) * 15 + Math.random() * 10;
    return {
      timestamp,
      cpu: {
        load: [cpuUsage / 100, (cpuUsage * 0.8) / 100, (cpuUsage * 0.6) / 100],
        cores: 4,
        usage: Math.max(0, Math.min(100, cpuUsage)),
      },
      memory: {
        total: 16 * 1024 * 1024 * 1024,
        used: (memoryUsage / 100) * (16 * 1024 * 1024 * 1024),
        free: ((100 - memoryUsage) / 100) * (16 * 1024 * 1024 * 1024),
        cache: 0
      },
      disk: {
        total: 500 * 1024 * 1024 * 1024,
        used: (diskUsage / 100) * (500 * 1024 * 1024 * 1024),
        free: ((100 - diskUsage) / 100) * (500 * 1024 * 1024 * 1024)
      }
    };
  });
};

// Custom hook for real-time metrics using STOMP over WebSocket
const useRealtimeMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_DATA_POINTS = 60;
  const stompClientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8080' : window.location.host;
    const wsUrl = `${wsProtocol}://${wsHost}/api/ws`;
    console.log('Connecting to WebSocket at:', wsUrl);

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (str.toLowerCase().includes('error')) {
          console.error('[STOMP]', str);
        } else {
          console.log('[STOMP]', str);
        }
      },
      onConnect: () => {
        console.log('STOMP connected successfully');
        setIsConnected(true);
        setError(null);
        const subscription = client.subscribe('/topic/metrics', (message) => {
          try {
            const messageBody = message.body;
            console.log('[STOMP] Received raw message:', messageBody);
            let metricData;
            try {
              metricData = typeof messageBody === 'string' ? JSON.parse(messageBody) : messageBody;
              console.log('Parsed metrics update:', metricData);
              const newMetric = mapToSystemMetrics(metricData);
              console.log('Mapped metrics:', newMetric);
              setMetrics(prevMetrics => {
                const updated = [...prevMetrics, newMetric].slice(-MAX_DATA_POINTS);
                return updated.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              });
            } catch (parseError) {
              console.error('Error parsing metrics message:', parseError, 'Raw message:', messageBody);
              setError('Failed to parse metrics: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'));
            }
          } catch (error) {
            console.error('Error processing metrics update:', error);
            setError('Failed to process metrics update: ' + (error instanceof Error ? error.message : 'Unknown error'));
          }
        });
        console.log('Subscribed to /topic/metrics');

        const fetchInitialData = async () => {
          try {
            console.log('Fetching initial metrics...');
            const initialData = await systemService.getSystemMetrics();
            console.log('Initial metrics data:', initialData);
            if (initialData) {
              const initialMetrics = mapToSystemMetrics(initialData);
              console.log('Mapped initial metrics:', initialMetrics);
              setMetrics(prevMetrics => {
                if (prevMetrics.length === 0) {
                  return [initialMetrics];
                }
                return prevMetrics;
              });
            }
          } catch (err) {
            console.error('Error fetching initial metrics:', err);
            setError('Failed to load initial metrics: ' + (err instanceof Error ? err.message : 'Unknown error'));
          }
        };
        fetchInitialData();
      },
      onDisconnect: () => {
        console.log('STOMP disconnected');
        setIsConnected(false);
        if (isMountedRef.current) {
          console.log('Attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            if (stompClientRef.current) {
              stompClientRef.current.activate();
            }
          }, 5000);
        }
      },
      onStompError: (frame) => {
        const errorMsg = frame.headers?.message || 'Unknown STOMP error';
        console.error('STOMP protocol error:', errorMsg);
        setError('Connection error: ' + errorMsg);
        setIsConnected(false);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket closed:', event);
        setIsConnected(false);
        setError('WebSocket connection closed');
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      isMountedRef.current = false;
      console.log('Cleaning up WebSocket connection');
      if (client) {
        try {
          client.deactivate().catch(console.error);
        } catch (e) {
          console.error('Error deactivating STOMP client:', e);
        }
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isConnected && stompClientRef.current && isMountedRef.current) {
      console.log('Attempting to reconnect...');
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        const client = stompClientRef.current;
        if (client) {
          client.deactivate()
            .then(() => {
              if (isMountedRef.current) {
                return client.activate();
              }
              return Promise.resolve();
            })
            .catch(error => {
              console.error('Error during reconnection:', error);
            });
        }
      }, 5000);
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
    }
  }, [isConnected]);

  return { metrics, isConnected, error };
};

// Main dashboard component
const SystemSettingsDashboard: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ERROR');
  const [logSearch, setLogSearch] = useState('');

  const { data: statuses = [], isLoading: isLoadingStatus, error: statusError } = useQuery<SystemStatus[]>({
    queryKey: ['systemStatus'],
    queryFn: async () => {
      try {
        const response = await systemService.getSystemStatus();
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching system status:', error);
        throw error;
      }
    },
    refetchInterval: document.hidden ? false : 30000
  });

  const { data: logsResponse, isLoading: isLoadingLogs, error: logsError } = useSystemLogs(logLevel, logSearch);
  const logs = logsResponse?.logs || [];
  const totalLogs = logsResponse?.total || 0;

  const { metrics: realtimeMetrics, isConnected, error: metricsError } = useRealtimeMetrics();

  const allMetrics = React.useMemo<SystemMetrics[]>(() => {
    const result = Array.isArray(realtimeMetrics) ? [...realtimeMetrics] : [];
    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [realtimeMetrics]);

  React.useEffect(() => {
    if (statusError) {
      toast({
        title: 'Error loading system status',
        description: statusError instanceof Error ? statusError.message : 'Unknown error',
        variant: 'destructive',
      });
    }
    if (metricsError) {
      toast({
        title: 'Error loading system metrics',
        description: metricsError,
        variant: 'destructive',
      });
    }
    if (logsError) {
      toast({
        title: 'Error loading system logs',
        description: logsError instanceof Error ? logsError.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [statusError, metricsError, logsError, toast]);

  const handleLogLevelChange = (value: string) => {
    setLogLevel(value as 'ALL' | 'INFO' | 'WARN' | 'ERROR');
  };

  const handleClearLogs = () => {
    setLogSearch('');
    setLogLevel('ALL');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage system resources in real-time</p>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoadingStatus ? (
                  Array(3).fill(0).map((_, i) => (
                    <Card key={`loading-${i}`}>
                      <CardHeader className="space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="h-2 bg-muted rounded animate-pulse"></div>
                        <div className="h-2 bg-muted rounded animate-pulse w-5/6"></div>
                        <div className="h-2 bg-muted rounded animate-pulse w-4/6"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : statuses.length > 0 ? (
                  statuses.map((status) => (
                    <SystemStatusCard key={status.id} status={status} />
                  ))
                ) : (
                  <Alert className="col-span-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No status data available</AlertTitle>
                    <AlertDescription>
                      {statusError?.message || 'System status information is not currently available.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>System Logs</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Select value={logLevel} onValueChange={handleLogLevelChange}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="INFO">Info</SelectItem>
                          <SelectItem value="WARN">Warning</SelectItem>
                          <SelectItem value="ERROR">Error</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" onClick={handleClearLogs}>
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : logs.length > 0 ? (
                    <SystemLogsTable logs={logs} />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No logs available</AlertTitle>
                      <AlertDescription>
                        No logs match the current filters.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>System Metrics</CardTitle>
                      <CardDescription>Real-time system performance metrics</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-muted-foreground">
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {allMetrics.length > 0 ? (
                    <SystemMetricsChart data={allMetrics} />
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No metrics data</AlertTitle>
                      <AlertDescription>
                        System metrics are not currently available. Try refreshing the page.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Metrics</CardTitle>
                <CardDescription>View detailed system metrics and performance data</CardDescription>
              </CardHeader>
              <CardContent>
                {allMetrics.length > 0 ? (
                  <SystemMetricsChart data={allMetrics} />
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No metrics data</AlertTitle>
                    <AlertDescription>
                      System metrics are not currently available. Try refreshing the page.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Maintenance Mode</h3>
                  <div className="flex items-center space-x-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Enable maintenance mode</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only administrators will be able to access the system.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">System Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="email-notifications" defaultChecked />
                      <Label htmlFor="email-notifications">Email notifications</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="system-alerts" defaultChecked />
                      <Label htmlFor="system-alerts">System alerts</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">System Logs</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="log-retention">Log Retention (days)</Label>
                        <Select defaultValue="30">
                          <SelectTrigger>
                            <SelectValue placeholder="Select retention period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                            <SelectItem value="365">1 year</SelectItem>
                            <SelectItem value="0">Forever</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="log-level">Default Log Level</Label>
                        <Select value={logLevel} onValueChange={handleLogLevelChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select default log level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEBUG">Debug</SelectItem>
                            <SelectItem value="INFO">Info</SelectItem>
                            <SelectItem value="WARN">Warning</SelectItem>
                            <SelectItem value="ERROR">Error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">System Message</h3>
                  <Textarea
                    placeholder="Enter a system-wide message that will be displayed to all users"
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be displayed at the top of every page.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 border-t px-6 py-4">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

// Wrapper component to provide React Query context
const SystemSettingsDashboardWithProviders: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SystemSettingsDashboard />
    </QueryClientProvider>
  );
};

export default SystemSettingsDashboardWithProviders;
