-- DropIndex
DROP INDEX "CurriculumContent_subjectId_gradeId_track_idx";

-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "CurriculumContent" ADD COLUMN     "schoolId" TEXT;

-- Backfill: every existing CurriculumContent row predates multi-school support,
-- so attribute it to the single school that existed at the time.
UPDATE "CurriculumContent" SET "schoolId" = (SELECT "id" FROM "School" ORDER BY "createdAt" ASC LIMIT 1);

-- AlterTable: now enforce NOT NULL
ALTER TABLE "CurriculumContent" ALTER COLUMN "schoolId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CurriculumContent_schoolId_subjectId_gradeId_track_idx" ON "CurriculumContent"("schoolId", "subjectId", "gradeId", "track");

-- AddForeignKey
ALTER TABLE "CurriculumContent" ADD CONSTRAINT "CurriculumContent_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
