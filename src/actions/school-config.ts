"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/permissions";
import { parseCurriculumCsv } from "@/lib/curriculumImport";
import type { Role, Track, DayOfWeek } from "@/generated/prisma/enums";

export type ActionState = { error?: string; success?: boolean } | undefined;

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  nameAr: z.string().optional(),
  role: z.enum(["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "TEAM_LEADER", "TEACHER", "INITIATIVE_OWNER"]),
  password: z.string().min(8),
});

export async function createUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  requireRole(session, ADMIN_ROLES);

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    nameAr: formData.get("nameAr") || undefined,
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const school = await prisma.school.findFirst();

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      nameAr: parsed.data.nameAr,
      role: parsed.data.role as Role,
      passwordHash,
      schoolId: school?.id,
    },
  });

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "Users",
    entityId: user.id,
    after: { email: user.email, name: user.name, role: user.role },
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserActiveAction(userId: string) {
  const session = await auth();
  requireRole(session, ADMIN_ROLES);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await logAudit({
    userId: session!.user.id,
    action: "UPDATE",
    module: "Users",
    entityId: userId,
    before: { isActive: user.isActive },
    after: { isActive: updated.isActive },
  });

  revalidatePath("/admin/users");
}

const createClassSectionSchema = z.object({
  gradeId: z.string().min(1),
  name: z.string().min(1),
  track: z.enum(["GENERAL", "ADVANCED"]).optional(),
});

export async function createClassSectionAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  requireRole(session, MANAGEMENT_ROLES);

  const rawTrack = formData.get("track");
  const parsed = createClassSectionSchema.safeParse({
    gradeId: formData.get("gradeId"),
    name: formData.get("name"),
    track: rawTrack === "none" || !rawTrack ? undefined : rawTrack,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const school = await prisma.school.findFirstOrThrow();
  const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { isActive: true } });

  try {
    const classSection = await prisma.classSection.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        gradeId: parsed.data.gradeId,
        name: parsed.data.name,
        track: parsed.data.track as Track | undefined,
      },
    });

    await logAudit({
      userId: session!.user.id,
      action: "CREATE",
      module: "ClassSections",
      entityId: classSection.id,
      after: { name: classSection.name, gradeId: classSection.gradeId },
    });
  } catch {
    return { error: "A class section with this name already exists for this grade." };
  }

  revalidatePath("/admin/classes");
  return { success: true };
}

const createTimetableSlotSchema = z.object({
  teacherId: z.string().min(1),
  classSectionId: z.string().min(1),
  subjectId: z.string().min(1),
  dayOfWeek: z.enum(["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]),
  periodNumber: z.coerce.number().int().min(1).max(12),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export async function createTimetableSlotAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  requireRole(session, MANAGEMENT_ROLES);

  const parsed = createTimetableSlotSchema.safeParse({
    teacherId: formData.get("teacherId"),
    classSectionId: formData.get("classSectionId"),
    subjectId: formData.get("subjectId"),
    dayOfWeek: formData.get("dayOfWeek"),
    periodNumber: formData.get("periodNumber"),
    startTime: formData.get("startTime") || undefined,
    endTime: formData.get("endTime") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const school = await prisma.school.findFirstOrThrow();
  const academicYear = await prisma.academicYear.findFirstOrThrow({ where: { isActive: true } });

  try {
    const slot = await prisma.timetable.create({
      data: {
        schoolId: school.id,
        academicYearId: academicYear.id,
        classSectionId: parsed.data.classSectionId,
        subjectId: parsed.data.subjectId,
        teacherId: parsed.data.teacherId,
        dayOfWeek: parsed.data.dayOfWeek as DayOfWeek,
        periodNumber: parsed.data.periodNumber,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      },
    });

    await logAudit({
      userId: session!.user.id,
      action: "CREATE",
      module: "Timetable",
      entityId: slot.id,
      after: parsed.data,
    });
  } catch {
    return { error: "This teacher or class section already has a slot at that day/period." };
  }

  revalidatePath("/admin/timetable");
  return { success: true };
}

export type CurriculumImportState =
  | { error: string; created?: undefined; rowErrors?: undefined }
  | { error?: undefined; created: number; rowErrors: string[] }
  | undefined;

const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

export async function importCurriculumAction(
  _prevState: CurriculumImportState,
  formData: FormData,
): Promise<CurriculumImportState> {
  const session = await auth();
  requireRole(session, MANAGEMENT_ROLES);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a CSV file to upload." };
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { error: "File is too large (max 2MB)." };
  }

  const text = await file.text();
  const { rows, errors } = parseCurriculumCsv(text);

  if (rows.length === 0) {
    return { error: errors[0]?.message ?? "No valid rows found in the file." };
  }

  const [subjects, grades] = await Promise.all([prisma.subject.findMany(), prisma.grade.findMany()]);
  const subjectByCode = new Map(subjects.map((s) => [s.code.toUpperCase(), s]));
  const gradeByLevel = new Map(grades.map((g) => [g.level, g]));

  const rowErrors = errors.map((e) => `Row ${e.row}: ${e.message}`);
  let created = 0;

  for (const row of rows) {
    const subject = subjectByCode.get(row.subjectCode.toUpperCase());
    const grade = gradeByLevel.get(row.gradeLevel);
    if (!subject) {
      rowErrors.push(`Lesson "${row.lessonTitle}": unknown subject code "${row.subjectCode}".`);
      continue;
    }
    if (!grade) {
      rowErrors.push(`Lesson "${row.lessonTitle}": unknown grade level "${row.gradeLevel}".`);
      continue;
    }

    const content = await prisma.curriculumContent.create({
      data: {
        subjectId: subject.id,
        gradeId: grade.id,
        track: (row.track || undefined) as Track | undefined,
        unit: row.unit,
        unitTitle: row.unitTitle,
        lessonTitle: row.lessonTitle,
        orderIndex: row.orderIndex,
      },
    });
    await prisma.learningOutcome.create({
      data: {
        curriculumContentId: content.id,
        textEn: row.textEn,
        textAr: row.textAr,
        skill: row.skill,
      },
    });
    created += 1;
  }

  if (created > 0) {
    await logAudit({
      userId: session!.user.id,
      action: "CREATE",
      module: "CurriculumImport",
      entityId: `batch-${Date.now()}`,
      after: { created, skipped: rowErrors.length },
    });
  }

  revalidatePath("/admin/curriculum");
  return { created, rowErrors };
}
