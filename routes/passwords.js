import { Router } from "express";
import { forgotPassword } from "../utils/forgotPassword.js";
import { resetUserPassword } from "../controllers/user.js";
import { resetAdminPassword } from "../controllers/admin.js";

const passwordRouter = Router();

passwordRouter.post('/forgot-password', forgotPassword);

passwordRouter.post('/reset-password/:token', resetUserPassword);
passwordRouter.post('/reset-password/:token', resetAdminPassword);

export default passwordRouter;

