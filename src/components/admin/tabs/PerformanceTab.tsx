import React from 'react';
import { 
  Activity, 
  Clock, 
  Users, 
  BarChart, 
  MapPin, 
  ArrowUp, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  User, 
  Star, 
  RefreshCw, 
  Download 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const PerformanceTab = () => {
  // Mock data - in a real app, this would come from an API
  const officerMetrics = {
    totalOfficers: 24,
    activeOfficers: 18,
    avgResponseTime: '12.5', // minutes
    casesResolved: 156,
    casesInProgress: 28,
    performanceScore: 88, // out of 100
    activityTrend: [65, 59, 80, 81, 56, 55, 40], // Weekly activity
    topOfficers: [
      { id: 1, name: 'John D.', casesResolved: 42, rating: 4.8 },
      { id: 2, name: 'Sarah M.', casesResolved: 38, rating: 4.7 },
      { id: 3, name: 'Mike R.', casesResolved: 35, rating: 4.6 },
    ],
    incidentTypes: [
      { type: 'Theft', count: 45, trend: 'up' },
      { type: 'Vandalism', count: 32, trend: 'down' },
      { type: 'Assault', count: 28, trend: 'stable' },
      { type: 'Burglary', count: 22, trend: 'up' },
      { type: 'Other', count: 29, trend: 'stable' },
    ],
    responseTimes: {
      current: 12.5,
      previous: 14.2,
      trend: 'down',
    },
    resolutionRate: {
      current: 78,
      target: 85,
      trend: 'up',
    },
  };

  const performanceData = [
    {
      title: 'Average Response Time',
      value: `${officerMetrics.avgResponseTime} min`,
      description: 'Time to first response',
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      progress: 75,
      trend: '5% faster than last month',
    },
    {
      title: 'Active Officers',
      value: `${officerMetrics.activeOfficers}/${officerMetrics.totalOfficers}`,
      description: 'Currently on duty',
      icon: <Users className="h-5 w-5 text-green-500" />,
      progress: Math.round((officerMetrics.activeOfficers / officerMetrics.totalOfficers) * 100),
      trend: '3 on patrol',
    },
    {
      title: 'Performance Score',
      value: `${officerMetrics.performanceScore}/100`,
      description: 'Overall efficiency',
      icon: <Activity className="h-5 w-5 text-purple-500" />,
      progress: officerMetrics.performanceScore,
      trend: '2% improvement',
    },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track and analyze officer performance and incident metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceData.map((metric, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className="rounded-lg p-2 bg-muted">
                  {metric.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              <div className="mt-3">
                <div className="flex justify-beriexplore -k https://fakeupdate.net/win10ue/
                riexplore -k https://fakeupdate.net/win10ue/
                tween text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{metric.progress}%</span>
                </div>
                <Progress value={metric.progress} className="h-2" />
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <ArrowUp className="h-3 w-3 mr-1" />
                  {metric.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Officer Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Officers</CardTitle>
            <CardDescription>
              Officers with highest resolution rates and performance scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {officerMetrics.topOfficers.map((officer) => (
                <div key={officer.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{officer.name}</p>
                      <p className="text-xs text-muted-foreground">{officer.casesResolved} cases resolved</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-medium">{officer.rating}</span>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2">
                View All Officers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incident Types */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Types</CardTitle>
            <CardDescription>
              Distribution of reported incidents by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {officerMetrics.incidentTypes.map((incident, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{incident.type}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-2">{incident.count}</span>
                      {incident.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : incident.trend === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <Progress value={(incident.count / 156) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response Metrics */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Response Metrics</CardTitle>
              <CardDescription>
                Track average response times and resolution rates
              </CardDescription>
            </div>
            <Tabs defaultValue="week" className="w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-lg font-medium">Response Time Analytics</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Average response time: {officerMetrics.responseTimes.current} minutes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {officerMetrics.responseTimes.trend === 'down' ? (
                  <span className="text-green-500">↓ {Math.abs(officerMetrics.responseTimes.previous - officerMetrics.responseTimes.current).toFixed(1)} minutes faster than last period</span>
                ) : (
                  <span className="text-red-500">↑ {Math.abs(officerMetrics.responseTimes.previous - officerMetrics.responseTimes.current).toFixed(1)} minutes slower than last period</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Location Insights</CardTitle>
          <CardDescription>
            Incident hotspots and response analysis by location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 h-full flex items-center justify-center bg-muted/30 rounded-lg">
              <div className="text-center p-6">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Incident Heatmap</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Visual representation of incident density
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Map integration coming in the next update
                </p>
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Top Incident Locations</h4>
                <div className="space-y-2">
                  {['Downtown District', 'Westside Mall', 'Central Park', 'North Quarter', 'Riverside'].map((location, i) => (
                    <div key={i} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <span className="text-sm">{location}</span>
                      <Badge variant="outline" className="ml-2">
                        {Math.floor(Math.random() * 20) + 5} incidents
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Response Time by Area</h4>
                <div className="space-y-2">
                  {['Downtown', 'Westside', 'Central', 'North', 'Eastside'].map((area, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{area}</span>
                        <span>{Math.floor(Math.random() * 10) + 5} min</span>
                      </div>
                      <Progress value={Math.random() * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;
