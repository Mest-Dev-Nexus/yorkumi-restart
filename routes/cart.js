import { Router } from "express";

import { 
  getUserCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart,
  transferGuestCart,
  getCartItemCount
} from '../controllers/cart.js';
import { isAuthenticated } from '../middlewares/auth.js';

const cartRouter = Router();


cartRouter.get('/cart', isAuthenticated, getUserCart);

cartRouter.get('/count', isAuthenticated, getCartItemCount);


cartRouter.post('/cart', isAuthenticated, addToCart);


cartRouter.put('/cart', isAuthenticated, updateCartItem);


cartRouter.delete('/cart', isAuthenticated, removeFromCart);


 
cartRouter.delete('/clear', isAuthenticated, clearCart);


cartRouter.post('/transfercart', isAuthenticated, transferGuestCart);



export default cartRouter;