
/**
 * User Model Schema
 * 
 * This file defines the schema for the User model.
 * It's not actively used yet and is here as preparation for future MongoDB integration.
 */

/*
// Uncomment and install dependencies when ready to implement:

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'officer', 'admin'], 
    default: 'citizen' 
  },
  profileImage: { type: String },
  phoneNumber: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'USA' }
  },
  emergencyContacts: [{
    name: { type: String },
    relationship: { type: String },
    phoneNumber: { type: String }
  }],
  notifications: [{
    message: { type: String },
    type: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { 
  timestamps: true 
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
*/

// For now, export a placeholder model to indicate future implementation
export const UserModel = {
  modelName: 'User',
  schema: {
    name: 'String',
    email: 'String',
    passwordHash: 'String',
    role: 'String',
    profileImage: 'String',
    phoneNumber: 'String',
    address: {
      street: 'String',
      city: 'String',
      state: 'String',
      zipCode: 'String',
      country: 'String'
    },
    emergencyContacts: [{
      name: 'String',
      relationship: 'String',
      phoneNumber: 'String'
    }],
    notifications: [{
      message: 'String',
      type: 'String',
      isRead: 'Boolean',
      createdAt: 'Date'
    }],
    isActive: 'Boolean',
    lastLogin: 'Date'
  }
};
