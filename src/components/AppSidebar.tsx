import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, BarChart3, Users, Settings, MapPin, 
  User, FileText, Bell, Map, ShieldAlert,
  FileBarChart, Calendar, ClipboardList, Shield, Car
} from 'lucide-react';
import { 
  Sidebar, SidebarContent, SidebarGroup, 
  SidebarGroupContent, SidebarGroupLabel, 
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, 
  SidebarHeader, SidebarFooter
} from '@/components/ui/sidebar';
import { useAuth, UserRole } from '@/context/AuthContext';
import Logo from './Logo';
import { cn } from '@/lib/utils';

const getRoleMenuItems = (role: UserRole) => {
  switch (role) {
    case 'citizen':
      return [
        { title: 'Dashboard', path: '/citizen', icon: Home },
        { title: 'Report Incident', path: '/citizen/report', icon: FileText },
        { title: 'My Reports', path: '/citizen/reports', icon: ClipboardList },
        { title: 'Crime Map', path: '/citizen/map', icon: MapPin },
        { title: 'Safety Alerts', path: '/citizen/alerts', icon: Bell },
        { title: 'Emergency Contacts', path: '/citizen/contacts', icon: Users },
        { title: 'Profile', path: '/citizen/profile', icon: User },
      ];
    case 'officer':
      return [
        // { title: 'Dashboard', path: '/officer', icon: Home },
        { title: 'Active Incidents', path: '/officer/incidents', icon: ShieldAlert },
        { title: 'Assigned Cases', path: '/officer/cases', icon: ClipboardList },
        { title: 'Patrol Map', path: '/officer/patrol', icon: Map },
        { title: 'Patrol Vehicles', path: '/officer/vehicles', icon: Car },
        { title: 'Schedule', path: '/officer/schedule', icon: Calendar },
        { title: 'Reports', path: '/officer/reports', icon: FileBarChart },
        { title: 'Team', path: '/officer/team', icon: Users },
        { title: 'Profile', path: '/officer/profile', icon: User },
      ];
    case 'admin':
      return [
        { title: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
        { title: 'Officers', path: '/admin/officers', icon: Shield },
        { title: 'Citizens', path: '/admin/citizens', icon: Users },
        { title: 'Incidents', path: '/admin/incidents', icon: ShieldAlert },
        { title: 'Alerts', path: '/admin/alerts', icon: Bell },
        { title: 'Reports', path: '/admin/reports', icon: FileBarChart },
        { title: 'System', path: '/admin/system', icon: Settings },
      ];
    default:
      return [];
  }
};

const AppSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) return null;
  
  const menuItems = getRoleMenuItems(user.role);
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-white/10">
        <Logo />
        {/* SidebarTrigger removed as per user preference */}
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-white/70 px-4">
            {user.role === 'admin' ? 'Administration' : 
             user.role === 'officer' ? 'Law Enforcement' : 'Citizen Portal'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link 
                        to={item.path} 
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-200",
                          isActive 
                            ? "bg-white/15 text-white font-medium" 
                            : "text-white/80 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <item.icon 
                          size={18} 
                          className={cn(
                            "transition-colors",
                            isActive ? "text-white" : "text-white/70"
                          )} 
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-white/10">
        <div className="flex items-center justify-center p-2 text-xs text-white/70">
          <span> 2025 CIVIGUARD</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;