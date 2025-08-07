
# CiviGuard Project Documentation

## Overview

CiviGuard is a comprehensive public safety management platform designed to facilitate coordination between citizens, law enforcement officers, and administrators. The platform enables incident reporting, officer management, resource allocation, and public safety monitoring.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **State Management**: React Context API, TanStack Query
- **Routing**: React Router
- **Charts/Visualization**: Recharts
- **Icons**: Lucide React

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── charts/         # Chart components
│   ├── dashboards/     # Dashboard components per user role
│   └── ui/             # Shadcn UI components
├── context/            # React contexts (Auth)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and helpers
├── pages/              # Top-level page components
└── types/              # TypeScript type definitions
```

## User Roles

1. **Citizen**: Regular users who can report incidents, view safety alerts, and access community resources.
2. **Officer**: Law enforcement personnel who respond to incidents, update case status, and patrol.
3. **Admin**: System administrators who manage officers, view analytics, and configure system settings.

## Main Features

- **Role-Based Dashboards**: Different interfaces for citizens, officers, and admins
- **Officer Management**: Comprehensive directory and management of law enforcement personnel
- **Incident Tracking**: Reporting and monitoring of public safety incidents
- **Real-Time Alerts**: Critical notifications for system users
- **Analytics**: Performance metrics and trend analysis
- **System Status Monitoring**: Health checks for all system components

## Authentication

The application uses a role-based authentication system managed by AuthContext. Users are redirected to appropriate dashboards based on their roles.

## Future MongoDB Integration Guide

### Prerequisites

1. Install MongoDB-related packages:
```
npm install mongodb mongoose
```

2. Create a MongoDB connection utility:

```typescript
// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civiguard';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
```

### Creating Models

Example Schema for Officers:

```typescript
// src/models/Officer.ts
import mongoose from 'mongoose';

const OfficerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  badge: { type: String, required: true, unique: true },
  rank: { type: String, required: true },
  department: { type: String, required: true },
  status: { type: String, enum: ['active', 'on-leave', 'training', 'suspended'], default: 'active' },
  district: { type: String, required: true },
  joinDate: { type: Date, required: true },
  avatar: { type: String, default: '' },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, { timestamps: true });

export default mongoose.models.Officer || mongoose.model('Officer', OfficerSchema);
```

### Integration with React Query

Example for fetching officers:

```typescript
// src/hooks/useOfficers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const fetchOfficers = async () => {
  const response = await fetch('/api/officers');
  if (!response.ok) throw new Error('Failed to fetch officers');
  return response.json();
};

export function useOfficers() {
  return useQuery({
    queryKey: ['officers'],
    queryFn: fetchOfficers,
  });
}

export function useAddOfficer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (officerData) => {
      const response = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officerData),
      });
      
      if (!response.ok) throw new Error('Failed to add officer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
    },
  });
}
```

## Styling Guidelines

- Use the utility classes defined in index.css for consistent styling
- Follow the color scheme defined in tailwind.config.ts
- Use the glass-effect class for modern card-like components
- Ensure responsive design using Tailwind's responsive modifiers

## Component Guidelines

- Keep components small and focused (under 300 lines)
- Use React Context for global state management
- Leverage React Query for data fetching and caching
- Implement proper loading and error states

## Performance Considerations

- Use React.memo() for components that render frequently
- Implement proper pagination for large data sets
- Lazy load components that aren't immediately visible
- Use code-splitting for larger feature sets
