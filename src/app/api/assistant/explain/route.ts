export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getRoleGroup } from "@/lib/permissions";
import { getOpenAIClient, OPENAI_MODEL } from "@/lib/ai/client";

const MAX_PAGE_TEXT = 6000;
const MAX_QUESTION = 500;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isManagement = (await getRoleGroup("MANAGEMENT_ROLES")).includes(session.user.role);
  if (!isManagement) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.slice(0, MAX_QUESTION) : "";
  const pageText = typeof body?.pageText === "string" ? body.pageText.slice(0, MAX_PAGE_TEXT) : "";
  const pathname = typeof body?.pathname === "string" ? body.pathname.slice(0, 200) : "";

  if (!question.trim()) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const locale = (await getLocale()) as "ar" | "en";
  const systemPrompt =
    locale === "ar"
      ? "أنت مساعد ذكي داخل منصة إدارة مدرسية. مهمتك هي شرح البيانات المعروضة حالياً في الصفحة للمستخدم (من فريق الإدارة) والإجابة عن أسئلته حولها بإيجاز ووضوح، بالاعتماد فقط على نص الصفحة المرفق. إن لم تجد إجابة في النص، قل ذلك بصراحة."
      : "You are an AI assistant inside a school management platform. Explain the data currently shown on the page to the management user and answer their question about it, briefly and clearly, relying only on the attached page text. If the answer isn't in the text, say so plainly.";

  try {
    const completion = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Page path: ${pathname}\n\nPage content:\n${pageText || "(no content captured)"}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "";
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json({ error: "The assistant could not respond. Please try again." }, { status: 502 });
  }
}
