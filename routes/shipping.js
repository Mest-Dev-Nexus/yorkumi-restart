import { Router } from "express";


import { 
  isAuthenticated, 
  normalizeAuth, 
  authorizeRole,
  authorizeAdmin // Using authorizeAdmin for highest level admin (superadmin)
} from '../middlewares/auth.js';
import { addShipping, deleteShipping, getShipping, patchShipping } from "../controllers/shipping.js";

const shippingRouter = Router();


shippingRouter.get('/shipping', isAuthenticated, normalizeAuth, 
  authorizeRole(["admin"]) , getShipping);



shippingRouter.post('/shipping',isAuthenticated, normalizeAuth, 
  authorizeAdmin("super"), addShipping);


shippingRouter.patch('/shipping/:id', isAuthenticated,normalizeAuth, 
  authorizeAdmin("super"), patchShipping);


shippingRouter.delete('/shipping/:id', isAuthenticated,normalizeAuth, 
  authorizeAdmin("super"),deleteShipping);






export default shippingRouter;