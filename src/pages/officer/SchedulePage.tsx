import { useState, useEffect, useCallback } from 'react';
import { format, startOfWeek, addDays, parse, isBefore } from 'date-fns';
import { Clock, MapPin, Trash2, Edit, Plus, Users } from 'lucide-react';
import {
  useGetShiftsByDateRange,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useGetOfficerShifts,
  type Shift,
  type ShiftType,
  type ShiftStatus,
  type Location
} from '@/services/scheduleService';
import { useGetOfficers } from '@/services/officerService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface ShiftFormData {
  title: string;
  type: ShiftType;
  startTime: string;
  endTime: string;
  location: Omit<Location, 'id'>;
  description: string;
  assignedOfficerIds: number[];
  status: ShiftStatus;
  date: string;
}

const initialFormData: Omit<ShiftFormData, 'id'> = {
  title: '',
  type: 'PATROL',
  startTime: '09:00',
  endTime: '17:00',
  location: {
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    latitude: 0,
    longitude: 0,
    district: ''
  },
  description: '',
  assignedOfficerIds: [],
  status: 'PENDING',
  date: format(new Date(), 'yyyy-MM-dd')
};

// Use the officers service hook
const useOfficers = () => {
  const { data, loading, error } = useGetOfficers();

  return {
    officers: Array.isArray(data) ? data : [],
    loading,
    error: error as Error | null
  };
};

const getShiftTypeColor = (type: ShiftType): string => {
  const colors = {
    PATROL: 'border-blue-500 bg-blue-100',
    COURT: 'border-purple-500 bg-purple-100',
    TRAINING: 'border-green-500 bg-green-100',
    MEETING: 'border-yellow-500 bg-yellow-100',
    OTHER: 'border-gray-500 bg-gray-100',
  };
  return colors[type] || colors.OTHER;
};

// Toast component is now handled by the UI library

