import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'citizen' | 'officer' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  verified?: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  loading: boolean; // Added this to match what's being used in HomeRouter and ProtectedRoute
  updateUserProfile: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Real API call to backend
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      // Adjust this if your backend returns a different structure
      // Extract user info from the correct response structure
      const apiData = response.data;
      const userRaw = apiData.data;

      // Normalize role: remove 'ROLE_' prefix if present and lowercase it
      const normalizeRole = (role: string) =>
        role && role.startsWith('ROLE_') ? role.substring(5).toLowerCase() : (role?.toLowerCase() || 'citizen');

      const user: User = {
        id: userRaw.userId?.toString() || userRaw.id?.toString() || '',
        name: userRaw.name,
        email: userRaw.email,
        role: normalizeRole(userRaw.role),
        token: userRaw.token,
        // add avatar, verified, etc. if available
      };
      setUser(user);
      localStorage.setItem('civiguard-user', JSON.stringify(user));

      // Set authorization header for future requests
      if (user.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      }

      setIsLoading(false);
      return;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('civiguard-user');
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out"
    });
  };
  
  const updateUserProfile = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...userData };
      localStorage.setItem('civiguard-user', JSON.stringify(updated));
      return updated;
    });
  };

  // Check for existing user session
  useEffect(() => {
    const storedUser = localStorage.getItem('civiguard-user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Set authorization header for future requests
      if (parsedUser.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      loading: isLoading, // Add this alias to make it compatible with existing code
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
