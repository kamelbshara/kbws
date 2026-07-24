"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { selectProfessionalGoalAction } from "@/actions/professionalGoals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ProfessionalGoalForm() {
  const t = useTranslations("professionalGoalsPage");
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ professionalGoalId: string; suggestions: string[] } | null>(null);
  const [isSelecting, startSelecting] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);

  async function generate() {
    if (prompt.trim().length < 5) {
      setError(t("promptTooShort"));
      return;
    }
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/professional-goals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      setResult({ professionalGoalId: data.professionalGoalId, suggestions: data.suggestions });
    } catch {
      setError(t("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  function select(goal: string) {
    if (!result) return;
    startSelecting(async () => {
      const res = await selectProfessionalGoalAction(result.professionalGoalId, goal);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setSelected(goal);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          rows={3}
          placeholder={t("promptPlaceholder")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <Button onClick={generate} disabled={generating} className="w-fit">
          {generating ? t("generating") : t("generate")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">{t("chooseOne")}</p>
          {result.suggestions.map((goal, i) => (
            <div
              key={i}
              className={`rounded-md border p-3 text-sm ${
                selected === goal ? "border-brand-gold bg-brand-cream/60" : "border-slate-200"
              }`}
            >
              <p>{goal}</p>
              <Button
                type="button"
                size="sm"
                variant={selected === goal ? "default" : "outline"}
                className="mt-2"
                onClick={() => select(goal)}
                disabled={isSelecting}
              >
                {selected === goal ? t("adopted") : t("adoptGoal")}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
