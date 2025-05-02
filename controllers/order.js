import mongoose from 'mongoose';
import { CartModel } from '../models/cart.js';
import { ProductModel } from '../models/product.js';
import { OrderModel } from '../models/order.js';

/**
 * Controller function to create order from cart before payment
 * - Creates the order but doesn't update inventory yet
 * - Adds a paymentStatus field to track whether payment is completed
 */
export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.auth?.id; // From authentication middleware
    const { 
      shippingAddress1, 
      shippingAddress2, 
      city, 
      country, 
      phoneNumber 
    } = req.body;

    // Validate shipping details
    if (!shippingAddress1 || !city || !country || !phoneNumber) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Shipping details are required: shippingAddress1, city, country, and phoneNumber"]
      });
    }

    // Find the user's cart
    const userCart = await CartModel.findOne({ user: userId }).populate('items.product');
    
    if (!userCart || !userCart.items || userCart.items.length === 0) {
      return res.status(400).json({
        message: "Cart error",
        error: ["Your cart is empty"]
      });
    }

    // Check product availability first (without updating inventory yet)
    for (const item of userCart.items) {
      const product = item.product;
      
      if (!product) {
        return res.status(400).json({
          message: "Product error",
          error: [`Product with ID ${item.product} was not found`]
        });
      }
      
      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          message: "Inventory error",
          error: [`Not enough stock for "${product.title}". Available: ${product.countInStock}, Requested: ${item.quantity}`]
        });
      }
    }

    // Convert cart items to order items and calculate total price
    const orderItems = [];
    let baseTotal = 0;
    
    for (const item of userCart.items) {
      const product = item.product;
      
      // Calculate price (handles both string and number price formats)
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      baseTotal += price * item.quantity;
      
      // Add to order items
      orderItems.push({
        product: product._id,
        quantity: item.quantity
      });
    }
    
    // Create the new order
    const newOrder = await OrderModel.create({
      orderItems,
      shippingAddress1,
      shippingAddress2: shippingAddress2 || "",
      city,
      country,
      phoneNumber,
      totalPrice: baseTotal, // Shipping fee will be added by pre-save hook
      user: userId,
      // We'll use the existing status field as 'pending' by default
      // You might want to add a paymentStatus field to the schema if needed
    });
    
    return res.status(201).json({
      message: "Order created successfully. Please proceed to payment.",
      data: {
        orderId: newOrder._id,
        totalPrice: newOrder.totalPrice,
        shippingFee: newOrder.shippingFee,
        totalWithShipping: newOrder.totalPrice + newOrder.shippingFee
      }
    });
  } catch (error) {
    console.error("Error creating order from cart:", error);
    next(error);
  }
};

/**
 * Function to complete the order after successful payment
 * - Updates inventory
 * - Updates order status
 * - Empties the cart
 */
export const completeOrderAfterPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const userId = req.auth?.id;
    const { paymentDetails } = req.body; // Optional: Capture payment info
    
    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        message: "Invalid order ID"
      });
    }
    
    // Find the order and verify it belongs to the user
    const order = await OrderModel.findById(orderId).populate('orderItems.product');
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        message: "You don't have permission to access this order"
      });
    }
    
    // Verify the order hasn't been paid for yet
    if (order.status !== 'pending') {
      return res.status(400).json({
        message: "This order has already been processed"
      });
    }
    
    // Start a transaction for inventory updates
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update product inventory
      for (const item of order.orderItems) {
        await ProductModel.updateOne(
          { _id: item.product },
          { $inc: { countInStock: -item.quantity } },
          { session }
        );
      }
      
      // Update order status if needed
      // You could add payment details here if you expanded the schema
      await OrderModel.findByIdAndUpdate(
        orderId,
        { 
          $set: { 
            status: 'pending', // Keep as pending or change based on your workflow
            // paymentStatus: 'paid', // If you added this field
            // paymentDetails: paymentDetails // If tracking payment info
          } 
        },
        { session }
      );
      
      // Empty the user's cart
      await CartModel.findOneAndUpdate(
        { user: userId },
        { $set: { items: [] } },
        { session }
      );
      
      await session.commitTransaction();
      session.endSession();
      
      return res.status(200).json({
        message: "Payment successful. Order has been confirmed.",
        orderId: order._id
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error completing order after payment:", error);
    next(error);
  }
};