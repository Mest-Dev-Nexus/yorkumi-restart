import { Router } from "express";
import {
  registerUser,
  loginUser,
  // resetUserPassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/user.js";
import { 
  isAuthenticated, 
  normalizeAuth, 
  authorizeRole,
  authorizeAdmin
} from "../middlewares/auth.js";
import { usersPictureUpload } from "../middlewares/upload.js";

const userRouter = Router();

// Public routes - no authentication required
// Register a new user
userRouter.post(
  "/user/register", 
  usersPictureUpload.single("image"),
  registerUser
);

// Login user
userRouter.post("/user/login", loginUser);

// Password reset (requires valid token from email link)
// userRouter.post("/user/reset-password/:token", resetUserPassword);

// Get single user by ID - self or admin
userRouter.get(
  "/users/:id",
  isAuthenticated,
  normalizeAuth,
  getUserById
);

// Protected routes - authentication required
// Get all users - admin only
userRouter.get(
  "/users",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  getAllUsers
);



// Update user - self or admin
userRouter.patch(
  "/users/:id",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["user"]),
  usersPictureUpload.single("image"),
  updateUser
);

// Delete user - self or admin
userRouter.delete(
  "/users/:id",
  isAuthenticated,
  normalizeAuth,
 authorizeRole(["user"]),
  deleteUser
);

export default userRouter;