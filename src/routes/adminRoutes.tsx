import { Route, Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import ProtectedRoute from "@/components/routing/ProtectedRoute";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import OfficersPage from "@/pages/admin/OfficersPage";
import CitizensPage from "@/pages/admin/CitizensPage";
import AdminIncidentsPage from "@/pages/admin/IncidentsPage";
import AdminReportsPage from "@/pages/admin/ReportsPage";
import ConvertToIncidentPage from "@/pages/admin/ConvertToIncidentPage";
import SystemPage from "@/pages/admin/SystemPage";
import AdminAlertsPage from "@/pages/admin/AlertsPage";

export const adminRoutes = [
  <Route 
    key="admin-root"
    path="/admin" 
    element={
      <Navigate to="/admin/analytics" replace />
    }
  />,
  <Route 
    key="admin-analytics"
    path="/admin/analytics" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AnalyticsPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-officers"
    path="/admin/officers" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <OfficersPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-citizens"
    path="/admin/citizens" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <CitizensPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-incidents"
    path="/admin/incidents" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminIncidentsPage />
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-reports"
    path="/admin/reports" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <AdminReportsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-convert-incident"
    path="/admin/reports/convert/:reportId" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <ConvertToIncidentPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-alerts"
    path="/admin/alerts" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <DashboardLayout>
          <AdminAlertsPage />
        </DashboardLayout>
      </ProtectedRoute>
    }
  />,
  <Route 
    key="admin-system"
    path="/admin/system" 
    element={
      <ProtectedRoute allowedRoles={['admin']}>
        <SystemPage />
      </ProtectedRoute>
    }
  />
];
