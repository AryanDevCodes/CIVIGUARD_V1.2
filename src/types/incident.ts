// export type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
// export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// export interface Coordinates {
//   lat: number;
//   lng: number;
// }

// export interface IncidentLocation {
//   address: string;
//   coordinates: Coordinates;
// }

// export interface IncidentTeam {
//   id: number;
//   title: string;
//   description: string;
//   location: IncidentLocation;
//   status: IncidentStatus;
//   priority: IncidentPriority;
//   incidentType: string;
//   reportedBy: number; // User ID
//   assignedTo: number[]; // Officer IDs
//   images: string[];
//   reportDate: string;
//   resolutionDate?: string;
//   resolutionNotes?: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface OfficerSummary {
//   id: number;
//   name: string;
//   email: string;
//   phone?: string;
//   avatar?: string;
//   badgeNumber?: string;
//   rank?: string;
//   department?: string;
//   status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
// }

// export interface TeamMember extends OfficerSummary {
//   role: 'OFFICER' | 'ADMIN' | 'SUPERVISOR';
//   incidentId: number;
//   incidentTitle: string;
//   joinDate: string;
//   lastActive?: string;
// }

// // For API responses
// export interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   timestamp: string;
// }

// // For creating/updating incidents
// export interface IncidentRequest {
//   title: string;
//   description: string;
//   location: IncidentLocation;
//   incidentType: string;
//   priority?: IncidentPriority;
//   assignedTo?: number[];
//   images?: string[];
// }
