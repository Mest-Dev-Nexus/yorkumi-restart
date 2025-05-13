import Joi from "joi";

export const addDiscountValidator = Joi.object({
  promocode: Joi.string().required(),
  value: Joi.number().required(),
  expiryDate: Joi.date().required(),
  isActive: Joi.boolean().default(true),
  type: Joi.string().valid("percentage", "fixed").required(),
});