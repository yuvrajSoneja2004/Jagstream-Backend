import { redisClient } from "../database/redisClient";
import { PRISMA_CLIENT } from "../database/prismaClient";

export interface TranscodingCompletionData {
  uniqueId: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  previewGif: string;
  channelId: number;
  status: "completed" | "failed";
  completedAt: string;
  hlsPath: string;
  error?: string;
}

export class TranscodingCompletionService {
  private static instance: TranscodingCompletionService;
  private isPolling = false;

  private constructor() {}

  public static getInstance(): TranscodingCompletionService {
    if (!TranscodingCompletionService.instance) {
      TranscodingCompletionService.instance =
        new TranscodingCompletionService();
    }
    return TranscodingCompletionService.instance;
  }

  public startPolling() {
    if (this.isPolling) {
      console.log("Transcoding completion service is already polling");
      return;
    }

    this.isPolling = true;
    console.log("🔄 Starting transcoding completion polling service");
    this.pollForCompletions();
  }

  public stopPolling() {
    this.isPolling = false;
    console.log("⏹️ Stopped transcoding completion polling service");
  }

  private async pollForCompletions() {
    while (this.isPolling) {
      try {
        // Get all transcoding keys
        const keys = await redisClient.keys("transcoding:*");

        for (const key of keys) {
          const data = await redisClient.get(key);
          if (data) {
            const completionData: TranscodingCompletionData = JSON.parse(data);

            if (completionData.status === "completed") {
              await this.handleCompletedTranscoding(completionData);
              // Remove from Redis after processing
              await redisClient.del(key);
            } else if (completionData.status === "failed") {
              await this.handleFailedTranscoding(completionData);
              // Remove from Redis after processing
              await redisClient.del(key);
            }
          }
        }
      } catch (error) {
        console.error("Error in transcoding completion polling:", error);
      }

      // Poll every 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  private async handleCompletedTranscoding(data: TranscodingCompletionData) {
    try {
      console.log(
        `✅ Processing completed transcoding for video: ${data.uniqueId}`
      );

      // Save metadata in the database
      await PRISMA_CLIENT.video.create({
        data: {
          title: data.title,
          type: data.category,
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
          previewGif: data.previewGif,
          videoUrl: data.uniqueId,
          uploadedBy: data.channelId,
        },
      });

      console.log(`📝 Video ${data.uniqueId} saved to database successfully`);
    } catch (error) {
      console.error(
        `❌ Error saving completed video ${data.uniqueId} to database:`,
        error
      );
    }
  }

  private async handleFailedTranscoding(data: TranscodingCompletionData) {
    console.log(`❌ Transcoding failed for video: ${data.uniqueId}`);
    console.log(`Error: ${data.error}`);

    // You could implement additional error handling here, such as:
    // - Notifying the user
    // - Logging to a separate error tracking system
    // - Cleaning up temporary files
  }
}
