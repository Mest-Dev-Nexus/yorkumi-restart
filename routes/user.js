import {Router} from 'express';
import { deleteUser, getUserById, getUsers, loginUser, patchUser, registerUser } from '../controllers/user.js';
import { usersPictureUpload } from '../middlewares/upload.js';  // Importing correctly
import { isAuthenticated, isUserAuthorized, isVendorAuthorized } from '../middlewares/auth.js';

const userRouter = Router();

// Public routes
userRouter.post('/user/register', usersPictureUpload.single("image"), registerUser);  // Changed to match import
userRouter.post('/user/login', loginUser);

// Protected routes
userRouter.get('/user', isAuthenticated, isVendorAuthorized("vendor"), getUsers);
userRouter.get('/user/:id', isAuthenticated, isVendorAuthorized("vendor"), getUserById);
userRouter.patch('/user/:id', isAuthenticated, isUserAuthorized("user"), usersPictureUpload.single("image"), patchUser);  // Changed to match import
userRouter.delete('/:id', isAuthenticated, isUserAuthorized("user"), deleteUser);

export default userRouter;