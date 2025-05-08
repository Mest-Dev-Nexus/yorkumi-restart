import {expressjwt} from "express-jwt";
import { UserModel } from "../models/user.js";
import { VendorModel } from "../models/vendor.js";


export const isAuthenticated = expressjwt ({
  secret : process.env.JWT_SECRET_KEY,
  algorithms : ["HS256"],
});


export const isUserAuthorized = (role) => {
  return async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.auth.id);
      
      // Check if user exists
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has role property
      if (!user.role) {
        return res.status(403).json({ message: "User role not defined" });
      }
      
      // Check if user has required role
      if (role?.includes(user.role)) {
        next();
      } else {
        res.status(403).json({ message: "You are unauthorized!" });
      }
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
};
export const isVendorAuthorized = (role) => {
  return async (req, res, next) => {
    const user = await VendorModel.findById(req.auth.id);
    if (role?.includes (user.role)) {
      next();
    }else{
      res.status(403).json("You are unauthorized!")
    }
  }
};
export const normalizeAuth = (req, res, next) => {
  // If auth object exists but doesn't have id property
  if (req.auth && !req.auth.id) {
    // Check for common alternatives
    if (req.auth.sub) {
      req.auth.id = req.auth.sub;
    } else if (req.auth.userId) {
      req.auth.id = req.auth.userId;
    } else if (req.auth._id) {
      req.auth.id = req.auth._id;
    }
  }
  next();
};
