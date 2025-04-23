import { CartModel } from "../models/cart.js"
import { UserModel } from "../models/user.js"
import { ProductModel } from "../models/product.js"
import mongoose from "mongoose"
import { cartValidationSchema } from "../validators/cart.js"




export const addCart = async (req, res, next) => {
  try {
    const { user, products } = req.body;

    // Check if user already has an active cart
    const existingOrder = await CartModel.findOne({ user });

    if (existingOrder) {
      return res.status(409).json({
        message: "Order conflict",
        error: ["You already have an active order. Please complete it before creating a new one."]
      });
    }

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Invalid User ID format"]
      });
    }

    const userExists = await UserModel.findById(user);
    if (!userExists) {
      return res.status(400).json({
        message: "Validation error",
        error: ["User does not exist"]
      });
    }

    // Validate each product in the products array
    for (const item of products) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        return res.status(400).json({
          message: "Validation error",
          error: [`Invalid Product ID format: ${item.product}`]
        });
      }

      const productExists = await ProductModel.findById(item.product);
      if (!productExists) {
        return res.status(400).json({
          message: "Validation error",
          error: [`Product with ID ${item.product} does not exist`]
        });
      }
    }

    // Validate with Joi (assuming you have a schema for this)
    const { error, value } = cartValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail) => detail.message)
      });
    }

    // Calculate totalPrice (optional logic)
    let totalPrice = 0;
    for (const item of products) {
      const productDoc = await ProductModel.findById(item.product);
      totalPrice += productDoc.price * item.quantity;
    }

    const result = await CartModel.create({ ...value, totalPrice });

    return res.status(201).json({
      message: "Cart successfully created",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


export const getCartbyId = async (req, res, next) => {
  try {
    const authenticatedUserId = req.auth.id;
    const requestedUserId = req.params.id;

    // Ensure user can only access their own cart
    if (authenticatedUserId !== requestedUserId) {
      return res.status(403).json({
        message: "Forbidden: You can only get your own cart"
      });
    }

    // ✅ Use the correct variable: requestedUserId
    const cart = await CartModel.findOne({ user: requestedUserId }).populate('products.product');

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    return res.status(200).json({
      message: "Cart retrieved successfully",
      data: cart
    });

  } catch (error) {
    next(error);
  }
};
