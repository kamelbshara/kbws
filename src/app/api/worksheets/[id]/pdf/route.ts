export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorksheetContentSchema } from "@/lib/ai/worksheetSchema";
import { generateWorksheetPdf } from "@/lib/pdf/generateWorksheetPdf";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const worksheet = await prisma.worksheet.findUnique({
    where: { id },
    include: {
      lessonPlan: {
        include: {
          classSection: { include: { grade: true, school: true } },
          curriculumContent: { include: { subject: true } },
        },
      },
    },
  });

  if (!worksheet || worksheet.createdById !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contentParse = WorksheetContentSchema.safeParse(worksheet.contentJson);
  if (!contentParse.success) {
    return NextResponse.json({ error: "This worksheet has no content to print." }, { status: 400 });
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateWorksheetPdf({
      schoolName: worksheet.lessonPlan.classSection.school.name,
      schoolNameAr: worksheet.lessonPlan.classSection.school.nameAr,
      subjectName: worksheet.lessonPlan.curriculumContent.subject.name,
      gradeName: worksheet.lessonPlan.classSection.grade.name,
      classSectionName: worksheet.lessonPlan.classSection.name,
      studentNameLabel: true,
      content: contentParse.data,
    });
  } catch (error) {
    console.error("Worksheet PDF generation failed", error);
    return NextResponse.json({ error: "Failed to generate PDF." }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="worksheet-${worksheet.id}.pdf"`,
    },
  });
}
