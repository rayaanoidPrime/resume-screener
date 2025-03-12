-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "originalBucketId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_originalBucketId_fkey" FOREIGN KEY ("originalBucketId") REFERENCES "Bucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
