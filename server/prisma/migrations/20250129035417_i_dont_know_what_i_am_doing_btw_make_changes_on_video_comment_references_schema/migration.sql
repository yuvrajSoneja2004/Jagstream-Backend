-- DropForeignKey
ALTER TABLE "VideoComment" DROP CONSTRAINT "VideoComment_videoId_fkey";

-- AlterTable
ALTER TABLE "VideoComment" ALTER COLUMN "videoId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "VideoComment" ADD CONSTRAINT "VideoComment_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoUrl") ON DELETE RESTRICT ON UPDATE CASCADE;
