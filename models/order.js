import mongoose from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const orderSchema = new mongoose.Schema(
  {
   
    shippingAddress1: {
      type: String,
      required: true,
    },
    shippingAddress2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    internationalShippingRequired: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate shipping fee
orderSchema.pre('save', function(next) {
  const city = this.city ? this.city.toLowerCase() : '';
  const country = this.country ? this.country.toLowerCase() : '';
  
  // Within Accra
  if (city === 'accra' && country === 'ghana') {
    this.shippingFee = 40;
  }
  // Outside Accra but in Ghana
  else if (city !== 'accra' && country === 'ghana') {
    this.shippingFee = 50;
  }
  // Other regions in Ghana
  else if (country === 'ghana') {
    this.shippingFee = 70;
  }
  // International shipping
  else {
    this.internationalShippingRequired = true;
    // Shipping fee will be determined by shipping choice
  }
  
  next();
});

orderSchema.plugin(normalizeMongoose);

export const OrderModel = mongoose.model('Order', orderSchema);