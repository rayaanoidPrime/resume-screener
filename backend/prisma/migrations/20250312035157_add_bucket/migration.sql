-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "bucketId" TEXT;

-- CreateTable
CREATE TABLE "Bucket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Bucket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "Bucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bucket" ADD CONSTRAINT "Bucket_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
