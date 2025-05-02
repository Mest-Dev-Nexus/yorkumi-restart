import { UserModel } from "../models/user.js";
import { CartModel } from "../models/cart.js"; // Import the CartModel
import { userValidationSchema, userLoginValidationSchema } from "../validators/user.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmailSignup } from "../utils/mailingUser.js";

export const registerUser = async (req, res, next) => {
  try {
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
      whatsappnumber: value.whatsappnumber, // Make sure this matches your schema
      role: "user" // Enforce User role
    });

    // Create an empty cart for the new user
    const newCart = await CartModel.create({
      products: [],
      user: newUser._id,
      totalPrice: 0
    });
    
    // Update the user with the cart reference
    const updatedUser = await UserModel.findByIdAndUpdate(
      newUser._id,
      { cart: newCart._id },
      { new: true }
    );

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
  } catch (error) {
    console.error("Error during user registration:", error);
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const {error, value} = userLoginValidationSchema.validate(req.body);
    if (error) {
      return res.status(422).json(error);
    }
    
    const user = await UserModel.findOne({
      email: value.email
    });
    
    if (!user) {
      return res.status(409).json("User does not exist");
    }
    
    const correctPassword = bcrypt.compareSync(value.password, user.password);
    if (!correctPassword) {
      return res.status(401).json("invalid credentials!");
    }
    
    // Check if user has a cart, create one if not
    const existingCart = await CartModel.findOne({ user: user._id });
    if (!existingCart) {
      // Create a new cart for the user if they don't have one
      const newCart = new CartModel({
        products: [],
        user: user._id,
        totalPrice: 0
      });
      
      await newCart.save();
    }
    
    const accessTokenLogin = jwt.sign(
      {id: user.id, role: user.role},
      process.env.JWT_SECRET_KEY,
      {expiresIn: "24h"}
    );
    
    res.status(200).json({
      accessTokenLogin,
      User: {
        role: user.role,
        email: user.email,
        UserId: user.id
      },
    });
  } catch (error) {
    console.error("Error during user login:", error);
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    
    
    // Find user by ID and populate the cart field
    const user = await UserModel.find()
      .populate('cart')
      .select('-password'); // Exclude password from the response
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Find user by ID and populate the cart field
    const user = await UserModel.findById(userId)
      .populate('cart')
      .select('-password'); // Exclude password from the response
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};
 
export const patchUser = async (req, res, next) => {
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
    if (req.file?.path) {
      updateData.image = req.file?.path;
    }
        
    // Find and update the user
    const result = await UserModel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    if (!result) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    
    return res.json({
      message: "User updated successfully",
      data: result
    });
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (req, res, next) => {
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
    
    // Find and delete the user's cart first
    await CartModel.findOneAndDelete({ user: req.params.id });
    
    // Then delete the user
    const result = await UserModel.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    
    return res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error)
  }
}