import mongoose from 'mongoose';
import { CartModel } from '../models/cart.js';
import { UserModel } from '../models/user.js';
import { orderValidationSchema } from '../validators/order.js';
import { OrderModel } from '../models/order.js';
import { VendorModel } from '../models/vendor.js';

export const addOrder = async (req, res, next) => {
  try {
    const { user, cart } = req.body;

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Invalid User ID format"]
      });
    }

    // Check if user exists
    const userExists = await UserModel.findById(user);
    if (!userExists) {
      return res.status(400).json({
        message: "Validation error",
        error: ["User does not exist"]
      });
    }

    // Validate cart ID format
    if (!mongoose.Types.ObjectId.isValid(cart)) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Invalid Cart ID format"]
      });
    }

    // Check if cart exists
    const cartExists = await CartModel.findById(cart);
    if (!cartExists) {
      return res.status(400).json({
        message: "Validation error",
        error: [`Cart with ID ${cart} does not exist`]
      });
    }

    // Validate with Joi schema
    const { error, value } = orderValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail) => detail.message)
      });
    }

    // Destructure shippingFee from validated data
    const { shippingFee, ...orderData } = value;

  // Calculate total price from cart + shipping
const cartTotal = Number(cartExists.totalPrice) || 0;
const shipping = Number(shippingFee) || 0;
const totalPrice = cartTotal + shipping;

// Create the order with correct total price
const result = await OrderModel.create({
  ...orderData,
  user,
  cart,
  shippingFee: shipping,
  totalPrice
});


   
    return res.status(201).json({
      message: "Order successfully created",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await OrderModel.find().populate('cart').populate('user', 'username email -_id').sort('{createdAt:-1}');
    return res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders
    });
  } catch (error) {
    next(error);
  }
};
export const getOrder = async (req, res, next) => {
  try {
    const userIdFromToken = req.auth?.id;

    if (!userIdFromToken) {
      return res.status(401).json({ message: "Unauthorized: No user ID found in token." });
    }

    // Only fetch orders for the logged-in user (ignore params completely)
    const orders = await OrderModel.find({ user: userIdFromToken }).populate('cart');

    return res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Error retrieving orders:", error);
    next(error);
  }
};



export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id; // Correct way to access the ID from route parameter
    const { status } = req.body;

    const allowedStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be one of: pending, shipped, delivered, cancelled" 
      });
    }

    // Optional: validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order status updated successfully",
      orderId: updatedOrder._id,
      newStatus: updatedOrder.status
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
};
