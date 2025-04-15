import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  whatsappNumber: { type: String },
  role: { 
    type: String, 
    enum: ['user'], 
    default: 'user' },

})

export const UserModel = mongoose.model("user", userSchema)