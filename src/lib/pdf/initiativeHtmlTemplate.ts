import { getArabicFontFaceCss, containsArabic } from "@/lib/pdf/fonts";

export type InitiativePdfData = {
  schoolName: string;
  schoolNameAr: string;
  title: string;
  categoryLabel: string;
  statusLabel: string;
  ownerName: string;
  initialIdea: string;
  goal: string;
  targetGroup: string;
  phases: { name: string; description: string; timeline: string }[];
  indicators: { name: string; measurementMethod: string; baselineValue: string; targetValue: string; actualValue: string }[];
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
  rtl: {
    owner: "المسؤول",
    initialIdea: "الفكرة الأولية",
    goal: "الهدف",
    targetGroup: "الفئة المستهدفة",
    phases: "مراحل التنفيذ",
    indicators: "مؤشرات الأداء",
    baseline: "القيمة الأساسية",
    target: "المستهدف",
    actual: "الحالي",
  },
  ltr: {
    owner: "Owner",
    initialIdea: "Initial Idea",
    goal: "Goal",
    targetGroup: "Target Group",
    phases: "Implementation Phases",
    indicators: "Performance Indicators",
    baseline: "Baseline",
    target: "Target",
    actual: "Current",
  },
};

export async function buildInitiativeHtml(data: InitiativePdfData): Promise<string> {
  const isRtl = containsArabic(data.goal) || containsArabic(data.title);
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
  body { font-family: 'Noto Naskh Arabic', 'Arial', sans-serif; font-size: 13px; color: #1e293b; padding: 24px 32px; }
  header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
  h1 { font-size: 20px; margin: 0 0 4px 0; }
  .meta { color: #475569; font-size: 12px; }
  section { margin-bottom: 14px; page-break-inside: avoid; }
  section h2 { font-size: 14px; background: #f1f5f9; padding: 6px 10px; border-radius: 4px; margin: 0 0 6px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: start; }
  th { background: #f8fafc; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(schoolDisplayName)}</h1>
      <div class="meta">${escapeHtml(data.categoryLabel)} · ${escapeHtml(data.statusLabel)}</div>
    </div>
    <div class="meta" style="text-align: end;">${t.owner}: ${escapeHtml(data.ownerName)}</div>
  </header>

  <h2 style="margin:0 0 12px 0;">${escapeHtml(data.title)}</h2>

  <section>
    <h2>${t.initialIdea}</h2>
    <p>${escapeHtml(data.initialIdea)}</p>
  </section>

  <section>
    <h2>${t.goal}</h2>
    <p>${escapeHtml(data.goal)}</p>
  </section>

  <section>
    <h2>${t.targetGroup}</h2>
    <p>${escapeHtml(data.targetGroup)}</p>
  </section>

  <section>
    <h2>${t.phases}</h2>
    <table>
      <thead><tr><th>#</th><th>Name</th><th>Description</th><th>Timeline</th></tr></thead>
      <tbody>
        ${data.phases
          .map(
            (p, i) =>
              `<tr><td>${i + 1}</td><td>${escapeHtml(p.name)}</td><td>${escapeHtml(p.description)}</td><td>${escapeHtml(p.timeline)}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </section>

  <section>
    <h2>${t.indicators}</h2>
    <table>
      <thead><tr><th>Indicator</th><th>${t.baseline}</th><th>${t.actual}</th><th>${t.target}</th></tr></thead>
      <tbody>
        ${data.indicators
          .map(
            (ind) =>
              `<tr><td>${escapeHtml(ind.name)}</td><td>${escapeHtml(ind.baselineValue || "—")}</td><td>${escapeHtml(ind.actualValue || "—")}</td><td>${escapeHtml(ind.targetValue || "—")}</td></tr>`,
          )
          .join("")}
      </tbody>
    </table>
  </section>
</body>
</html>`;
}
