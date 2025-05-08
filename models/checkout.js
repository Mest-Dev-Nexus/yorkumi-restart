import mongoose from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const checkoutSchema = new mongoose.Schema(
  {
    // Customer information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Contact details
    phoneNumber: {
      type: String, // Changed from Number to String to preserve formatting
      required: true,
      validate: {
        validator: function(v) {
          return /^\d{8,15}$/.test(v); // Basic validation for phone numbers
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    
    // Shipping information
    shippingAddress: {
      address1: {
        type: String,
        required: true,
        trim: true
      },
      address2: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      country: {
        type: String,
        required: true,
        trim: true
      },
      postalCode: {
        type: String,
        trim: true
      }
    },
    
    // Delivery options
    delivery: {
      type: String,
      enum: ['pick-up', 'local-delivery', 'international-delivery'],
      required: true,
      default: 'local-delivery',
    },
    
    // Payment information
    paymentMethod: {
      type: String,
      enum: ['card', 'mobile-money', 'cash-on-delivery'],
      required: true,
    },
    
    // Price calculations
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      shippingFee: {
        type: Number,
        default: 0,
        min: 0
      },
      discount: {
        type: Number,
        default: 0,
        min: 0
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0
      }
    },
    
    // Shipping status
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending'
    },
    
    // International shipping flag
    isInternational: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for full address
checkoutSchema.virtual('fullAddress').get(function() {
  return `${this.shippingAddress.address1}, ${this.shippingAddress.city}, ${this.shippingAddress.country}`;
});

// Pre-save middleware to calculate shipping fee
checkoutSchema.pre('save', function(next) {
  const city = this.shippingAddress.city ? this.shippingAddress.city.toLowerCase() : '';
  const country = this.shippingAddress.country ? this.shippingAddress.country.toLowerCase() : '';
  
  // Set international flag
  this.isInternational = country !== 'ghana';
  
  // Calculate shipping fee based on location
  if (country === 'ghana') {
    if (city === 'accra') {
      this.pricing.shippingFee = 40;
    } else {
      this.pricing.shippingFee = 50;
    }
  } else {
    this.pricing.shippingFee = 0; // Will be determined later
    this.isInternational = true;
  }
  
  // Calculate total amount
  this.pricing.totalAmount = 
    this.pricing.subtotal + 
    this.pricing.shippingFee + 
    this.pricing.discount;
  
  next();
});


// Static method to find checkouts by user
// checkoutSchema.statics.findByUser = function(userId) {
//   return this.find({ user: userId }).populate('user').exec();
// };

checkoutSchema.plugin(normalizeMongoose);

export const CheckoutModel = mongoose.model('Checkout', checkoutSchema);