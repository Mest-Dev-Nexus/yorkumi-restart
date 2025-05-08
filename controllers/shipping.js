import { ShippingAddressModel } from "../models/shippingAddress.js";
import { shippingAddressValidation } from "../validators/shippingAddress.js"



export const addShipping = async (req, res, next) => {
  try {
    const {error,value} = shippingAddressValidation.validate(req.body,{abortEarly:false});
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail)=>detail.message)
      })}
    const result = await ShippingAddressModel.create(value);
    return res.status(201).json({
      message: "Shipping successfully created",
      data: result
    })
  } catch (error) {
    next(error)
  }
}  

export const getShipping = async (req, res, next) =>{
 try {
  const {filter = '{}',sort = '{}'} = req.query;
      const result = await ShippingAddressModel.find(JSON.parse(filter)).sort(JSON.parse(sort))
      return res.status(200).json(result);
 } catch (error) {
  next(error)
 }
}

export const patchShipping = async (req, res, next) =>{
  try {
   const result = await ShippingAddressModel.findByIdAndUpdate(req.params.id, req.body,{
    new:true,
    runValidators:true
   });
   if (!result){
    return res.status(404).json({
      message:"Shipping not found"
    })
   }
   return res.json({
    message: "Shipping updated successfully",
    data: result
  });
  } catch (error) {
   next(error)
  }
 }
export const deleteShipping = async (req, res, next) =>{
  try {
   const result = await ShippingAddressModel.findByIdAndDelete(req.params.id);
   if (!result){
    return res.status(404).json({
      message:"Shipping not found"
    })
   }
   return res.json({
    message: "Shipping deleted successfully"
  });
  } catch (error) {
   next(error)
  }
 }