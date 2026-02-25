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

    const options = {
      folder,
      resource_type: resourceType,
      overwrite: false
    };
    
    // 🔥 Appliquer transformation uniquement aux images classiques
    if (resourceType === "image" && !folder.includes("dishes")) {
      options.transformation = [
        { width: 1600, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
        { dpr: "auto" }
      ];
    }
    
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};
