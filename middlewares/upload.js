import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const productsPicturesUpload = multer({
  storage: new CloudinaryStorage({
      cloudinary,
      params: {
          folder: 'Yorkumi-api/pictures-upload',
      }
  })
});

export const adminPictureUpload = multer({
  storage: new CloudinaryStorage({
      cloudinary,
      params: {
          folder: 'Yorkumi/Vendor-upload',
      }
  })
})

export const usersPictureUpload = multer({
  storage: new CloudinaryStorage({
      cloudinary,
      params: {
          folder: 'Yorkumi/Users-upload',
      }
  })
})