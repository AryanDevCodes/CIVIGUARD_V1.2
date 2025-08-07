import { useApi } from '@/hooks/useApi';

export type ShiftType = 'PATROL' | 'COURT' | 'TRAINING' | 'MEETING' | 'OTHER';
export type ShiftStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Officer {
  id: number;
  name: string;
  email?: string;
  // Add other officer properties as needed
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Shift {
  id: number;
  title: string;
  type: ShiftType;
  startTime: string | Date;
  endTime: string | Date;
  location: Location;
  description: string;
  status: ShiftStatus;
  assignedOfficerIds: number[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateShiftData {
  title: string;
  type: ShiftType;
  startTime: Date;
  endTime: Date;
  location: Omit<Location, 'id'>;
  description: string;
  status?: ShiftStatus;
  assignedOfficerIds: number[];
}

export type UpdateShiftData = Partial<Omit<CreateShiftData, 'assignedOfficerIds'>> & {
  assignedOfficerIds?: number[];
};

// Helper function to parse dates from API responses
const parseShiftDates = (shift: Shift): Shift => ({
  ...shift,
  startTime: new Date(shift.startTime),
  endTime: new Date(shift.endTime),
  createdAt: new Date(shift.createdAt),
  updatedAt: new Date(shift.updatedAt)
});

// Get all shifts
export const useGetShifts = () => {
  return useApi<Shift[]>({
    url: '/shifts',
    method: 'GET',
    queryKey: ['shifts'],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};

// Get shifts by date range
export const useGetShiftsByDateRange = (start: Date, end: Date) => {
  const params = new URLSearchParams();
  params.append('start', start.toISOString());
  params.append('end', end.toISOString());
  
  return useApi<Shift[]>({
    url: `/shifts/date-range?${params.toString()}`,
    method: 'GET',
    queryKey: ['shifts', 'date-range', start.toISOString(), end.toISOString()],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};

// Get upcoming shifts within a date range
export const useGetUpcomingShifts = (startDate: Date, endDate: Date) => {
  const params = new URLSearchParams();
  params.append('startDate', startDate.toISOString());
  params.append('endDate', endDate.toISOString());
  
  return useApi<Shift[]>({
    url: `/shifts/upcoming?${params.toString()}`,
    method: 'GET',
    queryKey: ['upcoming-shifts', startDate.toISOString(), endDate.toISOString()],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};

// Get a single shift by ID
export const useGetShiftById = (id: string | number) => {
  return useApi<Shift>({
    url: `/shifts/${String(id)}`,
    method: 'GET',
    queryKey: ['shift', String(id)],
    transform: parseShiftDates
  });
};

// Create a new shift
export const useCreateShift = () => {
  return useApi<Shift>({
    url: '/shifts',
    method: 'POST',
    transform: parseShiftDates
  });
};

// Update an existing shift
export const useUpdateShift = (shiftId: string | number) => {
  return useApi<Shift>({
    url: `/shifts/${String(shiftId)}`,
    method: 'PUT',
    transform: parseShiftDates
  });
};

// Update shift status
export const useUpdateShiftStatus = (shiftId: string | number, status: ShiftStatus) => {
  return useApi<Shift>({
    url: `/shifts/${String(shiftId)}/status/${status}`,
    method: 'PATCH',
    transform: parseShiftDates
  });
};

// Delete a shift
export const useDeleteShift = (shiftId: string | number) => {
  return useApi<void>({
    url: `/shifts/${String(shiftId)}`,
    method: 'DELETE'
  });
};

// Get shifts by officer ID
export const useGetOfficerShifts = (officerId: string | number) => {
  return useApi<Shift[]>({
    url: `/shifts/officer/${String(officerId)}`,
    method: 'GET',
    queryKey: ['officer-shifts', String(officerId)],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};

// Get shifts by officer ID with date range
export const useGetOfficerShiftsInRange = (officerId: string | number, startDate: Date, endDate: Date) => {
  const params = new URLSearchParams();
  params.append('startDate', startDate.toISOString());
  params.append('endDate', endDate.toISOString());
  
  return useApi<Shift[]>({
    url: `/shifts/officer/${String(officerId)}?${params.toString()}`,
    method: 'GET',
    queryKey: ['officer-shifts-range', String(officerId), startDate.toISOString(), endDate.toISOString()],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};

// Get shifts by status
export const useGetShiftsByStatus = (status: ShiftStatus) => {
  return useApi<Shift[]>({
    url: `/shifts/status/${status}`,
    method: 'GET',
    queryKey: ['shifts-by-status', status],
    transform: (data: Shift[]) => data.map(parseShiftDates)
  });
};
