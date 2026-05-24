import { QueueEvents } from "bullmq";

export const transcodeVideoEvents = new QueueEvents("transcode-video", {
    connection: {
        host: "20.244.8.123",
        port: 6379,
      }
})