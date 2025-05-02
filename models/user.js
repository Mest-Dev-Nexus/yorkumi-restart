import mongoose from "mongoose";
import normalizeMongoose from 'normalize-mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true },
  image: { type: String },
  lastname: { type: String }, // Added lastname field
  whatsappnumber: { type: String }, // Fixed field name to match registration
  role: { 
    type: String, 
    enum: ['user'], 
    default: 'user' 
  },
  cart: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart'
  }
}, {timestamps: true})

userSchema.plugin(normalizeMongoose);

export const UserModel = mongoose.model("user", userSchema)