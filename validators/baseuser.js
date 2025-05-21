import Joi from "joi";

export const baseUserValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must only contain alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  fullName: Joi.string()
    
    .min(3)
    .max(30)
    .required()
    .messages({
      
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username cannot exceed 30 characters',
      'any.required': 'Username is required'
    }),
  
  image: Joi.string().allow('', null),
  
  role: Joi.string()
    .valid('user', 'vendor', 'admin')
    .default('user')
    .messages({
      'any.only': 'Role must be either user, vendor, or admin'
    })
});