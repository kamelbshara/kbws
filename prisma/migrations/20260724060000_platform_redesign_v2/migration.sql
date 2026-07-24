-- CreateEnum
CREATE TYPE "InspectionVisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- Safety net: reassign any existing rows still on the roles being removed
-- before they're dropped from the enum, so this migration can never fail on
-- production data even if a real Evaluator/Team Leader account exists.
UPDATE "User" SET "role" = 'TEACHER' WHERE "role" = 'TEAM_LEADER';
UPDATE "User" SET "role" = 'PRINCIPAL' WHERE "role" = 'EVALUATOR';
UPDATE "PermissionGroup" SET "roles" = array_remove(array_remove("roles", 'TEAM_LEADER'), 'EVALUATOR');
DELETE FROM "PermissionGroup" WHERE "name" = 'EVALUATOR_ROLES';

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SYSTEM_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'TEACHER', 'INITIATIVE_OWNER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "PermissionGroup" ALTER COLUMN "roles" TYPE "Role_new"[] USING ("roles"::text::"Role_new"[]);
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "AIGenerationLog" ADD COLUMN     "professionalGoalId" TEXT,
ADD COLUMN     "worksheetId" TEXT;

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "reflection" TEXT,
ADD COLUMN     "reportJson" JSONB;

-- AlterTable
ALTER TABLE "InitiativeIndicator" ADD COLUMN     "aiAnalysis" JSONB,
ADD COLUMN     "phaseId" TEXT;

-- AlterTable
ALTER TABLE "OperationalPlan" ADD COLUMN     "academicYearId" TEXT,
ADD COLUMN     "previousPlanId" TEXT;

-- CreateTable
CREATE TABLE "Worksheet" (
    "id" TEXT NOT NULL,
    "lessonPlanId" TEXT NOT NULL,
    "contentJson" JSONB,
    "pdfPath" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "academicYearId" TEXT,
    "prompt" TEXT NOT NULL,
    "suggestions" JSONB NOT NULL,
    "selectedGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlanTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "structureJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonPlanTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspectionVisit" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classSectionId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "status" "InspectionVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InitiativeComment" (
    "id" TEXT NOT NULL,
    "initiativeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InitiativeComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionVisit_schoolId_scheduledDate_idx" ON "InspectionVisit"("schoolId", "scheduledDate");

-- CreateIndex
CREATE INDEX "InitiativeComment_initiativeId_idx" ON "InitiativeComment"("initiativeId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalPlan_previousPlanId_key" ON "OperationalPlan"("previousPlanId");

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGenerationLog" ADD CONSTRAINT "AIGenerationLog_professionalGoalId_fkey" FOREIGN KEY ("professionalGoalId") REFERENCES "ProfessionalGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalPlan" ADD CONSTRAINT "OperationalPlan_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalPlan" ADD CONSTRAINT "OperationalPlan_previousPlanId_fkey" FOREIGN KEY ("previousPlanId") REFERENCES "OperationalPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Initiative" ADD CONSTRAINT "Initiative_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeIndicator" ADD CONSTRAINT "InitiativeIndicator_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "InitiativePhase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_lessonPlanId_fkey" FOREIGN KEY ("lessonPlanId") REFERENCES "LessonPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalGoal" ADD CONSTRAINT "ProfessionalGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalGoal" ADD CONSTRAINT "ProfessionalGoal_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalGoal" ADD CONSTRAINT "ProfessionalGoal_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanTemplate" ADD CONSTRAINT "LessonPlanTemplate_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlanTemplate" ADD CONSTRAINT "LessonPlanTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionVisit" ADD CONSTRAINT "InspectionVisit_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionVisit" ADD CONSTRAINT "InspectionVisit_classSectionId_fkey" FOREIGN KEY ("classSectionId") REFERENCES "ClassSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionVisit" ADD CONSTRAINT "InspectionVisit_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspectionVisit" ADD CONSTRAINT "InspectionVisit_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeComment" ADD CONSTRAINT "InitiativeComment_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "Initiative"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InitiativeComment" ADD CONSTRAINT "InitiativeComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
