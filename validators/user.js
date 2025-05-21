import Joi from 'joi';
import { baseUserValidationSchema } from './baseuser.js';



// Regular user validation schema
export const userValidationSchema = baseUserValidationSchema.keys({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name cannot exceed 100 characters'
    }),
  
  whatsappnumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .messages({
      'string.pattern.base': 'Please provide a valid phone number (E.164 format recommended)'
    }),
  
  address: Joi.object({
    address1: Joi.string()
      .required()
      .messages({
        'any.required': 'Address line 1 is required'
      }),
    
    address2: Joi.string().allow('', null),
    
    city: Joi.string()
      .required()
      .messages({
        'any.required': 'City is required'
      }),
    
    country: Joi.string()
      .required()
      .messages({
        'any.required': 'Country is required'
      }),
    
    region: Joi.string()
      .required()
      .messages({
        'any.required': 'Region/State is required'
      }),
    
    postalCode: Joi.string().allow('', null)
  }).required()
});


// Login validation schema (works for all user types)
export const userLoginValidationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Password reset validation schema
export const passwordResetValidationSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must include at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords must match',
      'any.required': 'Password confirmation is required'
    })
});

