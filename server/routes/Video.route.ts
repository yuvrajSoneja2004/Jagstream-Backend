import express, { Request, Response } from "express";
import { uploadVideo } from "../controllers/video/video.controller";
import { upload, uploadThumbnail } from "../middleware/upload.middleware";
import { generateThumbnails } from "../controllers/video/generateThumbnail.controller";
import { getVideos } from "../controllers/video/getVideos.controller";
import { getMetaData } from "../controllers/video/getMetaData.controller";
import { getUpNextVideos } from "../controllers/video/getUpNextVideos.controller";
import { getChannelVideos } from "../controllers/video/getChannelVideos.controller";
import { likeVideo } from "../controllers/video/likeVideo.controller";
import { updateVideoWatchedDuration } from "../controllers/video/updateVideoWatchedDuration.controller";
import { getUserLikedVideos } from "../controllers/video/getUserLikedVideos.controller";
import { uploadRawVideoQueue } from "../queues/transcodeVideo.queue";
import { randomUUID } from "crypto";
import path from "path";
import { blobServiceClient } from "../config/blob.config";
import multer from "multer";
import { transcodeVideoEvents } from "../config/queueevents.config";
import { QueueEvents } from "bullmq";

const router = express.Router();

// Blob storage configuration
const blobContainerClient = blobServiceClient.getContainerClient("raw-vids");
const uploadBlob = multer({ storage: multer.memoryStorage() }); // store in memory for direct upload

// Upload handler function
const uploadVideoHandler = async (req: Request, res: Response) => {
  const uniqueId = randomUUID();
  const rawVideo = req.file;

  const { channelId, title, description, category, thumbnail } = req.body;

  try {
    if (!rawVideo) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const FULL_FILE_NAME = `${req.body.title}${path.extname(
      rawVideo.originalname
    )}`;

    if (req.body.title === undefined) {
      return res.status(400).json({ error: "File name is undefined" });
    }

    // Upload Raw video to blob storage
    const blobName = `${uniqueId}/${FULL_FILE_NAME}`;
    const blockBlobClient = blobContainerClient.getBlockBlobClient(blobName);

    // Upload from memory buffer
    await blockBlobClient.uploadData(rawVideo.buffer, {
      blobHTTPHeaders: { blobContentType: rawVideo.mimetype }, // preserve content type
    });

    // Once raw video is uploaded, add job to process it
    const job = await uploadRawVideoQueue.add("transcode-job", {
      uniqueId,
      channelId,
      title,
      description,
      category,
      thumbnail,
      blobName, // pass the blob name for processing
    });

    console.log(`Job ${job.id} added to the queue`);

    res.json({
      message: "Upload successful",
      path: blobName,
      jobId: job.id,
      uniqueId: uniqueId,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Error uploading video" });
  }
};

// Serve static files from the 'tempThumbnails' directory
router.use("/tempThumbnails", express.static("tempThumbnails"));

/**
 * @swgetagger
 * /getVideos:
 *   :
 *     summary: Get a list of videos
 *     tags: [Videos]
 */
router.post("/getVideos", getVideos as any);
//test
/**
 * @swagger
 * /getChannelVideos/{channelId}:
 *   get:
 *     summary: Get videos for a specific channel by channel ID
 *     tags: [Videos]
 *     parameters:
 *       - name: channelId
 *         in: path
 *         required: true
 *         description: ID of the channel
 *         schema:
 *           type: string
 */
router.get("/getChannelVideos/:channelId", getChannelVideos as any);

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Upload a video file
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
 */
router.post("/upload", uploadBlob.single("video"), uploadVideoHandler as any);

// SSE endpoint for upload progress
// SSE endpoint for real-time progress updates
router.get("/upload-progress/:jobId", (req: Request, res: Response) => {
  const { jobId } = req.params;

  // Set SSE headers with aggressive anti-buffering
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Nginx
    "Content-Encoding": "identity",
  });

  // Send initial connection message with flush
  const sendMessage = (data: any) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      // Force immediate send
      if (res.flush && typeof res.flush === "function") {
        res.flush();
      }
    } catch (error) {
      console.error(`Error sending SSE message:`, error);
    }
  };

  sendMessage({
    status: "connected",
    message: "Connected to progress stream",
    jobId: jobId,
  });

  let isConnectionClosed = false;
  let lastProgress = -1;
  let pollCount = 0;

  // Fast polling approach (every 500ms) as primary method
  const pollInterval = setInterval(async () => {
    if (isConnectionClosed) {
      clearInterval(pollInterval);
      return;
    }

    pollCount++;
    console.log(`Poll #${pollCount} for job ${jobId}`);

    try {
      const job = await uploadRawVideoQueue.getJob(jobId);

      if (!job) {
        console.log(`Job ${jobId} not found`);
        sendMessage({
          jobId: jobId,
          status: "not_found",
          progress: 0,
          message: "Uploaded Successfully",
        });
        cleanup();
        return;
      }

      const jobState = await job.getState();
      const progress = Math.round(Number(job.progress) || 0);

      console.log(
        `Poll #${pollCount}: Job ${jobId} state=${jobState}, progress=${progress}%`
      );

      // Only send if progress changed
      if (
        progress !== lastProgress ||
        jobState === "completed" ||
        jobState === "failed"
      ) {
        let status = "processing";
        let message = "";

        if (progress <= 5) {
          status = "initializing";
          message = "Starting processing...";
        } else if (progress <= 15) {
          status = "downloading";
          message = "Downloading video...";
        } else if (progress <= 70) {
          status = "transcoding";
          message = "Transcoding video...";
        } else if (progress <= 80) {
          status = "uploading";
          message = "Uploading HLS files...";
        } else if (progress <= 95) {
          status = "finalizing";
          message = "Finalizing...";
        } else if (progress < 100) {
          status = "completing";
          message = "Almost done...";
        }

        if (jobState === "completed") {
          status = "completed";
          message = "Video processing completed successfully!";
          sendMessage({
            jobId: jobId,
            status: status,
            progress: 100,
            message: message,
          });
          console.log(`Job ${jobId} completed - closing connection`);
          cleanup();
          return;
        } else if (jobState === "failed") {
          status = "failed";
          message = "Video processing failed. Please try again.";
          sendMessage({
            jobId: jobId,
            status: status,
            progress: 0,
            message: message,
            error: job.failedReason,
          });
          console.log(`Job ${jobId} failed - closing connection`);
          cleanup();
          return;
        } else {
          // Send progress update
          sendMessage({
            jobId: jobId,
            status: status,
            progress: progress,
            message: message,
          });

          lastProgress = progress;
          console.log(`Sent progress update: ${progress}% for job ${jobId}`);
        }
      } else {
        console.log(`No progress change for job ${jobId} (still ${progress}%)`);
      }
    } catch (error) {
      console.error(`Error polling job ${jobId}:`, error);
      sendMessage({
        jobId: jobId,
        status: "error",
        progress: 0,
        message: "Error checking job status",
      });
    }
  }, 500); // Poll every 500ms for more responsive updates

  // Cleanup function
  const cleanup = () => {
    if (isConnectionClosed) return;

    isConnectionClosed = true;
    console.log(`Cleaning up SSE connection for job ${jobId}`);

    clearInterval(pollInterval);

    try {
      res.end();
    } catch (error) {
      console.error(`Error ending response for job ${jobId}:`, error);
    }
  };

  // Handle client disconnect
  req.on("close", () => {
    console.log(`Client disconnected for job ${jobId}`);
    cleanup();
  });

  req.on("error", (error) => {
    console.error(`SSE connection error for job ${jobId}:`, error);
    cleanup();
  });

  // Set a maximum connection time (10 minutes)
  setTimeout(() => {
    if (!isConnectionClosed) {
      console.log(`SSE connection timeout for job ${jobId}`);
      sendMessage({
        jobId: jobId,
        status: "timeout",
        progress: 0,
        message: "Connection timeout",
      });
      cleanup();
    }
  }, 10 * 60 * 1000);
});

