// src/components/OfficerForm.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/sonner';
import { officersService } from '@/services/apiService';
import { Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

// Types
interface Officer {
  id?: number;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  status: string;
  district: string;
  joinDate: string;
  dateOfBirth: string;
  avatar: string;
  contactNumber: string;
  email: string;
  address: string;
  emergencyContact: string;
  designation: string;
  specialization: string;
  weaponNumber: string;
  bloodGroup: string;
  currentPosting: string;
  previousPostings: string[];
  performance: {
    casesSolved: number;
    commendations: number;
    incidentsReported: number;
    performanceRating: number;
    lastPromotionDate: string;
    awards: string[];
    disciplinaryActions: string[];
    trainingHoursCompleted: number;
    communityEngagementScore: number;
    teamLeadershipScore: number;
  };
}

interface OfficerFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: Officer | null;
}

// Validation Schema
const officerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  badgeNumber: z.string().min(1, 'Badge number is required'),
  rank: z.string().min(1, 'Rank is required'),
  department: z.string().min(1, 'Department is required'),
  status: z.string().optional(),
  district: z.string().optional(),
  joinDate: z.string().optional(),
  dateOfBirth: z.string().optional(),
  avatar: z.string().optional(),
  contactNumber: z.string()
    .transform(val => val.trim())
    .refine(val => val === '' || /^\d{10}$/.test(val), {
      message: 'Contact number must be exactly 10 digits'
    })
    .optional()
    .or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  designation: z.string().optional(),
  specialization: z.string().optional(),
  weaponNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  currentPosting: z.string().optional(),
  previousPostings: z.array(z.string()).optional(),
  performance: z.object({
    casesSolved: z.number().min(0).optional(),
    commendations: z.number().min(0).optional(),
    incidentsReported: z.number().min(0).optional(),
    performanceRating: z.number().min(0).max(5).optional(),
    lastPromotionDate: z.string().optional(),
    awards: z.array(z.string()).optional(),
    disciplinaryActions: z.array(z.string()).optional(),
    trainingHoursCompleted: z.number().min(0).optional(),
    communityEngagementScore: z.number().min(0).optional(),
    teamLeadershipScore: z.number().min(0).optional(),
  }).optional(),
});

// Constants
const RANKS = [
  'CONSTABLE',
  'HEAD_CONSTABLE',
  'ASSISTANT_SUB_INSPECTOR',
  'SUB_INSPECTOR',
  'INSPECTOR',
  'DEPUTY_SUPERINTENDENT',
];

