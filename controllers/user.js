import { UserModel } from "../models/user.js";
import { userValidationSchema, userLoginValidationSchema } from "../validators/user.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmailSignup } from "../utils/mailingUser.js";

export const registerUser = async (req, res, next) => {
  const image = req.file?.path;
    
  const { error, value } = userValidationSchema.validate({
    ...req.body,
    image,
  }, { abortEarly: false });
  if (error) {
    return res.status(422).json(error);
  }

  // Check if user already exists
  const existingUser = await UserModel.findOne({
    $or: [{ username: value.username }, { email: value.email }],
  });

  if (existingUser) {
    return res.status(409).json("User already exists");
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(value.password, 10);

  // Create User with role explicitly set
  const newUser = await UserModel.create({
    email: value.email,
    password: hashedPassword,
    username: value.username, 
    image: value.image,
    lastname: value.lastname, 
    whatsappnumber: value.whatsappnumber,
    role: "user" // Enforce User role
  });

  // Send welcome email
  sendEmailSignup(
    newUser.email,
    "Welcome User to the Yorkumi",
    newUser.username,
    newUser.role
  );

  // Generate token
  const accessToken = jwt.sign(
    { id: newUser.id, role: newUser.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "24h" }
  );

  res.status(201).json({
    message: "User account created successfully!",
    accessToken,
  });
};

export const loginUser =async (req,res, next) => {
  const {error,value} =userLoginValidationSchema.validate(req.body);
  if (error) {
    return res.status(422).json(error);
  }
  const User = await UserModel.findOne({
    email : value.email
  });
  if (!User) {
    return res.status(409).json("User does not exist");
  }
  const correctPassword = bcrypt.compareSync(value.password, User.password);
  if (!correctPassword) {
    return res.status(401).json("invalid credentials!");
  }
  const accessTokenLogin = jwt.sign(
    {id: User.id},
    process.env.JWT_SECRET_KEY,
    {expiresIn : "24h"}
  );
  res.status(200).json({
    accessTokenLogin,
    User: {
      role: User.role,
      email: User.email,
      UserId: User.id
    },
  });
};
export const getUsers = async (req, res, next) =>{
  try {
   const result = await UserModel.find();
   return res.json(result);
  } catch (error) {
   next(error)
  }
 }
 export const getUserById = async (req, res, next) => {
   try {
     const result =await UserModel.findById(req.params.id);
     return res.status(200).json(result);
   } catch (error) {
     next(error)
   }
 }
 
 export const patchUser = async (req, res, next) =>{
   try {
    const authenticatedUserId = req.auth.id;
    
    // Get the User ID from the request parameters
    const requestedUserId = req.params.id;
    
    // Check if the authenticated User is trying to update their own profile
    if (authenticatedUserId !== requestedUserId) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile"
      });
    }
    const updateData = { ...req.body };
        
        // Check if a new image was uploaded
        if ( req.file?.path) {
          updateData.image = req.file?.path;
        }
        
        // Find and update the user
        const result = await UserModel.findByIdAndUpdate(req.params.id, updateData, {
          new: true,
          runValidators: true
        });
    if (!result){
     return res.status(404).json({
       message:"User not found"
     })
    }
    return res.json({
     message: "User updated successfully",
     data: result
   });
   } catch (error) {
    next(error)
   }
  }
 export const deleteUser = async (req, res, next) =>{
   try {
    const authenticatedUserId = req.auth.id;
    
    // Get the User ID from the request parameters
    const requestedUserId = req.params.id;
    
    // Check if the authenticated User is trying to delete their own profile
    if (authenticatedUserId !== requestedUserId) {
      return res.status(403).json({
        message: "Forbidden: You can only delete your own profile"
      });
    }
    const result = await UserModel.findByIdAndDelete(req.params.id);
    if (!result){
     return res.status(404).json({
       message:"User not found"
     })
    }
    return res.json({
     message: "User deleted successfully"
   });
   } catch (error) {
    next(error)
   }
  }