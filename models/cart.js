import {Schema, model} from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';




const CartSchema = new Schema({
  products: [{
    product:{type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true},
    quantity: {
      type: Number,      required: true,
    }
  },],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});
CartSchema.plugin(normalizeMongoose);
export const CartModel = model('Cart', CartSchema);