
import React from 'react';
import { Users, ShieldAlert, UserCheck, Activity, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/apiService';
import { mapUserFromBackend } from '@/utils/dataMappers';

// Activity entry type
interface UserActivity {
  user: string;
  action: string;
  time: string;
}

import ComprehensivePieChart from '@/components/charts/ComprehensivePieChart';

const UsersTab = () => {
  // Fetch real users data
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const response = await userService.getAllUsers();
      return response.data.map((user: any) => mapUserFromBackend(user));
    }
  });

  // Calculate user metrics
  const citizenCount = users?.filter(u => u.role === 'citizen').length || 0;
  const officerCount = users?.filter(u => u.role === 'officer').length || 0;
  const adminCount = users?.filter(u => u.role === 'admin').length || 0;
  const activeNowCount = users?.filter(u => u.isActive).length || 0;

  // Calculate percentage change (mock logic - would be based on historical data)
  const citizenChange = '+2.4%';
  const officerChange = '+2 new';
  const adminChange = '0'; // No change
  const activeChange = '+18%';
  
  // Recent activity data (would come from a real API in production)
  // This would typically come from an activity log API endpoint
  const recentActivity: UserActivity[] = [
    { user: "Maria Gonzalez", action: "Created new report", time: "5m ago" },
    { user: "Officer Johnson", action: "Updated case status", time: "12m ago" },
    { user: "Admin Smith", action: "Added new officer", time: "1h ago" },
    { user: "James Wilson", action: "Logged safety concern", time: "2h ago" }
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in">
        <h4 className="font-medium text-lg">Loading User Data...</h4>
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <ComprehensivePieChart
        endpoint="/api/analytics/user-roles"
        labelKey="role"
        valueKey="count"
        title="User Roles Distribution"
      />
      <h4 className="font-medium text-lg">Active Users Overview</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase">Citizens</div>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div className="text-xl font-semibold mt-3 text-blue-600">{citizenCount}</div>
          <div className="text-xs text-success font-medium flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3">
              <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {citizenChange}
          </div>
        </div>
        
        <div className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase">Officers</div>
            <div className="p-2 bg-green-50 rounded-full">
              <ShieldAlert className="h-4 w-4 text-secondary" />
            </div>
          </div>
          <div className="text-xl font-semibold mt-3 text-green-600">{officerCount}</div>
          <div className="text-xs text-success font-medium flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3">
              <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {officerChange}
          </div>
        </div>
        
        <div className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase">Admins</div>
            <div className="p-2 bg-red-50 rounded-full">
              <UserCheck className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <div className="text-xl font-semibold mt-3 text-red-600">{adminCount}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {adminChange === '0' ? 'No change' : adminChange}
          </div>
        </div>
        
        <div className="border rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground uppercase">Active Now</div>
            <div className="p-2 bg-indigo-50 rounded-full">
              <Activity className="h-4 w-4 text-info" />
            </div>
          </div>
          <div className="text-xl font-semibold mt-3 text-indigo-600">{activeNowCount}</div>
          <div className="text-xs text-success font-medium flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3">
              <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            {activeChange}
          </div>
        </div>
      </div>
      
      <h4 className="font-medium text-lg mt-8">Recent User Activity</h4>
      <div className="space-y-3 bg-white p-4 rounded-xl shadow-sm">
        {recentActivity.map((item, i) => (
          <div key={i} className="flex items-center justify-between border-b pb-3 hover:bg-slate-50 p-2 rounded-md transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-medium">
                {item.user.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium">{item.user}</div>
                <div className="text-xs text-muted-foreground">{item.action}</div>
              </div>
            </div>
            <Badge variant="outline" className="bg-slate-100">{item.time}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsersTab;
