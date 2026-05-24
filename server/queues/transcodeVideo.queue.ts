import { Queue } from "bullmq";
// const UPLOAD_QUEUE_CONFIG = {
//     name: 'uploadRawVideoQueue',
//     options: {
//         redis: {
//         host: process.env.REDIS_HOST || 'localhost',
//         port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
//         },
//         defaultJobOptions: {
//         attempts: 3,
//         backoff: {
//             type: 'exponential',
//             delay: 5000,
//         },
//         removeOnComplete: true,
//         removeOnFail: false,
//         },
//     },
// }

export const uploadRawVideoQueue = new Queue("transcode-video", {
  connection: {
    host: "20.244.8.123",
    port: 6379,
    maxRetriesPerRequest: null, // ✅ BullMQ requirement
    retryDelayOnFailover: 100,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 30000, // ✅ Increased timeout
    keepAlive: 30000,
    family: 4,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});