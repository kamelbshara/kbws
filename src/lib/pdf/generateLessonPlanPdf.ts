import { buildLessonPlanHtml, type LessonPlanPdfData } from "@/lib/pdf/lessonPlanHtmlTemplate";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";

export async function generateLessonPlanPdf(data: LessonPlanPdfData): Promise<Buffer> {
  const html = await buildLessonPlanHtml(data);
  return generatePdfFromHtml(html);
}
