/**
 * Data mapping utilities for converting between backend and frontend data formats
 */

import { AlertType } from '@/types';

// Maps backend incident data to frontend data structure

interface BackendAlert {
  id: number;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
  active: boolean;
  location?: {
    address?: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdBy?: {
    id: number;
    name: string;
    email?: string;
    role: string;
  };
  type?: string;
  status?: string;
}

// Maps backend severity to frontend severity
export const mapSeverityFromBackend = (priority: string): 'low' | 'medium' | 'high' => {
  if (!priority) return 'low';
  switch (priority.toLowerCase()) {
    case 'high':
    case 'urgent':
    case 'critical':
      return 'high';
    case 'medium':
    case 'normal':
      return 'medium';
    case 'low':
    case 'info':
      return 'low';
    default:
      return 'low';
  }
};

// Maps frontend severity to backend priority
export const mapSeverityToBackend = (severity: string): string => {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'HIGH';
    case 'medium':
      return 'MEDIUM';
    case 'low':
    default:
      return 'LOW';
  }
};

// Maps backend alert data to frontend format
export const mapAlertFromBackend = (backendAlert: any): AlertType | null => {
  if (!backendAlert) return null;
  
  if (typeof window !== 'undefined') {
    console.debug('[mapAlertFromBackend] Raw backendAlert:', backendAlert);
  }

  // Construct area from location fields
  const locationParts = [
    backendAlert?.location?.address,
    backendAlert?.location?.city,
    backendAlert?.location?.district,
  ].filter(Boolean);
  
  const area = locationParts.length > 0 ? locationParts.join(', ') : 'All Areas';
  
  // Check if the alert has been read by the current user
  const isRead = Array.isArray(backendAlert.readByUsers) && 
                backendAlert.readByUsers.length > 0;

  // Map severity from backend to frontend format
  const severity = mapSeverityFromBackend(backendAlert?.severity || 'INFO');
  
  // Create the alert object with all required fields
  const mappedAlert: AlertType = {
    id: String(backendAlert?.id || 'unknown'),
    title: backendAlert?.title || 'Untitled Alert',
    description: backendAlert?.description || 'No description available',
    message: backendAlert?.description || 'No description available', // For backward compatibility
    severity,
    status: backendAlert?.active ? 'active' : 'inactive',
    createdAt: backendAlert?.createdAt || new Date().toISOString(),
    area,
    isActive: backendAlert?.active ?? true,
    type: backendAlert?.type || 'General',
    isRead,
    // Include location data for maps
    latitude: backendAlert?.location?.latitude,
    longitude: backendAlert?.location?.longitude,
    address: backendAlert?.location?.address || '',
    city: backendAlert?.location?.city || '',
    district: backendAlert?.location?.district || '',
    state: backendAlert?.location?.state || '',
    postalCode: backendAlert?.location?.postalCode || '',
    country: backendAlert?.location?.country || 'India',
    // Include createdBy information
    createdBy: backendAlert?.createdBy?.name || 'System',
  };
  
  if (typeof window !== 'undefined') {
    console.debug('[mapAlertFromBackend] Mapped Alert:', mappedAlert);
  }

  return mappedAlert;
};


export const mapIncidentFromBackend = (backendIncident: any) => {
  if (!backendIncident) return null;

  const locationObj = backendIncident.location || {};

  console.debug('[mapIncidentFromBackend] Mapping:', backendIncident);

  return {
    id: backendIncident.id?.toString() || '',
    type: backendIncident.incidentType || backendIncident.type || 'Unknown',
    title: backendIncident.title || backendIncident.description?.substring(0, 50) || 'Untitled Incident',
    description: backendIncident.description || '',
    location: typeof locationObj.address === 'string' && locationObj.address.trim() !== ''
      ? locationObj.address
      : `${locationObj.latitude ?? ''}, ${locationObj.longitude ?? ''}`,
    latitude: typeof locationObj.latitude === 'number' ? locationObj.latitude : Number(locationObj.latitude) || 0,
    longitude: typeof locationObj.longitude === 'number' ? locationObj.longitude : Number(locationObj.longitude) || 0,
    severity: mapSeverityFromBackend(backendIncident.priority),
    priority: mapSeverityFromBackend(backendIncident.priority),
    status: mapStatusFromBackend(backendIncident.status),
    reportedAt: backendIncident.reportDate || backendIncident.createdAt || new Date().toISOString(),
    createdAt: backendIncident.createdAt || new Date().toISOString(),
    updatedAt: backendIncident.updatedAt || new Date().toISOString(),
    resolutionDate: backendIncident.resolutionDate || null,
    resolutionNotes: backendIncident.resolutionNotes || null,
    reportedBy: backendIncident.reportedBy?.name || 'Anonymous',
    reportedById: backendIncident.reportedBy?.id?.toString() || backendIncident.reportedById || '',
    reporterContactInfo: backendIncident.reporterContactInfo || '',
    anonymous: backendIncident.anonymous ?? true,
    assignedOfficers: backendIncident.assignedOfficers?.map((officer: any) => officer.name) || [],
    images: backendIncident.images || [],
    tags: backendIncident.tags || [],
    updates: backendIncident.updates || [],
  };
};

