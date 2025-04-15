import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  role: { 
    type: String, 
    enum: ['vendor'], 
    default: 'vendor' },

})

export const VendorModel = mongoose.model("vendor", vendorSchema)