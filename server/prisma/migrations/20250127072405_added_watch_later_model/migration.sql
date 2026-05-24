-- CreateTable
CREATE TABLE "UserWatchLater" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserWatchLater_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserWatchLater" ADD CONSTRAINT "UserWatchLater_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWatchLater" ADD CONSTRAINT "UserWatchLater_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("videoUrl") ON DELETE RESTRICT ON UPDATE CASCADE;
