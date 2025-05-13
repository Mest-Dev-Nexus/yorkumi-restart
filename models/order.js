import {Schema, model} from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    shippingAddress1: { type: String, },
    shippingAddress2: { type: String },
    city: { type: String, },
    country: { type: String, },
    region: { type: String, }
  },
  cart: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    }
  }],
  
  costing: {
    subTotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    amountAfterDiscount: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    discountApplied: { type: Boolean, default: false },
    shippingId: { type: Schema.Types.ObjectId, ref: 'ShippingAddress', default: null }
  }
  ,
  status: {
    type: String,
    enum: ["not paid",'pending', 'completed', 'cancelled'],
    default: 'not paid'
  }
}, { timestamps: true });
orderSchema.plugin(normalizeMongoose);
export const OrderModel = model('Order', orderSchema);