import React, { useState, useEffect } from 'react';
// Import individual UI components to resolve module issues
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout';
import { User, ShieldCheck, Bell, Lock, UploadCloud, Mail, Phone, Home, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/apiService';
import { format } from 'date-fns';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  district?: string;
  landmark?: string;
  country?: string;
}

interface EmergencyContact {
  id: number;
  name: string;
  phoneNumber: string;
  relationship?: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  profileImage?: string;
  phoneNumber?: string;
  address?: Address;
  emergencyContacts: EmergencyContact[];
  aadhaar: string;
  lastLogin?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const CitizenProfilePage: React.FC = () => {
  const { user: authUser, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings states
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Form state
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    name: '',
    email: '',
    role: 'CITIZEN',
    verificationStatus: 'UNVERIFIED',
    phoneNumber: '',
    address: {},
    emergencyContacts: [],
    aadhaar: '',
    active: true,
    createdAt: '',
    updatedAt: ''
  });

  // Load user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userService.getProfile();
        setProfile(response.data || response); // Handle both response structures
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  // Update form when profile data changes
  useEffect(() => {
    if (authUser) {
      setProfile(prev => ({
        ...prev,
        name: authUser.name,
        email: authUser.email,
        role: (authUser.role as any)?.toUpperCase() || 'CITIZEN',
        verificationStatus: authUser.verified ? 'VERIFIED' : 'UNVERIFIED',
      }));
    }
  }, [authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setProfile(prev => {
      // Handle nested properties (e.g., address.street)
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof UserProfile] as object || {}),
            [child]: checked !== undefined ? checked : value
          }
        } as UserProfile;
      }
      
      // Handle direct properties
      return {
        ...prev,
        [name]: checked !== undefined ? checked : value
      };
    });
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Prepare the update data
      const updateData = {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        address: profile.address
      };

      // Call the API
      const response = await userService.updateProfile(updateData);
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        ...response.data,
        updatedAt: new Date().toISOString()
      }));
      
      // Update auth context if name/email changed
      if (response?.data?.name || response?.data?.email) {
        updateUserProfile({
          name: response.data.name || profile.name,
          email: response.data.email || profile.email,
        });
      }
      
      toast({
        title: 'Profile Updated',
        description: 'Your personal details have been successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    toast({
      title: 'Preferences Updated',
      description: 'Your notification settings are saved.',
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to server
      const url = URL.createObjectURL(file);
      setProfile(prev => ({
        ...prev,
        profileImage: url
      }));
      toast({ 
        title: "Profile picture updated",
        description: "Don't forget to save your changes!",
      });
    }
  };

  if (!authUser || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Citizen Profile</h1>
            <p className="text-muted-foreground">Manage your identity and settings in CIVIGUARD</p>
          </div>
          {authUser.verified && (
            <Badge variant="outline" className="border-green-600 text-green-600">
              <ShieldCheck className="mr-1 h-4 w-4" />
              Verified
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1 shadow-sm">
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto ring-2 ring-primary">
                <AvatarImage src={profile.profileImage} alt={profile.name} />
                <AvatarFallback className="bg-primary/10">
                  <User size={36} className="text-primary" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-2">{profile.name}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                <Mail className="h-4 w-4" /> {profile.email}
              </CardDescription>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {profile.role?.toLowerCase() || 'citizen'}
                </Badge>
                <Badge variant={profile.verificationStatus === 'VERIFIED' ? 'default' : 'secondary'}>
                  {profile.verificationStatus === 'VERIFIED' ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="space-y-1 text-sm text-muted-foreground">
                {profile.phoneNumber && (
                  <p className="flex items-center justify-center gap-1">
                    <Phone className="h-4 w-4" /> {profile.phoneNumber}
                  </p>
                )}
                {profile.aadhaar && (
                  <p className="flex items-center justify-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Aadhaar: •••• •••• {profile.aadhaar.slice(-4)}
                  </p>
                )}
                <p className="flex items-center justify-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Member since {profile.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}
                </p>
                {profile.lastLogin && (
                  <p className="flex items-center justify-center gap-1 text-xs">
                    Last login: {format(new Date(profile.lastLogin), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Phone Number
                    </div>
                  </Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={profile.phoneNumber || ''}
                    onChange={handleInputChange}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Home className="h-4 w-4" /> Address
                  </Label>
                  <div className="space-y-2">
                    <Input
                      name="address.street"
                      value={profile.address?.street || ''}
                      onChange={handleInputChange}
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        name="address.city"
                        value={profile.address?.city || ''}
                        onChange={handleInputChange}
                        placeholder="City"
                      />
                      <Input
                        name="address.state"
                        value={profile.address?.state || ''}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Input
                          name="address.postalCode"
                          value={profile.address?.postalCode || ''}
                          onChange={handleInputChange}
                          placeholder="Postal Code"
                        />
                      </div>
                      <div className="space-y-2">
                        <Input
                          name="address.district"
                          value={profile.address?.district || ''}
                          onChange={handleInputChange}
                          placeholder="District"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Input
                        name="address.landmark"
                        value={profile.address?.landmark || ''}
                        onChange={handleInputChange}
                        placeholder="Landmark (Optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        name="address.country"
                        value={profile.address?.country || 'India'}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>

                {/* Emergency Contacts Section */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Emergency Contacts</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement add emergency contact
                        toast({
                          title: "Feature coming soon",
                          description: "Emergency contact management will be available in the next update.",
                        });
                      }}
                    >
                      Add Contact
                    </Button>
                  </div>
                  
                  {profile.emergencyContacts && profile.emergencyContacts.length > 0 ? (
                    <div className="space-y-2">
                      {profile.emergencyContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-muted-foreground">{contact.phoneNumber}</p>
                            {contact.relationship && (
                              <span className="text-xs text-muted-foreground">
                                {contact.relationship}
                              </span>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4 border-2 border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">No emergency contacts added</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add at least one emergency contact for your safety
                      </p>
                    </div>
                  )}
                </div>

                {/* Verification Status */}
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">
                        {profile.verificationStatus === 'VERIFIED' ? 'Profile Verified' : 'Verification Required'}
                      </p>
                      <p className="text-xs">
                        {profile.verificationStatus === 'VERIFIED' 
                          ? 'Your profile is verified and you have full access to all features.'
                          : 'To access all features, please complete your profile and verify your Aadhaar.'}
                      </p>
                      {profile.verificationStatus === 'VERIFIED' && (
                        <div className="mt-2 text-xs flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-600" />
                          Last verified: {format(new Date(profile.updatedAt), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings Tabs */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Update your profile, security, and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="notifications">Notifications</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <div>
                    <Label htmlFor="tab-name">Full Name</Label>
                    <Input 
                      id="tab-name" 
                      name="name"
                      value={profile.name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="tab-email">Email</Label>
                    <Input 
                      id="tab-email" 
                      type="email" 
                      name="email"
                      value={profile.email} 
                      onChange={handleInputChange}
                      disabled // Email is typically not editable
                    />
                  </div>
                  <div>
                    <Label htmlFor="tab-phone">Phone</Label>
                    <Input 
                      id="tab-phone" 
                      name="phoneNumber"
                      type="tel"
                      value={profile.phoneNumber || ''} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <Button onClick={handleSaveProfile} className="mt-4" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                  {[
                    { 
                      label: "Push Notifications", 
                      desc: "Receive alerts on your device", 
                      state: notificationsEnabled, 
                      setter: (checked: boolean) => setNotificationsEnabled(checked) 
                    },
                    { label: "Email Notifications", desc: "Get updates via email", state: true },
                    { label: "Safety Alerts", desc: "Incidents near your area", state: true },
                    { label: "Emergency Broadcasts", desc: "Critical safety info", state: true },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <Label>{item.label}</Label>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch 
                      checked={item.state} 
                      onCheckedChange={item.setter as (checked: boolean) => void} 
                    />
                    </div>
                  ))}
                  <Button onClick={handleSaveNotifications}>Update Preferences</Button>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Location Services</Label>
                      <p className="text-sm text-muted-foreground">Share your live location</p>
                    </div>
                    <Switch checked={locationSharing} onCheckedChange={setLocationSharing} />
                  </div>

                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input type="password" />
                  </div>

                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button variant="default">
                      <Lock className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant={twoFactorEnabled ? "secondary" : "outline"} onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}>
                      {twoFactorEnabled ? "2FA Enabled" : "Enable Two-Factor Auth"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Linked Accounts */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>Manage external logins</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            {[
              { name: "Google", icon: "G", connected: false },
              { name: "Facebook", icon: "FB", connected: false }
            ].map((acc, idx) => (
              <div key={idx} className="p-4 border rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full font-bold text-blue-500">{acc.icon}</div>
                  <div>
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {acc.connected ? "Connected" : "Not Connected"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {acc.connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CitizenProfilePage;
