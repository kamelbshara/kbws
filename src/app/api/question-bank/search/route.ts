import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSchoolId } from "@/lib/activeSchool";
import type { QuestionDifficulty, QuestionType } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolId = await getActiveSchoolId(session);
  if (!schoolId) {
    return NextResponse.json({ items: [] });
  }

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId") || undefined;
  const gradeId = searchParams.get("gradeId") || undefined;
  const difficulty = (searchParams.get("difficulty") as QuestionDifficulty) || undefined;
  const type = (searchParams.get("type") as QuestionType) || undefined;
  const q = searchParams.get("q") || undefined;

  const items = await prisma.questionBankItem.findMany({
    where: {
      createdBy: { schoolId },
      subjectId,
      gradeId,
      difficulty,
      type,
      questionText: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: { subject: true, grade: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      subjectName: i.subject.name,
      gradeName: i.grade.name,
      skill: i.skill,
      difficulty: i.difficulty,
      type: i.type,
      questionText: i.questionText,
      choices: i.choices,
      correctAnswer: i.correctAnswer,
      explanation: i.explanation,
    })),
  });
}
