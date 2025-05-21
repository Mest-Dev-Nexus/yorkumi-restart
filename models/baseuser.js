// // File: models/index.js
// // This file serves as the entry point for all models

// export { UserModel, baseUserSchema } from './baseuser.js';
// export { RegularUserModel } from './regularUser.js';
// export { VendorModel } from './vendor.js';
// export { AdminModel } from './admin.js';

// File: models/baseUser.js
import mongoose from "mongoose";
import normalizeMongoose from 'normalize-mongoose';

// Create the base schema with common fields for all user types
const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

// Base user schema with common fields
export const baseUserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  // The role field will be used as the discriminator key
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, baseOptions);

// Apply the normalize plugin
baseUserSchema.plugin(normalizeMongoose);

// Create the base model
export const UserModel = mongoose.model('User', baseUserSchema);