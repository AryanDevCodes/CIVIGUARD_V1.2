import React, { useState } from 'react';
import { Bell, Globe, User, Menu, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ta', name: 'தமிழ்' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [currentLang, setCurrentLang] = useState('en');
  const [alerts] = useState(3);

  if (!user) return null;

  return (
    <div className="sticky top-0 z-50 w-full px-4 py-3 flex items-center justify-between nav-glass">
      <div className="flex items-center gap-2">
          <SidebarTrigger>
          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
            <Menu size={20} />
          </Button>
        </SidebarTrigger>
      </div>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-primary hover:bg-primary/5">
              <Globe size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
  align="end"
  className="w-40 bg-background/80 backdrop-blur-md border border-border shadow-xl"
>
            {languages.map(lang => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => setCurrentLang(lang.code)}
                className={currentLang === lang.code ? "bg-accent" : ""}
              >
                {lang.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-primary hover:bg-primary/5">
              <Bell size={18} />
              {alerts > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                  {alerts}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
  align="end"
  className="w-[320px] bg-background/80 backdrop-blur-md border border-border shadow-xl"
>
            <div className="text-sm font-medium p-3 border-b">Notifications</div>
            <div className="max-h-[320px] overflow-y-auto">
              <div className="p-3 text-sm border-b border-border hover:bg-accent/50 cursor-pointer">
                <div className="font-medium">New Alert</div>
                <div className="text-muted-foreground text-xs mt-1">Suspicious activity reported near your area</div>
                <div className="text-xs text-primary mt-1">5 minutes ago</div>
              </div>
              <div className="p-3 text-sm border-b border-border hover:bg-accent/50 cursor-pointer">
                <div className="font-medium">Report Status Update</div>
                <div className="text-muted-foreground text-xs mt-1">Your report #2304 has been assigned to Officer Smith</div>
                <div className="text-xs text-primary mt-1">2 hours ago</div>
              </div>
              <div className="p-3 text-sm hover:bg-accent/50 cursor-pointer">
                <div className="font-medium">System Update</div>
                <div className="text-muted-foreground text-xs mt-1">CIVIGUARD has been updated to version 2.4</div>
                <div className="text-xs text-primary mt-1">1 day ago</div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 rounded-full hover:bg-primary/5">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <User size={16} />
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground text-sm font-medium hidden md:inline-block">
                  {user.name}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-md border border-border shadow-xl">
            <div className="flex items-center justify-start gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 leading-none">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-500 focus:text-red-500">
              <LogOut size={16} className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Navbar;