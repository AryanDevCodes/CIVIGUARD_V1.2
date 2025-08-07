import React, { useState, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  AlertTriangle, CalendarClock, FileText, MapPin, Save, Upload 
} from "lucide-react";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/context/AuthContext';
import MapSelector from './MapSelector';
import VoiceReporter from './VoiceReporter';
import { debounce } from 'lodash';
import { reportsService } from '@/services/reportsService';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  incidentType: z.string().min(1, "Please select an incident type"),
  date: z.string().min(1, "Please select the incident date"),
  time: z.string().min(1, "Please select the incident time"),
  location: z.string().min(5, "Location must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  witnesses: z.string().optional(),
  evidence: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

type IncidentFormValues = z.infer<typeof formSchema>;

// List of incident types
const incidentTypes = [
  "Theft/Burglary", 
  "Vandalism", 
  "Assault", 
  "Suspicious Activity", 
  "Noise Complaint", 
  "Traffic Incident", 
  "Harassment", 
  "Fraud", 
  "Other"
];

const IncidentReportForm: React.FC = () => {
  const { user } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      incidentType: "",
      date: new Date().toISOString().substr(0, 10),
      time: new Date().toTimeString().substr(0, 5),
      location: "",
      description: "",
      witnesses: "",
      evidence: "",
      coordinates: undefined,
    },
  });

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    console.log('Location selected:', address, coordinates);
    form.setValue("location", address);
    form.setValue("coordinates", coordinates);
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript) {
      console.log('Voice transcript received:', transcript);
      form.setValue("description", transcript);
    }
  };

  const handleShowMap = useCallback(
    debounce(() => {
      console.log('Show Map button tapped, showMap:', !showMap);
      setShowMap(prev => !prev);
    }, 300),
    [showMap]
  );

  async function onSubmit(values: IncidentFormValues) {
    console.log("Form submitted:", values);
    setFormError(null);
    try {
      // Prepare payload for reports endpoint
      // Prepare location data
      const locationData: any = {
        address: values.location || 'No address provided',
      };

      // Add coordinates if available
      if (values.coordinates) {
        locationData.lat = values.coordinates.lat;
        locationData.lng = values.coordinates.lng;
        locationData.latitude = values.coordinates.lat;
        locationData.longitude = values.coordinates.lng;
      }

      const reportData = {
        title: values.title,
        description: values.description,
        incidentType: values.incidentType,
        date: values.date,
        time: values.time,
        location: locationData,
        witnesses: values.witnesses || '',
        evidence: values.evidence || '',
        status: 'PENDING', // Default status for new reports
        priority: 'MEDIUM', // Default priority
        createdBy: user?.id || undefined,
        // Include locationString as a fallback for older API versions
        locationString: values.location || 'No address provided',
      };
      
      await reportsService.create(reportData);
      toast.success("Report submitted successfully", {
        description: "Your report has been received and will be reviewed shortly.",
      });
      form.reset();
      setShowMap(false);
    } catch (error: any) {
      console.error("Error submitting report:", error);
      setFormError(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit report. Please try again."
      );
      toast.error("Failed to submit report", {
        description: error?.response?.data?.message || error?.message || "Unknown error occurred."
      });
    }
  }

  return (
    <div className="container mx-auto p-4">
      {formError && <p className="text-red-600 mb-4">{formError}</p>}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief title describing the incident" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="incidentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incident Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="w-56 bg-background/80 backdrop-blur-md border border-border shadow-xl">
                      {incidentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Incident</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="date" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of Incident</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <div className="space-y-3">
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Street address or location description" 
                        className="pl-10" 
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShowMap}
                    onTouchStart={() => console.log('Show Map button touched in IncidentReportForm')}
                  >
                    {showMap ? "Hide Map" : "Show Map"}
                  </Button>
                  
                  {showMap && (
                    <MapSelector 
                      onLocationSelect={handleLocationSelect}
                      initialCoordinates={form.getValues("coordinates") as { lat: number; lng: number } | undefined}
                      provider="google"
                    />
                  )}
                  
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                      placeholder="Detailed description of what happened"
                      className="min-h-[120px] pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Please provide as much detail as possible about the incident
                </FormDescription>
                <FormMessage />
                
                <div className="mt-3 border-t pt-3">
                  <p className="text-sm font-medium mb-2">Voice Reporting</p>
                  <VoiceReporter onTranscriptChange={handleVoiceTranscript} />
                </div>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="witnesses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Witnesses</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Names and contact information of any witnesses (optional)"
                    className="min-h-[80px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="evidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Evidence</FormLabel>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" /> Upload Files
                  </Button>
                </div>
                <FormDescription>
                  Upload photos, videos, or documents related to the incident (coming soon)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-md flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Filing a false report is a serious offense. Please ensure all information provided is accurate to the best of your knowledge.
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> Submit Report
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default IncidentReportForm;