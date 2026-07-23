import { buildInitiativeHtml, type InitiativePdfData } from "@/lib/pdf/initiativeHtmlTemplate";
import { generatePdfFromHtml } from "@/lib/pdf/generatePdf";

export async function generateInitiativePdf(data: InitiativePdfData): Promise<Buffer> {
  const html = await buildInitiativeHtml(data);
  return generatePdfFromHtml(html);
}
