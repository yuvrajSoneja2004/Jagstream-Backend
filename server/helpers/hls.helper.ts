import Ffmpeg from "fluent-ffmpeg";
import { QUALITIES } from "../config/ffmpeg.config";
import { QualityKey } from "../types/hls.type";
import fs from "fs/promises";
import path from "path";
import { unlinkSync } from "fs";

class HLSService {
  static async createHLSForQuality(
    inputPath: string,
    outputDir: string,
    quality: QualityKey,
    FULL_FILE_NAME?: string,
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    const preset = QUALITIES[quality];

    // Validate input file exists
    try {
      await fs.access(inputPath);
    } catch (error) {
      throw new Error(`Input file does not exist: ${inputPath}`);
    }

    // Normalize paths for Windows compatibility
    const normalizedInputPath = path.resolve(inputPath);
    const normalizedOutputDir = path.resolve(outputDir);

    console.log(`Processing ${quality} quality:`);
    console.log(`Input: ${normalizedInputPath}`);
    console.log(`Output: ${normalizedOutputDir}`);
    console.log(`Preset:`, preset);

    return new Promise<void>((resolve, reject) => {
      const command = Ffmpeg(normalizedInputPath)
        .outputOptions([
          "-c:v h264",
          "-preset fast", // Changed from veryfast to fast for better quality
          "-profile:v main",
          `-s ${preset.resolution}`, // Set resolution
          `-b:v ${preset.bitrate}`, // Set video bitrate
          "-g 60", // Increased keyframe interval for better compatibility
          "-keyint_min 30", // Reduced minimum keyframe interval
          "-sc_threshold 40", // Increased scene change threshold
          "-c:a aac",
          `-b:a ${preset.audioBitrate}`, // Use preset audio bitrate
          "-ac 2",
          "-ar 44100", // Changed to standard 44.1kHz for better compatibility
          "-af aresample=44100", // Standard resampling for better compatibility
          "-fflags +genpts+igndts", // Improved timestamp handling
          "-avoid_negative_ts disabled", // Disabled timestamp shifting
          "-hls_time 6", // Increased segment time for better streaming
          "-hls_list_size 0",
          "-hls_flags independent_segments+delete_segments", // Added segment deletion
          "-hls_segment_filename",
          path.join(normalizedOutputDir, `${quality}_%03d.ts`),
          "-f hls",
        ])
        .output(path.join(normalizedOutputDir, "playlist.m3u8"))
        .on("start", (commandLine) => {
          console.log(`FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress) => {
          const percent = progress.percent || 0;
          console.log(`Processing ${quality}: ${percent.toFixed(2)}%`);
          if (progressCallback) {
            progressCallback(percent);
          }
        })
        .on("end", async () => {
          console.log(`${quality} quality processing completed`);
          if (FULL_FILE_NAME) {
            const removeMainFile = path.join(
              normalizedOutputDir,
              "..",
              FULL_FILE_NAME
            );
            try {
              await fs.unlink(removeMainFile);
              console.log(`Successfully deleted file: ${removeMainFile}`);
            } catch (err: any) {
              console.error(`Error deleting file: ${err.message}`);
            }
          }
          resolve();
        })
        .on("error", (err: Error) => {
          console.error(`FFmpeg error for ${quality}:`, err.message);
          reject(
            new Error(`FFmpeg conversion failed for ${quality}: ${err.message}`)
          );
        });

      // Add timeout to prevent hanging
      const timeout = setTimeout(() => {
        command.kill("SIGKILL");
        reject(new Error(`FFmpeg conversion timeout for ${quality}`));
      }, 300000); // 5 minutes timeout

      command.on("end", () => clearTimeout(timeout));
      command.on("error", () => clearTimeout(timeout));

      command.run();
    });
  }

  static createMasterPlaylist(
    videoId: string,
    qualities: QualityKey[]
  ): string {
    const content =
      "#EXTM3U\n" +
      "#EXT-X-VERSION:3\n" +
      qualities
        .map((quality) => {
          const preset = QUALITIES[quality];
          const resolution = preset.resolution.split("x");
          return `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(
            preset.bitrate
          )}000,RESOLUTION=${preset.resolution}\n${quality}/playlist.m3u8`;
        })
        .join("\n");

    return content;
  }

  /**
   * Process a video into multiple HLS qualities
   * @param inputPath - Path to the input video file
   * @param outputDir - Base directory for HLS output
   * @param qualities - Array of quality preset keys to process
   * @returns Promise that resolves when all qualities are processed
   */
  static async processVideo(
    inputPath: string,
    outputDir: string,
    qualities: QualityKey[] = Object.keys(QUALITIES) as QualityKey[]
  ): Promise<void> {
    try {
      // Process all qualities in parallel
      await Promise.all(
        qualities.map((quality) => {
          const qualityDir = path.join(outputDir, quality);
          return fs
            .mkdir(qualityDir, { recursive: true })
            .then(() =>
              this.createHLSForQuality(inputPath, qualityDir, quality)
            );
        })
      );

      // Create master playlist
      const masterPlaylist = this.createMasterPlaylist(
        path.basename(outputDir) || "video",
        qualities
      );

      // Write master playlist to file
      await fs.writeFile(path.join(outputDir, "master.m3u8"), masterPlaylist);
    } catch (error: any) {
      throw new Error(`Failed to process video: ${error.message}`);
    }
  }
}

export default HLSService;
