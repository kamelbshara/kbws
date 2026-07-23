import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

async function launchBrowser() {
  // Local development: point PUPPETEER_EXECUTABLE_PATH at a locally installed
  // Chromium build. In production (Vercel), @sparticuz/chromium supplies a
  // slim, serverless-compatible Chromium binary sized to fit the function bundle.
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());

  return puppeteer.launch({
    executablePath,
    args: process.env.PUPPETEER_EXECUTABLE_PATH ? ["--no-sandbox"] : chromium.args,
    headless: true,
  });
}

/** Renders an HTML string to a PDF buffer via headless Chromium. Shared by every print pipeline. */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
