import { Router } from "express";
import { 
  isAuthenticated, 
  normalizeAuth, 
  authorizeRole,
  authorizeAdmin
} from '../middlewares/auth.js';
import { 
  addDiscount, 
  deleteDiscount, 
  getDiscounts, 
  patchDiscount 
} from "../controllers/discount.js";

const discountRouter = Router();

// Get all discounts - admin access
discountRouter.get(
  '/discounts',
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  getDiscounts
);

// Add new discount - superadmin only
discountRouter.post(
  '/discount', 
  isAuthenticated,
  normalizeAuth,
  authorizeAdmin("super"), // Using string parameter, not array
  addDiscount
);

// Update discount - superadmin only
discountRouter.patch(
  '/discount/:id',  // Added :id parameter
  isAuthenticated,
  normalizeAuth,
  authorizeAdmin("super"), // Using string parameter, not array
  patchDiscount
);

// Delete discount - superadmin only
discountRouter.delete(
  '/discount/:id', // Added :id parameter 
  isAuthenticated,
  normalizeAuth,
  authorizeAdmin("super"), // Using string parameter, not array
  deleteDiscount
);

export default discountRouter;