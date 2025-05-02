import { CartModel } from "../models/cart.js";
import { ProductModel } from "../models/product.js";
import { UserModel } from "../models/user.js";

/**
 * Get the cart for the currently authenticated user
 */
export const getUserCart = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    
    // Find user first to check if they have a cart associated
    const user = await UserModel.findById(userId).populate('cart');
    
    // If user has a cart already associated in their document
    if (user && user.cart) {
      // Find and populate the cart with product details
      const cart = await CartModel.findById(user.cart._id)
        .populate({
          path: 'products.product',
          select: 'name price images description'
        });
      
      return res.status(200).json(cart);
    }
    
    // Check if cart exists but is not linked to user
    let cart = await CartModel.findOne({ user: userId })
      .populate({
        path: 'products.product',
        select: 'name price images description'
      });
    
    if (!cart) {
      // Create a new cart if user doesn't have one
      cart = await CartModel.create({
        products: [],
        user: userId,
        totalPrice: 0
      });
      
      // Update user with cart reference
      await UserModel.findByIdAndUpdate(
        userId,
        { cart: cart._id },
        { new: true }
      );
    } else if (user && !user.cart) {
      // If user exists but cart reference is missing, update it
      await UserModel.findByIdAndUpdate(
        userId,
        { cart: cart._id },
        { new: true }
      );
    }
    
    res.status(200).json(cart);
    
  } catch (error) {
    console.error('Error getting user cart:', error);
    next(error);
  }
};

