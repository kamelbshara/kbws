import { getArabicFontFaceCss, containsArabic } from "@/lib/pdf/fonts";

export type OperationalPlanPdfData = {
  schoolName: string;
  schoolNameAr: string;
  title: string;
  levelLabel: string;
  items: {
    domain: string;
    objective: string;
    actions: string;
    responsible: string;
    timeline: string;
    indicator: string;
    risk: string;
  }[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const LABELS = {
  rtl: { domain: "المجال", objective: "الهدف", actions: "الإجراءات", responsible: "المسؤول", timeline: "الجدول الزمني", indicator: "المؤشر", risk: "المخاطر" },
  ltr: { domain: "Domain", objective: "Objective", actions: "Actions", responsible: "Responsible", timeline: "Timeline", indicator: "Indicator", risk: "Risk" },
};

export async function buildOperationalPlanHtml(data: OperationalPlanPdfData): Promise<string> {
  const isRtl = containsArabic(data.title) || data.items.some((i) => containsArabic(i.objective));
  const dir = isRtl ? "rtl" : "ltr";
  const t = LABELS[isRtl ? "rtl" : "ltr"];
  const fontFaceCss = await getArabicFontFaceCss();
  const schoolDisplayName = isRtl ? data.schoolNameAr : data.schoolName;

  return `<!doctype html>
<html dir="${dir}" lang="${isRtl ? "ar" : "en"}">
<head>
<meta charset="utf-8" />
<style>
  ${fontFaceCss}
  * { box-sizing: border-box; }
  body { font-family: 'Noto Naskh Arabic', 'Arial', sans-serif; font-size: 12px; color: #1e293b; padding: 24px 32px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 20px; margin: 0 0 4px 0; }
  .meta { color: #475569; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: start; vertical-align: top; }
  th { background: #f8fafc; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(schoolDisplayName)}</h1>
      <div class="meta">${escapeHtml(data.levelLabel)}</div>
    </div>
  </header>

  <h2 style="margin:0 0 12px 0;">${escapeHtml(data.title)}</h2>

  <table>
    <thead>
      <tr>
        <th>${t.domain}</th><th>${t.objective}</th><th>${t.actions}</th><th>${t.responsible}</th><th>${t.timeline}</th><th>${t.indicator}</th><th>${t.risk}</th>
      </tr>
    </thead>
    <tbody>
      ${data.items
        .map(
          (item) =>
            `<tr><td>${escapeHtml(item.domain)}</td><td>${escapeHtml(item.objective)}</td><td>${escapeHtml(item.actions)}</td><td>${escapeHtml(item.responsible)}</td><td>${escapeHtml(item.timeline)}</td><td>${escapeHtml(item.indicator)}</td><td>${escapeHtml(item.risk)}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;
}
