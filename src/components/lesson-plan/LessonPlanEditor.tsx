"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveLessonPlanContentAction } from "@/actions/lesson-plans";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { LessonPlanContent } from "@/lib/ai/lessonPlanSchema";

const SECTION_LABELS: Record<string, string> = {
  objectives: "Objectives",
  lessonFlow: "Lesson Flow",
  activities: "Activities",
  assessment: "Assessment",
  differentiation: "Differentiation",
  reflection: "Reflection",
};

function toLines(value: string[]): string {
  return value.join("\n");
}
function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function LessonPlanEditor({
  lessonPlanId,
  initialContent,
  isPrinted,
  updatedAt,
}: {
  lessonPlanId: string;
  initialContent: LessonPlanContent | null;
  isPrinted: boolean;
  updatedAt: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState<LessonPlanContent | null>(initialContent);
  const [loadedAt, setLoadedAt] = useState(updatedAt);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);

  async function generate(section?: keyof typeof SECTION_LABELS) {
    setGenerating(section ?? "full");
    setError(null);
    try {
      const res = await fetch(`/api/lesson-plans/${lessonPlanId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed.");
        return;
      }
      if (section && content) {
        setContent({ ...content, [section]: data.content[section] });
      } else {
        setContent(data.content);
      }
    } catch {
      setError("Network error while generating. Please try again.");
    } finally {
      setGenerating(null);
    }
  }

  function save() {
    if (!content) return;
    startSaving(async () => {
      const result = await saveLessonPlanContentAction(lessonPlanId, content, loadedAt);
      if (result.conflict) {
        setConflict(true);
        setError(result.error ?? null);
        return;
      }
      if (result.updatedAt) {
        setLoadedAt(result.updatedAt);
      }
      setConflict(false);
      setError(null);
      setSaveMessage("Saved.");
      router.refresh();
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  async function print() {
    setIsPrinting(true);
    try {
      const res = await fetch(`/api/lesson-plans/${lessonPlanId}/pdf`, { method: "POST" });
      if (!res.ok) {
        setError("Failed to generate PDF.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      router.refresh();
    } finally {
      setIsPrinting(false);
    }
  }

  if (!content) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
        <p className="text-sm text-slate-600">No lesson plan content yet.</p>
        <Button className="mt-4" onClick={() => generate()} disabled={generating !== null}>
          {generating ? "Generating..." : "Generate Plan with AI"}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Section
        title={SECTION_LABELS.objectives}
        onRegenerate={() => generate("objectives")}
        generating={generating === "objectives"}
      >
        <Textarea
          rows={3}
          value={toLines(content.objectives)}
          onChange={(e) => setContent({ ...content, objectives: fromLines(e.target.value) })}
          disabled={isPrinted}
        />
      </Section>

      <Section
        title={SECTION_LABELS.lessonFlow}
        onRegenerate={() => generate("lessonFlow")}
        generating={generating === "lessonFlow"}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(["intro", "development", "application", "closure"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <Label className="text-xs capitalize text-slate-500">{key}</Label>
              <Textarea
                rows={3}
                value={content.lessonFlow[key]}
                onChange={(e) => setContent({ ...content, lessonFlow: { ...content.lessonFlow, [key]: e.target.value } })}
                disabled={isPrinted}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title={SECTION_LABELS.activities}
        onRegenerate={() => generate("activities")}
        generating={generating === "activities"}
      >
        <Textarea
          rows={3}
          value={toLines(content.activities)}
          onChange={(e) => setContent({ ...content, activities: fromLines(e.target.value) })}
          disabled={isPrinted}
        />
      </Section>

      <Section
        title={SECTION_LABELS.assessment}
        onRegenerate={() => generate("assessment")}
        generating={generating === "assessment"}
      >
        <Textarea
          rows={2}
          value={content.assessment}
          onChange={(e) => setContent({ ...content, assessment: e.target.value })}
          disabled={isPrinted}
        />
      </Section>

      <Section
        title={SECTION_LABELS.differentiation}
        onRegenerate={() => generate("differentiation")}
        generating={generating === "differentiation"}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">Support</Label>
            <Textarea
              rows={3}
              value={content.differentiation.support}
              onChange={(e) =>
                setContent({ ...content, differentiation: { ...content.differentiation, support: e.target.value } })
              }
              disabled={isPrinted}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-slate-500">Enrichment</Label>
            <Textarea
              rows={3}
              value={content.differentiation.enrichment}
              onChange={(e) =>
                setContent({
                  ...content,
                  differentiation: { ...content.differentiation, enrichment: e.target.value },
                })
              }
              disabled={isPrinted}
            />
          </div>
        </div>
      </Section>

      <Section
        title={SECTION_LABELS.reflection}
        onRegenerate={() => generate("reflection")}
        generating={generating === "reflection"}
      >
        <Textarea
          rows={2}
          value={content.reflection}
          onChange={(e) => setContent({ ...content, reflection: e.target.value })}
          disabled={isPrinted}
        />
      </Section>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        {!isPrinted && !conflict && (
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        )}
        {conflict && (
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload
          </Button>
        )}
        <Button onClick={print} variant="outline" disabled={isPrinting}>
          {isPrinting ? "Preparing PDF..." : "Print"}
        </Button>
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
        {isPrinted && <span className="text-sm text-slate-500">This plan has been printed and is now read-only.</span>}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  onRegenerate,
  generating,
}: {
  title: string;
  children: React.ReactNode;
  onRegenerate: () => void;
  generating: boolean;
}) {
  return (
    <div className="rounded-md border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={onRegenerate} disabled={generating}>
          {generating ? "Regenerating..." : "Regenerate"}
        </Button>
      </div>
      {children}
    </div>
  );
}
