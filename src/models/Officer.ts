export interface Officer {
  id: number;
  name: string;
  badgeNumber: string;
  rank: string;
  department: string;
  status: string;
  district: string;
  joinDate: string; // or Date if parsed
  avatar?: string;
  contactNumber: string;
  email: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}
