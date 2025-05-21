

/**
 * Controller function to create order from cart before payment
 */
import mongoose from 'mongoose';
import { ProductModel } from '../models/product.js';
import { OrderModel } from '../models/order.js';
import { DiscountModel } from '../models/discount.js';
import { ShippingAddressModel } from '../models/shippingAddress.js';
import { RegularUserModel } from '../models/user.js'; // Add this import
import { orderAmountCalc } from '../helpers/orderAmountCalc.js';

/**
 * Controller function to create order from cart before payment
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication error",
        error: ["User not authenticated. Please log in to complete checkout."]
      });
    }

    const { cart, promocode } = req.body;
    
    // Initialize address
    let address = {};
    
    // If address is provided in the request, use it
    if (req.body.address) {
      const {
        shippingAddress1,
        shippingAddress2,
        city,
        country,
        region
      } = req.body.address;

      address = {
        shippingAddress1,
        shippingAddress2,
        city,
        country,
        region
      };
    } else {
      // If no address is provided, fetch from user's saved address
      const user = await RegularUserModel.findById(userId);
      if (!user || !user.address || !user.address.address1) {
        return res.status(400).json({
          message: "Address error",
          error: ["No shipping address provided and no default address found for user"]
        });
      }
      
      // Use the user's saved address
      address = {
        shippingAddress1: user.address.shippingAddress1,
        shippingAddress2: user.address.shippingAddress2 || '',
        city: user.address.city,
        country: user.address.country,
        region: user.address.region
      };
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart error",
        error: ["Your cart is empty"]
      });
    }

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
          error: [`Not enough stock for \"${product.title}\". Available: ${product.countInStock}, Requested: ${item.quantity}`]
        });
      }

      populatedCartItems.push({
        product: {
          _id: product._id,
          price: product.price,
          title: product.title
        },
        quantity: item.quantity
      });
    }

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

    let shippingId = null;
    let shippingRate = 10;
    try {
      const shippingData = await ShippingAddressModel.findOne({
        country: address.country,
        region: address.region
      });

      if (shippingData) {
        shippingId = shippingData._id;
        shippingRate = shippingData.rate;
        console.log(`Using shipping rate: ${shippingRate} for ${address.country}, ${address.region}`);
      } else {
        console.log(`No shipping rate found for ${address.country}, ${address.region}. Using default rate of ${shippingRate}.`);
      }
    } catch (error) {
      console.error('Error fetching shipping rate:', error);
    }

    const calculateOrder = orderAmountCalc(populatedCartItems, shippingRate, discount);
    const costingDetails = calculateOrder();

    const newOrder = await OrderModel.create({
      address,
      cart: cart.items.map(item => ({
        product: item.product,
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
    const { paymentDetails } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await OrderModel.findById(orderId).populate('cart.product');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({ message: "You don't have permission to access this order" });
    }

    if (order.status !== 'not paid') {
      return res.status(400).json({ message: "This order has already been processed" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const item of order.cart) {
        await ProductModel.updateOne(
          { _id: item.product },
          { $inc: { countInStock: -item.quantity } },
          { session }
        );
      }

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
 */
export const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.id;
    const isAdmin = req.auth?.role === 'admin';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    const order = await OrderModel.findById(id)
      .populate({ path: 'cart.product', select: 'title price images' });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "You don't have permission to access this order" });
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
 */
export const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.auth?.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filterOptions = { user: userId };

    if (req.query.status) {
      filterOptions.status = req.query.status;
    }

    const totalOrders = await OrderModel.countDocuments(filterOptions);

    const orders = await OrderModel.find(filterOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'cart.product', select: 'title price images' });

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
 */
/**
 * Admin: Get all orders
 */
export const getAllOrders = async (req, res, next) => {
  try {
    // Check for admin authorization
    if (req.auth?.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // Set up pagination (optional)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Set up filter options (optional)
    const filterOptions = {};

    // Apply status filter if provided
    if (req.query.status && req.query.status !== 'all') {
      filterOptions.status = req.query.status;
    }

    // Apply date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      filterOptions.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Count total orders matching the filter
    const totalOrders = await OrderModel.countDocuments(filterOptions);

    // Get orders with pagination
    const orders = await OrderModel.find(filterOptions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'cart.product', select: 'title price images' })
      .populate({ path: 'user', select: 'name email' });

    // Return the orders with pagination info
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
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.auth?.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    const validStatuses = ['not paid', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value",
        error: [`Status must be one of: ${validStatuses.join(', ')}`]
      });
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
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
