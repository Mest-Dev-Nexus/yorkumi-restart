import { ProductModel } from "../models/product.js";
import { addProductValidator } from "../validators/product.js"
import { CategoryModel } from "../models/category-model.js";
import mongoose from "mongoose";



export const addProduct = async (req, res, next) => {
  try {
    const image = req.files?.image?.[0]?.filename;
    const images = req.files?.images?.map(file => file.filename);
    
    // First, validate category separately
    const categoryId = req.body.category;
    
    // Check if category exists in DB (do this before Joi validation)
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Invalid category ID format"]
      });
    }
    
    const categoryExists = await CategoryModel.findById(categoryId);
    if (!categoryExists) {
      return res.status(400).json({
        message: "Validation error",
        error: ["Category does not exist"]
      });
    }
    
   
    
    // Validate the rest with Joi
    const { error, value } = addProductValidator.validate({
      ...req.body,
      image,
      images
    }, { abortEarly: false });
    
    if (error) {
      return res.status(422).json({
        message: "Validation error",
        error: error.details.map((detail) => detail.message)
      });
    }
    
    // Create the product with the validated data
    const result = await ProductModel.create(value);
    
    return res.status(201).json({
      message: "Product Created Successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export const getProducts = async (req, res, next) => {
  try {
    const {filter = '{}',sort = '{}'} = req.query;
    const result = await ProductModel.find(JSON.parse(filter)).sort(JSON.parse(sort))
    return res.status(200).json(result);
  } catch (error) {
    next(error)
  }
}

export const getProductMinDeets = async(req, res, next) => {
  try {
    const {filter = '{}',sort = '{}'} = req.query;
    const result = await ProductModel.find(JSON.parse(filter)).sort(JSON.parse(sort)).select("title image price -_id")
    return res.status(200).json(result);
  } catch (error) {
    next(error)
  }
}

export const getProductById = async (req, res, next) => {
  try {
    const result =await ProductModel.findById(req.params.id).populate('category');
    return res.status(200).json(result);
  } catch (error) {
    next(error)
  }
}

export const updateProduct = async (req, res, next) => {
  try {
    // Create an update object from req.body
    const updateData = { ...req.body };
    
    // Check if category was provided in the request
    if (updateData.category) {
      // Validate category ID format
      if (!mongoose.Types.ObjectId.isValid(updateData.category)) {
        return res.status(400).json({
          message: "Validation error",
          error: ["Invalid category ID format"]
        });
      }
      
      // Check if category exists in the database
      const categoryExists = await CategoryModel.findById(updateData.category);
      if (!categoryExists) {
        return res.status(400).json({
          message: "Validation error",
          error: ["Category does not exist"]
        });
      }
    }
    
    // Handle main image upload if present
    if (req.files?.image?.[0]?.filename) {
      updateData.image = req.files.image[0].filename;
    }
    
    // Handle additional images upload if present
    if (req.files?.images?.length > 0) {
      const imageFilenames = req.files.images.map(file => file.filename);
      updateData.images = imageFilenames;
    }
    
    // Update the product with validated data
    const result = await ProductModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );
    
    // Check if product exists
    if (!result) {
      return res.status(404).json({
        message: "Product not found"
      });
    }
    
    return res.json({
      message: "Product updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


export const deleteProduct = async (req, res, next) => {
  try {
     const result = await ProductModel.findByIdAndDelete(req.params.id);
     if (!result){
      return res.status(404).json({
        message:"Product not found"
      })
     }
     return res.json({
      message: "Product deleted successfully"
    });
    } catch (error) {
     next(error)
    }
}

export const productCount = async (req, res, next) => {
  try {
    const result = await ProductModel.countDocuments();

    if (result === 0) {
      return res.status(404).json({ message: "There are no products to count" });
    }

    res.status(200).json({ count: result });
  } catch (error) {
    next(error);
  }
};
export const featuredProduct = async (req, res, next) => {
  try {
    const result = await ProductModel.find({isFeatured:true}).limit(5);

    if (result === 0) {
      return res.status(404).json({ message: "There are no products to feature" });
    }

    res.status(200).json({ count: result });
  } catch (error) {
    next(error);
  }
};
