import Joi from 'joi';

export const orderItemValidation = Joi.object({
  product: Joi.string().required().messages({
    'string.base': 'Product ID must be a string.',
    'any.required': 'Product ID is required.',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number.',
    'number.integer': 'Quantity must be an integer.',
    'number.min': 'Quantity must be at least 1.',
    'any.required': 'Quantity is required.',
  }),
});

