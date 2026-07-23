import { buildOperationalPlanHtml, type OperationalPlanPdfData } from "@/lib/pdf/operationalPlanHtmlTemplate";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";

export async function generateOperationalPlanPdf(data: OperationalPlanPdfData): Promise<Buffer> {
  const html = await buildOperationalPlanHtml(data);
  return generatePdfFromHtml(html);
}
