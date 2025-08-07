import React from 'react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Avatar, AvatarFallback, AvatarImage
} from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Search, UserPlus, MoreHorizontal, User, UserCheck, UserX, Mail, Loader2
} from 'lucide-react';
import DashboardLayout from "@/components/DashboardLayout";
import { apiService } from '@/services/apiService';
import { useStompSubscription } from '@/hooks/useStompSubscription';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';

// ---------------- Types ----------------
interface CitizenUser {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  verificationStatus: 'VERIFIED' | 'UNVERIFIED';
  recentActivity: string;
  avatar: string;
}

// ---------------- Service ----------------
const citizensService = {
  getAll: async (params: any = {}) => {
    // Map frontend pagination params to backend params
    const backendParams = {
      ...params,
      role: 'CITIZEN',
      page: params.page !== undefined ? params.page - 1 : 0, // Convert to 0-based index for Spring
      size: params.pageSize || 10,
    };
    
    // Remove undefined values
    Object.keys(backendParams).forEach(key => 
      backendParams[key] === undefined && delete backendParams[key]
    );
    
    return apiService.get('/users/admin', backendParams);
  },
  update: async (id: string, data: any) => {
    const response = await apiService.put(`/users/${id}`, data);
    return response.data; // Return the updated user data
  },
  create: (data: any) => apiService.post('/users', data),
  verifyCitizen: async (id: string) => {
    const response = await apiService.put(`/users/${id}`, { 
      verificationStatus: 'VERIFIED' 
    });
    return response.data;
  },
  unverifyCitizen: async (id: string) => {
    const response = await apiService.put(`/users/${id}`, { 
      verificationStatus: 'UNVERIFIED' 
    });
    return response.data;
  },
  activateUser: (id: string) => apiService.put(`/users/${id}/activate`, {}),
  deactivateUser: (id: string) => apiService.put(`/users/${id}/deactivate`, {})
};

// ---------------- Citizen Form ----------------
interface CitizenFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: CitizenUser | null;
}

const defaultCitizen = {
  name: '',
  email: '',
  status: 'active',
  joinedDate: '',
  verificationStatus: 'UNVERIFIED',
  recentActivity: '',
  avatar: '',
};

