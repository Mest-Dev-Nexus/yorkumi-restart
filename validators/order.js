import Joi from 'joi';

export const orderValidationSchema = Joi.object({
  
  shippingAddress1: Joi.string().required(),
  shippingAddress2: Joi.string().optional().allow('', null),
  city: Joi.string().required(),
  country: Joi.string().required(),
  phoneNumber: Joi.number().required(),
  status: Joi.string()
    .valid('pending', 'shipped', 'delivered', 'cancelled')
    .default('pending'),
  totalPrice: Joi.number().positive().required(),
  shippingFee: Joi.number().optional(),
  internationalShippingRequired: Joi.boolean().optional(),
  user: Joi.string().required(),
  
});