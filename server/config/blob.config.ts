// Write config for azure blob storage with front door cdn enabled
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
import { config } from "dotenv";

config();

export const blobServiceClient = new BlobServiceClient(
  `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
  new StorageSharedKeyCredential(
    process.env.AZURE_STORAGE_ACCOUNT_NAME || "",
    process.env.AZURE_STORAGE_ACCOUNT_KEY || ""
  )
);
