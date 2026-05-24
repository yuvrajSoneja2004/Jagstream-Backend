/*
  Warnings:

  - The `videoId` column on the `UserWatchHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserWatchHistory" DROP COLUMN "videoId",
ADD COLUMN     "videoId" SERIAL NOT NULL;

-- AddForeignKey
ALTER TABLE "UserWatchHistory" ADD CONSTRAINT "UserWatchHistory_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;
