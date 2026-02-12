import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

/* ==============================
   MEMORY STORAGE (no disk)
============================== */

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});

/* ==============================
   CLOUDINARY UPLOAD
============================== */

export const uploadToCloudinary = (
  fileBuffer,
  folder,
  resourceType = "image"
) => {


  return new Promise((resolve, reject) => {

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        overwrite: false,
        transformation:
          resourceType === "image"
            ? [
                { width: 1600, crop: "limit" }, // max largeur
                { quality: "auto:good" },       // compression intelligente
                { fetch_format: "auto" },
                { dpr: "auto" }
              ]
            : undefined
      },
    
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
