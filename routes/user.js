import {Router} from 'express';
import { deleteUser, getUserById, getUsers, loginUser, patchUser, registerUser } from '../controllers/user.js';
import { usersPictureUpload } from '../middlewares/upload.js';
import { isAuthenticated, isUserAuthorized, isVendorAuthorized } from '../middlewares/auth.js';

const userRouter = Router();

// Public routes
userRouter.post('/user/register', usersPictureUpload.single("image"), registerUser);
userRouter.post('/user/login', loginUser);

// Protected routes
userRouter.get('/user',  getUsers);
userRouter.get('/user/:id', isAuthenticated, isVendorAuthorized("vendor"),isUserAuthorized("user"), getUserById);
userRouter.patch('/user/:id', isAuthenticated, isUserAuthorized("user"), usersPictureUpload.single("image"), patchUser);
userRouter.delete('/user/:id', isAuthenticated, isUserAuthorized("user"), deleteUser);

export default userRouter;