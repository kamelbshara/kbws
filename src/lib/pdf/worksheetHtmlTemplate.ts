import { getArabicFontFaceCss, containsArabic } from "@/lib/pdf/fonts";
import type { WorksheetContent } from "@/lib/ai/worksheetSchema";

export type WorksheetPdfData = {
  schoolName: string;
  schoolNameAr: string;
  subjectName: string;
  gradeName: string;
  classSectionName: string;
  studentNameLabel: boolean;
  content: WorksheetContent;
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
  rtl: { subject: "المادة", grade: "الصف", name: "اسم الطالب", date: "التاريخ", question: "سؤال" },
  ltr: { subject: "Subject", grade: "Grade", name: "Student Name", date: "Date", question: "Question" },
};

export async function buildWorksheetHtml(data: WorksheetPdfData): Promise<string> {
  const isRtl = containsArabic(data.content.title) || containsArabic(data.content.instructions);
  const dir = isRtl ? "rtl" : "ltr";
  const t = LABELS[isRtl ? "rtl" : "ltr"];
  const fontFaceCss = await getArabicFontFaceCss();
  const schoolDisplayName = isRtl ? data.schoolNameAr : data.schoolName;

  const questionsHtml = data.content.questions
    .map((q, index) => {
      const choicesHtml =
        q.type === "MULTIPLE_CHOICE" && q.choices && q.choices.length > 0
          ? `<div class="choices">${q.choices.map((c) => `<div class="choice">${escapeHtml(c)}</div>`).join("")}</div>`
          : `<div class="answer-line"></div>`;
      return `<div class="question">
        <div class="question-text"><strong>${index + 1}.</strong> ${escapeHtml(q.text)}</div>
        ${choicesHtml}
      </div>`;
    })
    .join("");

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
  .student-row { display: flex; justify-content: space-between; margin: 12px 0 20px 0; font-size: 13px; }
  .student-row .line { display: inline-block; min-width: 160px; border-bottom: 1px solid #94a3b8; margin-inline-start: 8px; }
  .instructions {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 18px;
  }
  .question { margin-bottom: 16px; page-break-inside: avoid; }
  .question-text { margin-bottom: 6px; }
  .choices { display: flex; flex-direction: column; gap: 4px; padding-inline-start: 16px; }
  .choice::before { content: "○ "; }
  .answer-line { border-bottom: 1px solid #cbd5e1; height: 22px; margin-top: 4px; }
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
  </header>

  <h2 style="margin:0 0 8px 0;">${escapeHtml(data.content.title)}</h2>
  <div class="student-row">
    <span>${t.name}:<span class="line"></span></span>
    <span>${t.date}:<span class="line"></span></span>
  </div>
  <div class="instructions">${escapeHtml(data.content.instructions)}</div>

  ${questionsHtml}
</body>
</html>`;
}
