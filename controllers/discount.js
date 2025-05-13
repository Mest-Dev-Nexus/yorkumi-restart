import { DiscountModel } from "../models/discount.js";
import { addDiscountValidator } from "../validators/discount.js"



export const addDiscount = async (req, res, next) => {
  try {
    const { error, value } = addDiscountValidator.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail) => detail.message)
      });
    }
    const result = await DiscountModel.create(value);
    return res.status(201).json({
      message: "Discount successfully created",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const getDiscounts = async (req, res, next) =>{
 try {
  const {filter = '{}',sort = '{}'} = req.query;
      const result = await DiscountModel.find(JSON.parse(filter)).sort(JSON.parse(sort))
      return res.status(200).json(result);
 } catch (error) {
  next(error)
 }
}

export const patchDiscount = async (req, res, next) => {
  try {
    const result = await DiscountModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }); 
    if (!result) {
      return res.status(404).json({
        message: "Discount not found"
      })
    }
    return res.json({
      message: "Discount updated successfully",
      data: result
    }); 
  }
  catch (error) {
    next(error)
  }};

  export const deleteDiscount = async (req, res, next) => {
    try {
      const result = await DiscountModel.findByIdAndDelete(req.params.id);
      if (!result) {
        return res.status(404).json({
          message: "Discount not found"
        })
      }
      return res.json({
        message: "Discount deleted successfully"
      });
    } catch (error) {
      next(error)
    }
  }
  
