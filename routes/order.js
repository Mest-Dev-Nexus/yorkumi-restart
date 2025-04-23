import { Router } from "express";
import { addOrder, getAllOrders,  getOrder, updateOrderStatus } from "../controllers/order.js";
import {isAuthenticated} from "../middlewares/auth.js";

const orderRouter = Router();

orderRouter.post("/order", addOrder)
orderRouter.get("/myorders", isAuthenticated,getOrder)
orderRouter.get("/order", getAllOrders)
orderRouter.patch('/order/:id', isAuthenticated,updateOrderStatus)



export default orderRouter;