import Joi from "joi";
import mongoose from "mongoose";
import { CategoryModel } from "../models/category-model.js";


 export const addProductValidator  = Joi.object({
  title: Joi.string().required(),
  sku: Joi.number().required(),
  description: Joi.string().max(200), // Fixing the typo from "descrition" to "description"
  image: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  price: Joi.string().required(),
  category: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(), // ObjectId validation
  countInStock: Joi.number().required(),
  numReviews: Joi.number().default(0),
  isFeatured: Joi.boolean().default(false), // Fixing the camelCase from "isfeatured" to "isFeatured"
  rating: Joi.number().default(0)

});