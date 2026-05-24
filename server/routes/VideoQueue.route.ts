import express, { Request, Response } from "express";
import { uploadVideoQueue } from "../controllers/video/videoQueue.controller";
import { upload } from "../middleware/upload.middleware";
import cors from "cors";

const router = express.Router();

// Serve static files from the 'tempHLS' directory
router.use("/videos", express.static("tempHLS"));
router.use("/tempThumbnails", express.static("tempThumbnails"));

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a video file (Queue-based processing)
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               channelId:
 *                 type: string
 *                 description: ID of the channel uploading the video
 *               title:
 *                 type: string
 *                 description: Title of the video
 *               description:
 *                 type: string
 *                 description: Description of the video
 *               category:
 *                 type: string
 *                 description: Category of the video
 *               thumbnail:
 *                 type: string
 *                 description: Thumbnail URL or path
 */
router.post("/upload", upload.single("video"), uploadVideoQueue as any);

export default router;
