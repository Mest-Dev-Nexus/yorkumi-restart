import mongoose from 'mongoose';
import { CartModel } from '../models/cart.js';
import { ProductModel } from '../models/product.js';
import { OrderModel } from '../models/order.js';
import { orderAmountCalc } from '../helpers/orderAmountCalc.js';

/**
 * Controller function to create order from cart before payment
 * - Creates the order but doesn't update inventory yet
 * - Adds a paymentStatus field to track whether payment is completed
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.auth?.id; // From authentication middleware
    const { 
      shippingAddress1, 
      shippingAddress2, 
      city, 
      country, 
    } = req.body.address;
    const {
      cart,promocode
    }= req.body;
    

     if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart error",
        error: ["Your cart is empty"]
      });
    }

    // Check product availability first (without updating inventory yet)
    for (const item of cart.items) {
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

    const discount = await DiscountModel.findOne({promocode});

    const costing = orderAmountCalc(cart,req.body.adress,userId,discount.value);
    // Create the new order
    const newOrder = await OrderModel.create({
      address,
      cart,
      costing, // This should be the result of orderAmountCalc
      user: userId,
      
    });
    
    return res.status(201).json({
      message: "Order created successfully. Please proceed to payment.",
      data: newOrder
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
    
    // Fetch the order and populate product details
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
    if (order.status !== 'not paid') {
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