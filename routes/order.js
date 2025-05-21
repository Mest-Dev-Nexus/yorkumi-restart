import {Router} from 'express';
import { authorizeAdmin, authorizeRole, isAuthenticated } from '../middlewares/auth.js';
import { 
  createOrder, 
  completeOrderAfterPayment,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  getAllOrders
} from '../controllers/order.js';

const orderRouter = Router();

/**
 * @route   POST /api/order
 * @desc    Create a new order from cart
 * @access  Private
 */
orderRouter.post('/order', isAuthenticated, createOrder);

/**
 * @route   POST /api/order/:orderId/payment
 * @desc    Complete order after successful payment
 * @access  Private
 */
orderRouter.post('/order/:orderId/payment', isAuthenticated, completeOrderAfterPayment);

/**
 * @route   GET /api/order/user
 * @desc    Get all orders for current user
 * @access  Private
 */
orderRouter.get('/order/user', isAuthenticated, getUserOrders);

/**
 * @route   GET /api/order/all
 * @desc    Get all orders (admin only)
 * @access  Admin
 */
orderRouter.get('/order/all', isAuthenticated, authorizeAdmin("super"), getAllOrders);

/**
 * @route   PUT /api/order/:id/status
 * @desc    Update order status (admin only)
 * @access  Admin
 */
orderRouter.put('/order/:id/status', isAuthenticated, authorizeAdmin("super"), updateOrderStatus);

/**
 * @route   GET /api/order/:id
 * @desc    Get specific order by ID
 * @access  Private
 */
orderRouter.get('/order/:id', isAuthenticated, getOrderById);

export default orderRouter;