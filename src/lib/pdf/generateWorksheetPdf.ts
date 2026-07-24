import { buildWorksheetHtml, type WorksheetPdfData } from "@/lib/pdf/worksheetHtmlTemplate";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";

export async function generateWorksheetPdf(data: WorksheetPdfData): Promise<Buffer> {
  const html = await buildWorksheetHtml(data);
  return generatePdfFromHtml(html);
}
