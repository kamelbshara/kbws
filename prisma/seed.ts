import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Role } from "../src/generated/prisma/enums.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEED_PASSWORD = "Passw0rd!123";

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  const school = await prisma.school.create({
    data: {
      name: "Al Noor National School",
      nameAr: "مدرسة النور الوطنية",
      address: "Abu Dhabi, UAE",
    },
  });

  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: school.id,
      name: "2026-2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      isActive: true,
    },
  });

  const gradeLevels = [
    { level: 5, name: "Grade 5", nameAr: "الصف الخامس" },
    { level: 6, name: "Grade 6", nameAr: "الصف السادس" },
    { level: 7, name: "Grade 7", nameAr: "الصف السابع" },
    { level: 8, name: "Grade 8", nameAr: "الصف الثامن" },
    { level: 9, name: "Grade 9", nameAr: "الصف التاسع" },
    { level: 10, name: "Grade 10", nameAr: "الصف العاشر" },
    { level: 11, name: "Grade 11", nameAr: "الصف الحادي عشر" },
    { level: 12, name: "Grade 12", nameAr: "الصف الثاني عشر" },
  ];
  const grades = new Map<number, { id: string; level: number }>();
  for (const g of gradeLevels) {
    const grade = await prisma.grade.create({ data: g });
    grades.set(g.level, grade);
  }

  const mathSubject = await prisma.subject.create({
    data: { name: "Mathematics", nameAr: "الرياضيات", code: "MATH" },
  });
  const physicsSubject = await prisma.subject.create({
    data: { name: "Physics", nameAr: "الفيزياء", code: "PHYS" },
  });

  const grade8 = grades.get(8)!;
  const grade10 = grades.get(10)!;

  const grade8ClassA = await prisma.classSection.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeId: grade8.id,
      name: "8A",
    },
  });

  const grade10ClassA = await prisma.classSection.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      gradeId: grade10.id,
      track: "GENERAL",
      name: "10A",
    },
  });

  // Curriculum content + learning outcomes: Grade 8 Math
  const mathUnit1 = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: mathSubject.id,
      gradeId: grade8.id,
      unit: "Unit 3",
      unitTitle: "Linear Equations",
      lessonTitle: "Solving Linear Equations with One Variable",
      orderIndex: 1,
    },
  });
  await prisma.learningOutcome.create({
    data: {
      curriculumContentId: mathUnit1.id,
      textAr: "يحل الطالب المعادلات الخطية ذات المتغير الواحد باستخدام طرق مختلفة",
      textEn: "Solve linear equations in one variable using multiple methods",
      skill: "Algebraic reasoning",
    },
  });

  const mathUnit2 = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: mathSubject.id,
      gradeId: grade8.id,
      unit: "Unit 3",
      unitTitle: "Linear Equations",
      lessonTitle: "Graphing Linear Equations",
      orderIndex: 2,
    },
  });
  await prisma.learningOutcome.create({
    data: {
      curriculumContentId: mathUnit2.id,
      textAr: "يمثل الطالب المعادلات الخطية بيانياً ويفسر ميل الخط المستقيم",
      textEn: "Represent linear equations graphically and interpret the slope of a line",
      skill: "Graphical representation",
    },
  });

  // Curriculum content + learning outcomes: Grade 10 Physics
  const physicsUnit1 = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: physicsSubject.id,
      gradeId: grade10.id,
      track: "GENERAL",
      unit: "Unit 1",
      unitTitle: "Motion and Forces",
      lessonTitle: "Newton's Laws of Motion",
      orderIndex: 1,
    },
  });
  await prisma.learningOutcome.create({
    data: {
      curriculumContentId: physicsUnit1.id,
      textAr: "يشرح الطالب قوانين نيوتن للحركة ويطبقها على مواقف واقعية",
      textEn: "Explain Newton's laws of motion and apply them to real-world scenarios",
      skill: "Applied physics reasoning",
    },
  });

  const physicsUnit2 = await prisma.curriculumContent.create({
    data: {
      schoolId: school.id,
      subjectId: physicsSubject.id,
      gradeId: grade10.id,
      track: "GENERAL",
      unit: "Unit 1",
      unitTitle: "Motion and Forces",
      lessonTitle: "Free Body Diagrams",
      orderIndex: 2,
    },
  });
  await prisma.learningOutcome.create({
    data: {
      curriculumContentId: physicsUnit2.id,
      textAr: "يرسم الطالب مخططات الجسم الحر ويحدد القوى المؤثرة عليه",
      textEn: "Draw free body diagrams and identify forces acting on an object",
      skill: "Diagrammatic modeling",
    },
  });

  // Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@school.edu",
      passwordHash,
      name: "System Administrator",
      nameAr: "مدير النظام",
      role: "SYSTEM_ADMIN",
      schoolId: school.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "principal@school.edu",
      passwordHash,
      name: "School Principal",
      nameAr: "مدير المدرسة",
      role: "PRINCIPAL",
      schoolId: school.id,
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: "teacher1@school.edu",
      passwordHash,
      name: "Sara Ahmed",
      nameAr: "سارة أحمد",
      role: "TEACHER",
      schoolId: school.id,
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: "teacher2@school.edu",
      passwordHash,
      name: "Omar Khalid",
      nameAr: "عمر خالد",
      role: "TEACHER",
      schoolId: school.id,
    },
  });

  // Teacher assignments
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher1.id,
      classSectionId: grade8ClassA.id,
      subjectId: mathSubject.id,
      academicYearId: academicYear.id,
    },
  });
  await prisma.teacherAssignment.create({
    data: {
      teacherId: teacher2.id,
      classSectionId: grade10ClassA.id,
      subjectId: physicsSubject.id,
      academicYearId: academicYear.id,
    },
  });

  // Timetable
  await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade8ClassA.id,
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      dayOfWeek: "SUNDAY",
      periodNumber: 2,
      startTime: "08:50",
      endTime: "09:35",
    },
  });
  await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade8ClassA.id,
      subjectId: mathSubject.id,
      teacherId: teacher1.id,
      dayOfWeek: "TUESDAY",
      periodNumber: 3,
      startTime: "09:40",
      endTime: "10:25",
    },
  });
  await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade10ClassA.id,
      subjectId: physicsSubject.id,
      teacherId: teacher2.id,
      dayOfWeek: "MONDAY",
      periodNumber: 1,
      startTime: "08:00",
      endTime: "08:45",
    },
  });
  await prisma.timetable.create({
    data: {
      schoolId: school.id,
      academicYearId: academicYear.id,
      classSectionId: grade10ClassA.id,
      subjectId: physicsSubject.id,
      teacherId: teacher2.id,
      dayOfWeek: "WEDNESDAY",
      periodNumber: 4,
      startTime: "10:30",
      endTime: "11:15",
    },
  });

  const defaultPermissionGroups: { name: string; roles: Role[] }[] = [
    { name: "ADMIN_ROLES", roles: ["SYSTEM_ADMIN"] },
    { name: "MANAGEMENT_ROLES", roles: ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
    { name: "TEACHER_ROLES", roles: ["TEACHER"] },
    { name: "INITIATIVE_CREATOR_ROLES", roles: ["TEACHER", "INITIATIVE_OWNER", "SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
    { name: "TEAM_CREATOR_ROLES", roles: ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
  ];
  for (const group of defaultPermissionGroups) {
    await prisma.permissionGroup.upsert({
      where: { name: group.name },
      create: group,
      update: {},
    });
  }

  console.log("Seed complete.");
  console.log(`Seeded users (password for all: ${SEED_PASSWORD}):`);
  console.log(`  Admin:     admin@school.edu`);
  console.log(`  Principal: principal@school.edu`);
  console.log(`  Teacher 1: teacher1@school.edu (${teacher1.name}, Grade 8A Math)`);
  console.log(`  Teacher 2: teacher2@school.edu (${teacher2.name}, Grade 10A Physics)`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
