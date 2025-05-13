// promocode, value, expiryDate, isActive, type
import { Schema, model } from 'mongoose';
import normalizeMongoose from 'normalize-mongoose';

const discountSchema = new Schema(
  {
    promocode: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
  },
  { timestamps: true }
);
discountSchema.plugin(normalizeMongoose);

export const DiscountModel = model('Discount', discountSchema);