import { blobServiceClient } from "../config/blob.config";
import fs from "fs";

export const uploadToAzure = async (
  container: string,
  thumbnail: string,
  videoId: string
) => {
  try {
    // Validate thumbnail parameter
    if (!thumbnail || typeof thumbnail !== "string") {
      throw new Error("Thumbnail path is required and must be a string");
    }

    console.log("thumbnail 🐢🐢🐢🐢", thumbnail);

    // Check if file exists
    if (!fs.existsSync(thumbnail)) {
      throw new Error(`Thumbnail file does not exist: ${thumbnail}`);
    }

    const containerClient = blobServiceClient.getContainerClient(container);
    const fileName = videoId;

    if (!fileName) {
      throw new Error("Could not extract filename from thumbnail path");
    }

    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    const fileBuffer = fs.readFileSync(thumbnail);

    await blockBlobClient.upload(fileBuffer, fileBuffer.length);

    return `https://jagstreamfiles-hagkcmfge3c4b0gz.z01.azurefd.net/${container}/${fileName}`;
  } catch (error) {
    console.error("Error uploading to Azure:", error);
    throw new Error(
      `Failed to upload thumbnail to Azure: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
