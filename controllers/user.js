import { UserModel } from "../models/baseuser.js";
import { RegularUserModel } from "../models/user.js";
import { userValidationSchema, userLoginValidationSchema, passwordResetValidationSchema } from "../validators/user.js";
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
    const newUser = await RegularUserModel.create({
      email: value.email,
      password: hashedPassword,
      username: value.username, 
      image: value.image,
      fullName: value.fullName,
      whatsappnumber: value.whatsappnumber,
      address: value.address,
      role: "user" // Enforce User role
    });


    // Send welcome email
    sendEmailSignup(
      newUser.email,
      "Welcome to Yorkumi",
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
    const { error, value } = userLoginValidationSchema.validate(req.body);
    if (error) {
      return res.status(422).json(error);
    }
    
    const user = await RegularUserModel.findOne({
      email: value.email,
      role: "user"
    });
    
    if (!user) {
      return res.status(409).json("User does not exist");
    }
    
    const correctPassword = bcrypt.compareSync(value.password, user.password);
    if (!correctPassword) {
      return res.status(401).json("Invalid credentials!");
    }
    
    const accessTokenLogin = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "48h" }
    );
    
    res.status(200).json({
      accessTokenLogin,
      User: {
        role: user.role,
        email: user.email,
        userId: user.id,
        fullName: user.fullName
      },
    });
  } catch (error) {
    console.error("Error during user login:", error);
    next(error);
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { error, value } = passwordResetValidationSchema.validate(req.body);
    
    if (error) {
      return res.status(422).json(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await RegularUserModel.findById(decoded.id);
    
    if (!user || user.role !== "user") {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(value.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    // Only admins should be able to get all users
    if (req.auth.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    const users = await RegularUserModel.find()
      .select('-password');
    
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Check permissions: admins can access any user, users can only access themselves
    if (req.auth.role !== "admin" && req.auth.id !== userId) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    const user = await RegularUserModel.findById(userId)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const authenticatedUserId = req.auth.id;
    const requestedUserId = req.params.id;
    
    // Check if the authenticated user is trying to update their own profile
    if (authenticatedUserId !== requestedUserId && req.auth.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile"
      });
    }
    
    const updateData = { ...req.body };
        
    // Check if a new image was uploaded
    if (req.file?.path) {
      updateData.image = req.file.path;
    }
    
    // Prevent role change through this endpoint
    delete updateData.role;
        
    // Find and update the user
    const result = await RegularUserModel.findByIdAndUpdate(requestedUserId, updateData, {
      new: true,
      runValidators: true
    }).select('-password');
    
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
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const authenticatedUserId = req.auth.id;
    const requestedUserId = req.params.id;
    
    // Check if the authenticated user is trying to delete their own profile
    // or is an admin
    if (authenticatedUserId !== requestedUserId && req.auth.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You can only delete your own profile"
      });
    }
    
    // Find and delete the user
    const result = await RegularUserModel.findByIdAndDelete(requestedUserId);
    
    if (!result) {
      return res.status(404).json({
        message: "User not found"
      });
    }
    
    return res.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};