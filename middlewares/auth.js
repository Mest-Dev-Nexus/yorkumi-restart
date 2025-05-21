import { expressjwt } from "express-jwt";
import { UserModel } from "../models/baseuser.js";

export const isAuthenticated = expressjwt({
  secret: process.env.JWT_SECRET_KEY,
  algorithms: ["HS256"],
});

/**
 * Middleware to normalize user ID from JWT payload
 */
export const normalizeAuth = (req, res, next) => {
  if (req.auth && !req.auth.id) {
    req.auth.id = req.auth.sub || req.auth.userId || req.auth._id;
  }
  next();
};

/**
 * Authorize any specific role (e.g., ['user'], ['admin'])
 */
export const authorizeRole = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.auth.id);
      console.log("Fetched user:", user);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (roles.includes(user.role)) {
        next();
      } else {
        return res.status(403).json({ message: "Access denied: insufficient role" });
      }
    } catch (err) {
      console.error("Authorization error:", err);
      return res.status(500).json({ message: "Server error during role authorization" });
    }
  };
};

/**
 * Authorize only admins with optional level check (e.g., 'junior', 'super')
 */
export const authorizeAdmin = (requiredLevel = null) => {
  return async (req, res, next) => {
    try {
      const admin = await UserModel.findById(req.auth.id);
      if (!admin || admin.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      if (requiredLevel && admin.adminLevel !== requiredLevel) {
        return res.status(403).json({ message: `Only ${requiredLevel} admins allowed` });
      }

      next();
    } catch (err) {
      console.error("Admin authorization error:", err);
      return res.status(500).json({ message: "Server error during admin authorization" });
    }
  };
};