/**
 * Add a product to the user's cart
 */
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' });
    }

    const user = await UserModel.findById(userId);
    let cart;

    if (user && user.cart) {
      cart = await CartModel.findById(user.cart);
      if (!cart) {
        cart = await CartModel.create({ products: [], user: userId, totalPrice: 0 });
        await UserModel.findByIdAndUpdate(userId, { cart: cart._id }, { new: true });
      }
    } else {
      cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        cart = await CartModel.create({ products: [], user: userId, totalPrice: 0 });
        if (user) {
          await UserModel.findByIdAndUpdate(userId, { cart: cart._id }, { new: true });
        }
      } else if (user && !user.cart) {
        await UserModel.findByIdAndUpdate(userId, { cart: cart._id }, { new: true });
      }
    }

    // Process each product in the request
    for (const item of products) {
      const productId = item.product;
      const quantity = item.quantity || 1;

      if (!productId) {
        return res.status(400).json({ message: 'Product ID is required' });
      }

      if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }

      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${productId}` });
      }

      const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
      if (productIndex > -1) {
        cart.products[productIndex].quantity += parseInt(quantity);
      } else {
        cart.products.push({ product: productId, quantity: parseInt(quantity) });
      }
    }

    await calculateCartTotal(cart);
    await cart.save();

    const updatedCart = await CartModel.findById(cart._id).populate({
      path: 'products.product',
      select: 'name price images description'
    });

    res.status(200).json({
      message: 'Products added to cart successfully',
      cart: updatedCart
    });

  } catch (error) {
    console.error('Error adding to cart:', error);
    next(error);
  }
};


/**
 * Update the quantity of a product in the cart
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { productId, quantity } = req.body;
    
    // Validate inputs
    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }
    
    // Handle removal if quantity is 0
    if (parseInt(quantity) === 0) {
      return removeFromCart(req, res, next);
    }
    
    // Validate quantity
    if (parseInt(quantity) < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    // Find user to get cart reference
    const user = await UserModel.findById(userId);
    let cart;
    
    if (user && user.cart) {
      cart = await CartModel.findById(user.cart);
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    } else {
      // Find cart directly
      cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      
      // Update user with cart reference if missing
      if (user && !user.cart) {
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: cart._id },
          { new: true }
        );
      }
    }
    
    // Find product in cart
    const productIndex = cart.products.findIndex(item => 
      item.product.toString() === productId
    );
    
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }
    
    // Update quantity
    cart.products[productIndex].quantity = parseInt(quantity);
    
    // Recalculate total price
    await calculateCartTotal(cart);
    
    // Save cart
    await cart.save();
    
    // Return cart with populated product details
    const updatedCart = await CartModel.findById(cart._id)
      .populate({
        path: 'products.product',
        select: 'name price images description'
      });
    
    res.status(200).json({
      message: 'Cart updated successfully',
      cart: updatedCart
    });
    
  } catch (error) {
    console.error('Error updating cart item:', error);
    next(error);
  }
};

/**
 * Remove a product from the cart
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { productId } = req.body;
    
    // Validate input
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Find user to get cart reference
    const user = await UserModel.findById(userId);
    let cart;
    
    if (user && user.cart) {
      cart = await CartModel.findById(user.cart);
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    } else {
      // Find cart directly
      cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      
      // Update user with cart reference if missing
      if (user && !user.cart) {
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: cart._id },
          { new: true }
        );
      }
    }
    
    // Check if product exists in cart
    const initialProductCount = cart.products.length;
    
    // Remove product from cart
    cart.products = cart.products.filter(item => 
      item.product.toString() !== productId
    );
    
    // Check if any product was removed
    if (cart.products.length === initialProductCount) {
      return res.status(404).json({ message: 'Product not found in cart' });
    }
    
    // Recalculate total price
    await calculateCartTotal(cart);
    
    // Save cart
    await cart.save();
    
    // Return cart with populated product details
    const updatedCart = await CartModel.findById(cart._id)
      .populate({
        path: 'products.product',
        select: 'name price images description'
      });
    
    res.status(200).json({
      message: 'Product removed from cart successfully',
      cart: updatedCart
    });
    
  } catch (error) {
    console.error('Error removing from cart:', error);
    next(error);
  }
};

/**
 * Clear all items from the cart
 */
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    
    // Find user to get cart reference
    const user = await UserModel.findById(userId);
    let cart;
    
    if (user && user.cart) {
      cart = await CartModel.findById(user.cart);
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
    } else {
      // Find cart directly
      cart = await CartModel.findOne({ user: userId });
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
      
      // Update user with cart reference if missing
      if (user && !user.cart) {
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: cart._id },
          { new: true }
        );
      }
    }
    
    // Clear cart
    cart.products = [];
    cart.totalPrice = 0;
    
    // Save cart
    await cart.save();
    
    res.status(200).json({
      message: 'Cart cleared successfully',
      cart
    });
    
  } catch (error) {
    console.error('Error clearing cart:', error);
    next(error);
  }
};

/**
 * Helper function to calculate cart total
 * Optimized to fetch all products in a single query
 */
const calculateCartTotal = async (cart) => {
  // If cart has no products, set totalPrice to 0 and return
  if (!cart.products || cart.products.length === 0) {
    cart.totalPrice = 0;
    return 0;
  }
  
  // Get all product IDs from cart
  const productIds = cart.products.map(item => item.product);
  
  // Fetch all products in one query for efficiency
  const products = await ProductModel.find({
    _id: { $in: productIds }
  }, 'price');
  
  // Create a map of product IDs to prices for quick lookup
  const productPriceMap = {};
  products.forEach(product => {
    productPriceMap[product._id.toString()] = product.price;
  });
  
  // Calculate total price
  let total = 0;
  cart.products.forEach(item => {
    const productId = item.product.toString();
    const price = productPriceMap[productId] || 0;
    total += price * item.quantity;
  });
  
  cart.totalPrice = total;
  return total;
};

/**
 * Transfer a guest cart to a user's cart after login
 * This function can be used if you implement guest cart functionality
 */
export const transferGuestCart = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    const { guestCartItems } = req.body;
    
    if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
      return res.status(400).json({ message: 'No guest cart items provided' });
    }
    
    // Find user first to check if they have a cart associated
    const user = await UserModel.findById(userId);
    let userCart;
    
    if (user && user.cart) {
      userCart = await CartModel.findById(user.cart);
      
      // If cart reference exists but actual cart doesn't, create a new one
      if (!userCart) {
        userCart = await CartModel.create({
          products: [],
          user: userId,
          totalPrice: 0
        });
        
        // Update user with cart reference
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: userCart._id },
          { new: true }
        );
      }
    } else {
      // Find cart directly or create if doesn't exist
      userCart = await CartModel.findOne({ user: userId });
      if (!userCart) {
        userCart = await CartModel.create({
          products: [],
          user: userId,
          totalPrice: 0
        });
        
        // Update user with cart reference
        if (user) {
          await UserModel.findByIdAndUpdate(
            userId,
            { cart: userCart._id },
            { new: true }
          );
        }
      } else if (user && !user.cart) {
        // If user exists but cart reference is missing, update it
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: userCart._id },
          { new: true }
        );
      }
    }
    
    // Get all product IDs from guest cart for validation
    const productIds = guestCartItems.map(item => item.productId);
    
    // Validate products exist in a single query
    const validProducts = await ProductModel.find({
      _id: { $in: productIds }
    }, '_id');
    
    // Create a set of valid product IDs for quick lookup
    const validProductSet = new Set(validProducts.map(p => p._id.toString()));
    
    // Process each guest cart item
    for (const item of guestCartItems) {
      const { productId, quantity } = item;
      
      // Skip invalid products
      if (!validProductSet.has(productId)) continue;
      
      // Check if product already in user's cart
      const existingItemIndex = userCart.products.findIndex(
        cartItem => cartItem.product.toString() === productId
      );
      
      if (existingItemIndex > -1) {
        // Update quantity if product exists
        userCart.products[existingItemIndex].quantity += parseInt(quantity);
      } else {
        // Add new product to cart
        userCart.products.push({
          product: productId,
          quantity: parseInt(quantity)
        });
      }
    }
    
    // Recalculate total price
    await calculateCartTotal(userCart);
    
    // Save cart
    await userCart.save();
    
    // Return cart with populated product details
    const updatedCart = await CartModel.findById(userCart._id)
      .populate({
        path: 'products.product',
        select: 'name price images description'
      });
    
    res.status(200).json({
      message: 'Guest cart transferred successfully',
      cart: updatedCart
    });
    
  } catch (error) {
    console.error('Error transferring guest cart:', error);
    next(error);
  }
};

/**
 * Get the number of items in the cart (for badge/counter display)
 */
export const getCartItemCount = async (req, res, next) => {
  try {
    const userId = req.auth.id;
    
    // Find user first to check if they have a cart associated
    const user = await UserModel.findById(userId);
    let cart;
    
    if (user && user.cart) {
      cart = await CartModel.findById(user.cart);
    } else {
      // Find cart directly
      cart = await CartModel.findOne({ user: userId });
      
      // Update user with cart reference if cart exists but reference is missing
      if (cart && user && !user.cart) {
        await UserModel.findByIdAndUpdate(
          userId,
          { cart: cart._id },
          { new: true }
        );
      }
    }
    
    if (!cart) {
      return res.status(200).json({ count: 0 });
    }
    
    // Calculate total items count
    const itemCount = cart.products.reduce((total, item) => total + item.quantity, 0);
    
    res.status(200).json({ count: itemCount });
    
  } catch (error) {
    console.error('Error getting cart count:', error);
    next(error);
  }
};