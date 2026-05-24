/*
  Warnings:

  - You are about to drop the `VideoDislike` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VideoLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('LIKE', 'DISLIKE');

-- DropForeignKey
ALTER TABLE "VideoDislike" DROP CONSTRAINT "VideoDislike_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoDislike" DROP CONSTRAINT "VideoDislike_videoId_fkey";

-- DropForeignKey
ALTER TABLE "VideoLike" DROP CONSTRAINT "VideoLike_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoLike" DROP CONSTRAINT "VideoLike_videoId_fkey";

-- DropTable
DROP TABLE "VideoDislike";

-- DropTable
DROP TABLE "VideoLike";

-- CreateTable
CREATE TABLE "VideoInteraction" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,

    CONSTRAINT "VideoInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VideoInteraction_videoId_userId_key" ON "VideoInteraction"("videoId", "userId");

-- AddForeignKey
ALTER TABLE "VideoInteraction" ADD CONSTRAINT "VideoInteraction_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoInteraction" ADD CONSTRAINT "VideoInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
