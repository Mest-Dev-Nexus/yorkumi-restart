import { UserModel } from "../models/baseuser.js";
import { AdminModel } from "../models/admin.js";
import { adminValidationSchema} from "../validators/admin.js";
import { userLoginValidationSchema, passwordResetValidationSchema  } from "../validators/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendEmailSignup } from "../utils/mailingAdmin.js";

export const registerAdmin = async (req, res, next) => {
  try {
    const image = req.file?.path;
      
    const { error, value } = adminValidationSchema.validate({
      ...req.body,
      image,
    }, { abortEarly: false });
    
    if (error) {
      return res.status(422).json(error);
    }

    // Check if admin already exists
    const existingAdmin = await UserModel.findOne({
      $or: [{ username: value.username }, { email: value.email }],
    });

    if (existingAdmin) {
      return res.status(409).json("Admin already exists");
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(value.password, 10);

    // Create Admin with role explicitly set
    const newAdmin = await AdminModel.create({
      email: value.email,
      password: hashedPassword,
      username: value.username, 
      image: value.image,
      fullName: value.fullName,
      adminLevel: value.adminLevel || 'junior',
      role: "admin" // Enforce Admin role
    });

    // Send welcome email
    sendEmailSignup(
      newAdmin.email,
      "Welcome Admin to the Yorkumi",
      newAdmin.username,
      newAdmin.role
    );

    // Generate token
    const accessToken = jwt.sign(
      { id: newAdmin.id, role: newAdmin.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Admin account created successfully!",
      accessToken,
    });
  } catch (error) {
    console.error("Error during admin registration:", error);
    next(error);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { error, value } = userLoginValidationSchema.validate(req.body);
    console.log(req.body);
    if (error) {
      return res.status(422).json(error);
    }
    
    const admin = await AdminModel.findOne({
      email: value.email,
      role: "admin"
    });
    
    if (!admin) {
      return res.status(409).json("Admin does not exist");
    }
    
    const correctPassword = bcrypt.compareSync(value.password, admin.password);
    if (!correctPassword) {
      return res.status(401).json("Invalid credentials!");
    }
    
    const accessTokenLogin = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "24h" }
    );
    
    res.status(200).json({
      accessTokenLogin,
      Admin: {
        role: admin.role,
        email: admin.email,
        adminId: admin.id,
        adminLevel: admin.adminLevel,
        permissions: admin.permissions
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    next(error);
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { error, value } = passwordResetValidationSchema.validate(req.body);
    
    if (error) {
      return res.status(422).json(error);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminModel.findById(decoded.id);
    
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const hashedPassword = await bcrypt.hash(value.newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

export const getAllAdmins = async (req, res, next) => {
  try {
    // Only super admins can view all admins
    if (req.auth.role !== "admin" || !req.auth.adminLevel === "super") {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    const admins = await AdminModel.find()
      .select('-password');
    
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    next(error);
  }
};

export const getAdminById = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    
    // Check permissions
    if (req.auth.role !== "admin" && req.auth.id !== adminId) {
      return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
    
    const admin = await AdminModel.findById(adminId)
      .select('-password');
    
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    res.status(200).json(admin);
  } catch (error) {
    console.error("Error fetching admin:", error);
    next(error);
  }
};

export const updateAdmin = async (req, res, next) => {
  try {
    const authenticatedUserId = req.auth.id;
    const requestedAdminId = req.params.id;
    
    // Check if the authenticated user is trying to update their own profile
    // or is a super admin
    if (authenticatedUserId !== requestedAdminId && 
        !(req.auth.role === "admin" && req.auth.adminLevel === "super")) {
      return res.status(403).json({
        message: "Forbidden: You can only update your own profile or need super admin privileges"
      });
    }
    
    const updateData = { ...req.body };
        
    // Check if a new image was uploaded
    if (req.file?.path) {
      updateData.image = req.file.path;
    }
    
    // Prevent role change through this endpoint
    delete updateData.adminLevel;
        
    // Find and update the admin
    const result = await AdminModel.findByIdAndUpdate(requestedAdminId, updateData, {
      new: true,
      runValidators: true
    }).select('-password');
    
    if (!result) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }
    
    return res.json({
      message: "Admin updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (req, res, next) => {
  try {
    const authenticatedUserId = req.auth.id;
    const requestedAdminId = req.params.id;
    
    // Only super admins can delete other admins
    // Regular admins can only delete themselves
    if (authenticatedUserId !== requestedAdminId && 
        !(req.auth.role === "admin" && req.auth.adminLevel === "super")) {
      return res.status(403).json({
        message: "Forbidden: You can only delete your own profile or need super admin privileges"
      });
    }
    
    // Delete the admin
    const result = await AdminModel.findByIdAndDelete(requestedAdminId);
    
    if (!result) {
      return res.status(404).json({
        message: "Admin not found"
      });
    }
    
    return res.json({
      message: "Admin deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};