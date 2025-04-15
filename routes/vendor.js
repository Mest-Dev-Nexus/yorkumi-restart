import {Router} from 'express';
import { loginVendor, getVendor, getVendorById, patchVendor, registerVendor, deleteVendor } from '../controllers/vendor.js';
import { vendorPictureUpload } from '../middlewares/upload.js';
import { isAuthenticated,isUserAuthorized,isVendorAuthorized } from '../middlewares/auth.js';


const vendorRouter = Router();

// Public routes
vendorRouter.post('/vendor/register', vendorPictureUpload.single("image"), registerVendor);
vendorRouter.post('/vendor/login', loginVendor);

// Protected routes
vendorRouter.get('/vendor', isAuthenticated, isVendorAuthorized("vendor"), getVendor); // Admin only - get all vendors
vendorRouter.get('/vendor/:id', isAuthenticated, isUserAuthorized('user'),getVendorById);    // Get vendor by ID (for profile)
vendorRouter.patch('/vendor/:id', isAuthenticated,isVendorAuthorized("vendor"), vendorPictureUpload.single("image"), patchVendor); // Update vendor
vendorRouter.delete('/:id', isAuthenticated,isVendorAuthorized("vendor"), deleteVendor);  // Delete vendor

export default vendorRouter;