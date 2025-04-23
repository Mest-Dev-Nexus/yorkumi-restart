import {Router} from "express";
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
import { isAuthenticated,isUserAuthorized,isVendorAuthorized } from '../middlewares/auth.js';

const productRouter = Router();

// Add new product
productRouter.post("/product",productsPicturesUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 3 }
]), isAuthenticated, isVendorAuthorized('vendor'),addProduct);

// Get all products
productRouter.get("/product", getProducts);

// get products name and images alone
productRouter.get('/product/min', getProductMinDeets)

// get product count 
productRouter.get('/product/count', productCount)

// get featured product
productRouter.get('/product/featured', featuredProduct)

// Get single product by ID
productRouter.get("/product/:id", getProductById);


// Update product by ID
productRouter.patch("/product/:id",productsPicturesUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 3 }
]),isAuthenticated, isVendorAuthorized('vendor'), updateProduct);

// Delete product by ID
productRouter.delete("/product/:id",isAuthenticated, isVendorAuthorized('vendor'), deleteProduct);

export default productRouter;