/*
  Warnings:

  - Changed the type of `uploadedBy` on the `Video` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_uploadedBy_fkey";

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "uploadedBy",
ADD COLUMN     "uploadedBy" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
