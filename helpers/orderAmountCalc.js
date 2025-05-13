/**
 * Calculates order amounts based on cart contents, shipping and discounts
 * @param {Array} cartItems - Cart items with product info and quantity
 * @param {Number} shippingRate - Shipping cost to apply
 * @param {Object|null} discount - Discount object from database
 * @returns {Function} - Function that returns order amount details
 */
export const orderAmountCalc = (cartItems, shippingRate, discount) => () => {
  // Calculate subtotal (sum of products in cart)
  const subTotal = cartItems.reduce((total, item) => {
    // item price = product price * quantity
    const itemPrice = item.product.price * item.quantity;
    return total + itemPrice;
  }, 0);
  
  // Use shipping rate directly
  shippingRate = typeof shippingRate === 'number' ? shippingRate : 10; // Default if not a number
  
  // Apply discount if applicable
  let amountAfterDiscount = subTotal;
  let discountAmount = 0;
  let discountApplied = false;
  
  if (discount && discount.isActive && new Date() < new Date(discount.expiryDate)) {
    discountApplied = true;
    
    if (discount.type === 'percentage') {
      // Calculate percentage-based discount
      discountAmount = (subTotal * discount.value) / 100;
      amountAfterDiscount = subTotal - discountAmount;
    } else if (discount.type === 'fixed') {
      // Apply fixed amount discount
      discountAmount = discount.value;
      amountAfterDiscount = subTotal - discountAmount;
      // Ensure discount doesn't make total negative
      if (amountAfterDiscount < 0) {
        amountAfterDiscount = 0;
        discountAmount = subTotal; // Cap the discount at the subtotal amount
      }
    }
  }
  
  // Calculate grand total (subtotal - discount + shipping)
  const grandTotal = amountAfterDiscount + shippingRate;
  
  return {
    grandTotal,
    subTotal,
    shippingCost: shippingRate,
    amountAfterDiscount,
    discountAmount,
    discountApplied
  };
};