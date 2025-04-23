import mongoose from "mongoose";
import normalizeMongoose from 'normalize-mongoose';

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

},{timestamps:true})

userSchema.plugin(normalizeMongoose);

export const UserModel = mongoose.model("user", userSchema)