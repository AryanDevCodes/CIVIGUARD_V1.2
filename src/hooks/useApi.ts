
import axios, { AxiosRequestConfig } from 'axios';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';

// Define base API URL from environment variables
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API_PREFIX = '/api';

interface UseApiOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  transform?: (data: any) => T;
  queryKey?: string[];
}

// Main API hook that leverages React Query
export function useApi<T = any>({
  url,
  method = 'GET',
  body,
  initialData,
  enabled = true,
  onSuccess,
  onError,
  transform,
  queryKey = ['data']
}: UseApiOptions<T>) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Configuration for API calls
  const getConfig = (): AxiosRequestConfig => {
    // Construct the URL properly without duplicate slashes
    const path = url.startsWith('/') ? url : `/${url}`;
    const apiUrl = `${API_BASE_URL}${API_PREFIX}${path}`;
    
    return {
      method,
      url: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header if user is logged in
        ...(user && { Authorization: `Bearer ${user.token}` })
      },
      ...(body && (method === 'POST' || method === 'PUT' || method === 'PATCH') && { data: body })
    };
  };

  // For queries (GET requests)
  if (method === 'GET') {
    const query = useQuery({
      queryKey: [...queryKey, url],
      queryFn: async () => {
        try {
          const response = await axios(getConfig());
          return transform ? transform(response.data) : response.data;
        } catch (error) {
          // Handle error
          const err = error as any;
          const errorMessage = err.response?.data?.message || 'An error occurred while fetching data';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
          throw error;
        }
      },
      initialData,
      enabled,
      meta: {
        onError: (error: any) => {
          if (onError) onError(error);
        },
        onSuccess: (data: any) => {
          if (onSuccess) onSuccess(data as T);
        }
      }
    });

    return {
      data: query.data,
      loading: query.isLoading,
      error: query.error,
      refetch: query.refetch
    };
  } 
  // For mutations (POST, PUT, DELETE)
  else {
    const mutation = useMutation({
      mutationFn: async (newBody?: any) => {
        try {
          const config = getConfig();
          if (newBody) {
            config.data = newBody;
          }
          const response = await axios(config);
          return transform ? transform(response.data) : response.data;
        } catch (error) {
          // Handle error
          const err = error as any;
          const errorMessage = err.response?.data?.message || 'An error occurred';
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive'
          });
          throw error;
        }
      },
      onSuccess: (data) => {
        if (onSuccess) onSuccess(data as T);
      },
      onError: (error) => {
        if (onError) onError(error);
      }
    });

    return {
      data: undefined,
      loading: false,
      error: null,
      mutate: mutation.mutate,
      isPending: mutation.isPending,
      isSuccess: mutation.isSuccess,
      isError: mutation.isError
    };
  }
}

// Helper hooks for common operations
export function useGet<T = any>(url: string, options?: Omit<UseApiOptions<T>, 'url' | 'method'>) {
  return useApi<T>({ ...options, url, method: 'GET', queryKey: options?.queryKey || [url.split('/')[0]] });
}

export function usePost<T = any>(url: string, options?: Omit<UseApiOptions<T>, 'url' | 'method'>) {
  return useApi<T>({ ...options, url, method: 'POST', enabled: false });
}

export function usePut<T = any>(url: string, options?: Omit<UseApiOptions<T>, 'url' | 'method'>) {
  return useApi<T>({ ...options, url, method: 'PUT', enabled: false });
}

export function useDelete<T = any>(url: string, options?: Omit<UseApiOptions<T>, 'url' | 'method'>) {
  return useApi<T>({ ...options, url, method: 'DELETE', enabled: false });
}
