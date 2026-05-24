-- CreateTable
CREATE TABLE "UserStories" (
    "id" SERIAL NOT NULL,
    "postedBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pictureUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserStories" ADD CONSTRAINT "UserStories_postedBy_fkey" FOREIGN KEY ("postedBy") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
