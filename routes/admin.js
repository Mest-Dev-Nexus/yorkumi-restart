import { Router } from "express";
import {
  registerAdmin,
  loginAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin
} from "../controllers/admin.js";
import { 
  isAuthenticated, 
  normalizeAuth, 
  authorizeRole,
  authorizeAdmin
} from "../middlewares/auth.js";
import { adminPictureUpload } from "../middlewares/upload.js";

const adminRouter = Router();

// Public routes - no authentication required
// Register a new user
adminRouter.post(
  "/admin/register", 
  adminPictureUpload.single("image"),
  registerAdmin
);

// Login user
adminRouter.post("/admin/login", loginAdmin);

// Password reset (requires valid token from email link)
// adminRouter.post("/reset-password/:token", resetAdminPassword);

// Protected routes - authentication required
// Get all users - admin only
adminRouter.get(
  "/admin",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  getAllAdmins
);

// Get single user by ID - self or admin
adminRouter.get(
  "/admin/:id",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  getAdminById
);

// Update user - self or admin
adminRouter.patch(
  "/admin/:id",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  adminPictureUpload.single("image"),
  updateAdmin
);

// Delete user - self or admin
adminRouter.delete(
  "/admin/:id",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  deleteAdmin
);

export default adminRouter;