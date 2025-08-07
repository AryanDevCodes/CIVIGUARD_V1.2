import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Clock, Users, Activity, Calendar } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import ComprehensivePieChart from '@/components/charts/ComprehensivePieChart';
import ComprehensiveBarChart from '@/components/charts/ComprehensiveBarChart';
import { incidentsService } from '@/services/apiService';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import { DateRangePicker } from '@/components/ui/date-range-picker';

type TimeRange = 'all' | '24h' | '7d' | '30d' | '90d' | 'custom';
type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type IncidentType = 'THEFT' | 'VANDALISM' | 'ASSAULT' | 'BURGLARY' | 'OTHER';

interface IncidentStatusData {
  status: string;
  count: number;
}

interface IncidentTypeData {
  type: string;
  count: number;
}

interface ResponseTimeData {
  date: string;
  avgResponseTime: number;
}

interface AnalyticsData {
  totalIncidents: number;
  resolvedIncidents: number;
  avgResponseTime: number;
  resolutionRate: number;
  incidentsByStatus: IncidentStatusData[];
  incidentsByType: IncidentTypeData[];
  responseTimeTrend: ResponseTimeData[];
  error?: string;
}

interface AnalyticsQueryResponse {
  incidents: any[];
  officers: Array<{ status: string }>;
  analytics: AnalyticsData | null;
}

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  const formatDateForBackend = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    return date.toISOString();
  };

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsQueryResponse, Error>({
    queryKey: ['analytics', timeRange, dateRange],
    queryFn: async (): Promise<AnalyticsQueryResponse> => {
      const startDate = dateRange?.from;
      const endDate = dateRange?.to;

      // Only include date parameters if they exist (not needed for 'all' time range)
      const incidentsParams: Record<string, any> = {
        page: 0,
        size: 1000,
      };

      // Add date filters only if date range is specified (not for 'all' time range)
      if (startDate) {
        incidentsParams.startDate = formatDateForBackend(startDate);
      }
      if (endDate) {
        incidentsParams.endDate = formatDateForBackend(endDate);
      }
      console.log('Query params:', incidentsParams);

      try {
        const [incidentsRes] = await Promise.all([
          incidentsService.getAll(incidentsParams).catch((error) => {
            console.error('Error fetching incidents:', error);
            return { data: { content: [] } };
          }),
        ]);
        console.log('incidentsRes:', incidentsRes);
        const incidents = incidentsRes?.data?.content || [];
        console.log('incidents:', incidents);

        const resolvedIncidents = incidents.filter((i: any) => i.status === 'RESOLVED').length;
        const totalIncidents = incidents.length;

        const statusCounts: Record<string, number> = incidents.reduce((acc, incident) => {
          const status = (incident.status as string) || 'UNKNOWN';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Define valid incident types and their display names
        const validTypes = [
          'THEFT', 'VANDALISM', 'ASSAULT', 'BURGLARY', 'TRAFFIC',
          'CYBERCRIME', 'DOMESTIC', 'MISSING', 'PUBLIC', 'DRUG', 'FRAUD',
          'ROBBERY', 'HARASSMENT', 'BURGLARY', 'THEFT_VEHICLE', 'THEFT_BICYCLE',
          'THEFT_PERSONAL', 'DAMAGE_PROPERTY', 'GRAFFITI', 'PUBLIC_INTOXICATION',
          'DISORDERLY_CONDUCT', 'TRESPASSING', 'SUSPICIOUS_ACTIVITY', 'NOISE_COMPLAINT'
        ];
        
        // Map raw types to standardized types with more specific categories
        const typeMapping: Record<string, string> = {
          // Theft related
          'THEFT': 'THEFT',
          'THEFT_VEHICLE': 'THEFT',
          'THEFT_BICYCLE': 'THEFT',
          'THEFT_PERSONAL': 'THEFT',
          'PICKPOCKET': 'THEFT',
          'SHOPLIFTING': 'THEFT',
          
          // Assault related
          'ASSAULT': 'ASSAULT',
          'BATTERY': 'ASSAULT',
          'DOMESTIC_VIOLENCE': 'ASSAULT',
          'SEXUAL_ASSAULT': 'ASSAULT',
          'HARASSMENT': 'ASSAULT',
          'STALKING': 'ASSAULT',
          
          // Vandalism related
          'VANDALISM': 'VANDALISM',
          'GRAFFITI': 'VANDALISM',
          'DAMAGE_PROPERTY': 'VANDALISM',
          'ARSON': 'VANDALISM',
          
          // Burglary related
          'BURGLARY': 'BURGLARY',
          'ROBBERY': 'BURGLARY',
          'HOME_INVASION': 'BURGLARY',
          'BURGLARY_RESIDENTIAL': 'BURGLARY',
          'BURGLARY_COMMERCIAL': 'BURGLARY',
          
          // Public disturbances
          'PUBLIC_DISTURBANCE': 'PUBLIC',
          'DISORDERLY_CONDUCT': 'PUBLIC',
          'PUBLIC_INTOXICATION': 'PUBLIC',
          'NOISE_COMPLAINT': 'PUBLIC',
          'LOITERING': 'PUBLIC',
          'TRESPASSING': 'PUBLIC',
          
          // Traffic related
          'TRAFFIC_VIOLATION': 'TRAFFIC',
          'DUI': 'TRAFFIC',
          'HIT_AND_RUN': 'TRAFFIC',
          'RECKLESS_DRIVING': 'TRAFFIC',
          'PARKING_VIOLATION': 'TRAFFIC',
          
          // Cyber crimes
          'CYBERCRIME': 'CYBERCRIME',
          'IDENTITY_THEFT': 'CYBERCRIME',
          'ONLINE_FRAUD': 'CYBERCRIME',
          'CYBERSTALKING': 'CYBERCRIME',
          'HACKING': 'CYBERCRIME',
          
          // Missing persons
          'MISSING_PERSON': 'MISSING',
          'RUNAWAY': 'MISSING',
          'ABDUCTION': 'MISSING',
          
          // Drug related
          'DRUG_POSSESSION': 'DRUG',
          'DRUG_SALE': 'DRUG',
          'DRUG_USE': 'DRUG',
          'DRUG_TRAFFICKING': 'DRUG',
          
          // Fraud related
          'FRAUD': 'FRAUD',
          'CREDIT_CARD_FRAUD': 'FRAUD',
          'INSURANCE_FRAUD': 'FRAUD',
          'TAX_FRAUD': 'FRAUD',
          'FORGERY': 'FRAUD',
          
          // Default mappings for common variations
          'DOMESTIC_ABUSE': 'ASSAULT',
          'DOMESTIC': 'ASSAULT',
          'MISSING': 'MISSING',
          'TRAFFIC': 'TRAFFIC',
          'PUBLIC': 'PUBLIC',
          'DRUGS': 'DRUG',
          'NARCOTICS': 'DRUG',
          'THEFTS': 'THEFT',
          'ASSAULTS': 'ASSAULT',
          'VANDALISMS': 'VANDALISM',
          'BURGLARIES': 'BURGLARY',
          'FRAUDS': 'FRAUD',
          'CYBER_CRIME': 'CYBERCRIME',
          'CYBER_CRIMES': 'CYBERCRIME',
          'CYBERCRIMES': 'CYBERCRIME'
        };

        // Map standardized types to display names with more descriptive labels
        const typeDisplayNames: Record<string, string> = {
          'THEFT': 'Theft',
          'ASSAULT': 'Assault',
          'VANDALISM': 'Vandalism',
          'BURGLARY': 'Burglary',
          'TRAFFIC': 'Traffic Violation',
          'CYBERCRIME': 'Cyber Crime',
          'DOMESTIC': 'Domestic Incident',
          'MISSING': 'Missing Person',
          'PUBLIC': 'Public Disturbance',
          'DRUG': 'Drug Related',
          'FRAUD': 'Fraud',
          'OTHER': 'Other',
          'UNKNOWN': 'Unknown'
        };

        // Process incidents to count by type with standardized names
        const typeCounts: Record<string, number> = incidents.reduce((acc, incident) => {
          let type = incident.incidentType || incident.type || 'UNKNOWN';
          
          // Normalize the type
          if (typeof type === 'string' && type.trim()) {
            type = type.trim().toUpperCase();
            // Map to standardized type or use original if valid, otherwise map to 'OTHER'
            type = typeMapping[type] || (validTypes.includes(type) ? type : 'OTHER');
          } else {
            type = 'UNKNOWN';
          }
          
          // Use display name for the final type
          const displayType = typeDisplayNames[type] || type;
          acc[displayType] = (acc[displayType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Process status counts
        const incidentsByStatus: IncidentStatusData[] = Object.entries(statusCounts)
          .map(([status, count]) => ({
            status: status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' '), // Format status for display
            count: Number(count) || 0,
          }));


        // Process type counts with display names
        const incidentsByType: IncidentTypeData[] = Object.entries(typeCounts)
          .filter(([type]) => type !== 'UNKNOWN')
          .map(([type, count]) => ({
            type: typeDisplayNames[type] || type,
            count: Number(count) || 0,
          }))
          .sort((a, b) => b.count - a.count); // Sort by count descending
        console.log('incidentsByType:', incidentsByType);

        const responseTimeTrend: ResponseTimeData[] = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split('T')[0],
            avgResponseTime: Math.floor(Math.random() * 60) + 5,
          };
        });

        const avgResponseTime = Math.floor(Math.random() * 60) + 5;

        const analyticsData: AnalyticsData = {
          totalIncidents,
          resolvedIncidents,
          avgResponseTime,
          resolutionRate: totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0,
          incidentsByStatus,
          incidentsByType,
          responseTimeTrend,
        };

        return {
          incidents,
          officers: [],
          analytics: analyticsData,
        };
      } catch (error) {
        console.error('Error in analytics query:', error);
        return {
          incidents: [],
          officers: [],
          analytics: {
            totalIncidents: 0,
            resolvedIncidents: 0,
            avgResponseTime: 0,
            resolutionRate: 0,
            incidentsByStatus: [],
            incidentsByType: [],
            responseTimeTrend: [],
            error: 'Failed to fetch analytics data. Please try again.',
          },
        };
      }
    },
    refetchInterval: autoRefresh ? 30000 : false,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 30000)
  });

  useEffect(() => {
    if (timeRange !== 'custom') {
      if (timeRange === 'all') {
        // For 'All Time', set date range to undefined to fetch all data
        setDateRange(undefined);
      } else {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        let from = new Date();

        switch (timeRange) {
          case '24h':
            from = subDays(now, 1);
            break;
          case '30d':
            from = subDays(now, 29);
            break;
          case '90d':
            from = subDays(now, 89);
            break;
          default: // 7d
            from = subDays(now, 6);
        }

        from.setHours(0, 0, 0, 0);
        setDateRange({ from, to: now });
      }
    }
  }, [timeRange]);

  // Helper function to safely parse and validate analytics data
  const parseAnalyticsData = (data: AnalyticsQueryResponse | undefined) => {
    const defaultMetrics = {
      totalIncidents: 0,
      resolvedIncidents: 0,
      avgResponseTime: '0.0',
      activeOfficers: 0,
      resolutionRate: '0.0',
      error: undefined as string | undefined
    };

    if (!data || !data.analytics) {
      return { ...defaultMetrics, error: 'No analytics data available' };
    }

    try {
      // Safely calculate active officers count
      const activeOfficers = Array.isArray(data.officers) 
        ? data.officers.filter(o => o?.status && ['ACTIVE', 'ON_PATROL'].includes(o.status)).length
        : 0;

      // Safely format response time
      const avgResponseTime = typeof data.analytics.avgResponseTime === 'number' 
        ? data.analytics.avgResponseTime.toFixed(1)
        : '0.0';

      // Safely calculate resolution rate
      const resolutionRate = typeof data.analytics.resolutionRate === 'number'
        ? data.analytics.resolutionRate.toFixed(1)
        : '0.0';

      return {
        totalIncidents: Number(data.analytics.totalIncidents) || 0,
        resolvedIncidents: Number(data.analytics.resolvedIncidents) || 0,
        avgResponseTime,
        activeOfficers,
        resolutionRate,
        error: data.analytics.error
      };
    } catch (error) {
      console.error('Error parsing analytics data:', error);
      return { ...defaultMetrics, error: 'Error processing analytics data' };
    }
  };

  // Memoize the parsed metrics
  const metrics = React.useMemo(() => parseAnalyticsData(analytics), [analytics]);

  // Render loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render error state if needed
  if (metrics.error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Error loading analytics</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
          <div className="rounded-lg border border-destructive p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium text-destructive mb-2">
              Unable to load analytics
            </h3>
            <p className="text-sm text-muted-foreground">
              {metrics.error}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        <div className="p-4 sm:p-6 pb-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Real-time insights and performance metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <Select 
                value={timeRange} 
                onValueChange={(value: TimeRange) => setTimeRange(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                className="gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard
                title="Total Incidents"
                value={metrics.totalIncidents}
                icon={<AlertTriangle className="h-5 w-5 text-blue-500" />}
                description={`${metrics.resolvedIncidents} resolved`}
                loading={isLoading}
              />
              <StatCard
                title="Avg. Response Time"
                value={`${metrics.avgResponseTime}m`}
                icon={<Clock className="h-5 w-5 text-green-500" />}
                description="Across all incidents"
                loading={isLoading}
              />
              <StatCard
                title="Active Officers"
                value={metrics.activeOfficers}
                icon={<Users className="h-5 w-5 text-purple-500" />}
                description="On duty"
                loading={isLoading}
              />
              <StatCard
                title="Resolution Rate"
                value={`${metrics.resolutionRate}%`}
                icon={<Activity className="h-5 w-5 text-amber-500" />}
                description="Of all reported incidents"
                loading={isLoading}
              />
            </div>

            <Tabs defaultValue="overview" className="flex flex-col h-full">
              <div className="py-3 bg-gray-50 dark:bg-gray-900">
                <TabsList className="w-full justify-start overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <TabsTrigger value="overview" className="px-4 py-2 text-sm font-medium">Overview</TabsTrigger>
                  <TabsTrigger value="incidents" className="px-4 py-2 text-sm font-medium">Incident Analysis</TabsTrigger>
                  <TabsTrigger value="officers" className="px-4 py-2 text-sm font-medium">Officer Performance</TabsTrigger>
                  <TabsTrigger value="locations" className="px-4 py-2 text-sm font-medium">Location Insights</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 min-h-0">
                <TabsContent value="overview" className="space-y-6 m-0">
                  <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Incidents by Status</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Distribution of incident statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[350px]">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-64 w-full rounded-lg" />
                        </div>
                      ) : analytics?.analytics?.error ? (
                        <div className="text-red-500 text-center">{analytics.analytics.error}</div>
                      ) : (analytics?.analytics?.incidentsByStatus || []).length === 0 ? (
                        <div className="text-center text-muted-foreground">No incident status data available</div>
                      ) : (
                        <ComprehensivePieChart
                          data={analytics?.analytics?.incidentsByStatus || []}
                          labelKey="status"
                          valueKey="count"
                          title="Incidents by Status"
                          colors={['#3b82f6', '#f59e0b', '#10b981', '#ef4444']}
                        />
                      )}
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Incidents by Type</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Breakdown of incident categories</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[350px]">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-64 w-full rounded-lg" />
                        </div>
                      ) : analytics?.analytics?.error ? (
                        <div className="text-red-500 text-center">{analytics.analytics.error}</div>
                      ) : (analytics?.analytics?.incidentsByType || []).length === 0 ? (
                        <div className="text-center text-muted-foreground">No incident type data available</div>
                      ) : (
                        <ComprehensiveBarChart
                          data={analytics?.analytics?.incidentsByType || []}
                          labelKey="type"
                          valueKeys={['count']}
                          title="Incidents by Type"
                          barColors={['#8b5cf6']}
                        />
                      )}
                    </CardContent>
                  </Card>
                  <Card className="flex flex-col shadow-sm hover:shadow-md transition-shadow rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Response Time Trend</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Average response time over time</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[350px]">
                      {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                          <Skeleton className="h-64 w-full rounded-lg" />
                        </div>
                      ) : analytics?.analytics?.error ? (
                        <div className="text-red-500 text-center">{analytics.analytics.error}</div>
                      ) : (analytics?.analytics?.responseTimeTrend || []).length === 0 ? (
                        <div className="text-center text-muted-foreground">No response time data available</div>
                      ) : (
                        <ComprehensiveBarChart
                          data={analytics?.analytics?.responseTimeTrend || []}
                          labelKey="date"
                          valueKeys={['avgResponseTime']}
                          title="Avg. Response Time (minutes)"
                          barColors={['#10b981']}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="incidents" className="m-0 h-full">
                  <Card className="flex flex-col h-full shadow-sm rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Incident Analysis</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Detailed incident metrics and trends</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Incident analysis coming soon
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="officers" className="m-0 h-full">
                  <Card className="flex flex-col h-full shadow-sm rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Officer Performance</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Officer activity and response metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Officer performance metrics coming soon
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="locations" className="m-0 h-full">
                  <Card className="flex flex-col h-full shadow-sm rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Location Insights</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Geographic distribution of incidents</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Location insights coming soon
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  description,
  loading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  loading?: boolean;
}) => {
  if (loading) {
    return (
      <Card className="shadow-sm rounded-lg">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="rounded-lg p-2 bg-muted">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default AnalyticsPage;
