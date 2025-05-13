import {Router} from 'express';
import { isAuthenticated } from '../middlewares/auth.js';
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
 * @route   POST /api/orders
 * @desc    Create a new order from cart
 * @access  Private
 */
orderRouter.post('/order', isAuthenticated, createOrder);

/**
 * @route   POST /api/orders/:orderId/payment
 * @desc    Complete order after successful payment
 * @access  Private
 */
orderRouter.post('/:orderId/payment', isAuthenticated, completeOrderAfterPayment);

orderRouter.get('/order', isAuthenticated, getUserOrders);
orderRouter.get('/:id', isAuthenticated, getOrderById);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for current user
 * @access  Private
 */


/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (admin only)
 * @access  Admin
 */
orderRouter.get('/admin/all', isAuthenticated, getAllOrders);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status (admin only)
 * @access  Admin
 */
orderRouter.put('/:id/status', isAuthenticated, updateOrderStatus);

export default orderRouter;