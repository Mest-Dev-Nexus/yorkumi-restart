import mongoose from 'mongoose';
import { CartModel } from '../models/cart.js';
import { ProductModel } from '../models/product.js';
import { OrderModel } from '../models/order.js';
import { DiscountModel } from '../models/discount.js';
import { ShippingAddressModel } from '../models/shippingAddress.js';
import { orderAmountCalc } from '../helpers/orderAmountCalc.js';

/**
 * Controller function to create order from cart before payment
 */
export const createOrder = async (req, res, next) => {
  try {
    // Get user ID from authenticated session
    const userId = req.auth?.id;
    
    // Check if userId exists - required for creating an order
    if (!userId) {
      return res.status(401).json({
        message: "Authentication error",
        error: ["User not authenticated. Please log in to complete checkout."]
      });
    }

    // Extract shipping address from request
    const {
      shippingAddress1,
      shippingAddress2,
      city,
      country,
      region
    } = req.body.address;
    
    // Extract cart and promo code
    const { cart, promocode } = req.body;
    
    // Format the address for the order
    const address = {
      shippingAddress1,
      shippingAddress2,
      city,
      country,
      region
    };

    // Validate cart has items
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart error",
        error: ["Your cart is empty"]
      });
    }

    // Check product availability and populate product data for calculations
    const populatedCartItems = [];
    for (const item of cart.items) {
      const product = await ProductModel.findById(item.product);
      
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

      // Create a populated item with product details needed for calculation
      populatedCartItems.push({
        product: {
          _id: product._id,
          price: product.price,
          title: product.title
        },
        quantity: item.quantity
      });
    }

    // Process discount code if provided
    let discount = null;
    if (promocode) {
      discount = await DiscountModel.findOne({
        promocode,
        isActive: true,
        expiryDate: { $gt: new Date() }
      });
      
      if (!discount) {
        console.log(`Promocode ${promocode} is invalid or expired`);
      }
    }

    // Get shipping rate based on country and region
    let shippingId = null;
    let shippingRate = 10; // Default fallback rate
    try {
      const shippingData = await ShippingAddressModel.findOne({
        country: country,
        region: region
      });
      
      if (shippingData) {
        shippingId = shippingData._id;
        shippingRate = shippingData.rate;
        console.log(`Using shipping rate: ${shippingRate} for ${country}, ${region}`);
      } else {
        console.log(`No shipping rate found for ${country}, ${region}. Using default rate of ${shippingRate}.`);
      }
    } catch (error) {
      console.error('Error fetching shipping rate:', error);
    }

    // Calculate order amounts using populated cart items
    const calculateOrder = orderAmountCalc(populatedCartItems, shippingRate, discount);
    const costingDetails = calculateOrder();

    // Create the new order with proper structure
    const newOrder = await OrderModel.create({
      address,
      cart: cart.items.map(item => ({
        product: item.product,  // Just store the product ID reference
        quantity: item.quantity
      })),
      costing: {
        subTotal: costingDetails.subTotal,
        discountAmount: costingDetails.discountAmount || 0,
        amountAfterDiscount: costingDetails.amountAfterDiscount,
        shippingCost: costingDetails.shippingCost,
        grandTotal: costingDetails.grandTotal,
        discountApplied: costingDetails.discountApplied || false,
        shippingId
      },
      user: userId,
      status: 'not paid'
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
    const order = await OrderModel.findById(orderId).populate('cart.product');
    
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
      for (const item of order.cart) {
        await ProductModel.updateOne(
          { _id: item.product },
          { $inc: { countInStock: -item.quantity } },
          { session }
        );
      }
      
      // Update order status
      await OrderModel.findByIdAndUpdate(
        orderId,
        { 
          $set: { 
            status: 'pending',
            paymentDetails: paymentDetails || {}
          } 
        },
        { session }
      );
      
      // Clear user's cart after successful order
      await CartModel.findOneAndUpdate(
        { user: userId },
        { items: [] },
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

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.id;
    const isAdmin = req.auth?.role === 'admin';
    
    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid order ID format"
      });
    }
    
    // Find order and populate product details
    const order = await OrderModel.findById(id)
      .populate({
        path: 'cart.product',
        select: 'title price images' // Only get needed fields
      });
    
    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    // Check permission: must be order owner or admin
    if (order.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({
        message: "You don't have permission to access this order"
      });
    }
    
    return res.status(200).json({
      message: "Order retrieved successfully",
      data: order
    });
  } catch (error) {
    console.error("Error retrieving order:", error);
    next(error);
  }
};

/**
 * Get all orders for logged in user
 * @route GET /api/orders
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.auth?.id;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Apply filters if provided
    const filterOptions = { user: userId };
    
    if (req.query.status) {
      filterOptions.status = req.query.status;
    }
    
    // Get total count for pagination
    const totalOrders = await OrderModel.countDocuments(filterOptions);
    
    // Find orders with pagination and sorting
    const orders = await OrderModel.find(filterOptions)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'cart.product',
        select: 'title price images'
      });
    
    return res.status(200).json({
      message: "Orders retrieved successfully",
      data: orders,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        hasNextPage: skip + orders.length < totalOrders,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error retrieving user orders:", error);
    next(error);
  }
};

/**
 * Admin: Get all orders
 * @route GET /api/orders/admin/all
 */
export const getAllOrders = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.auth?.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Admin privileges required."
      });
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Apply filters if provided
    const filterOptions = {};
    
    if (req.query.status) {
      filterOptions.status = req.query.status;
    }
    
    if (req.query.userId) {
      filterOptions.user = req.query.userId;
    }
    
    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filterOptions.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Get total count for pagination
    const totalOrders = await OrderModel.countDocuments(filterOptions);
    
    // Find orders with pagination and sorting
    const orders = await OrderModel.find(filterOptions)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'cart.product',
        select: 'title price images'
      })
      .populate({
        path: 'user',
        select: 'name email'
      });
    
    return res.status(200).json({
      message: "All orders retrieved successfully",
      data: orders,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
        hasNextPage: skip + orders.length < totalOrders,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error retrieving all orders:", error);
    next(error);
  }
};

/**
 * Admin: Update order status
 * @route PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if user is admin
    if (req.auth?.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Admin privileges required."
      });
    }
    
    // Validate status value
    const validStatuses = ['not paid', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        error: [`Status must be one of: ${validStatuses.join(', ')}`]
      });
    }
    
    // Find and update the order
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true } // Return the updated document
    );
    
    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }
    
    return res.status(200).json({
      message: "Order status updated successfully",
      data: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    next(error);
  }
};