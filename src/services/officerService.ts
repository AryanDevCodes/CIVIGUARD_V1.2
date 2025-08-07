import { useApi } from '@/hooks/useApi';

export interface Officer {
  id: number;
  name: string;
  email?: string;
  // Add other officer properties as needed
}

export const useGetOfficers = () => {
  return useApi<Officer[]>({
    url: '/officers',
    method: 'GET',
    queryKey: ['officers']
  });
};

export const useGetOfficerById = (officerId: string | number) => {
  return useApi<Officer>({
    url: `/officers/${String(officerId)}`,
    method: 'GET',
    queryKey: ['officer', String(officerId)]
  });
};
