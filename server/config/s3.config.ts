// src/config/s3.config.ts
import { S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";

config();

export const s3Client = new S3Client({
  endpoint: "https://s3.filebase.com",
  credentials: {
    accessKeyId: process.env.FILEBASE_ACCESS_KEY || "",
    secretAccessKey: process.env.FILEBASE_SECRET_KEY || "",
  },
  region: "us-east-1",
});
