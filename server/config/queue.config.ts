import Queue from "bull";
import { redisClient } from "../database/redisClient";

// Create the video transcoding queue
export const videoTranscodingQueue = new Queue("video transcoding", {
  redis: {
    host: "20.244.8.123",
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 10, // Keep only 10 completed jobs
    removeOnFail: 50, // Keep 50 failed jobs for debugging
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
});

// Queue event listeners
videoTranscodingQueue.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
  console.log("Result:", result);
});

videoTranscodingQueue.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

videoTranscodingQueue.on("stalled", (job) => {
  console.warn(`⚠️ Job ${job.id} stalled`);
});

videoTranscodingQueue.on("active", (job) => {
  console.log(`🔄 Job ${job.id} is now active`);
});

export default videoTranscodingQueue;
