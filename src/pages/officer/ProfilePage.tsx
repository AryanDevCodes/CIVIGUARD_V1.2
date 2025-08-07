// Full updated code is large; due to limits, I’ll show section by section.
// First: Essential imports and setup
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield, User, MapPin, Phone, Mail, Calendar, Loader2, Award,
  Star, UserCheck, FileText, Target, Crosshair, ShieldCheck, AlertCircle, Users, Clock, Briefcase
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { officersService, userService } from '@/services/apiService';
import { format } from 'date-fns';

const OfficerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const { data: officerData, isLoading } = useQuery({
    queryKey: ['officerProfile', user?.id],
    queryFn: async () => {
      const response = await officersService.getById(user?.id || '');
      return response.data;
    }
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    address: ''
  });

  useEffect(() => {
    if (officerData) {
      setFormData({
        fullName: officerData.name || user?.name || '',
        email: officerData.email || user?.email || '',
        phone: officerData.contactNumber || '',
        emergencyContact: officerData.emergencyContact || '',
        address: officerData.address || ''
      });
    }
  }, [officerData, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile({
        name: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone,
        address: formData.address
      });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your profile information has been saved" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Officer Profile</h1>
            <p className="text-muted-foreground">Detailed officer overview and editable contact info</p>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid md:grid-cols-[1fr_2fr] gap-6">
          {/* Summary Sidebar */}
          <Card className="text-center">
            <CardContent className="py-6">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={officerData?.avatar || ''} />
                <AvatarFallback>{officerData?.name?.[0] || 'O'}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{officerData?.name}</h2>
              <p className="text-muted-foreground">{officerData?.designation}</p>
              <div className="flex justify-center mt-2 gap-2">
                <Badge className="bg-primary/90 text-white">{officerData?.rank}</Badge>
                <Badge variant="outline">Badge #{officerData?.badgeNumber}</Badge>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-2"><Shield size={16} /> ID: {officerData?.id}</div>
                <div className="flex items-center gap-2"><Calendar size={16} /> Joined: {format(new Date(officerData?.joinDate), 'dd MMM yyyy')}</div>
                <div className="flex items-center gap-2"><Mail size={16} /> {officerData?.email}</div>
                <div className="flex items-center gap-2"><MapPin size={16} /> {officerData?.district}</div>
              </div>
            </CardContent>
          </Card>

          {/* Main Profile Content */}
          <Card>
            <CardHeader>
              <CardTitle><User className="inline-block mr-2" />Professional Information</CardTitle>
              <CardDescription>
                Specialization: <strong>{officerData?.specialization}</strong> | Current Posting: <strong>{officerData?.currentPosting}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div><Label htmlFor="fullName">Full Name</Label><Input id="fullName" value={formData.fullName} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={handleInputChange} disabled={!isEditing} /></div>
                <div><Label htmlFor="emergencyContact">Emergency Contact</Label><Input id="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} disabled={!isEditing} /></div>
              </div>
              <Separator />
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={handleInputChange} disabled={!isEditing} />
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter>
                <Button onClick={handleSaveProfile} className="ml-auto">Save Changes</Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Performance Section */}
        <Card>
          <CardHeader>
            <CardTitle><Star className="inline-block mr-2" />Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Target className="text-green-600" size={20} /> Cases Solved: {officerData?.performance?.casesSolved}</div>
            <div className="flex items-center gap-2"><Award className="text-yellow-500" size={20} /> Awards: {officerData?.performance?.awardsReceived}</div>
            <div className="flex items-center gap-2"><ShieldCheck className="text-blue-600" size={20} /> Commendations: {officerData?.performance?.commendations}</div>
            <div className="flex items-center gap-2"><AlertCircle className="text-red-500" size={20} /> Disciplinary Actions: {officerData?.performance?.disciplinaryActions}</div>
            <div className="flex items-center gap-2"><Users className="text-purple-500" size={20} /> Community Score: {officerData?.performance?.communityEngagementScore}</div>
            <div className="flex items-center gap-2"><Clock className="text-cyan-600" size={20} /> Training Hours: {officerData?.performance?.trainingHoursCompleted}</div>
          </CardContent>
        </Card>

        {/* Career Timeline */}
        <Card>
          <CardHeader>
            <CardTitle><Briefcase className="inline-block mr-2" />Previous Postings</CardTitle>
            <CardDescription>Career history in chronological order</CardDescription>
          </CardHeader>
          <CardContent className="list-disc pl-4">
            {officerData?.previousPostings?.map((posting: string, index: number) => (
              <li key={index}>{posting}</li>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OfficerProfilePage;
