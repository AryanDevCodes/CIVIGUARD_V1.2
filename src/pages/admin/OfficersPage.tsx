import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody } from '@/components/ui/Modal';
import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Plus, Search, Filter, Edit, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/ui/status-badge';
import { officersService } from '@/services/apiService';
import OfficerForm from './OfficerForm';

const OfficersPage = () => {
  const [officers, setOfficers] = useState([]);

  // Fetch officers from backend and update state
  const fetchOfficers = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const response = await officersService.getAll({ page: pageToFetch - 1, size: officersPerPage });
      const officersArr = response?.data?.content || response?.data?.data?.content || response?.data || [];
      setOfficers(officersArr);
      setTotalOfficers(response?.data?.totalElements || response?.data?.data?.totalElements || 0);
      setIsLastPage(
        response?.data?.last !== undefined ? response.data.last :
        response?.data?.data?.last !== undefined ? response.data.data.last :
        officersArr.length < officersPerPage // fallback
      );
      if (officersArr.length === 0 && pageToFetch > 1) {
        setCurrentPage(pageToFetch - 1);
        toast.toast({
          title: 'No more data',
          description: 'You have reached the end of the officer list. Returning to the last valid page.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to fetch officers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editedOfficer, setEditedOfficer] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [officersPerPage] = useState(15); // Show 10 per page
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [confirmDeleteOfficerId, setConfirmDeleteOfficerId] = useState(null);
  const [isLastPage, setIsLastPage] = useState(false);
  const toast = useToast();

  // Fetch officers for the current page
  useEffect(() => {
    const fetchOfficers = async (pageToFetch = currentPage) => {
      setLoading(true);
      try {
        const response = await officersService.getAll({ page: pageToFetch - 1, size: officersPerPage });
        const officersArr = response?.data?.content || response?.data?.data?.content || response?.data || [];
        setOfficers(officersArr);
        setTotalOfficers(response?.data?.totalElements || response?.data?.data?.totalElements || 0);
        setIsLastPage(
          response?.data?.last !== undefined ? response.data.last :
          response?.data?.data?.last !== undefined ? response.data.data.last :
          officersArr.length < officersPerPage // fallback
        );
        if (officersArr.length === 0 && pageToFetch > 1) {
          setCurrentPage(pageToFetch - 1);
          toast.toast({
            title: 'No more data',
            description: 'You have reached the end of the officer list. Returning to the last valid page.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast.toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to fetch officers',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchOfficers();
  }, [currentPage, officersPerPage]);

  // Pagination Logic (backend-driven)
  const totalPages = Math.ceil(totalOfficers / officersPerPage);

  // Filtering (search/status/department) should be done on backend for large data, but for now filter the current page
  const filteredOfficers = officers.filter((officer) => {
    const searchMatch = officer.name?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'All' || officer.status?.toLowerCase() === statusFilter.toLowerCase();
    const departmentMatch = departmentFilter === 'All' || officer.department === departmentFilter;
    return searchMatch && statusMatch && departmentMatch;
  });

  const handleEditOfficer = (officer) => {
    setEditedOfficer({
      ...officer,
      performance: officer.performance || { casesSolved: 0, commendations: 0, incidentsReported: 0 }
    });
    setIsModalOpen(true);
  };

  const handleDeleteOfficer = async () => {
    if (confirmDeleteOfficerId) {
      try {
        // Find the officer to update
        const officerToUpdate = officers.find(officer => officer.id === confirmDeleteOfficerId);
        if (!officerToUpdate) throw new Error('Officer not found');
        // Update status to 'Unavailable'
        const updatedOfficer = { ...officerToUpdate, status: 'SUSPENDED' };
        await officersService.update(confirmDeleteOfficerId, updatedOfficer);
        setOfficers(officers.map(officer => officer.id === confirmDeleteOfficerId ? { ...officer, status: 'SUSPENDED' } : officer));
        setIsDeleteDialogOpen(false);
        toast.toast({
          title: 'Success',
          description: 'Officer deactivated successfully',
          variant: 'default'
        });
      } catch (error) {
        toast.toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to deactivate officer',
          variant: 'destructive'
        });
      }
    }
  };



  const handleAddOfficer = () => {
    setEditedOfficer({
      name: '',
      rank: '',
      department: '',
      status: 'Active',
      badge: '',
      district: '',
      joinDate: '',
      email: '',
      contactNumber: '',
      avatar: '',
      performance: { casesSolved: 0, commendations: 0, incidentsReported: 0 }
    });
    setIsModalOpen(true);
  };

  const handleSaveOfficer = async () => {
    if (editedOfficer) {
      try {
        let result;
        if (editedOfficer.id) {
          // Update existing
          result = await officersService.update(editedOfficer.id, editedOfficer);
        } else {
          // Create new
          result = await officersService.create(editedOfficer);
        }
        toast.toast({
          title: 'Success',
          description: editedOfficer.id ? 'Officer details updated' : 'Officer added successfully',
          variant: 'default'
        });
        setIsModalOpen(false);
        setEditedOfficer(null);
        // Refresh officers list
        await fetchOfficers(1); // Refresh the list and go to first page
        setCurrentPage(1); // Ensure we're on the first page
      } catch (error) {
        toast.toast({
          title: 'Error',
          description: error?.response?.data?.message || 'Failed to save officer',
          variant: 'destructive'
        });
      }
    } else {
      toast.toast({
        title: 'Error',
        description: 'No officer data to save',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Officers Management</h1>
          <p className="text-muted-foreground">Manage and monitor your law enforcement team</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={handleAddOfficer}>
          <Plus className="mr-2 h-4 w-4" />
          Add Officer
        </Button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search officers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-md border border-border shadow-xl">
              <DropdownMenuItem onClick={() => setStatusFilter('All')}>All Officers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Active')}>Active</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('On Leave')}>On Leave</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('In Training')}>In Training</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('Suspended')}>Suspended</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Department</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-md border border-border shadow-xl">
              <DropdownMenuItem onClick={() => setDepartmentFilter('All')}>All Departments</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDepartmentFilter('Patrol')}>Patrol</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDepartmentFilter('Traffic')}>Traffic</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDepartmentFilter('Investigation')}>Investigation</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDepartmentFilter('Community')}>Community</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Showing filtered officers count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredOfficers.length} of {totalOfficers}
        {statusFilter !== 'All' && ` | Status: ${statusFilter}`}
        {departmentFilter !== 'All' && ` | Department: ${departmentFilter}`}
      </p>

      {/* Officer List */}
      <div className="space-y-4">
        {filteredOfficers.map((officer) => (
          <div
            key={officer.id}
            className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-muted"
            onClick={() => setSelectedOfficer(officer.id)}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={officer.avatar} />
              <AvatarFallback>{officer.name.split(' ')[1]?.[0] || officer.name[0] || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{officer.name}</h3>
              <p className="text-sm text-muted-foreground">{officer.rank} • {officer.department}</p>
              <StatusBadge status={officer.status} />
            </div>
            <div className="ml-auto">
              <Button onClick={() => handleEditOfficer(officer)} variant="outline" className="mr-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              {officer.status === 'SUSPENDED' ? (
                <Button onClick={async () => {
                  try {
                    const updatedOfficer = { ...officer, status: 'ACTIVE' };
                    await officersService.update(officer.id, updatedOfficer);
                    setOfficers(officers.map(o => o.id === officer.id ? { ...o, status: 'ACTIVE' } : o));
                    toast.toast({
                      title: 'Success',
                      description: 'Officer reactivated successfully',
                      variant: 'default'
                    });
                  } catch (error) {
                    toast.toast({
                      title: 'Error',
                      description: error?.response?.data?.message || 'Failed to reactivate officer',
                      variant: 'destructive'
                    });
                  }
                }} variant="default" className="mr-2">
                  Activate
                </Button>
              ) : null}
              <Button onClick={() => {
                setConfirmDeleteOfficerId(officer.id);
                setIsDeleteDialogOpen(true);
              }} variant="destructive">
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-4 mt-4">
        <Button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          disabled={currentPage === totalPages || isLastPage || officers.length === 0}
          onClick={(e) => {
            e.preventDefault();
            if (currentPage < totalPages && officers.length > 0 && !isLastPage) {
              setCurrentPage(currentPage + 1);
            }
          }}
        >
          Next
          <ChevronRight />
        </Button>
      </div>

      {/* Officer Details */}
      {selectedOfficer && (
        <Card className="animate-in fade-in">
          <CardHeader>
            <CardTitle>Officer Details</CardTitle>
            <CardDescription>Complete information about the selected officer</CardDescription>
          </CardHeader>
          <CardContent>
            {officers.filter(o => o.id === selectedOfficer).map(officer => (
              <div key={officer.id} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={officer.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl">
                        {officer.name.split(' ')[1]?.[0] || officer.name[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{officer.name}</h3>
                      <p className="text-sm text-muted-foreground">{officer.rank} • {officer.department}</p>
                      <StatusBadge status={officer.status} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Badge Number</p>
                      <p className="font-medium">{officer.badge}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">District</p>
                      <p className="font-medium">{officer.district}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Join Date</p>
                      <p className="font-medium">{officer.joinDate}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Years of Service</p>
                      <p className="font-medium">
                        {officer.rawJoinDate
                          ? new Date().getFullYear() - new Date(officer.rawJoinDate).getFullYear()
                          : 'N/A'} years
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{officer.email}</p>
                  <p className="text-sm font-medium text-muted-foreground">Contact</p>
                  <p>{officer.contactNumber}</p>
                  <div className="mt-6">
                    <h4 className="font-semibold">Performance</h4>
                    <p>Cases Solved: {officer.performance?.casesSolved ?? 0}</p>
                    <p>Commendations: {officer.performance?.commendations ?? 0}</p>
                    <p>Incidents Reported: {officer.performance?.incidentsReported ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal for Editing Officer */}
      {isModalOpen && editedOfficer && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Officer Details</ModalHeader>
            <ModalBody>
              <OfficerForm
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaved={fetchOfficers}
                initialData={editedOfficer}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={() => setIsDeleteDialogOpen(false)}>
        <DialogOverlay />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete this officer? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteOfficer} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficersPage;
