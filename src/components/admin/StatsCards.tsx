
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { TrendingDown, UserCheck, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { incidentsService, officersService, userService } from '@/services/apiService';
import { mapIncidentFromBackend, mapOfficerFromBackend, mapUserFromBackend } from '@/utils/dataMappers';

const StatsCards = () => {
  // Fetch incidents data
  const { data: incidents, isLoading: isIncidentsLoading } = useQuery({
    queryKey: ['incidents', 'stats'],
    queryFn: async () => {
      const response = await incidentsService.getAll();
      return response.data.map((incident: any) => mapIncidentFromBackend(incident));
    }
  });

  // Fetch officers data
  const { data: officers, isLoading: isOfficersLoading } = useQuery({
    queryKey: ['officers'],
    queryFn: async () => {
      const response = await officersService.getAll();
      return response.data.map((officer: any) => mapOfficerFromBackend(officer));
    }
  });

  // Fetch users data
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await userService.getAllUsers();
      return response.data.map((user: any) => mapUserFromBackend(user));
    }
  });

  // Calculate previous month data (mock for comparison)
  const prevMonthIncidents = incidents ? Math.round(incidents.length * 1.08) : 0; // 8% more than current
  const monthlyChange = incidents ? ((incidents.length - prevMonthIncidents) / prevMonthIncidents * 100).toFixed(1) : "0";
  
  // Count active officers
  const activeOfficers = officers?.filter((officer: any) => officer.status === 'ACTIVE')?.length || 0;
  const onPatrolOfficers = officers?.filter((officer: any) => officer.status === 'ON_PATROL')?.length || 0;
  
  // Response rate calculation (placeholder logic)
  const responseRate = 96.8;
  const responseRateChange = +2.3;

  // Calculate registered citizens
  const registeredCitizens = users?.filter((user: any) => user.role === 'CITIZEN')?.length || 0;
  const newUsersThisMonth = 345; // Placeholder value - would be calculated based on registration dates

  const isLoading = isIncidentsLoading || isOfficersLoading || isUsersLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="stats-card card-hover overflow-hidden border-none shadow-lg">
            <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/50 to-blue-100/50">
              <CardDescription className="font-medium">Loading...</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex justify-center items-center min-h-[80px]">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="stats-card card-hover overflow-hidden border-none shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-br from-blue-50/50 to-blue-100/50">
          <CardDescription className="font-medium">Total Incidents</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="stats-value">{incidents?.length || 0}</div>
          <div className="flex items-center gap-2 mt-1">
            <TrendingDown className="h-4 w-4 text-success" />
            <span className="stats-change-positive">Down {Math.abs(parseFloat(monthlyChange))}% from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card card-hover overflow-hidden border-none shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-br from-green-50/50 to-green-100/50">
          <CardDescription className="font-medium">Active Officers</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="stats-value">{activeOfficers}</div>
          <div className="flex items-center gap-2 mt-1">
            <UserCheck className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{onPatrolOfficers} on patrol</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card card-hover overflow-hidden border-none shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-br from-purple-50/50 to-purple-100/50">
          <CardDescription className="font-medium">Response Rate</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="stats-value">{responseRate}%</div>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="stats-change-positive">+{responseRateChange}% from target</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="stats-card card-hover overflow-hidden border-none shadow-lg">
        <CardHeader className="pb-2 bg-gradient-to-br from-amber-50/50 to-amber-100/50">
          <CardDescription className="font-medium">Registered Citizens</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="stats-value">{registeredCitizens}</div>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="stats-change-positive">+{newUsersThisMonth} this month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
