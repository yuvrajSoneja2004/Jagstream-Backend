import { Request, Response } from "express";
import HLSService from "../../helpers/hls.helper";
import { v4 as uuid } from "uuid";
import path from "path";
import { createDirectories } from "../../helpers/dir.helper";
import { copyFile, rm } from "fs/promises";
import { QUALITIES } from "../../config/ffmpeg.config";
import { PRISMA_CLIENT } from "../../database/prismaClient";
import { convertToGif } from "../../helpers/createGif.helper";
// import { uploadToImgBB } from "../../helpers/uploadThumbnail.helper";
import fs from "fs/promises";
import { uploadToAzure } from "../../helpers/uploadToAzure.helper";

// NOTE: This controller is no longer used. Upload logic has been moved to transcoding worker.
// Keeping this for reference but it's not active.
export const uploadVideo = async (req: Request, res: Response) => {
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

    // Total tasks: Upload, HLS processing (multiple qualities), GIF, Thumbnail, DB insert
    const totalTasks = 5; // 5 main tasks
    let completedTasks = 0;

    // Send initial upload progress (10% for upload phase)
    sendProgress("upload", 10);
    completedTasks++;

    // Create directories and get paths
    const paths = await createDirectories(uniqueId, FULL_FILE_NAME, req.file);
    sendProgress("upload", 20);
    completedTasks++;

    // Copy uploaded file to final destination
    await copyFile(req.file.path, paths.inputFilePath);
    sendProgress("upload", 30);
    completedTasks++;

    // Track individual quality progress
    const qualityProgress: { [key: string]: number } = {};
    const totalQualities = Object.keys(QUALITIES).length;

    const updateTotalProgress = () => {
      // Normalize progress across all qualities and scale to 50%
      const hlsProgress =
        (Object.values(qualityProgress).reduce(
          (acc, progress) => acc + progress,
          0
        ) /
          totalQualities) *
        0.5; // 50% of total task

      // Total progress = 30% (upload) + HLS progress (up to 50%)
      const totalProgress = 30 + hlsProgress * 100; // Convert to percentage
      sendProgress("processing", totalProgress);
    };

    // Process video into multiple qualities (HLS)
    const hlsPromises = Object.keys(QUALITIES).map((quality) => {
      const qualityDir = paths.qualities[quality];
      return fs.mkdir(qualityDir, { recursive: true }).then(() =>
        HLSService.createHLSForQuality(
          paths.inputFilePath,
          qualityDir,
          quality as keyof typeof QUALITIES,
          FULL_FILE_NAME,
          (progress: number) => {
            qualityProgress[quality] = progress / 100; // Normalize to 0-1
            updateTotalProgress();
          }
        )
      );
    });

    await Promise.all(hlsPromises);

    // Update after video processing is done (HLS conversion)
    completedTasks++;
    sendProgress("processing", 80); // 80% after video processing

    // Generate preview GIF
    const previewGif = await convertToGif({
      videoPath: req.file.path,
      outputDir: "uploads",
    });
    // Upload thumbnail
    // const thumbnailUrl = await uploadToImgBB(thumbnail);
    console.log("thumbnail 💀💀💀💀", thumbnail);

    // Convert URL to local file path
    const fileName = thumbnail.split("/").pop() || "thumbnail.png";
    const thumbnailPath = path.resolve(
      __dirname,
      "..",
      "..",
      "tempThumbnails",
      fileName
    );
    const thumbnailUrlAzure = await uploadToAzure(
      "thumbnails",
      thumbnailPath,
      uniqueId
    );
    // Update progress for GIF/Thumbnail completion
    completedTasks++;
    sendProgress("thumbnail", 90); // 90% when thumbnail is uploaded

    // Save metadata in the database
    await PRISMA_CLIENT.video.create({
      data: {
        title,
        type: category,
        description,
        thumbnailUrl: thumbnailUrlAzure,
        previewGif,
        videoUrl: uniqueId,
        uploadedBy: parseInt(channelId),
      },
    });

    // Final success response
    completedTasks++;
    sendProgress("complete", 100); // 100% when everything is done
    res.end();
  } catch (error: any) {
    // Handle errors and clean up
    try {
      await rm(path.resolve(__dirname, "..", "tempHLS", uniqueId), {
        recursive: true,
        force: true,
      });
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    console.error("Upload error:", error);
    res.write(
      JSON.stringify({
        error: "Error processing video",
        details: error.message,
      })
    );
    res.end();
  }
};
