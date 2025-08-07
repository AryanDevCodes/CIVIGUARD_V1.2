import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { incidentsService } from '@/services/apiService';

interface AddIncidentUpdateProps {
  incidentId: string;
  currentStatus: string;
  onUpdate: () => void;
  className?: string;
}

export default function AddIncidentUpdate({ 
  incidentId, 
  currentStatus,
  onUpdate,
  className = '' 
}: AddIncidentUpdateProps) {
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'reported', label: 'Reported' },
    { value: 'under-investigation', label: 'Under Investigation' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ].filter(opt => opt.value !== currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter update notes',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // If status is changed, update status with notes, otherwise just add an update
      if (status && status !== currentStatus) {
        await incidentsService.updateStatus(incidentId, status, notes);
      } else {
        await incidentsService.addUpdate(incidentId, notes);
      }
      
      setNotes('');
      setStatus('');
      onUpdate();
      
      toast({
        title: 'Success',
        description: 'Update added successfully',
      });
    } catch (error: any) {
      console.error('Error adding update:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add update',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-medium mb-4">Add Update</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="update-notes">Notes</Label>
          <Textarea
            id="update-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter update details..."
            rows={3}
            className="w-full"
            disabled={isSubmitting}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label>Update Status (Optional)</Label>
          <Select 
            value={status} 
            onValueChange={setStatus}
            disabled={isSubmitting || statusOptions.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Current status: ${currentStatus.replace('_', ' ')}`} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Leave unchanged to keep current status: {currentStatus.replace('_', ' ')}
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !notes.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add Update'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
