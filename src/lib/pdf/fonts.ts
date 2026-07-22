import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedFontCss: string | null = null;

/**
 * Returns @font-face CSS with the Arabic font embedded as a base64 data URI.
 *
 * This MUST be self-hosted and embedded in the HTML/CSS itself: Vercel's
 * serverless Chromium sandbox has no Arabic system fonts installed, so
 * relying on a system font silently renders empty boxes for all Arabic text.
 */
export async function getArabicFontFaceCss(): Promise<string> {
  if (cachedFontCss) return cachedFontCss;

  const fontsDir = path.join(process.cwd(), "assets", "fonts");
  const [regular, bold] = await Promise.all([
    readFile(path.join(fontsDir, "NotoNaskhArabic-Regular.woff2")),
    readFile(path.join(fontsDir, "NotoNaskhArabic-Bold.woff2")),
  ]);

  cachedFontCss = `
    @font-face {
      font-family: 'Noto Naskh Arabic';
      font-style: normal;
      font-weight: 400;
      src: url(data:font/woff2;base64,${regular.toString("base64")}) format('woff2');
    }
    @font-face {
      font-family: 'Noto Naskh Arabic';
      font-style: normal;
      font-weight: 700;
      src: url(data:font/woff2;base64,${bold.toString("base64")}) format('woff2');
    }
  `;

  return cachedFontCss;
}

const ARABIC_RANGE = /[؀-ۿݐ-ݿ]/;

export function containsArabic(text: string): boolean {
  return ARABIC_RANGE.test(text);
}
