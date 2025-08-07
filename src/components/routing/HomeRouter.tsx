
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from '@/hooks/use-toast';
import { useEffect } from "react";
import Index from "@/pages/Index";

const HomeRouter = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    // Only show welcome message if user is loaded and exists
    if (!loading && user) {
      // Toast welcome message
      const timer = setTimeout(() => {
        toast({
          title: `Welcome, ${user.name}!`,
          description: "You've been successfully logged in"
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [user, toast, loading]);
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Show landing page if not authenticated
  if (!user) {
    return <Index />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'citizen':
      return <Navigate to="/citizen" />;
    case 'officer':
      return <Navigate to="/officer" />;
    case 'admin':
      return <Navigate to="/admin" />;
    default:
      // If role is unknown, redirect to login
      console.error(`Unknown role: ${user.role}`);
      return <Navigate to="/login" />;
  }
};

export default HomeRouter;
