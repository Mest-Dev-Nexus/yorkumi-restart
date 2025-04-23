import { Router } from "express";
import { addCart } from "../controllers/cart.js";


const cartRouter = Router();

cartRouter.post('/cart', addCart)

export default cartRouter;