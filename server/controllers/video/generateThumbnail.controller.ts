import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

export const generateThumbnails = async (req: Request, res: Response) => {
  try {
    // Check if the file is uploaded
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const videoPath = req.file.path;
    const outputDir = path.join(__dirname, "../../tempThumbnails");

    // Create thumbnails directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // First, get video metadata to determine proper dimensions
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.error("Error getting video metadata:", err);
        return res.status(500).json({ error: "Failed to get video metadata" });
      }

      const videoStream = metadata.streams.find(
        (stream) => stream.codec_type === "video"
      );
      if (!videoStream) {
        return res.status(500).json({ error: "No video stream found" });
      }

      const originalWidth = videoStream.width || 1920;
      const originalHeight = videoStream.height || 1080;
      const aspectRatio = originalWidth / originalHeight;

      // Calculate thumbnail dimensions while preserving aspect ratio
      // Use a maximum width of 480px, but maintain aspect ratio
      let thumbnailWidth = 480;
      let thumbnailHeight = Math.round(480 / aspectRatio);

      // If the video is very tall (mobile/vertical), use height as the constraint
      if (aspectRatio < 0.8) {
        // Vertical video
        thumbnailHeight = 640;
        thumbnailWidth = Math.round(640 * aspectRatio);
      }

      // Ensure minimum dimensions
      thumbnailWidth = Math.max(thumbnailWidth, 320);
      thumbnailHeight = Math.max(thumbnailHeight, 180);

      console.log(
        `Original video: ${originalWidth}x${originalHeight}, aspect ratio: ${aspectRatio.toFixed(
          2
        )}`
      );
      console.log(`Thumbnail dimensions: ${thumbnailWidth}x${thumbnailHeight}`);

      // Use ffmpeg to generate thumbnails with proper aspect ratio
      ffmpeg(videoPath)
        .on("filenames", (filenames) => {
          console.log("Will generate thumbnails:", filenames.join(", "));
        })
        .on("end", () => {
          console.log("Thumbnails generated");

          // Read generated thumbnails and send them back to the client
          fs.readdir(outputDir, (err, files) => {
            if (err) {
              return res
                .status(500)
                .json({ error: "Failed to read thumbnails" });
            }

            const thumbnails = files.map((file) => `/tempThumbnails/${file}`);
            res.json(thumbnails);
          });
        })
        .on("error", (err) => {
          console.error("Error generating thumbnails:", err);
          return res
            .status(500)
            .json({ error: "Failed to generate thumbnails" });
        })
        .screenshots({
          count: 3, // Number of thumbnails to generate
          folder: outputDir,
          size: `${thumbnailWidth}x${thumbnailHeight}`, // Dynamic size based on video aspect ratio
          filename: "thumbnail-%i.png", // Thumbnails will be named like 'thumbnail-1.png'
        });
    });
  } catch (error) {
    console.log("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
