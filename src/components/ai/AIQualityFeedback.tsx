"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { submitAIFeedbackAction } from "@/actions/aiFeedback";
import { Button } from "@/components/ui/button";
import type { QualityIssue } from "@/lib/ai/evaluate";

export function AIQualityFeedback({
  generationLogId,
  quality,
  fieldNamespace,
}: {
  generationLogId: string | null;
  quality: { score: number; issues: QualityIssue[] } | null;
  fieldNamespace: string;
}) {
  const t = useTranslations("aiQuality");
  const tField = useTranslations(fieldNamespace);
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState<"UP" | "DOWN" | null>(null);

  function rate(rating: "UP" | "DOWN") {
    if (!generationLogId) return;
    startTransition(async () => {
      await submitAIFeedbackAction(generationLogId, rating);
      setSubmitted(rating);
    });
  }

  if (!quality && !generationLogId) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-2 text-xs">
      {quality && (
        <div className="flex flex-1 flex-col gap-1">
          <span
            className={
              quality.score >= 80 ? "text-green-700" : quality.score >= 50 ? "text-amber-700" : "text-red-600"
            }
          >
            {t("score", { score: quality.score })}
          </span>
          {quality.issues.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-slate-500">
              {quality.issues.slice(0, 5).map((issue, i) => (
                <li key={i}>• {t(`issues.${issue.code}`, { field: tField(issue.field) })}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {generationLogId && (
        <div className="flex items-center gap-1">
          <span className="text-slate-400">{t("wasHelpful")}</span>
          <Button
            type="button"
            size="sm"
            variant={submitted === "UP" ? "default" : "ghost"}
            onClick={() => rate("UP")}
            disabled={isPending}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={submitted === "DOWN" ? "default" : "ghost"}
            onClick={() => rate("DOWN")}
            disabled={isPending}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
