import { Router } from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductMinDeets,
  productCount,
  featuredProduct,
} from "../controllers/product.js";
import { productsPicturesUpload } from "../middlewares/upload.js";
import { 
  isAuthenticated, 
  normalizeAuth, 
  authorizeRole,
  authorizeAdmin
} from '../middlewares/auth.js';

const productRouter = Router();

// Add new product - admin only
productRouter.post(
  "/product",
  productsPicturesUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 3 }
  ]), 
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]),
  addProduct
);

// Get all products - public access
productRouter.get("/product",isAuthenticated, getProducts);

// Get products name and images alone - public access
productRouter.get('/product/min', isAuthenticated,getProductMinDeets);

// Get product count - public access
productRouter.get('/product/count',isAuthenticated, productCount);

// Get featured product - public access
productRouter.get('/product/featured', featuredProduct);

// Get single product by ID - public access
productRouter.get("/product/:id", getProductById);

// Update product by ID - admin only
productRouter.patch(
  "/product/:id",
  productsPicturesUpload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 3 }
  ]),
  isAuthenticated,normalizeAuth,authorizeRole(["admin"]), 
  updateProduct
);

// Delete product by ID - admin only
productRouter.delete(
  "/product/:id",
  isAuthenticated,
  normalizeAuth,
  authorizeRole(["admin"]), 
  deleteProduct
);

export default productRouter;