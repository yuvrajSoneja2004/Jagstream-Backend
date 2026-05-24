import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const IMGBB_API_KEY = "1860dbb564356e69f87167f8d4c2785c";

/**
 * Uploads an image to ImgBB using the file stored on the server or a URL.
 * @param thumbnailPath - Path to the image file on the server or a URL.
 * @returns Promise<string> - URL of the uploaded image.
 * @throws Error if the file is not found or the upload fails.
 */
export const uploadToImgBB = async (thumbnailPath: string): Promise<string> => {
  let localFilePath = thumbnailPath;

  try {
    // Check if the thumbnailPath is a URL
    if (thumbnailPath.startsWith("http")) {
      // Download the file to a temporary location
      const response = await axios.get(thumbnailPath, {
        responseType: "stream",
      });
      const tempFileName = `temp-${uuidv4()}.png`;
      localFilePath = path.join(__dirname, tempFileName);

      // Save the file locally
      const writer = fs.createWriteStream(localFilePath);
      response.data.pipe(writer);

      await new Promise<void>((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    }

    // Check if the file exists locally
    if (!fs.existsSync(localFilePath)) {
      throw new Error("File not found at the specified path.");
    }

    // Prepare form data for ImgBB
    const formData = new FormData();
    formData.append("key", IMGBB_API_KEY);
    formData.append("image", fs.createReadStream(localFilePath));

    // Upload to ImgBB
    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    // Extract and return the uploaded image URL
    return response.data.data.url;
  } catch (error: any) {
    console.error("Error uploading to ImgBB:", error.message);
    throw new Error("Failed to upload image to ImgBB.");
  } finally {
    // Clean up temporary file if it exists
    if (localFilePath !== thumbnailPath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
  }
};
