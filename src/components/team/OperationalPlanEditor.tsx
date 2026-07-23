"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveOperationalPlanAction } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OperationalPlanGeneration } from "@/lib/ai/operationalPlanSchema";

const COLUMNS = ["domain", "objective", "actions", "responsible", "timeline", "indicator", "risk"] as const;

export function OperationalPlanEditor({
  planId,
  initialContent,
  updatedAt,
}: {
  planId: string;
  initialContent: OperationalPlanGeneration | null;
  updatedAt: string;
}) {
  const t = useTranslations("operationalPlan");
  const router = useRouter();
  const [content, setContent] = useState<OperationalPlanGeneration | null>(initialContent);
  const [loadedAt, setLoadedAt] = useState(updatedAt);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/operational-plans/${planId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      setContent(data.content);
    } catch {
      setError("Network error while generating. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function save() {
    if (!content) return;
    startSaving(async () => {
      const result = await saveOperationalPlanAction(planId, content, loadedAt);
      if (result.conflict) {
        setConflict(true);
        setError(result.error ?? null);
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.updatedAt) {
        setLoadedAt(result.updatedAt);
      }
      setConflict(false);
      setError(null);
      setSaveMessage(t("saved"));
      router.refresh();
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  function updateItem(index: number, field: keyof OperationalPlanGeneration["items"][number], value: string) {
    if (!content) return;
    const items = [...content.items];
    items[index] = { ...items[index], [field]: value };
    setContent({ items });
  }

  if (!content) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
        <p className="text-sm text-slate-600">{t("noneYet")}</p>
        <Button className="mt-4" onClick={generate} disabled={generating}>
          {generating ? "Generating..." : t("generate")}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t("matrixTitle")}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={generating}>
          {generating ? t("regenerating") : t("regenerate")}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
            <tr>
              {COLUMNS.map((field) => (
                <th key={field} className="px-2 py-2 font-medium">
                  {t(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {content.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100 align-top last:border-0">
                {COLUMNS.map((field) => (
                  <td key={field} className="px-2 py-1">
                    <Input
                      value={item[field]}
                      onChange={(e) => updateItem(index, field, e.target.value)}
                      className="min-w-[130px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        {!conflict && (
          <Button onClick={save} disabled={isSaving} className="w-fit">
            {isSaving ? t("saving") : t("save")}
          </Button>
        )}
        {conflict && (
          <Button onClick={() => window.location.reload()} variant="outline" className="w-fit">
            {t("reload")}
          </Button>
        )}
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
      </div>
    </div>
  );
}