// // Maps backend priority to frontend severity
// export const mapSeverityFromBackend = (priority: string): 'low' | 'medium' | 'high' => {
//   if (!priority) return 'low';
  
//   switch(priority?.toLowerCase()) {
//     case 'high':
//     case 'urgent':
//     case 'critical':
//       return 'high';
//     case 'medium':
//     case 'normal':
//       return 'medium';
//     case 'low':
//     default:
//       return 'low';
//   }
// };

// Maps backend report data to frontend structure for table display
// (No change needed for reports filtering, only incidents)
export const mapReportFromBackend = (report: any) => {
  return {
    id: report.id?.toString() ?? '',
    title: report.title ?? 'Untitled',
    type: report.type ?? 'Unknown',
    createdAt: report.createdAt
      ? (typeof report.createdAt === 'string'
          ? new Date(report.createdAt).toLocaleString()
          : (report.createdAt.toLocaleString?.() ?? String(report.createdAt)))
      : 'N/A',
    status: report.status ?? 'Unknown',
    createdBy: report.createdBy?.name ?? report.createdBy?.id ?? 'Unknown',
  };
};

// Maps backend status to frontend status
export const mapStatusFromBackend = (status: string): 'reported' | 'investigating' | 'resolved' => {
  if (!status) return 'reported';
  
  switch(status?.toLowerCase()) {
    case 'resolved':
    case 'closed':
    case 'completed':
      return 'resolved';
    case 'investigating':
    case 'in_progress':
    case 'in progress':
    case 'active':
      return 'investigating';
    case 'reported':
    case 'new':
    case 'pending':
    default:
      return 'reported';
  }
};

// Maps frontend status to backend status
export const mapStatusToBackend = (status: string): string => {
  switch(status?.toLowerCase()) {
    case 'resolved':
      return 'RESOLVED';
    case 'investigating':
      return 'IN_PROGRESS';
    case 'reported':
    default:
      return 'REPORTED';
  }
};

// Maps frontend severity to backend priority
// export const mapSeverityToBackend = (severity: string): string => {
//   switch(severity?.toLowerCase()) {
//     case 'high':
//       return 'HIGH';
//     case 'medium':
//       return 'MEDIUM';
//     case 'low':
//     default:
//       return 'LOW';
//   }
// };

// Maps backend officer data to frontend format
export const mapOfficerFromBackend = (backendOfficer: any) => {
  if (!backendOfficer) return null;
  
  return {
    id: backendOfficer.id?.toString() || '',
    name: backendOfficer.name || '',
    badgeNumber: backendOfficer.badgeNumber || '',
    rank: backendOfficer.rank || '',
    department: backendOfficer.department || '',
    status: backendOfficer.status || 'ACTIVE',
    district: backendOfficer.district || '',
    joinDate: backendOfficer.joinDate || '',
    avatar: backendOfficer.avatar || '',
    contactNumber: backendOfficer.contactNumber || backendOfficer.phoneNumber || '',
    email: backendOfficer.email || '',
    address: backendOfficer.address || '',
    phoneNumber: backendOfficer.phoneNumber || backendOfficer.contactNumber || '',
    emergencyContact: backendOfficer.emergencyContact || '',
    // Add any other fields needed
  };
};
export const mapOfficerTableFromBackend = (officer: any) => {
  // Normalize status to match StatusBadge expectations
  const normalizeStatus = (status: string | undefined) => {
    if (!status) return 'Unknown';
    const statusMap: { [key: string]: string } = {
      ACTIVE: 'active',
      'ON-LEAVE': 'on-leave',
      TRAINING: 'training',
      SUSPENDED: 'suspended',
    };
    return statusMap[status.toUpperCase()] || status.toLowerCase();
  };

  // Validate and format joinDate
  const formatJoinDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return {
    id: String(officer.id ?? ''),
    name: officer.name || 'Unknown',
    badge: officer.badgeNumber || '',
    rank: officer.rank || '',
    department: officer.department || '',
    status: normalizeStatus(officer.status),
    joinDate: formatJoinDate(officer.joinDate),
    contactNumber: officer.contactNumber || officer.phoneNumber || '',
    email: officer.email || officer.user?.email || '',
    avatar: officer.avatar || '/default-avatar.png',
    district: officer.district || 'N/A',
    // Store raw joinDate for calculations
    rawJoinDate: officer.joinDate && !isNaN(new Date(officer.joinDate).getTime()) ? officer.joinDate : null,
  };
};


