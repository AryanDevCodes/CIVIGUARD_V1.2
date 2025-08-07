import { ReactNode } from "react";

export type OfficerStatus = 'ON_DUTY' | 'OFF_DUTY' | 'ON_BREAK' | 'IN_EMERGENCY';
export type IncidentStatus = 'REPORTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Location {
  // Support both lat/lng and latitude/longitude formats
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  
  // Additional location metadata
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  district?: string;
  postalCode?: string;
  lastUpdated?: string;
  
  // Allow any other properties
  [key: string]: any;
}

export interface PatrolVehicle {
  id: string;
  vehicleNumber: string;
  type: string;
  model: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'ASSIGNED' | 'OUT_OF_SERVICE';
  location: Location;
  lastLocationUpdate?: string;
  assignedOfficerId?: string;
  assignedOfficer?: {
    id: string;
    name: string;
    badgeNumber: string;
    status: OfficerStatus;
    location: Location;
  };
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  mileage?: number;
  fuelLevel?: number;
  fuelEfficiency?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  // Additional fields from API
  createdAt?: string;
  updatedAt?: string;
  // Add any other fields that might be present in the API response
  [key: string]: any; // Allow for additional properties
}

export interface OfficerPerformance {
  casesSolved: number;
  commendations: number;
  incidentsReported: number;
  performanceRating: string;
  lastPromotionDate: string;
  awardsReceived: number;
  disciplinaryActions: number;
  trainingHoursCompleted: number;
  communityEngagementScore: number;
  teamLeadershipScore: number;
  performanceScore: number;
}

export interface Officer {
  currentLocation: any;
  lastUpdated: any;
  latitude: any;
  longitude: any;
  id: string;
  name: string;
  badgeNumber: string;
  status: OfficerStatus;
  rank?: string;
  department?: string;
  district?: string;
  joinDate?: string;
  dateOfBirth?: string;
  avatar?: string | null;
  contactNumber?: string;
  email?: string;
  address?: string;
  emergencyContact?: string;
  designation?: string;
  specialization?: string;
  weaponNumber?: string;
  bloodGroup?: string;
  currentPosting?: string;
  previousPostings?: string[];
  performance?: OfficerPerformance;
  location?: Location;
  currentPatrolRoute?: PatrolRoute;
  assignedVehicles?: PatrolVehicle[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Type for assigned officers that can be either a string or an Officer object
export type AssignedOfficer = string | {
  id?: string;
  name?: string;
  badgeNumber?: string;
  rank?: string;
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
  };
  [key: string]: any;
};

export interface Incident {
  latitude: any;
  longitude: any;
  id: string;
  title: string;
  status: IncidentStatus;
  priority: Priority;
  location: Location;
  reportedAt: string;
  assignedOfficers: AssignedOfficer[];
  type: string;
  description?: string;
}

export interface PatrolRoute {
  coordinates: any;
  id: string;
  name: string;
  waypoints: Array<{ lat: number; lng: number }>;
  assignedOfficer?: string;
  patrolVehicle?: {
    id: string;
    vehicleNumber: string;
    type: string;
  };
  status: 'ACTIVE' | 'COMPLETED' | 'PENDING';
}