const STATUSES = ['ACTIVE', 'SUSPENDED', 'ON_LEAVE', 'TRAINING'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const defaultOfficer: Officer = {
  name: '',
  badgeNumber: '',
  rank: '',
  department: '',
  status: 'ACTIVE',
  district: 'Bhopal',
  joinDate: new Date().toISOString().split('T')[0],
  dateOfBirth: '',
  avatar: '',
  contactNumber: '',
  email: '',
  address: '',
  emergencyContact: '',
  designation: '',
  specialization: '',
  weaponNumber: '',
  bloodGroup: '',
  currentPosting: '',
  previousPostings: [],
  performance: {
    casesSolved: 0,
    commendations: 0,
    incidentsReported: 0,
    performanceRating: 0,
    lastPromotionDate: '',
    awards: [],
    disciplinaryActions: [],
    trainingHoursCompleted: 0,
    communityEngagementScore: 0,
    teamLeadershipScore: 0,
  },
};

// Normalize initialData to ensure no undefined values
const normalizeOfficerData = (data: Officer | null | undefined): Officer => {
  const normalized: Officer = { ...defaultOfficer };
  if (!data) return normalized;

  // Normalize top-level fields
  Object.keys(defaultOfficer).forEach((key) => {
    if (key !== 'performance' && key !== 'previousPostings') {
      normalized[key as keyof Officer] =
        data[key as keyof Officer] ?? defaultOfficer[key as keyof Officer];
    }
  });

  // Normalize previousPostings
  normalized.previousPostings = Array.isArray(data.previousPostings)
    ? data.previousPostings
    : defaultOfficer.previousPostings;

  // Normalize performance object
  normalized.performance = { ...defaultOfficer.performance };
  if (data.performance) {
    Object.keys(defaultOfficer.performance).forEach((key) => {
      normalized.performance[key as keyof Officer['performance']] =
        data.performance[key as keyof Officer['performance']] ??
        defaultOfficer.performance[key as keyof Officer['performance']];
    });
  }

  return normalized;
};

// Reusable Form Field Component
interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  tooltip?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required,
  error,
  placeholder,
  tooltip,
}) => (
  <div className="space-y-1">
    <Label htmlFor={name} className="text-sm font-medium">
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {type === 'textarea' ? (
              <Textarea
                id={name}
                name={name}
                value={value as string}
                onChange={onChange}
                placeholder={placeholder}
                rows={3}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
              />
            ) : (
              <Input
                id={name}
                name={name}
                type={type}
                value={value ?? ''} // Ensure value is never undefined
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
              />
            )}
          </div>
        </TooltipTrigger>
        {tooltip && <TooltipContent>{tooltip}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
    {error && (
      <p id={`${name}-error`} className="text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {error}
      </p>
    )}
  </div>
);

const OfficerForm: React.FC<OfficerFormProps> = ({ open, onClose, onSaved, initialData }) => {
  const [officer, setOfficer] = useState<Officer>(normalizeOfficerData(null));
  const [errors, setErrors] = useState<Partial<Record<keyof Officer | `performance.${keyof Officer['performance']}`, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [debouncedEmail] = useDebounce(officer.email, 300);

  // Initialize form with normalized initialData
  useEffect(() => {
    setOfficer(normalizeOfficerData(initialData));
    setErrors({});
    setIsDirty(false);
  }, [initialData, open]);

  // Validate email debounced
  useEffect(() => {
    if (debouncedEmail) {
      const result = officerSchema.shape.email.safeParse(debouncedEmail);
      if (!result.success) {
        setErrors((prev) => ({ ...prev, email: result.error.errors[0].message }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    }
  }, [debouncedEmail]);

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setIsDirty(true);

      if (name.startsWith('performance.')) {
        const performanceField = name.split('.')[1] as keyof Officer['performance'];
        setOfficer((prev) => ({
          ...prev,
          performance: {
            ...prev.performance,
            [performanceField]:
              performanceField === 'awards' || performanceField === 'disciplinaryActions'
                ? value.split(',').filter(Boolean)
                : performanceField === 'lastPromotionDate'
                ? value
                : Number(value) || 0,
          },
        }));
      } else {
        setOfficer((prev) => ({ ...prev, [name]: value }));
      }

      // Validate field
      const fieldSchema = officerSchema.shape[name as keyof Officer];
      if (fieldSchema) {
        const result = fieldSchema.safeParse(value);
        setErrors((prev) => ({
          ...prev,
          [name]: result.success ? undefined : result.error.errors[0].message,
        }));
      }
    },
    []
  );

  // Handle select changes
  const handleSelectChange = useCallback((name: keyof Officer, value: string) => {
    setIsDirty(true);
    setOfficer((prev) => ({ ...prev, [name]: value }));
    const fieldSchema = officerSchema.shape[name];
    if (fieldSchema) {
      const result = fieldSchema.safeParse(value);
      setErrors((prev) => ({
        ...prev,
        [name]: result.success ? undefined : result.error.errors[0].message,
      }));
    }
  }, []);

  // Handle array field changes
  const handleArrayChange = useCallback((name: string, value: string) => {
    if (!value) return;
    setIsDirty(true);
    setOfficer((prev) => ({
      ...prev,
      [name]: [...(prev[name as keyof Officer] as string[]), value],
    }));
  }, []);

  // Remove item from array
  const removeArrayItem = useCallback((name: string, item: string) => {
    setIsDirty(true);
    setOfficer((prev) => ({
      ...prev,
      [name]: (prev[name as keyof Officer] as string[]).filter((i) => i !== item),
    }));
  }, []);

  // Format select options
  const formattedRanks = useMemo(
    () =>
      RANKS.map((rank) => ({
        value: rank,
        label: rank
          .split('_')
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' '),
      })),
    []
  );

  const formattedStatuses = useMemo(
    () =>
      STATUSES.map((status) => ({
        value: status,
        label: status
          .split('_')
          .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' '),
      })),
    []
  );

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const validationResult = officerSchema.safeParse(officer);
      if (!validationResult.success) {
        const newErrors = validationResult.error.flatten().fieldErrors;
        setErrors(
          Object.entries(newErrors).reduce((acc, [key, value]) => ({
            ...acc,
            [key]: Array.isArray(value) ? value[0] : value,
          }), {})
        );
        toast.error('Please fix the validation errors before submitting');
        return;
      }

      // Map the form data to match the OfficerRequest DTO
      const officerRequest = {
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        rank: officer.rank,
        department: officer.department,
        status: officer.status,
        district: officer.district,
        joinDate: officer.joinDate,
        avatar: officer.avatar,
        contactNumber: officer.contactNumber,
        email: officer.email,
        address: officer.address,
        emergencyContact: officer.emergencyContact,
        designation: officer.designation,
        specialization: officer.specialization,
        weaponNumber: officer.weaponNumber,
        bloodGroup: officer.bloodGroup,
        dateOfBirth: officer.dateOfBirth,
        currentPosting: officer.currentPosting,
        previousPostings: officer.previousPostings || []
      };

      if (initialData?.id) {
        await officersService.update(initialData.id, officerRequest);
        toast.success('Officer updated successfully');
      } else {
        await officersService.create(officerRequest);
        toast.success('Officer created successfully');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving officer:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save officer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel with confirmation
  const handleCancel = () => {
    if (isDirty) {
      setConfirmCancel(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle id="officer-form-title">
              {initialData?.id ? 'Edit Officer' : 'Add Officer'}
            </DialogTitle>
            <DialogDescription id="officer-form-description">
              {initialData?.id ? 'Update officer details' : 'Enter the details for the new officer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6" aria-labelledby="officer-form-title" aria-describedby="officer-form-description">
            {/* Personal Information */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold p-4 bg-muted rounded-lg w-full text-left">
                Personal Information
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-4">
                <FormField
                  label="Full Name"
                  name="name"
                  value={officer.name}
                  onChange={handleChange}
                  required
                  error={errors.name}
                  placeholder="Enter full name"
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={officer.dateOfBirth}
                    onChange={handleChange}
                    error={errors.dateOfBirth}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="bloodGroup">Blood Group</Label>
                    <Select
                      value={officer.bloodGroup}
                      onValueChange={(value) => handleSelectChange('bloodGroup', value)}
                    >
                      <SelectTrigger id="bloodGroup">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bloodGroup && (
                      <p className="text-sm text-red-500">{errors.bloodGroup}</p>
                    )}
                  </div>
                </div>
                <FormField
                  label="Contact Number"
                  name="contactNumber"
                  value={officer.contactNumber}
                  onChange={handleChange}
                  error={errors.contactNumber}
                  placeholder="Enter contact number"
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={officer.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="Enter email address"
                />
                <FormField
                  label="Emergency Contact"
                  name="emergencyContact"
                  value={officer.emergencyContact}
                  onChange={handleChange}
                  error={errors.emergencyContact}
                  placeholder="Enter emergency contact"
                />
                <FormField
                  label="Address"
                  name="address"
                  value={officer.address}
                  onChange={handleChange}
                  type="textarea"
                  error={errors.address}
                  placeholder="Enter full address"
                />
                <FormField
                  label="Profile Photo URL"
                  name="avatar"
                  value={officer.avatar}
                  onChange={handleChange}
                  error={errors.avatar}
                  placeholder="Enter profile photo URL"
                  tooltip="Provide a URL to the officer's profile photo"
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Professional Information */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold p-4 bg-muted rounded-lg w-full text-left">
                Professional Information
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Badge Number"
                    name="badgeNumber"
                    value={officer.badgeNumber}
                    onChange={handleChange}
                    required
                    error={errors.badgeNumber}
                    placeholder="Enter badge number"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="rank">
                      Rank
                      <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={officer.rank}
                      onValueChange={(value) => handleSelectChange('rank', value)}
                    >
                      <SelectTrigger id="rank">
                        <SelectValue placeholder="Select rank" />
                      </SelectTrigger>
                      <SelectContent>
                        {formattedRanks.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.rank && (
                      <p className="text-sm text-red-500">{errors.rank}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Department"
                    name="department"
                    value={officer.department}
                    onChange={handleChange}
                    required
                    error={errors.department}
                    placeholder="Enter department"
                  />
                  <FormField
                    label="Designation"
                    name="designation"
                    value={officer.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    placeholder="Enter designation"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Specialization"
                    name="specialization"
                    value={officer.specialization}
                    onChange={handleChange}
                    error={errors.specialization}
                    placeholder="Enter specialization"
                  />
                  <FormField
                    label="Weapon Number"
                    name="weaponNumber"
                    value={officer.weaponNumber}
                    onChange={handleChange}
                    error={errors.weaponNumber}
                    placeholder="Enter weapon number"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Join Date"
                    name="joinDate"
                    type="date"
                    value={officer.joinDate}
                    onChange={handleChange}
                    error={errors.joinDate}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={officer.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {formattedStatuses.map(({ value, label }) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status}</p>
                    )}
                  </div>
                </div>
                <FormField
                  label="Current Posting"
                  name="currentPosting"
                  value={officer.currentPosting}
                  onChange={handleChange}
                  error={errors.currentPosting}
                  placeholder="Enter current posting"
                />
                <div className="space-y-2">
                  <Label>Previous Postings</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newPosting"
                      placeholder="Add previous posting"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleArrayChange('previousPostings', e.currentTarget.value);
                          e.currentTarget.value = '';
                          e.preventDefault();
                        }
                      }}
                      aria-label="Add previous posting"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('newPosting') as HTMLInputElement;
                        if (input?.value) {
                          handleArrayChange('previousPostings', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {officer.previousPostings?.map((posting, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                      >
                        {posting}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeArrayItem('previousPostings', posting)}
                          aria-label={`Remove ${posting}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Performance Information */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold p-4 bg-muted rounded-lg w-full text-left">
                Performance Information
                <ChevronDown className="h-5 w-5" />
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Cases Solved"
                    name="performance.casesSolved"
                    type="number"
                    value={officer.performance.casesSolved}
                    onChange={handleChange}
                    error={errors['performance.casesSolved']}
                    placeholder="0"
                    tooltip="Number of cases solved by the officer"
                  />
                  <FormField
                    label="Commendations"
                    name="performance.commendations"
                    type="number"
                    value={officer.performance.commendations}
                    onChange={handleChange}
                    error={errors['performance.commendations']}
                    placeholder="0"
                  />
                  <FormField
                    label="Incidents Reported"
                    name="performance.incidentsReported"
                    type="number"
                    value={officer.performance.incidentsReported}
                    onChange={handleChange}
                    error={errors['performance.incidentsReported']}
                    placeholder="0"
                  />
                  <FormField
                    label="Performance Rating (0-5)"
                    name="performance.performanceRating"
                    type="number"
                    value={officer.performance.performanceRating}
                    onChange={handleChange}
                    error={errors['performance.performanceRating']}
                    placeholder="0"
                    tooltip="Rating from 0 to 5"
                  />
                  <FormField
                    label="Training Hours Completed"
                    name="performance.trainingHoursCompleted"
                    type="number"
                    value={officer.performance.trainingHoursCompleted}
                    onChange={handleChange}
                    error={errors['performance.trainingHoursCompleted']}
                    placeholder="0"
                  />
                  <FormField
                    label="Last Promotion Date"
                    name="performance.lastPromotionDate"
                    type="date"
                    value={officer.performance.lastPromotionDate}
                    onChange={handleChange}
                    error={errors['performance.lastPromotionDate']}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Awards</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newAward"
                      placeholder="Add award"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleArrayChange('performance.awards', e.currentTarget.value);
                          e.currentTarget.value = '';
                          e.preventDefault();
                        }
                      }}
                      aria-label="Add award"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('newAward') as HTMLInputElement;
                        if (input?.value) {
                          handleArrayChange('performance.awards', input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {officer.performance.awards?.map((award, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                      >
                        {award}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => removeArrayItem('performance.awards', award)}
                          aria-label={`Remove ${award}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : initialData?.id ? (
                'Update Officer'
              ) : (
                'Create Officer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Cancel */}
      <Dialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <DialogContent aria-labelledby="confirm-cancel-title" aria-describedby="confirm-cancel-description">
          <DialogHeader>
            <DialogTitle id="confirm-cancel-title">Unsaved Changes</DialogTitle>
            <DialogDescription id="confirm-cancel-description">
              You have unsaved changes. Are you sure you want to cancel?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmCancel(false)}>
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmCancel(false);
                onClose();
              }}
            >
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OfficerForm;