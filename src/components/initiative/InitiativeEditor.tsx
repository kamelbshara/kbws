"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveInitiativePlanAction, updateInitiativeStatusAction } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { InitiativeGeneration } from "@/lib/ai/initiativeSchema";

export function InitiativeEditor({
  initiativeId,
  initialContent,
  status,
}: {
  initiativeId: string;
  initialContent: InitiativeGeneration | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
}) {
  const router = useRouter();
  const [content, setContent] = useState<InitiativeGeneration | null>(initialContent);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTransitioning, startTransitioning] = useTransition();
  const readOnly = status === "COMPLETED";

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/generate`, { method: "POST" });
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
      const result = await saveInitiativePlanAction(initiativeId, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaveMessage("Saved.");
      router.refresh();
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  function markActive() {
    startTransitioning(async () => {
      await updateInitiativeStatusAction(initiativeId, "ACTIVE");
      router.refresh();
    });
  }

  function markCompleted() {
    startTransitioning(async () => {
      await updateInitiativeStatusAction(initiativeId, "COMPLETED");
      router.refresh();
    });
  }

  if (!content) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
        <p className="text-sm text-slate-600">No plan generated yet.</p>
        <Button className="mt-4" onClick={generate} disabled={generating}>
          {generating ? "Generating..." : "Generate Plan with AI"}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">Goal &amp; Target Group</h2>
          <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={generating}>
            {generating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-slate-500">Goal</Label>
            <Textarea
              rows={2}
              value={content.goal}
              onChange={(e) => setContent({ ...content, goal: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">Target Group</Label>
            <Textarea
              rows={1}
              value={content.targetGroup}
              onChange={(e) => setContent({ ...content, targetGroup: e.target.value })}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Implementation Phases</h2>
        <div className="flex flex-col gap-3">
          {content.phases.map((phase, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
              <Input
                value={phase.name}
                placeholder="Phase name"
                disabled={readOnly}
                onChange={(e) => {
                  const phases = [...content.phases];
                  phases[index] = { ...phase, name: e.target.value };
                  setContent({ ...content, phases });
                }}
              />
              <Input
                className="sm:col-span-2"
                value={phase.description}
                placeholder="Description"
                disabled={readOnly}
                onChange={(e) => {
                  const phases = [...content.phases];
                  phases[index] = { ...phase, description: e.target.value };
                  setContent({ ...content, phases });
                }}
              />
              <Input
                value={phase.timeline}
                placeholder="Timeline"
                disabled={readOnly}
                onChange={(e) => {
                  const phases = [...content.phases];
                  phases[index] = { ...phase, timeline: e.target.value };
                  setContent({ ...content, phases });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <h2 className="mb-2 font-medium">Performance Indicators</h2>
        <div className="flex flex-col gap-3">
          {content.indicators.map((indicator, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
              <Input
                value={indicator.name}
                placeholder="Indicator"
                disabled={readOnly}
                onChange={(e) => {
                  const indicators = [...content.indicators];
                  indicators[index] = { ...indicator, name: e.target.value };
                  setContent({ ...content, indicators });
                }}
              />
              <Input
                value={indicator.measurementMethod}
                placeholder="Measurement method"
                disabled={readOnly}
                onChange={(e) => {
                  const indicators = [...content.indicators];
                  indicators[index] = { ...indicator, measurementMethod: e.target.value };
                  setContent({ ...content, indicators });
                }}
              />
              <Input
                value={indicator.targetValue}
                placeholder="Target value"
                disabled={readOnly}
                onChange={(e) => {
                  const indicators = [...content.indicators];
                  indicators[index] = { ...indicator, targetValue: e.target.value };
                  setContent({ ...content, indicators });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        {!readOnly && (
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        )}
        {status === "DRAFT" && (
          <Button onClick={markActive} variant="outline" disabled={isTransitioning}>
            Mark Active
          </Button>
        )}
        {status === "ACTIVE" && (
          <Button onClick={markCompleted} variant="outline" disabled={isTransitioning}>
            Mark Completed
          </Button>
        )}
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
        {readOnly && <span className="text-sm text-slate-500">This initiative is completed and now read-only.</span>}
      </div>
    </div>
  );
}
