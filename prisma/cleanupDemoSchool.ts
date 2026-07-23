import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEMO_SCHOOL_NAME } from "./demoConstants.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Tears down everything seedDemoSchool.ts created, in FK-safe (children
 * before parents) order. Never touches Grade/Subject rows -- those are
 * global/shared across schools, not demo-specific.
 */
async function main() {
  const school = await prisma.school.findFirst({ where: { name: DEMO_SCHOOL_NAME } });
  if (!school) {
    console.log(`No school named "${DEMO_SCHOOL_NAME}" found -- nothing to clean up.`);
    return;
  }
  const schoolId = school.id;

  const demoUsers = await prisma.user.findMany({ where: { schoolId }, select: { id: true } });
  const userIds = demoUsers.map((u) => u.id);

  await prisma.assessmentQuestion.deleteMany({ where: { assessment: { teacherId: { in: userIds } } } });
  await prisma.aIFeedback.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.aIGenerationLog.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.lessonPlanVersion.deleteMany({ where: { lessonPlan: { teacherId: { in: userIds } } } });
  await prisma.assessment.deleteMany({ where: { teacherId: { in: userIds } } });
  await prisma.lessonPlan.deleteMany({ where: { teacherId: { in: userIds } } });

  await prisma.initiativeEvidence.deleteMany({ where: { initiative: { schoolId } } });
  await prisma.initiativeIndicator.deleteMany({ where: { initiative: { schoolId } } });
  await prisma.initiativePhase.deleteMany({ where: { initiative: { schoolId } } });
  await prisma.initiative.deleteMany({ where: { schoolId } });

  await prisma.actionItem.deleteMany({ where: { meeting: { team: { schoolId } } } });
  await prisma.meeting.deleteMany({ where: { team: { schoolId } } });
  await prisma.teamMember.deleteMany({ where: { team: { schoolId } } });
  await prisma.operationalPlanItem.deleteMany({ where: { operationalPlan: { OR: [{ team: { schoolId } }, { schoolId }] } } });
  await prisma.operationalPlan.deleteMany({ where: { OR: [{ team: { schoolId } }, { schoolId }] } });
  await prisma.team.deleteMany({ where: { schoolId } });

  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: userIds } }, { recipientId: { in: userIds } }] } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.knowledgeMemoryItem.deleteMany({ where: { schoolId } });
  await prisma.insight.deleteMany({ where: { schoolId } });
  await prisma.questionBankItem.deleteMany({ where: { createdById: { in: userIds } } });
  await prisma.passwordResetToken.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });

  await prisma.teacherAssignment.deleteMany({ where: { teacherId: { in: userIds } } });
  await prisma.timetable.deleteMany({ where: { schoolId } });
  await prisma.learningOutcome.deleteMany({ where: { curriculumContent: { schoolId } } });
  await prisma.curriculumContent.deleteMany({ where: { schoolId } });
  await prisma.classSection.deleteMany({ where: { schoolId } });
  await prisma.academicYear.deleteMany({ where: { schoolId } });

  await prisma.user.deleteMany({ where: { schoolId } });
  await prisma.school.delete({ where: { id: schoolId } });

  console.log(`Deleted "${DEMO_SCHOOL_NAME}" (id: ${schoolId}) and all its data. Grade/Subject rows were left untouched (shared/global).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
