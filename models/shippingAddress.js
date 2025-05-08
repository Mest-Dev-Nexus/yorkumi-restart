import {Schema, model} from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const shippingAddressSchema = new Schema({
  
    country: {
      type: String,
      required: true,
      trim: true
    },
    region: {
      type: String,
      required: true,
      trim: true
    },
    rate: {
      type: Number,
      required: true,
      min: 0
    }
  
})
shippingAddressSchema.plugin(normalizeMongoose);
export const ShippingAddressModel = model('ShippingAddress', shippingAddressSchema);