import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/s3.config";
import fs from "fs/promises";
import path from "path";
import mime from "mime-types";

export class VideoService {
  static async uploadToFilebase(
    uniqueId: string,
    title: string
  ): Promise<string[]> {
    const projectRoot = path.resolve(__dirname, "..", "tempHLS", uniqueId);

    try {
      // Verify directory exists before proceeding
      await fs.access(projectRoot);

      // Read all directories (e.g., 360, 480, 720)
      const resolutions = await fs.readdir(projectRoot);

      if (resolutions.length === 0) {
        throw new Error("No resolution directories found in HLS directory");
      }

      const uploadResults = await Promise.all(
        resolutions.map(async (resolution) => {
          const resolutionPath = path.join(projectRoot, resolution);

          // Ensure it's a directory (to filter out non-directory files if any)
          const resolutionStats = await fs.stat(resolutionPath);
          if (!resolutionStats.isDirectory()) return;

          // Read files within the resolution folder (e.g., .m3u8 and .ts files)
          const files = await fs.readdir(resolutionPath);

          // Upload each file (e.g., playlist.m3u8 and its ts chunks)
          return Promise.all(
            files.map(async (file) => {
              const filePath = path.join(resolutionPath, file);

              // Ensure it's a file
              const fileStats = await fs.stat(filePath);
              if (!fileStats.isFile()) return;

              // Read the file content
              const fileContent = await fs.readFile(filePath);
              const contentType =
                mime.lookup(file) || "application/octet-stream";

              const uploadParams = {
                Bucket: process.env.FILEBASE_BUCKET_NAME,
                Key: `${uniqueId}/${resolution}/${file}`, // Use the resolution in the path
                Body: fileContent,
                ContentType: contentType,
              };

              if (!uploadParams.Bucket) {
                throw new Error(
                  "FILEBASE_BUCKET_NAME environment variable is not set"
                );
              }

              const command = new PutObjectCommand(uploadParams as any);
              await s3Client.send(command);

              // Return the uploaded file's URL
              return `https://${uploadParams.Bucket}.s3.filebase.com/${uniqueId}/${resolution}/${file}`;
            })
          );
        })
      );

      // Flatten the results and filter out undefined values
      return uploadResults
        .flat()
        .filter((url): url is string => url !== undefined);
    } catch (error: any) {
      console.error("Error uploading files to Filebase:", error);
      throw new Error(
        `Failed to upload HLS files to Filebase: ${error.message}`
      );
    }
  }
}
