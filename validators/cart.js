import Joi from 'joi';

// Create Joi schema that matches the Mongoose Cart model
export const cartValidationSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      product: Joi.string()
        .length(24)
        .hex()
        .required()
        .messages({
          'any.required': 'Product ID is required',
          'string.length': 'Product ID must be 24 characters',
          'string.hex': 'Product ID must be a valid hexadecimal string',
        }),

      quantity: Joi.number()
        .integer()
        .min(1)
        .required()
        .messages({
          'number.base': 'Quantity must be a number',
          'number.integer': 'Quantity must be an integer',
          'number.min': 'Quantity must be at least 1',
          'any.required': 'Quantity is required',
        }),
    })
  ).min(1).required().messages({
    'array.min': 'Cart must contain at least one product',
    'any.required': 'Products array is required',
  }),
  
  user: Joi.string()
    .allow(null)
    .messages({
      'string.base': 'User ID must be a string',
    }),
  
  totalPrice: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Total price must be a number',
      'number.positive': 'Total price must be positive',
      'any.required': 'Total price is required',
    }),
});

