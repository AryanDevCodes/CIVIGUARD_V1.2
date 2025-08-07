
import { Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import CitizenDashboard from "@/components/dashboards/CitizenDashboard";
import ReportPage from "@/pages/citizen/ReportPage";
import MyReportsPage from "@/pages/citizen/MyReportsPage";
import CrimeMapPage from "@/pages/citizen/CrimeMapPage";
import SafetyAlertsPage from "@/pages/citizen/SafetyAlertsPage";
import ContactsPage from "@/pages/citizen/ContactsPage";
import ProfilePage from "@/pages/citizen/ProfilePage";

export const citizenRoutes = [
  <Route 
    key="citizen-dashboard"
    path="/citizen" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <DashboardLayout>
          <CitizenDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="citizen-report"
    path="/citizen/report" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <ReportPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="citizen-reports"
    path="/citizen/reports" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <MyReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="citizen-map"
    path="/citizen/map" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <CrimeMapPage />
      </ProtectedRoute>
    }
  />,

  <Route 
    key="citizen-alerts"
    path="/citizen/alerts" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <SafetyAlertsPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="citizen-contacts"
    path="/citizen/contacts" 
    element={
      <DashboardLayout>
      <ProtectedRoute allowedRoles={['citizen']}>
        <ContactsPage />
      </ProtectedRoute>
      </DashboardLayout>
    }
  />,
  <Route 
    key="citizen-profile"
    path="/citizen/profile" 
    element={
      <ProtectedRoute allowedRoles={['citizen']}>
        <ProfilePage />
      </ProtectedRoute>
    }
  />
];
