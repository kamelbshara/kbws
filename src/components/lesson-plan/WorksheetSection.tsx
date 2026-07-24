"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function WorksheetSection({
  lessonPlanId,
  worksheets,
  canGenerate,
}: {
  lessonPlanId: string;
  worksheets: { id: string; createdAt: string }[];
  canGenerate: boolean;
}) {
  const t = useTranslations("lessonPlan");
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/lesson-plans/${lessonPlanId}/worksheet`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      router.push(`/worksheets/${data.worksheetId}`);
    } catch {
      setError(t("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-6 rounded-md border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t("worksheetsTitle")}</h2>
        {canGenerate && (
          <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
            {generating ? t("generating") : t("generateWorksheet")}
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {worksheets.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          {worksheets.map((w) => (
            <li key={w.id}>
              <Link href={`/worksheets/${w.id}`} className="hover:underline">
                {t("worksheetDated", { date: w.createdAt })}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{t("noWorksheetsYet")}</p>
      )}
    </div>
  );
}
