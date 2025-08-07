
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from '@/components/DashboardLayout';
import IncidentReportForm from '@/components/citizen/IncidentReportForm';
import { Shield } from 'lucide-react';

const ReportPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Report an Incident</h1>
            <p className="text-muted-foreground">Submit details about any incident you've witnessed or experienced</p>
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">New Incident Report</CardTitle>
            <CardDescription>
              Please provide as much detail as possible to help authorities respond effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IncidentReportForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Confidentiality
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Your report is confidential and will only be shared with authorized personnel. Your personal information is protected and will not be disclosed without your consent unless required by law.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportPage;
