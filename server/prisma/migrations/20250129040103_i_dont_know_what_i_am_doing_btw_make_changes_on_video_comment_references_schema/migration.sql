/*
  Warnings:

  - You are about to drop the column `videoId` on the `VideoComment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoComment" DROP CONSTRAINT "VideoComment_videoId_fkey";

-- AlterTable
ALTER TABLE "VideoComment" DROP COLUMN "videoId",
ADD COLUMN     "videoUrl" TEXT NOT NULL DEFAULT 'This is VideoComment default ID';

-- AddForeignKey
ALTER TABLE "VideoComment" ADD CONSTRAINT "VideoComment_videoUrl_fkey" FOREIGN KEY ("videoUrl") REFERENCES "Video"("videoUrl") ON DELETE RESTRICT ON UPDATE CASCADE;
