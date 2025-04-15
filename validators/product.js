import Joi from "joi";
import mongoose from "mongoose";
import { CategoryModel } from "../models/category-model.js";


 export const addProductValidator  = Joi.object({
  title: Joi.string().required(),
  sku: Joi.number().required(),
  description: Joi.string().max(200),
  image: Joi.string().required(),
  images: Joi.array().items(Joi.string()),
  price: Joi.string().required(),
  category: Joi.string().required(), // Simple string validation
  countInStock: Joi.number().required()
});