-- AlterTable
ALTER TABLE "User" ADD COLUMN     "watchedVideosDurations" JSONB NOT NULL DEFAULT '{}';
