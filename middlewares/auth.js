import {expressjwt} from "express-jwt";
import { UserModel } from "../models/user.js";
import { VendorModel } from "../models/vendor.js";


export const isAuthenticated = expressjwt ({
  secret : process.env.JWT_SECRET_KEY,
  algorithms : ["HS256"],
});

export const isUserAuthorized = (role) => {
  return async (req, res, next) => {
    const user = await UserModel.findById(req.auth.id);
    if (role?.includes (user.role)) {
      next();
    }else{
      res.status(403).json("You are unauthorized!")
    }
  }
};
export const isVendorAuthorized = (role) => {
  return async (req, res, next) => {
    const user = await VendorModel.findById(req.auth.id);
    if (role?.includes (user.role)) {
      next();
    }else{
      res.status(403).json("You are unauthorized!")
    }
  }
};