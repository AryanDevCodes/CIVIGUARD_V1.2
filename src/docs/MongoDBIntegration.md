
# MongoDB Integration Guide for CIVIGUARD

This guide provides instructions for implementing the MongoDB integration in the CIVIGUARD application.

## Prerequisites

1. MongoDB Atlas account or a local MongoDB instance
2. Node.js environment with support for ES Modules
3. Required dependencies:
   - `mongoose` for MongoDB object modeling

## Setup Steps

### 1. Install Dependencies

```bash
npm install mongoose
```

### 2. Configure MongoDB Connection

The connection utility is already prepared in `src/lib/mongodb.ts`. To enable it:

1. Uncomment the code in `src/lib/mongodb.ts`
2. Set up your MongoDB connection string as an environment variable:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

For local development:
```
MONGODB_URI=mongodb://localhost:27017/civiguard
```

### 3. Enable Models

Models are already prepared in the `src/models` directory. To use them:

1. Uncomment the code in the model files (e.g., `src/models/Officer.ts`)
2. Additional models will need to be created for other entities (Users, Incidents, etc.)

### 4. Use Data Hooks

The application includes pre-built hooks in `src/hooks/useMongoData.ts` for interacting with MongoDB:

- `useMongoCollection`: Fetches data from a MongoDB collection
- `useMongoDocument`: Fetches a single document by ID
- `useCreateDocument`: Creates a new document
- `useUpdateDocument`: Updates an existing document
- `useDeleteDocument`: Deletes a document

### 5. API Integration

To use MongoDB with API endpoints:

1. Create API routes in the appropriate structure for your backend
2. Use the MongoDB connection and models to handle data operations
3. Implement proper error handling and response formatting

## Data Models

### Officer Model

```typescript
const OfficerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  badge: { type: String, required: true, unique: true },
  rank: { type: String, required: true },
  department: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'on-leave', 'training', 'suspended'], 
    default: 'active' 
  },
  district: { type: String, required: true },
  joinDate: { type: Date, required: true },
  avatar: { type: String, default: '' },
  contactNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
}, { 
  timestamps: true 
});
```

### Incident Model

```typescript
const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'resolved'], 
    default: 'active' 
  },
  location: { type: String, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportedAt: { type: Date, default: Date.now },
  assignedOfficers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Officer' }],
  images: [{ type: String }],
  notes: [{ 
    content: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }],
}, { 
  timestamps: true 
});
```

### User Model

```typescript
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'officer', 'admin'], 
    default: 'citizen' 
  },
  profile: {
    avatar: { type: String },
    phone: { type: String },
    address: { type: String },
    emergencyContact: { type: String },
    bio: { type: String }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      app: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    alerts: {
      emergency: { type: Boolean, default: true },
      warning: { type: Boolean, default: true },
      community: { type: Boolean, default: true }
    },
    privacy: {
      publicProfile: { type: Boolean, default: true },
      locationSharing: { type: Boolean, default: true },
      dataAnalytics: { type: Boolean, default: true }
    }
  }
}, { 
  timestamps: true 
});
```

### Case Model

```typescript
const CaseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['active', 'pending', 'resolved'], 
    default: 'active' 
  },
  priority: { 
    type: String, 
    enum: ['high', 'medium', 'low'], 
    default: 'medium' 
  },
  dateOpened: { type: Date, default: Date.now },
  dateClosed: { type: Date },
  leadOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer', required: true },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Officer' }],
  relatedIncidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Incident' }],
  progress: { type: Number, default: 0 },
  updates: [{
    content: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    addedAt: { type: Date, default: Date.now }
  }],
  files: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  tasks: [{
    title: { type: String },
    description: { type: String },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Officer' },
    dueDate: { type: Date },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date }
  }],
  nextAction: { type: String }
}, { 
  timestamps: true 
});
```

## Implementation Examples

### Fetching Officers

```tsx
import { useMongoCollection } from '@/hooks/useMongoData';

const OfficersPage = () => {
  const { data: officers, isLoading, error } = useMongoCollection('officers');

  if (isLoading) return <div>Loading officers...</div>;
  if (error) return <div>Error loading officers</div>;

  return (
    <div>
      <h1>Officers</h1>
      <ul>
        {officers.map(officer => (
          <li key={officer._id}>{officer.name}</li>
        ))}
      </ul>
    </div>
  );
};
```

### Creating an Incident Report

```tsx
import { useCreateDocument } from '@/hooks/useMongoData';
import { useAuth } from '@/context/AuthContext';

const ReportIncident = () => {
  const { user } = useAuth();
  const { mutate: createIncident, isLoading } = useCreateDocument('incidents');
  
  const handleSubmit = async (formData) => {
    createIncident({
      title: formData.title,
      description: formData.description,
      type: formData.incidentType,
      location: formData.location,
      reportedBy: user.id,
      reportedAt: new Date(),
    }, {
      onSuccess: () => {
        toast.success("Incident reported successfully");
      },
      onError: (error) => {
        toast.error("Failed to report incident");
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

## Best Practices

1. **Data Validation**: Always validate data before sending to MongoDB
2. **Error Handling**: Implement proper error handling for all database operations
3. **Indexing**: Create appropriate indexes for frequently queried fields
4. **Security**: Never expose MongoDB connection strings in client-side code
5. **Pagination**: Implement pagination for large data sets
6. **Caching**: Consider implementing caching for frequently accessed data
7. **Optimistic Updates**: Implement optimistic UI updates for better user experience

## Troubleshooting

- **Connection Issues**: Ensure the MongoDB URI is correctly formatted and credentials are valid
- **Performance Problems**: Check for missing indexes or overly complex queries
- **Data Inconsistencies**: Verify that schema validation is working correctly

---

For additional questions or issues with the MongoDB integration, please consult the MongoDB documentation or reach out to the CIVIGUARD development team.
