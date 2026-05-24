import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import { videoTranscodingQueue } from "../../config/queue.config";
import { redisClient } from "../../database/redisClient";
import { uploadToAzure } from "../../helpers/uploadToAzure.helper";

export const uploadVideoQueue = async (req: Request, res: Response) => {
  const uniqueId = uuid();
  const { channelId, title, description, category, thumbnail } = req.body;

  // Set headers to enable chunked transfer encoding
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flush && res.flush();

  const sendProgress = (stage: string, progress: number) => {
    res.write(JSON.stringify({ stage, progress }) + "\n");
    res.flush && res.flush();
  };

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const FULL_FILE_NAME = `${req.body.title}${path.extname(
      req.file.originalname
    )}`;

    // Send initial progress
    sendProgress("upload", 10);

    // Upload raw video to Azure Blob Storage in "raw-vids" container
    sendProgress("upload", 20);
    const videoUrl = await uploadToAzure("raw-vids", req.file.path, uniqueId);
    sendProgress("upload", 30);

    // Add job to the transcoding queue
    const job = await videoTranscodingQueue.add("transcode-video", {
      uniqueId,
      videoUrl, // Either cloud storage URL or local file path
      fileName: FULL_FILE_NAME,
      channelId,
      title,
      description,
      category,
      thumbnail,
    });

    sendProgress("queued", 20);

    console.log(`📤 Video upload queued with job ID: ${job.id}`);

    // Poll for job completion
    const pollForCompletion = async () => {
      const maxAttempts = 300; // 5 minutes max (1 second intervals)
      let attempts = 0;

      const poll = async () => {
        attempts++;

        // Check Redis for completion data
        const completionData = await redisClient.get(`transcoding:${uniqueId}`);

        if (completionData) {
          const data = JSON.parse(completionData);

          if (data.status === "completed") {
            sendProgress("complete", 100);
            res.end();
            return;
          } else if (data.status === "failed") {
            res.write(
              JSON.stringify({
                error: "Video processing failed",
                details: data.error,
              })
            );
            res.end();
            return;
          }
        }

        // Check job progress
        const jobData = await videoTranscodingQueue.getJob(job.id);
        if (jobData) {
          const progress = jobData.progress();
          if (typeof progress === "number") {
            sendProgress("processing", Math.max(20, progress));
          }
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          res.write(
            JSON.stringify({
              error: "Video processing timeout",
              details: "Processing took longer than expected",
            })
          );
          res.end();
        }
      };

      poll();
    };

    // Start polling for completion
    pollForCompletion();
  } catch (error: any) {
    console.error("Upload error:", error);
    res.write(
      JSON.stringify({
        error: "Error queuing video for processing",
        details: error.message,
      })
    );
    res.end();
  }
};
