import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
name: {type: String, required:true},
icon: {type: String, required:true},
color: {type: String, required:true},
})


export const CategoryModel = mongoose.model("Category", categorySchema)