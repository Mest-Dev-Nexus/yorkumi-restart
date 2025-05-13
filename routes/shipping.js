import { Router } from "express";


import { isAuthenticated, } from '../middlewares/auth.js';
import { addShipping, deleteShipping, getShipping, patchShipping } from "../controllers/shipping.js";

const shippingRouter = Router();


shippingRouter.get('/shipping', isAuthenticated, getShipping);



shippingRouter.post('/shipping',  addShipping);


shippingRouter.patch('/shipping', isAuthenticated, patchShipping);


shippingRouter.delete('/shipping', isAuthenticated,deleteShipping);






export default shippingRouter;