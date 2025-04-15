import { CategoryModel } from "../models/category-model.js";
import { addCategoryValidator } from "../validators/category-validator.js"



export const addCategory = async (req, res, next) => {
  try {
    const {error,value} = addCategoryValidator.validate(req.body,{abortEarly:false});
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail)=>detail.message)
      })}
    const result = await CategoryModel.create(value);
    return res.status(201).json({
      message: "Category successfully created",
      data: result
    })
  } catch (error) {
    next(error)
  }
}  

export const getCategories = async (req, res, next) =>{
 try {
  const {filter = '{}',sort = '{}'} = req.query;
      const result = await CategoryModel.find(JSON.parse(filter)).sort(JSON.parse(sort))
      return res.status(200).json(result);
 } catch (error) {
  next(error)
 }
}

export const patchCategory = async (req, res, next) =>{
  try {
   const result = await CategoryModel.findByIdAndUpdate(req.params.id, req.body,{
    new:true,
    runValidators:true
   });
   if (!result){
    return res.status(404).json({
      message:"Category not found"
    })
   }
   return res.json({
    message: "Category updated successfully",
    data: result
  });
  } catch (error) {
   next(error)
  }
 }
export const deleteCategory = async (req, res, next) =>{
  try {
   const result = await CategoryModel.findByIdAndDelete(req.params.id);
   if (!result){
    return res.status(404).json({
      message:"Category not found"
    })
   }
   return res.json({
    message: "Category deleted successfully"
  });
  } catch (error) {
   next(error)
  }
 }