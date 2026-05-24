import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { QUALITIES } from "../config/ffmpeg.config";
import HLSService from "./hls.helper";

interface DirectoryPaths {
  tempHLSPath: string;
  uniqueIdPath: string;
  inputFilePath: string;
  qualities: { [key: string]: string };
}

export async function createDirectories(
  uniqueId: string,
  FULL_FILE_NAME: string,
  inputFile: Express.Multer.File
): Promise<DirectoryPaths> {
  try {
    // Resolve to project root directory
    const projectRoot = path.resolve(__dirname, "..");

    // Create base tempHLS directory in project root
    const tempHLSPath = path.join(projectRoot, "tempHLS");
    if (!existsSync(tempHLSPath)) {
      await mkdir(tempHLSPath, { recursive: true });
      console.log(`Created tempHLS directory: ${tempHLSPath}`);
    }

    // Create uniqueId directory inside tempHLS
    const uniqueIdPath = path.join(tempHLSPath, uniqueId);
    if (!existsSync(uniqueIdPath)) {
      await mkdir(uniqueIdPath, { recursive: true });
      console.log(`Created uniqueId directory: ${uniqueIdPath}`);
    }

    // Save the input file
    const inputFilePath = path.join(uniqueIdPath, FULL_FILE_NAME);

    // Create quality directories and process HLS
    const qualityPaths: { [key: string]: string } = {};

    for (const quality of Object.keys(QUALITIES)) {
      // Create quality-specific directory
      const transcodePath = path.join(uniqueIdPath, quality);
      if (!existsSync(transcodePath)) {
        await mkdir(transcodePath, { recursive: true });
        console.log(`Created ${quality} directory: ${transcodePath}`);
      }
      qualityPaths[quality] = transcodePath;
    }

    // Log the paths for debugging
    console.log("Created directories:", {
      projectRoot,
      tempHLSPath,
      uniqueIdPath,
      inputFilePath,
      qualities: qualityPaths,
    });

    return {
      tempHLSPath,
      uniqueIdPath,
      inputFilePath,
      qualities: qualityPaths,
    };
  } catch (error) {
    console.error("Error creating directories:", error);
    throw error;
  }
}
