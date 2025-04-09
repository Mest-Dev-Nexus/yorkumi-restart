import Joi from "joi";


export const addCategoryValidator = Joi.object({
  name: Joi.string().required(),
  icon: Joi.string().required(),
  color: Joi.string().required(),
})