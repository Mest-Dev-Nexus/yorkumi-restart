import { Router } from "express";


import { isAuthenticated, } from '../middlewares/auth.js';
import { addDiscount, deleteDiscount, getDiscounts, patchDiscount } from "../controllers/discount.js";

const discountRounter = Router();


discountRounter.get('/discounts',  getDiscounts);



discountRounter.post('/discount', addDiscount);


discountRounter.patch('/discount',  patchDiscount);


discountRounter.delete('/discount', deleteDiscount);






export default discountRounter;