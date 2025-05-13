import { Router } from "express";
import { forgotPassword } from "../utils/forgotPassword.js";
import { resetPassword } from "../controllers/user.js";

const passwordRouter = Router();

passwordRouter.post('/forgot-password', forgotPassword);

passwordRouter.post('/reset-password/:token', resetPassword);

export default passwordRouter;

