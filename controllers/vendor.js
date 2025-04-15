import { VendorModel } from "../models/vendor.js";
import { vendorValidationSchema, vendorloginValidationSchema } from "../validators/vendor.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmailSignup } from "../utils/mailingVendor.js";



export const registerVendor = async (req, res, next) => {
  const image = req.file?.path;
    
  const { error, value } = vendorValidationSchema.validate({
    ...req.body,
    image,
  }, { abortEarly: false });
  if (error) {
    return res.status(422).json(error);
  }

  // Check if Vendor already exists
  const existingVendor = await VendorModel.findOne({
    $or: [{ username: value.username }, { email: value.email }],
  });

  if (existingVendor) {
    return res.status(409).json("Vendor already exists");
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(value.password, 10);

  // Create Vendor with role explicitly set
  const newVendor = await VendorModel.create({
    email: value.email,
    password: hashedPassword,
    username: value.username, 
    image: value.image,
    lastname: value.lastname, 
    role: "vendor" // Enforce User role
  });

  // Send welcome email
  sendEmailSignup(
    newVendor.email,
    "Welcome Vendor to your Website",
    newVendor.username,
    newVendor.role
  );

  // Generate token
  const accessToken = jwt.sign(
    { id: newVendor.id, role: newVendor.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "24h" }
  );

  res.status(201).json({
    message: "Vendor account created successfully!",
    accessToken,
  });
};

export const loginVendor =async (req,res, next) => {
  const {error,value} =vendorloginValidationSchema.validate(req.body);
  if (error) {
    return res.status(422).json(error);
  }
  const Vendor = await VendorModel.findOne({
    email : value.email
  });
  if (!Vendor) {
    return res.status(409).json("Vendor does not exist");
  }
  const correctPassword = bcrypt.compareSync(value.password, Vendor.password);
  if (!correctPassword) {
    return res.status(401).json("invalid credentials!");
  }
  const accessTokenLogin = jwt.sign(
    {id: Vendor.id},
    process.env.JWT_SECRET_KEY,
    {expiresIn : "24h"}
  );
  res.status(200).json({
    accessTokenLogin,
    Vendor: {
      role: Vendor.role,
      email: Vendor.email,
      VendorId: Vendor.id
    },
  });
};

export const getVendor = async (req, res, next) =>{
  try {
   const result = await VendorModel.find();
   return res.json(result);
  } catch (error) {
   next(error)
  }
 }
 export const getVendorById = async (req, res, next) => {
   try {
     const result =await VendorModel.findById(req.params.id);
     return res.status(200).json(result);
   } catch (error) {
     next(error)
   }
 }
 
 export const patchVendor = async (req, res, next) =>{
   try {
    const authenticatedVendorId = req.auth.id;
    
    // Get the Vendor ID from the request parameters
    const requestedVendorId = req.params.id;
    
    // Check if the authenticated Vendor is trying to update their own profile
    if (authenticatedVendorId !== requestedVendorId) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile"
      });
    }
    
    const updateData = { ...req.body };
        
        // Check if a new image was uploaded
        if ( req.file?.path) {
          updateData.image = req.file?.path;
        }
        
        // Find and update the Vendor
        const result = await VendorModel.findByIdAndUpdate(req.params.id, updateData, {
          new: true,
          runValidators: true
        });
    if (!result){
     return res.status(404).json({
       message:"Vendor not found"
     })
    }
    return res.json({
     message: "Vendor updated successfully",
     data: result
   });
   } catch (error) {
    next(error)
   }
  }
 export const deleteVendor = async (req, res, next) =>{
   try {
    const authenticatedVendorId = req.auth.id;
    
    // Get the Vendor ID from the request parameters
    const requestedVendorId = req.params.id;
    
    // Check if the authenticated Vendor is trying to delete their own profile
    if (authenticatedVendorId !== requestedVendorId) {
      return res.status(403).json({
        message: "Forbidden: You can only Dlete your own profile"
      });
    }
    const result = await VendorModel.findByIdAndDelete(req.params.id);
    if (!result){
     return res.status(404).json({
       message:"Vendor not found"
     })
    }
    return res.json({
     message: "Vendor deleted successfully"
   });
   } catch (error) {
    next(error)
   }
  }