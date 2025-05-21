import Joi from 'joi';
import { baseUserValidationSchema } from './baseuser.js';

export const adminValidationSchema = baseUserValidationSchema.keys({
  adminLevel: Joi.string()
    .valid('junior', 'senior', 'super')
    .default('junior')
    .messages({
      'any.only': 'Admin level must be either junior, senior, or super'
    }),
  
  department: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Department name must be at least 2 characters long',
      'string.max': 'Department name cannot exceed 50 characters'
    }),
  
  permissions: Joi.array()
    .items(Joi.string())
    .messages({
      'array.base': 'Permissions must be an array of strings'
    })
});