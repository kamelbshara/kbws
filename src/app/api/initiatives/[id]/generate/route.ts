export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OPENAI_MODEL } from "@/lib/ai/client";
import { generateInitiativePlan } from "@/lib/ai/generateInitiative";

const OWNER_ROLES = ["TEACHER", "INITIATIVE_OWNER", "TEAM_LEADER"];

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!OWNER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const initiative = await prisma.initiative.findUnique({ where: { id } });

  if (!initiative || initiative.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const promptInput = {
    title: initiative.title,
    category: initiative.category,
    initialIdea: initiative.initialIdea,
    locale,
  };

  try {
    const result = await generateInitiativePlan(promptInput);

    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: initiative.id,
        userId: session.user.id,
        model: OPENAI_MODEL,
        promptInput,
        responseJson: result.content,
        status: "SUCCESS",
      },
    });

    return NextResponse.json({ content: result.content });
  } catch (error) {
    await prisma.aIGenerationLog.create({
      data: {
        initiativeId: initiative.id,
        userId: session.user.id,
        model: OPENAI_MODEL,
        promptInput,
        status: "ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Generation failed. Please try again." }, { status: 502 });
  }
}
