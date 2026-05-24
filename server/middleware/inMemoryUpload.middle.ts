import multer from "multer";

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const inMemoryUpload = multer({ storage });

export default inMemoryUpload;
