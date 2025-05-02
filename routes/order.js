import { Router } from "express";
import { createOrderFromCart, completeOrderAfterPayment } from '../controllers/order.js';
import { isAuthenticated } from '../middlewares/auth.js';

const orderRouter = Router();


orderRouter.post('/order', isAuthenticated, createOrderFromCart);

orderRouter.post('/:orderId/payment', isAuthenticated, completeOrderAfterPayment);



export default orderRouter;