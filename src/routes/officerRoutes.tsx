import { Route } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import OfficerDashboard from "@/components/dashboards/OfficerDashboard";
import IncidentsPage from "@/pages/officer/IncidentsPage";
import IncidentDetailsPage from "@/pages/officer/IncidentDetailsPage";
import CasesPage from "@/pages/officer/CasesPage";
import PatrolMapPage from "@/pages/officer/PatrolMapPage";
import SchedulePage from "@/pages/officer/SchedulePage";
import ReportsPage from "@/pages/officer/ReportsPage";
import TeamPage from "@/pages/officer/TeamPage";
import OfficerProfilePage from "@/pages/officer/ProfilePage";
import OfficerAlertsPage from "@/pages/officer/AlertsPage";
import PatrolVehiclesPage from "@/pages/patrol/PatrolVehiclesPage";
import PatrolVehicleDetailPage from "@/pages/patrol/PatrolVehicleDetailPage";
import RealTimeMapPage from "@/pages/citizen/RealTimeMapPage";

export const officerRoutes = [
  <Route 
    key="officer-dashboard"
    path="/officer" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <OfficerDashboard />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-incidents"
    path="/officer/incidents" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <IncidentsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-incident-details"
    path="/officer/incidents/:id" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <IncidentDetailsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-cases"
    path="/officer/cases" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <CasesPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-patrol"
    path="/officer/patrol" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          {/* <PatrolMapPage /> */}
          <RealTimeMapPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-vehicles"
    path="/officer/vehicles" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <PatrolVehiclesPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-vehicle-detail"
    path="/officer/vehicles/:id" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <PatrolVehicleDetailPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-schedule"
    path="/officer/schedule" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
        <DashboardLayout>
          <SchedulePage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-reports"
    path="/officer/reports" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
          <ReportsPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-team"
    path="/officer/team" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
          <TeamPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-profile"
    path="/officer/profile" 
    element={
      <ProtectedRoute allowedRoles={['officer']}>
          <OfficerProfilePage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="officer-alerts"
    path="/officer/alerts" 
    element={
      <ProtectedRoute allowedRoles={['officer', 'admin']}>
        <DashboardLayout>
          <OfficerAlertsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
];

export default officerRoutes;
