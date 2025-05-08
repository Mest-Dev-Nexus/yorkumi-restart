import {Schema, model} from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  costing: {
    required: true
  },
  status: {
    type: String,
    enum: ["not paid",'pending', 'completed', 'cancelled'],
    default: 'not paid'
  }
}, { timestamps: true });
orderSchema.plugin(normalizeMongoose);
export const OrderModel = model('Order', orderSchema);