const CitizenForm: React.FC<CitizenFormProps> = ({ open, onClose, onSaved, initialData }) => {
  const [citizen, setCitizen] = React.useState({ ...defaultCitizen });

  React.useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setCitizen({ ...defaultCitizen, ...rest });
    } else {
      setCitizen({ ...defaultCitizen });
    }
  }, [initialData, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCitizen(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...citizen,
        verificationStatus: citizen.verificationStatus?.toUpperCase?.() || 'UNVERIFIED'
      };
      if (initialData?.id) {
        await citizensService.update(initialData.id, payload);
        toast.success('Citizen updated successfully');
      } else {
        await citizensService.create(payload);
        toast.success('Citizen created successfully');
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save citizen:', error);
      toast.error('Failed to save citizen');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? 'Edit Citizen' : 'Add Citizen'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input name="name" value={citizen.name} onChange={handleChange} placeholder="Name" />
          <Input name="email" value={citizen.email} onChange={handleChange} placeholder="Email" />
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={citizen.status}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Verification Status</label>
            <select
              name="verificationStatus"
              value={citizen.verificationStatus}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="VERIFIED">Verified</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {initialData?.id ? 'Update Citizen' : 'Create Citizen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------- Main Page ----------------
const CitizensPage: React.FC = () => {
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [bulkVerifying, setBulkVerifying] = React.useState<'VERIFIED' | 'UNVERIFIED' | null>(null);
  const [citizens, setCitizens] = React.useState<CitizenUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [editCitizen, setEditCitizen] = React.useState<CitizenUser | null>(null);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(0); // 0-based for backend
  const [pageSize, setPageSize] = React.useState(10);
  const [totalCitizens, setTotalCitizens] = React.useState(0);
  const [sortField, setSortField] = React.useState('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [updatingUsers, setUpdatingUsers] = React.useState<Record<string, boolean>>({});

  const fetchCitizens = async (pageToFetch = page, pageSizeToFetch = pageSize) => {
    setLoading(true);
    try {
      const params = {
        page: pageToFetch,
        pageSize: pageSizeToFetch,
        name: search || undefined,
        email: search || undefined,
        sort: `${sortField},${sortDirection}`,
      };
      
      const response = await citizensService.getAll(params);
      const content = response?.content || response?.data?.content || [];
      
      const arr = content.map((citizen: any) => ({
        ...citizen,
        id: citizen.id.toString(), // Ensure ID is string for consistency
        verificationStatus: (citizen.verificationStatus || 'UNVERIFIED').toUpperCase(),
        status: citizen.active ? 'active' : 'suspended',
        recentActivity: citizen.lastLogin 
          ? new Date(citizen.lastLogin).toLocaleString() 
          : 'No recent activity',
      }));
      
      setCitizens(arr);
      setTotalCitizens(response?.totalElements || response?.data?.totalElements || 0);
    } catch (error) {
      console.error('Error fetching citizens:', error);
      toast.error('Failed to fetch citizens');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCitizens(page, pageSize);
    // eslint-disable-next-line
  }, [page, pageSize, search]);

  const handleAddCitizen = () => {
    setEditCitizen(null);
    setShowModal(true);
  };

  const handleEditCitizen = (citizen: CitizenUser) => {
    setEditCitizen(citizen);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditCitizen(null);
  };

  // Server-side pagination and sorting
  const totalPages = Math.max(1, Math.ceil(totalCitizens / pageSize));
  const paginatedCitizens = citizens;
  
  // Handle sort change
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      setSortDirection(newDirection);
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when changing sort
    setPage(0);
  };

  // Real-time citizen updates (approve etc.)
  const handleCitizenUpdate = React.useCallback((body: any) => {
    setCitizens(prev => {
      if (!body.id) return prev;
      return prev.map(c => c.id === body.id ? { ...c, ...body } : c);
    });
  }, []);
  useStompSubscription({
    topic: '/topic/citizen-updates',
    onMessage: handleCitizenUpdate,
    debug: false
  });

  // Bulk selection
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(paginatedCitizens.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => checked 
      ? [...prev, id] 
      : prev.filter(x => x !== id)
    );
  };
  
  // Handle verification status change
  const handleVerificationChange = async (id: string, verify: boolean) => {
    try {
      setUpdatingUsers(prev => ({ ...prev, [id]: true }));
      
      if (verify) {
        await citizensService.verifyCitizen(id);
        toast.success('Citizen verified successfully');
      } else {
        await citizensService.unverifyCitizen(id);
        toast.success('Citizen unverified successfully');
      }
      
      // Refresh the list
      await fetchCitizens();
    } catch (error) {
      console.error('Error updating verification status:', error);
      toast.error(`Failed to ${verify ? 'verify' : 'unverify'} citizen`);
    } finally {
      setUpdatingUsers(prev => ({ ...prev, [id]: false }));
    }
  };
  
  // Handle status change (active/suspended)
  const handleStatusChange = async (id: string, activate: boolean) => {
    try {
      setUpdatingUsers(prev => ({ ...prev, [id]: true }));
      
      if (activate) {
        await citizensService.activateUser(id);
        toast.success('Citizen activated successfully');
      } else {
        await citizensService.deactivateUser(id);
        toast.success('Citizen deactivated successfully');
      }
      
      // Refresh the list
      await fetchCitizens();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(`Failed to ${activate ? 'activate' : 'deactivate'} citizen`);
    } finally {
      setUpdatingUsers(prev => ({ ...prev, [id]: false }));
    }
  };

  // Profile Drawer
  const [profileCitizen, setProfileCitizen] = React.useState<CitizenUser | null>(null);
  const handleOpenProfile = (citizen: CitizenUser) => setProfileCitizen(citizen);
  const handleCloseProfile = () => setProfileCitizen(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspended</Badge>;
      default:
        return null;
    }
  };

const getVerificationBadge = (status: string) => {
  if (status === 'VERIFIED') {
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        <UserCheck className="mr-1 h-3 w-3" /> Verified
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-gray-500 text-gray-500">
      <UserX className="mr-1 h-3 w-3" /> Unverified
    </Badge>
  );
};
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Citizens Management</h1>
            <p className="text-muted-foreground">Manage citizen accounts and registrations</p>
          </div>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <Button className="w-full md:w-auto" onClick={handleAddCitizen}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Citizen
            </Button>
            <Button
              variant="outline"
              disabled={selectedIds.length === 0 || !!bulkVerifying}
              onClick={async () => {
                setBulkVerifying('VERIFIED');
                try {
                  await Promise.all(selectedIds.map(id => citizensService.update(id, { verificationStatus: 'VERIFIED' })));
                  toast.success('Selected citizens verified!');
                  setSelectedIds([]);
                  fetchCitizens(page, pageSize);
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || 'Failed to verify selected citizens');
                } finally {
                  setBulkVerifying(null);
                }
              }}
            >
              {bulkVerifying === 'VERIFIED' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserCheck size={16} className="mr-2" />}
              Verify Selected
            </Button>
            <Button
              variant="outline"
              disabled={selectedIds.length === 0 || !!bulkVerifying}
              onClick={async () => {
                setBulkVerifying('UNVERIFIED');
                try {
                  await Promise.all(selectedIds.map(id => citizensService.update(id, { verificationStatus: 'UNVERIFIED' })));
                  toast.success('Selected citizens unverified!');
                  setSelectedIds([]);
                  fetchCitizens(page, pageSize);
                } catch (err: any) {
                  toast.error(err?.response?.data?.message || 'Failed to unverify selected citizens');
                } finally {
                  setBulkVerifying(null);
                }
              }}
            >
              {bulkVerifying === 'UNVERIFIED' ? <Loader2 size={16} className="mr-2 animate-spin" /> : <UserX size={16} className="mr-2" />}
              Unverify Selected
            </Button>
          </div>
          <CitizenForm
            open={showModal}
            onClose={handleModalClose}
            onSaved={fetchCitizens}
            initialData={editCitizen}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Registered Citizens</CardTitle>
                <CardDescription>Manage citizen accounts and access</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search citizens..."
                  className="pl-8 w-full md:w-[250px]"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-[auto,1fr,1fr,auto,auto,auto,auto] md:grid-cols-[auto,1fr,1fr,auto,auto,auto,auto,auto] gap-4 p-4 bg-accent/50 text-sm font-medium">
                <input type="checkbox" checked={paginatedCitizens.length > 0 && selectedIds.length === paginatedCitizens.length} onChange={e => handleSelectAll(e.target.checked)} />
                <div className="cursor-pointer" onClick={() => { setSortField('name'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  User {sortField === 'name' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </div>
                <div className="hidden md:block cursor-pointer" onClick={() => { setSortField('email'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Email {sortField === 'email' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </div>
                <div className="cursor-pointer" onClick={() => { setSortField('status'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Status {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </div>
                <div className="hidden md:block cursor-pointer" onClick={() => { setSortField('verificationStatus'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Verification {sortField === 'verificationStatus' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </div>
                <div className="cursor-pointer" onClick={() => { setSortField('recentActivity'); setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc'); }}>
                  Activity {sortField === 'recentActivity' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                </div>
                <div className="text-right">Actions</div>
              </div>

              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading citizens...</div>
              ) : paginatedCitizens.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No citizens found.</div>
              ) : paginatedCitizens.map((citizen) => (
                <div
                  key={citizen.id}
                  className="grid grid-cols-[auto,1fr,1fr,auto,auto,auto,auto] md:grid-cols-[auto,1fr,1fr,auto,auto,auto,auto,auto] gap-4 p-4 border-t items-center text-sm hover:bg-accent/30 cursor-pointer"
                  onClick={e => {
                    // Only open profile drawer if not clicking on a button or checkbox
                    if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                      handleOpenProfile(citizen);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(citizen.id)}
                    onChange={e => handleSelectOne(citizen.id, e.target.checked)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={citizen.avatar} alt={citizen.name} />
                      <AvatarFallback>
                        <User size={16} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{citizen.name}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{citizen.email}</div>
                    </div>
                  </div>
                  <div className="hidden md:block text-muted-foreground">{citizen.email}</div>
                  <div>{getStatusBadge(citizen.status)}</div>
                  <div className="hidden md:block">
                    {(() => { console.log('verificationStatus for', citizen.name, ':', citizen.verificationStatus); return null; })()}
                    {getVerificationBadge(citizen.verificationStatus)}
                  </div>
                  <div className="text-muted-foreground">{citizen.recentActivity}</div>
                  <div className="text-right" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-background/80 backdrop-blur-md border border-border shadow-xl">
                        <DropdownMenuItem onClick={() => handleEditCitizen(citizen)}>
                          <User size={16} className="mr-2" />
                          Edit Citizen
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail size={16} className="mr-2" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleVerificationChange(citizen.id, true)}
                          disabled={updatingUsers[citizen.id]}
                        >
                          {updatingUsers[citizen.id] ? (
                            <Loader2 size={16} className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserCheck size={16} className="mr-2" />
                          )}
                          Verify Citizen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleVerificationChange(citizen.id, false)}
                          disabled={updatingUsers[citizen.id]}
                        >
                          {updatingUsers[citizen.id] ? (
                            <Loader2 size={16} className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserX size={16} className="mr-2" />
                          )}
                          Unverify Citizen
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(citizen.id, citizen.status !== 'active')}
                          disabled={updatingUsers[citizen.id]}
                        >
                          {updatingUsers[citizen.id] ? (
                            <Loader2 size={16} className="mr-2 h-4 w-4 animate-spin" />
                          ) : citizen.status === 'active' ? (
                            <UserX size={16} className="mr-2" />
                          ) : (
                            <UserCheck size={16} className="mr-2" />
                          )}
                          {citizen.status === 'active' ? 'Deactivate' : 'Activate'} Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
          {/* Pagination controls */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
            <div className="flex gap-2 items-center mb-2 md:mb-0">
              <span className="text-xs">Rows per page:</span>
              <select
                className="border rounded px-2 py-1 text-xs"
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              >
                {[5, 10, 20, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs">
              Page {page + 1} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1 || totalPages === 0}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
          {/* Profile Drawer */}
          <Dialog open={!!profileCitizen} onOpenChange={handleCloseProfile}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Citizen Profile</DialogTitle>
              </DialogHeader>
              {profileCitizen && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileCitizen.avatar} alt={profileCitizen.name} />
                      <AvatarFallback>
                        <User size={32} />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-lg">{profileCitizen.name}</div>
                      <div className="text-muted-foreground text-sm">{profileCitizen.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      {getStatusBadge(profileCitizen.status)}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Verification</div>
                      {getVerificationBadge(profileCitizen.verificationStatus)}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Joined</div>
                      <div>{profileCitizen.joinedDate}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Recent Activity</div>
                      <div>{profileCitizen.recentActivity}</div>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
          {/* --- Fake verification section (optional, demo only) --- */}
          <Card>
            <CardHeader>
              <CardTitle>Verification Requests</CardTitle>
              <CardDescription>Citizens requesting identity verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "Michael Brown", email: "michael@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael" },
                  { name: "Sarah Wilson", email: "sarah@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" }
                ].map(user => (
                  <div key={user.email} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          <User size={20} />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Documents</Button>
                      <Button size="sm">Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  );
};

export default CitizensPage;