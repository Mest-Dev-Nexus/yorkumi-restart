
import mongoose from "mongoose";


const productSchema = mongoose.Schema({
  title: {type:String, required:true,},
  sku: {type: Number, required:true},
  descrition: {type:String, max:200},
  image:{type:String, required:true},
  images:[{type:String}],
  price:{type:String,required:true},
  category: {type: mongoose.Schema.Types.ObjectId, ref: "Category"},
  countInStock: {type:Number, required:true}
})

export const ProductModel= mongoose.model('Product',productSchema )