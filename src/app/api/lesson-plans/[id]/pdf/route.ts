export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { LessonPlanContentSchema } from "@/lib/ai/lessonPlanSchema";
import { generateLessonPlanPdf } from "@/lib/pdf/generateLessonPlanPdf";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const lessonPlan = await prisma.lessonPlan.findUnique({
    where: { id },
    include: {
      teacher: true,
      classSection: { include: { grade: true, school: true } },
      curriculumContent: { include: { subject: true } },
      learningOutcome: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!lessonPlan || lessonPlan.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentParse = LessonPlanContentSchema.safeParse(lessonPlan.contentJson);
  if (!contentParse.success) {
    return NextResponse.json({ error: "Generate and save the lesson plan before printing." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const outcomeText =
    lessonPlan.outcomeOverrideText ||
    (locale === "ar" ? lessonPlan.learningOutcome.textAr : lessonPlan.learningOutcome.textEn);

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateLessonPlanPdf({
      schoolName: lessonPlan.classSection.school.name,
      schoolNameAr: lessonPlan.classSection.school.nameAr,
      subjectName: lessonPlan.curriculumContent.subject.name,
      gradeName: lessonPlan.classSection.grade.name,
      classSectionName: lessonPlan.classSection.name,
      lessonTitle: lessonPlan.curriculumContent.lessonTitle,
      unitTitle: lessonPlan.curriculumContent.unitTitle,
      outcomeText,
      lessonDate: lessonPlan.lessonDate.toISOString().slice(0, 10),
      durationMinutes: lessonPlan.durationMinutes,
      teacherName: lessonPlan.teacher.name,
      content: contentParse.data,
    });
  } catch (error) {
    console.error("PDF generation failed", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 502 });
  }

  const nextVersionNumber = (lessonPlan.versions[0]?.versionNumber ?? 0) + 1;

  await prisma.$transaction([
    prisma.lessonPlanVersion.create({
      data: {
        lessonPlanId: lessonPlan.id,
        versionNumber: nextVersionNumber,
        contentJson: contentParse.data,
        printedById: session.user.id,
      },
    }),
    prisma.lessonPlan.update({
      where: { id: lessonPlan.id },
      data: { status: "PRINTED" },
    }),
  ]);

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    module: "LessonPlanning",
    entityId: lessonPlan.id,
    before: { status: lessonPlan.status },
    after: { status: "PRINTED", versionNumber: nextVersionNumber },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lesson-plan-${lessonPlan.id}.pdf"`,
    },
  });
}
