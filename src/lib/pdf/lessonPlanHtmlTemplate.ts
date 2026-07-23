import { getArabicFontFaceCss, containsArabic } from "@/lib/pdf/fonts";
import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

export type LessonPlanPdfData = {
  schoolName: string;
  schoolNameAr: string;
  subjectName: string;
  gradeName: string;
  classSectionName: string;
  lessonTitle: string;
  unitTitle: string;
  outcomeText: string;
  lessonDate: string;
  durationMinutes: number;
  teacherName: string;
  content: LessonPlanContent;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function list(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

const SECTION_TITLES = {
  rtl: {
    objectives: "أهداف الدرس",
    lessonFlow: "مسار الحصة",
    intro: "التهيئة",
    development: "بناء المعرفة",
    application: "التطبيق",
    closure: "التقويم الختامي",
    activities: "الأنشطة",
    assessment: "التقييم",
    differentiation: "التمايز",
    support: "دعم الطلاب المتعثرين",
    enrichment: "إثراء الطلاب المتقدمين",
    reflection: "التأمل",
    outcome: "مخرج التعلم",
    subject: "المادة",
    grade: "الصف",
    date: "التاريخ",
    duration: "المدة",
    teacher: "المعلم",
  },
  ltr: {
    objectives: "Objectives",
    lessonFlow: "Lesson Flow",
    intro: "Introduction",
    development: "Development",
    application: "Application",
    closure: "Closure",
    activities: "Activities",
    assessment: "Assessment",
    differentiation: "Differentiation",
    support: "Support",
    enrichment: "Enrichment",
    reflection: "Reflection",
    outcome: "Learning Outcome",
    subject: "Subject",
    grade: "Grade",
    date: "Date",
    duration: "Duration",
    teacher: "Teacher",
  },
};

export async function buildLessonPlanHtml(data: LessonPlanPdfData): Promise<string> {
  const isRtl = containsArabic(data.outcomeText) || containsArabic(data.content.objectives[0] ?? "");
  const dir = isRtl ? "rtl" : "ltr";
  const t = SECTION_TITLES[isRtl ? "rtl" : "ltr"];
  const fontFaceCss = await getArabicFontFaceCss();
  const schoolDisplayName = isRtl ? data.schoolNameAr : data.schoolName;

  return `<!doctype html>
<html dir="${dir}" lang="${isRtl ? "ar" : "en"}">
<head>
<meta charset="utf-8" />
<style>
  ${fontFaceCss}
  * { box-sizing: border-box; }
  body {
    font-family: 'Noto Naskh Arabic', 'Arial', sans-serif;
    font-size: 13px;
    color: #1e293b;
    padding: 24px 32px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  h1 { font-size: 20px; margin: 0 0 4px 0; }
  .meta { color: #475569; font-size: 12px; }
  .meta span { margin-inline-end: 16px; }
  section { margin-bottom: 14px; page-break-inside: avoid; }
  section h2 {
    font-size: 14px;
    background: #f1f5f9;
    padding: 6px 10px;
    border-radius: 4px;
    margin: 0 0 6px 0;
  }
  .outcome-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 16px;
  }
  ul { margin: 0; padding-inline-start: 20px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .subcard { background: #fafafa; border: 1px solid #eee; border-radius: 4px; padding: 8px 10px; }
  .subcard h3 { font-size: 12px; margin: 0 0 4px 0; color: #475569; }
</style>
</head>
<body>
  <header>
    <div>
      <h1>${escapeHtml(schoolDisplayName)}</h1>
      <div class="meta">
        <span>${t.subject}: ${escapeHtml(data.subjectName)}</span>
        <span>${t.grade}: ${escapeHtml(data.gradeName)} · ${escapeHtml(data.classSectionName)}</span>
      </div>
    </div>
    <div class="meta" style="text-align: end;">
      <div>${t.date}: <span dir="ltr">${escapeHtml(data.lessonDate)}</span></div>
      <div>${t.duration}: <span dir="ltr">${data.durationMinutes}</span> ${isRtl ? "دقيقة" : "min"}</div>
      <div>${t.teacher}: ${escapeHtml(data.teacherName)}</div>
    </div>
  </header>

  <h2 style="margin:0 0 4px 0;">${escapeHtml(data.unitTitle)} — ${escapeHtml(data.lessonTitle)}</h2>
  <div class="outcome-box">
    <strong>${t.outcome}:</strong> ${escapeHtml(data.outcomeText)}
  </div>

  <section>
    <h2>${t.objectives}</h2>
    ${list(data.content.objectives)}
  </section>

  <section>
    <h2>${t.lessonFlow}</h2>
    <div class="grid-2">
      <div class="subcard"><h3>${t.intro}</h3>${escapeHtml(data.content.lessonFlow.intro)}</div>
      <div class="subcard"><h3>${t.development}</h3>${escapeHtml(data.content.lessonFlow.development)}</div>
      <div class="subcard"><h3>${t.application}</h3>${escapeHtml(data.content.lessonFlow.application)}</div>
      <div class="subcard"><h3>${t.closure}</h3>${escapeHtml(data.content.lessonFlow.closure)}</div>
    </div>
  </section>

  <section>
    <h2>${t.activities}</h2>
    ${list(data.content.activities)}
  </section>

  <section>
    <h2>${t.assessment}</h2>
    <p>${escapeHtml(data.content.assessment)}</p>
  </section>

  <section>
    <h2>${t.differentiation}</h2>
    <div class="grid-2">
      <div class="subcard"><h3>${t.support}</h3>${escapeHtml(data.content.differentiation.support)}</div>
      <div class="subcard"><h3>${t.enrichment}</h3>${escapeHtml(data.content.differentiation.enrichment)}</div>
    </div>
  </section>

  <section>
    <h2>${t.reflection}</h2>
    <p>${escapeHtml(data.content.reflection)}</p>
  </section>
</body>
</html>`;
}
