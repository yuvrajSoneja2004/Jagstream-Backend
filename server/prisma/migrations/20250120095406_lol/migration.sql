/*
  Warnings:

  - A unique constraint covering the columns `[videoUrl]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "UserWatchHistory" DROP CONSTRAINT "UserWatchHistory_videoId_fkey";

-- AlterTable
ALTER TABLE "UserWatchHistory" ALTER COLUMN "videoId" DROP DEFAULT,
ALTER COLUMN "videoId" SET DATA TYPE TEXT;
DROP SEQUENCE "UserWatchHistory_videoId_seq";

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoUrl_key" ON "Video"("videoUrl");

-- AddForeignKey
ALTER TABLE "UserWatchHistory" ADD CONSTRAINT "UserWatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoUrl") ON DELETE RESTRICT ON UPDATE CASCADE;
