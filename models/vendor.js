import mongoose from "mongoose";
import normalizeMongoose from 'normalize-mongoose';

const vendorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  role: { 
    type: String, 
    enum: ['vendor'], 
    default: 'vendor' },

},{timestamps:true});

vendorSchema.plugin(normalizeMongoose);

export const VendorModel = mongoose.model("vendor", vendorSchema)