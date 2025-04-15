import Joi from "joi"

export const vendorValidationSchema = Joi.object({
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    }),
    username: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Username must be at least 2 characters',
      'string.max': 'Username cannot exceed 50 characters',
      'string.empty': 'Username cannot be empty',
      'any.required': 'Username is required'
    }),
    image: Joi.string()
    .messages({
      'string.empty': 'Image URL cannot be empty',
    }),
    role: Joi.string()
    .valid('vendor')
    .default('vendor')
    .messages({
      'any.only': 'Role must be  "vendor" '
    }),
  });

  export const vendorloginValidationSchema = Joi.object({
    email: Joi.string()
    .email({ minDomainSegments: 2 })
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email cannot be empty',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'string.empty': 'Password cannot be empty',
      'any.required': 'Password is required'
    })
  });