const SchedulePage: React.FC = () => {
  const { user } = useAuth();
  const { officers, loading: isLoadingOfficers } = useOfficers();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<ShiftFormData, 'id'>>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 });
  const endDate = addDays(startDate, 6);
  // Get shifts for the current week
  const { data: shifts = [], loading: isLoading, refetch: refetchShifts } = useGetShiftsByDateRange(
    startDate,
    endDate
  );

  const createShift = useCreateShift();
  const updateShift = useUpdateShift(selectedShift?.id || 0);
  const deleteShift = useDeleteShift(selectedShift?.id || 0);
  // Close toast is handled by the toast component itself

  // Refetch shifts when the week changes
  useEffect(() => { 
    if (refetchShifts) {
      refetchShifts(); 
    }
  }, [currentDate, refetchShifts]);

  // Error handling is done in the useApi hook

  const formatDateString = (date: Date | string, formatStr: string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, formatStr);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.replace('location.', '') as keyof Omit<Location, 'id'>;
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'assignedOfficerIds'
          ? (e.target as HTMLInputElement).checked
            ? [...prev.assignedOfficerIds, parseInt((e.target as HTMLInputElement).value)]
            : prev.assignedOfficerIds.filter(id => id !== parseInt((e.target as HTMLInputElement).value))
          : value
      }));
    }
  };

  const handleOfficerToggle = (officerId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedOfficerIds: prev.assignedOfficerIds.includes(officerId)
        ? prev.assignedOfficerIds.filter(id => id !== officerId)
        : [...prev.assignedOfficerIds, officerId]
    }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setSelectedShift(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.location.address.trim()) errors['location.address'] = 'Address is required';
    if (!formData.location.city.trim()) errors['location.city'] = 'City is required';
    if (!formData.location.state.trim()) errors['location.state'] = 'State is required';
    if (!formData.location.postalCode.trim()) errors['location.postalCode'] = 'Postal code is required';
    if (!formData.startTime) errors.startTime = 'Start time is required';
    if (!formData.endTime) errors.endTime = 'End time is required';
    if (formData.startTime && formData.endTime) {
      const start = parse(formData.startTime, 'HH:mm', new Date());
      const end = parse(formData.endTime, 'HH:mm', new Date());
      if (isBefore(end, start)) errors.endTime = 'End time must be after start time';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Format dates in the format expected by the backend: "yyyy-MM-dd HH:mm:ss"
    const formatDateTime = (dateStr: string, timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date(dateStr);
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      // Convert to local date string in the format YYYY-MM-DD HH:MM:SS
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
    };

    const shiftData = {
      title: formData.title,
      type: formData.type,
      startTime: formatDateTime(formData.date, formData.startTime),
      endTime: formatDateTime(formData.date, formData.endTime),
      location: formData.location,
      description: formData.description,
      status: formData.status,
      assignedOfficerIds: formData.assignedOfficerIds
    };

    try {
      if (selectedShift) {
        updateShift.mutate(shiftData);
        toast({ title: 'Success', description: 'Shift updated successfully' });
        setIsEditDialogOpen(false);
      } else {
        createShift.mutate(shiftData);
        toast({ title: 'Success', description: 'Shift created successfully' });
        setIsAddDialogOpen(false);
      }
      await refetchShifts();
      resetForm();
    } catch (error) {
      console.error('Error saving shift:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedShift ? 'update' : 'create'} shift: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      await deleteShift.mutate(id);
      toast({ title: 'Success', description: 'Shift deleted successfully' });
      await refetchShifts();
    } catch (error) {
      console.error('Error deleting shift:', error);
      toast({
        title: 'Error',
        description: `Failed to delete shift: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  };

  const handleEditShift = useCallback((shift: Shift) => {
    setSelectedShift(shift);
    const startDate = new Date(shift.startTime);
    const endDate = new Date(shift.endTime);
    
    // Initialize form data with default location if shift.location is null
    const defaultLocation: Omit<Location, 'id'> = {
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      district: '',
      latitude: 0,
      longitude: 0
    };
    
    setFormData({
      title: shift.title,
      type: shift.type,
      date: format(startDate, 'yyyy-MM-dd'),
      startTime: format(startDate, 'HH:mm'),
      endTime: format(endDate, 'HH:mm'),
      location: shift.location || defaultLocation,
      description: shift.description || '',
      status: shift.status || 'PENDING',
      assignedOfficerIds: shift.assignedOfficerIds || []
    });
    setIsEditDialogOpen(true);
  }, []);

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  // Close all dialogs
  const closeDialogs = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    resetForm();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shift Schedule</h1>
        <button
          onClick={openAddDialog}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus size={16} />
          Add Shift
        </button>
      </div>

      {/* Calendar/List View of Shifts */}
      <div className="bg-white rounded-lg shadow p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No shifts scheduled for this week
              </div>
            ) : (
              shifts.map((shift) => (
                <div
                  key={shift.id}
                  className={`p-4 border rounded-lg ${getShiftTypeColor(shift.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{shift.title}</h3>
                      <p className="text-sm text-gray-600">{shift.description}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {format(new Date(shift.startTime), 'MMM d, yyyy h:mm a')} -{' '}
                        {format(new Date(shift.endTime), 'h:mm a')}
                      </div>
                      {shift.location && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin size={14} className="mr-1" />
                          {shift.location.address}, {shift.location.city}
                        </div>
                      )}
                      {shift.assignedOfficerIds.length > 0 && (
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Users size={14} className="mr-1" />
                          {shift.assignedOfficerIds.length} officer(s) assigned
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditShift(shift)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(shift.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Shift Dialog */}
      {(isAddDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedShift ? 'Edit Shift' : 'Add New Shift'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                    {formErrors.title && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                    )}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="PATROL">Patrol</option>
                      <option value="COURT">Court</option>
                      <option value="TRAINING">Training</option>
                      <option value="MEETING">Meeting</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                    {formErrors.startTime && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.startTime}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded"
                      required
                    />
                    {formErrors.endTime && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.endTime}</p>
                    )}
                  </div>
                </div>

                {/* Location Fields */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Location Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        name="location.address"
                        value={formData.location.address}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                      {formErrors['location.address'] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors['location.address']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="location.city"
                        value={formData.location.city}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                      {formErrors['location.city'] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors['location.city']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="location.state"
                        value={formData.location.state}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                      {formErrors['location.state'] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors['location.state']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        name="location.postalCode"
                        value={formData.location.postalCode}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                      {formErrors['location.postalCode'] && (
                        <p className="text-red-500 text-sm mt-1">{formErrors['location.postalCode']}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Officers */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium mb-3">Assign Officers</h3>
                  {isLoadingOfficers ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {officers.map((officer) => (
                        <div key={officer.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`officer-${officer.id}`}
                            checked={formData.assignedOfficerIds.includes(officer.id)}
                            onChange={() => handleOfficerToggle(officer.id)}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <label htmlFor={`officer-${officer.id}`} className="ml-2 text-sm text-gray-700">
                            {officer.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-2 border rounded"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                  <button
                    type="button"
                    onClick={closeDialogs}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isLoadingOfficers}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving...' : 'Save Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {/* Toast container is handled by the UI library */}
    </div>
  );
};

export default SchedulePage;
