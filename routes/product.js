import {Router} from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.js";
import { productsPicturesUpload } from "../middlewares/upload.js";

const productRouter = Router();

// Add new product
productRouter.post("/product",productsPicturesUpload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 3 }
]), addProduct);

// Get all products
productRouter.get("/product", getProducts);

// Get single product by ID
productRouter.get("/product/:id", getProductById);

// Update product by ID
productRouter.patch("/product/:id", updateProduct);

// Delete product by ID
productRouter.delete("/product/:id", deleteProduct);

export default productRouter;