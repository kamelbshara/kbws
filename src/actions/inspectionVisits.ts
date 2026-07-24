"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRoleGroup } from "@/lib/permissions";
import { getActiveSchoolId } from "@/lib/activeSchool";
import { createNotifications } from "@/lib/notifications";

export type ActionState = { error?: string; success?: boolean } | undefined;

const createSchema = z.object({
  classSectionId: z.string().min(1),
  scheduledDate: z.string().min(1),
  notes: z.string().optional(),
});

export async function createInspectionVisitAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  await requireRoleGroup(session, "MANAGEMENT_ROLES");
  const schoolId = await getActiveSchoolId(session!);
  if (!schoolId) {
    return { error: "No active school selected." };
  }

  const parsed = createSchema.safeParse({
    classSectionId: formData.get("classSectionId"),
    scheduledDate: formData.get("scheduledDate"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const classSection = await prisma.classSection.findUnique({ where: { id: parsed.data.classSectionId } });
  if (!classSection || classSection.schoolId !== schoolId) {
    return { error: "Class not found." };
  }

  const teacherAssignments = await prisma.teacherAssignment.findMany({
    where: { classSectionId: classSection.id },
    select: { teacherId: true },
    distinct: ["teacherId"],
  });
  if (teacherAssignments.length === 0) {
    return { error: "No teacher is assigned to this class." };
  }

  const visits = await Promise.all(
    teacherAssignments.map((a) =>
      prisma.inspectionVisit.create({
        data: {
          schoolId,
          classSectionId: classSection.id,
          teacherId: a.teacherId,
          requestedById: session!.user.id,
          scheduledDate: new Date(parsed.data.scheduledDate),
          notes: parsed.data.notes,
        },
      }),
    ),
  );

  await createNotifications(
    teacherAssignments.map((a) => a.teacherId),
    {
      type: "INSPECTION_VISIT",
      title: "An inspection visit has been scheduled for your class",
      body: parsed.data.notes,
      link: "/schedule",
    },
  );

  await logAudit({
    userId: session!.user.id,
    action: "CREATE",
    module: "InspectionVisits",
    entityId: visits[0].id,
    after: { classSectionId: classSection.id, scheduledDate: parsed.data.scheduledDate, teacherCount: visits.length },
  });

  revalidatePath("/admin/lesson-plans");
  return { success: true };
}
