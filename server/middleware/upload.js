import multer from "multer";
import fs from "fs";
import path from "path";

export function dishImageUpload(slug) {
  const dir = path.join("uploads", slug, "images");

  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + ext);
    }
  });

  return multer({ storage });
}

export function dishModelUpload(slug) {
    const dir = `uploads/${slug}/models`;
  
    fs.mkdirSync(dir, { recursive: true });
  
    const storage = multer.diskStorage({
      destination: dir,
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
      }
    });
  
    return multer({ storage });
  }
  