// Helper function to get status messages
function getStatusMessage(status: string, progress: number): string {
  switch (status) {
    case "queued":
      return "Video queued for processing...";
    case "transcoding":
      return `Transcoding video... ${progress}%`;
    case "uploading":
      return `Uploading processed video... ${progress}%`;
    case "completed":
      return "Upload completed successfully!";
    case "failed":
      return "Upload failed. Please try again.";
    default:
      return `Processing... ${progress}%`;
  }
}

/**
 * @swagger
 * /generate-thumbnails:
 *   post:
 *     summary: Generate thumbnails for an uploaded video
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
 */
router.post(
  "/generate-thumbnails",
  uploadThumbnail.single("video"),
  generateThumbnails as any
);

/**
 * @swagger
 * /getMetaData/{videoUrlId}:
 *   get:
 *     summary: Get metadata for a specific video by video URL ID
 *     tags: [Videos]
 *     parameters:
 *       - name: videoUrlId
 *         in: path
 *         required: true
 *         description: URL ID of the video
 *         schema:
 *           type: string
 */
router.get("/getMetaData/:videoUrlId", getMetaData as any);

/**
 * @swagger
 * /getUpNextSuggestions/{videoUrlId}:
 *   get:
 *     summary: Get suggestions for the next videos to watch
 *     tags: [Videos]
 *     parameters:
 *       - name: videoUrlId
 *         in: path
 *         required: true
 *         description: URL ID of the video
 *         schema:
 *           type: string
 */
router.get("/getUpNextSuggestions/:videoUrlId", getUpNextVideos as any);

/**
 * @swagger
 * /updateVideoWatchedDuration/{userId}:
 *   put:
 *     summary: Update the watched duration for a video
 *     tags: [Videos]
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         description: ID of the user
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               duration:
 *                 type: number
 *                 description: Watched duration in seconds
 */
router.put(
  "/updateVideoWatchedDuration/:userId",
  updateVideoWatchedDuration as any
);

/**
 * @swagger
 * /likeVideo:
 *   post:
 *     summary: Like a video
 *     tags: [Videos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: ID of the video to like
 */
router.post("/likeVideo", likeVideo as any);
router.get("/getUserLikedVideos/:userId", getUserLikedVideos as any);

export default router;
