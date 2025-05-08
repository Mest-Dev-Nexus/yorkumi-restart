import e from 'express';
import Joi from 'joi';

export const shippingAddressValidation = Joi.object({
  country: Joi.string()
  .required()
  .trim()
  .min(2)
  .max(100)
  .description('Country name or code'),

region: Joi.string()
  .required()
  .trim()
  .min(1)
  .max(100)
  .description('Region, state, or province name'),

rate: Joi.number()
  .required()
  .min(0)
  .precision(2)
  .description('Shipping rate amount')
})