/*
  Warnings:

  - You are about to drop the `VideoInteraction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VideoInteraction" DROP CONSTRAINT "VideoInteraction_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoInteraction" DROP CONSTRAINT "VideoInteraction_videoId_fkey";

-- DropTable
DROP TABLE "VideoInteraction";

-- DropEnum
DROP TYPE "InteractionType";

-- CreateTable
CREATE TABLE "VideoLike" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VideoLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoDislike" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VideoDislike_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VideoLike" ADD CONSTRAINT "VideoLike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoLike" ADD CONSTRAINT "VideoLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDislike" ADD CONSTRAINT "VideoDislike_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoDislike" ADD CONSTRAINT "VideoDislike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