// Maps backend user data to frontend format
export const mapUserFromBackend = (backendUser: any) => {
  if (!backendUser) return null;
  
  return {
    id: backendUser.id?.toString() || '',
    name: backendUser.name || '',
    email: backendUser.email || '',
    role: backendUser.role?.toLowerCase() || 'citizen',
    profileImage: backendUser.profileImage || null,
    phoneNumber: backendUser.phoneNumber || '',
    address: backendUser.address || null,
    isActive: backendUser.isActive ?? true,
    lastLogin: backendUser.lastLogin || null,
  };
};

// Maps backend citizen data to frontend format
export const mapCitizenFromBackend = (backendCitizen: any) => {
  if (!backendCitizen) return null;
  return {
    id: backendCitizen.id?.toString() || '',
    name: backendCitizen.name || '',
    email: backendCitizen.email || '',
    status: backendCitizen.status || 'active',
    joinedDate: backendCitizen.joinedDate || backendCitizen.createdAt || '',
    verificationStatus: backendCitizen.verificationStatus || 'unverified',
    recentActivity: backendCitizen.recentActivity || '',
    avatar: backendCitizen.avatar || backendCitizen.profileImage || '',
    address: backendCitizen.address || '',
    phoneNumber: backendCitizen.phoneNumber || '',
    // Add any other fields needed
  };
};

// Maps backend alert data to frontend format
// export const mapAlertFromBackend = (backendAlert: any) => {
//   if (!backendAlert) return null;
//   // Debugging: Log the raw backend alert object
//   // Remove or comment out in production!
//   if (typeof window !== 'undefined') {
//     // Only log in browser
//     // eslint-disable-next-line no-console
//     console.debug('[mapAlertFromBackend] Raw backendAlert:', backendAlert);
//   }
//   return {
//     id: backendAlert.id?.toString() || '',
//     title: backendAlert.title || '',
//     message: backendAlert.description || '',
//     severity: mapSeverityFromBackend(backendAlert.severity || 'MEDIUM'),
//     createdAt: backendAlert.createdAt || new Date().toISOString(),
//     type: backendAlert.type || 'GENERAL',
//     area: backendAlert.location?.district || 'All Areas',
//     isActive: backendAlert.active ?? backendAlert.isActive ?? true,
//     // Flatten location
//     latitude: backendAlert.location?.latitude ?? null,
//     longitude: backendAlert.location?.longitude ?? null,
//     address: backendAlert.location?.address ?? '',
//     city: backendAlert.location?.city ?? '',
//     state: backendAlert.location?.state ?? '',
//     postalCode: backendAlert.location?.postalCode ?? '',
//     country: backendAlert.location?.country ?? 'Unknown',
//     // Flatten createdBy (prefer name, fallback to email or 'Unknown')
//     createdBy: backendAlert.createdBy?.name || backendAlert.createdBy?.email || 'Unknown',
//     // Provide a default status for filtering
//     status: backendAlert.status || (backendAlert.active ? 'active' : 'inactive'),
//     // Add any other fields needed
//   };
// };

// Maps frontend alert data to backend format
export const mapAlertToBackend = (frontendAlert: any) => {
  if (!frontendAlert) return null;
  const lat = Number(frontendAlert.latitude);
  const lng = Number(frontendAlert.longitude);
  console.log('[ALERT] latitude:', frontendAlert.latitude, '->', lat, typeof lat);
  console.log('[ALERT] longitude:', frontendAlert.longitude, '->', lng, typeof lng);
  return {
    title: frontendAlert.title || '',
    description: frontendAlert.message || '',
    severity: (frontendAlert.severity || 'DANGER').toUpperCase(),
    location: {
      latitude: isNaN(lat) ? null : lat,
      longitude: isNaN(lng) ? null : lng,
      address: frontendAlert.area || '',
      district: frontendAlert.area || '',
      city: frontendAlert.city || '',
      state: frontendAlert.state || '',
      postalCode: frontendAlert.postalCode || '',
      country: frontendAlert.country || 'India',
    },
  };
};
