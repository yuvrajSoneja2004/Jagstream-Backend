import express from "express";
import createStory from "../controllers/story/createStory.controller";
import { upload } from "../middleware/upload.middleware";
import inMemoryUpload from "../middleware/inMemoryUpload.middle";
const router = express.Router();

router.post("/createStory", inMemoryUpload.single("image"), createStory as any);

export default router;
