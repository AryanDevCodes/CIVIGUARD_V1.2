
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from '@/hooks/use-toast';
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only show error messages if we're done loading and access is denied
    if (!loading) {
      if (!user) {
        toast({
          title: "Access denied",
          description: "You need to login first",
          variant: "destructive"
        });
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        toast({
          title: "Unauthorized",
          description: "You don't have permission to access this page",
          variant: "destructive"
        });
      }
    }
  }, [user, allowedRoles, toast, loading]);
  
  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Redirect to appropriate dashboard if not authorized for this route
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case 'citizen':
        return <Navigate to="/citizen" />;
      case 'officer':
        return <Navigate to="/officer" />;
      case 'admin':
        return <Navigate to="/admin" />;
      default:
        return <Navigate to="/login" />;
    }
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
