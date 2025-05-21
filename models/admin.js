import mongoose from "mongoose";
import { UserModel } from './baseuser.js';

const adminSchema = new mongoose.Schema({
  adminLevel: { 
    type: String, 
    enum: ['junior', 'super'],
    default: 'junior'
  },
  
});

// Create admin discriminator
export const AdminModel = UserModel.discriminator('admin', adminSchema);
