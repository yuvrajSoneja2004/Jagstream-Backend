// src/middleware/upload.middleware.ts
import multer from "multer";
import path from "path";
import {mkdirp} from "mkdirp";


// Storage for hls files
mkdirp?.sync("temp");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp");
  },
  filename: (req, file, cb) => {
    const { title } = req.body;
    cb(null, `${title}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1000MB limit
  },
});

// Storage for hls files
mkdirp?.sync("../../tempThumbnails");
const thumbnailsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "temp");
  },
  filename: (req, file, cb) => {
    const { title } = req.body;
    cb(null, `${title}${path.extname(file.originalname)}`);
  },
});
export const uploadThumbnail = multer({
  storage: storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 1000MB limit
  },
});
