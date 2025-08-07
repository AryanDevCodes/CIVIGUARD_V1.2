
# CiviGuard MongoDB Integration Guide

This document provides instructions and best practices for fully integrating MongoDB with the CiviGuard application. It serves as a reference for completing the implementation of MongoDB database connections that have been prepared throughout the codebase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setting Up MongoDB](#setting-up-mongodb)
3. [Connection Configuration](#connection-configuration)
4. [Implementing API Routes](#implementing-api-routes)
5. [Working with Models](#working-with-models)
6. [Using the Hooks and Services](#using-the-hooks-and-services)
7. [Authentication Integration](#authentication-integration)
8. [Testing the Integration](#testing-the-integration)

## Prerequisites

Before beginning the MongoDB integration, ensure you have:

- A MongoDB Atlas account or a local MongoDB server
- Node.js and npm/yarn installed
- Basic knowledge of MongoDB operations
- Access to the CiviGuard codebase

## Setting Up MongoDB

1. Create a MongoDB database named `civiguard`
2. Set up the following collections:
   - `users` - for user accounts
   - `incidents` - for reported incidents
   - `reports` - for officer reports
   - `alerts` - for safety alerts

## Connection Configuration

1. Create a `.env` file in the root directory (if not already present)
2. Add your MongoDB connection string:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/civiguard?retryWrites=true&w=majority
```

3. Uncomment the MongoDB connection code in `src/lib/mongodb.ts`

## Implementing API Routes

Create API routes for each entity in your system:

### Example: Incidents API

```typescript
// src/api/incidents.ts

import { Router } from 'express';
import { connectToMongoDB } from '../lib/mongodb';
import { ObjectId } from 'mongodb';

const router = Router();

// GET all incidents
router.get('/', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const incidents = await db.collection('incidents').find({}).toArray();
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
});

// GET incident by ID
router.get('/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const incident = await db.collection('incidents').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve incident' });
  }
});

// POST new incident
router.post('/', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const result = await db.collection('incidents').insertOne({
      ...req.body,
      createdAt: new Date()
    });
    
    res.status(201).json({ id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// PUT update incident
router.put('/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const result = await db.collection('incidents').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: {
          ...req.body,
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

// DELETE incident
router.delete('/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const result = await db.collection('incidents').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete incident' });
  }
});

export default router;
```

## Working with Models

1. Update all the model files in `src/models` by uncommenting the Mongoose schema definitions
2. Ensure all model fields match the expected data structure in your components

## Using the Hooks and Services

1. Replace the mock data in components with real data fetching using the hooks:

```typescript
// Example usage in a component
import { useMongoCollection, useCreateDocument } from '@/hooks/useMongoData';

const MyComponent = () => {
  // Fetch incidents
  const { data: incidents, isLoading, error } = useMongoCollection('incidents');

  // Create incident mutation
  const { mutate: createIncident } = useCreateDocument('incidents');

  const handleSubmit = (formData) => {
    createIncident(formData, {
      onSuccess: () => {
        toast.success('Incident reported successfully');
      },
      onError: (error) => {
        toast.error('Failed to report incident');
      }
    });
  };

  return (
    // Component JSX
  );
};
```

2. Update the services in `src/services/mongoService.ts` to use real API calls

## Authentication Integration

1. Update the `AuthContext.tsx` to use MongoDB for user authentication:

```typescript
// Example authentication with MongoDB
const login = async (email: string, password: string) => {
  setIsLoading(true);
  
  try {
    const response = await axios.post('/api/auth/login', { email, password });
    const userData = response.data;
    
    if (userData) {
      setUser(userData);
      localStorage.setItem('civiguard-user', JSON.stringify(userData));
    } else {
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Failed to authenticate');
  } finally {
    setIsLoading(false);
  }
};
```

## Testing the Integration

1. Create sample data for each collection
2. Test CRUD operations for all entities
3. Verify authentication flows
4. Test all components with real data

## Best Practices

- Use the appropriate indexes on your MongoDB collections
- Implement proper error handling for all database operations
- Use pagination for large datasets
- Secure sensitive routes with authentication middleware
- Add validation for all input data
- Consider using caching for frequently accessed data

By following this guide, you can successfully integrate MongoDB with the CiviGuard application and replace all mock data with real, persistent data from your database.
