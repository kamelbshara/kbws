import { getTranslations } from "next-intl/server";
import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

export async function LessonPlanReadOnlyView({ content }: { content: LessonPlanContent | null }) {
  const t = await getTranslations("lessonPlan");

  if (!content) {
    return <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{t("noContentYet")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title={t("objectives")}>
        <ul className="list-disc ps-5">
          {content.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ul>
      </Section>
      <Section title={t("lessonFlow")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("lessonFlowIntro")} value={content.lessonFlow.intro} />
          <Field label={t("lessonFlowDevelopment")} value={content.lessonFlow.development} />
          <Field label={t("lessonFlowApplication")} value={content.lessonFlow.application} />
          <Field label={t("lessonFlowClosure")} value={content.lessonFlow.closure} />
        </div>
      </Section>
      <Section title={t("activities")}>
        <ul className="list-disc ps-5">
          {content.activities.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>
      <Section title={t("assessment")}>
        <p>{content.assessment}</p>
      </Section>
      <Section title={t("differentiation")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("support")} value={content.differentiation.support} />
          <Field label={t("enrichment")} value={content.differentiation.enrichment} />
        </div>
      </Section>
      <Section title={t("reflection")}>
        <p>{content.reflection}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h2 className="mb-2 font-medium">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div>{value}</div>
    </div>
  );
}
