-- AlterTable
ALTER TABLE "Bookmark" ADD COLUMN     "checkStatus" INTEGER,
ADD COLUMN     "checkedAt" TIMESTAMP(3),
ADD COLUMN     "redirectsTo" TEXT;

-- CreateIndex
CREATE INDEX "Bookmark_userId_spaceId_checkedAt_idx" ON "Bookmark"("userId", "spaceId", "checkedAt");
