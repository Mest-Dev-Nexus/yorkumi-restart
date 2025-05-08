import mongoose from "mongoose";
import normalizeMongoose from 'normalize-mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  fullName: { type: String }, // Added lastname field
  whatsappnumber: { type: String }, // Fixed field name to match registration
  role: { 
    type: String, 
    enum: ['user'], 
    default: 'user' 
  },
  address: {
    address1: {
      type: String,
      required: true,
      trim: true
    },
    address2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      trim: true
    }
  },
}, {timestamps: true})

userSchema.plugin(normalizeMongoose);

export const UserModel = mongoose.model("user", userSchema)