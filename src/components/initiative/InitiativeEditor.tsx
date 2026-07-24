"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveInitiativePlanAction, updateInitiativeStatusAction } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AIQualityFeedback } from "@/components/ai/AIQualityFeedback";
import type { InitiativeSave } from "@/lib/ai/initiativeSchema";
import type { QualityIssue } from "@/lib/ai/evaluate";

const EMPTY_PHASE = { name: "", description: "", timeline: "" };
const EMPTY_INDICATOR = { name: "", measurementMethod: "", targetValue: "", baselineValue: "", actualValue: "", aiAnalysis: "" };

export function InitiativeEditor({
  initiativeId,
  initialContent,
  initialReflection,
  status,
  updatedAt,
  canEdit,
}: {
  initiativeId: string;
  initialContent: InitiativeSave | null;
  initialReflection: string | null;
  status: "DRAFT" | "ACTIVE" | "COMPLETED";
  updatedAt: string;
  canEdit: boolean;
}) {
  const t = useTranslations("initiatives");
  const common = useTranslations("common");
  const router = useRouter();
  const [content, setContent] = useState<InitiativeSave | null>(initialContent);
  const [loadedAt, setLoadedAt] = useState(updatedAt);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isTransitioning, startTransitioning] = useTransition();
  const [isPrinting, setIsPrinting] = useState(false);
  const [generationLogId, setGenerationLogId] = useState<string | null>(null);
  const [quality, setQuality] = useState<{ score: number; issues: QualityIssue[] } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [reflection, setReflection] = useState(initialReflection ?? "");
  const [generatingReflection, setGeneratingReflection] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const readOnly = status === "COMPLETED" || !canEdit;

  async function print() {
    setIsPrinting(true);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/pdf`, { method: "POST" });
      if (!res.ok) {
        setError(t("printFailed"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } finally {
      setIsPrinting(false);
    }
  }

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      setContent(data.content);
      setGenerationLogId(data.generationLogId ?? null);
      setQuality(data.quality ?? null);
    } catch {
      setError(t("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  async function analyzeResults() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/analyze-results`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("analysisFailed"));
        return;
      }
      if (content) {
        const byName = new Map<string, string | null>(
          data.indicators.map((i: { name: string; analysis: string | null }) => [i.name, i.analysis]),
        );
        setContent({
          ...content,
          indicators: content.indicators.map((ind) => ({
            ...ind,
            aiAnalysis: byName.get(ind.name) ?? ind.aiAnalysis,
          })),
        });
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateReflection() {
    setGeneratingReflection(true);
    setError(null);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/reflection`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      setReflection(data.reflection);
    } catch {
      setError(t("networkError"));
    } finally {
      setGeneratingReflection(false);
    }
  }

  async function generateReport() {
    setGeneratingReport(true);
    setError(null);
    try {
      const res = await fetch(`/api/initiatives/${initiativeId}/report`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("reportFailed"));
        return;
      }
      setReportReady(true);
    } catch {
      setError(t("networkError"));
    } finally {
      setGeneratingReport(false);
    }
  }

  function save() {
    if (!content) return;
    startSaving(async () => {
      const result = await saveInitiativePlanAction(initiativeId, content, loadedAt);
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

  function addPhase() {
    if (!content) return;
    setContent({ ...content, phases: [...content.phases, { ...EMPTY_PHASE }] });
  }

  function removePhase(index: number) {
    if (!content) return;
    setContent({
      ...content,
      phases: content.phases.filter((_, i) => i !== index),
      indicators: content.indicators.map((ind) => (ind.phaseIndex === index ? { ...ind, phaseIndex: undefined } : ind)),
    });
  }

  function addIndicator() {
    if (!content) return;
    setContent({ ...content, indicators: [...content.indicators, { ...EMPTY_INDICATOR }] });
  }

  function removeIndicator(index: number) {
    if (!content) return;
    setContent({ ...content, indicators: content.indicators.filter((_, i) => i !== index) });
  }

  if (!content) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
        <p className="text-sm text-slate-600">{t("noPlanYet")}</p>
        {canEdit && (
          <Button className="mt-4" onClick={generate} disabled={generating}>
            {generating ? t("generating") : t("generatePlan")}
          </Button>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-md border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">{t("goalTargetGroupTitle")}</h2>
          {canEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={generating}>
              {generating ? t("regenerating") : t("regenerate")}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs text-slate-500">{t("goal")}</Label>
            <Textarea
              rows={2}
              value={content.goal}
              onChange={(e) => setContent({ ...content, goal: e.target.value })}
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500">{t("targetGroup")}</Label>
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
        <h2 className="mb-2 font-medium">{t("implementationPhases")}</h2>
        <div className="flex flex-col gap-3">
          {content.phases.map((phase, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-md bg-slate-50 p-3 sm:grid-cols-4">
              <Input
                value={phase.name}
                placeholder={t("phaseName")}
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
                placeholder={t("phaseDescription")}
                disabled={readOnly}
                onChange={(e) => {
                  const phases = [...content.phases];
                  phases[index] = { ...phase, description: e.target.value };
                  setContent({ ...content, phases });
                }}
              />
              <div className="flex items-center gap-2">
                <Input
                  value={phase.timeline}
                  placeholder={t("phaseTimeline")}
                  disabled={readOnly}
                  onChange={(e) => {
                    const phases = [...content.phases];
                    phases[index] = { ...phase, timeline: e.target.value };
                    setContent({ ...content, phases });
                  }}
                />
                {!readOnly && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePhase(index)}>
                    {t("removePhase")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addPhase}>
            {t("addPhase")}
          </Button>
        )}
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">{t("performanceIndicators")}</h2>
          {canEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={analyzeResults} disabled={analyzing}>
              {analyzing ? t("analyzing") : t("analyzeResults")}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {content.indicators.map((indicator, index) => (
            <div key={index} className="rounded-md bg-slate-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input
                  value={indicator.name}
                  placeholder={t("indicatorName")}
                  disabled={readOnly}
                  onChange={(e) => {
                    const indicators = [...content.indicators];
                    indicators[index] = { ...indicator, name: e.target.value };
                    setContent({ ...content, indicators });
                  }}
                />
                <Input
                  value={indicator.measurementMethod}
                  placeholder={t("measurementMethod")}
                  disabled={readOnly}
                  onChange={(e) => {
                    const indicators = [...content.indicators];
                    indicators[index] = { ...indicator, measurementMethod: e.target.value };
                    setContent({ ...content, indicators });
                  }}
                />
                <select
                  className="h-9 rounded-md border border-slate-300 px-2 text-sm"
                  value={indicator.phaseIndex ?? ""}
                  disabled={readOnly}
                  onChange={(e) => {
                    const indicators = [...content.indicators];
                    indicators[index] = {
                      ...indicator,
                      phaseIndex: e.target.value === "" ? undefined : Number(e.target.value),
                    };
                    setContent({ ...content, indicators });
                  }}
                >
                  <option value="">{t("noPhase")}</option>
                  {content.phases.map((phase, pIndex) => (
                    <option key={pIndex} value={pIndex}>
                      {phase.name || `${t("phaseLabel")} ${pIndex + 1}`}
                    </option>
                  ))}
                </select>
                <Input
                  value={indicator.targetValue}
                  placeholder={t("targetValue")}
                  disabled={readOnly}
                  onChange={(e) => {
                    const indicators = [...content.indicators];
                    indicators[index] = { ...indicator, targetValue: e.target.value };
                    setContent({ ...content, indicators });
                  }}
                />
                <Input
                  value={indicator.baselineValue ?? ""}
                  placeholder={t("baselineValue")}
                  disabled={readOnly}
                  onChange={(e) => {
                    const indicators = [...content.indicators];
                    indicators[index] = { ...indicator, baselineValue: e.target.value };
                    setContent({ ...content, indicators });
                  }}
                />
                <div className="flex items-center gap-2">
                  <Input
                    value={indicator.actualValue ?? ""}
                    placeholder={t("actualValue")}
                    disabled={readOnly}
                    onChange={(e) => {
                      const indicators = [...content.indicators];
                      indicators[index] = { ...indicator, actualValue: e.target.value };
                      setContent({ ...content, indicators });
                    }}
                  />
                  {!readOnly && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeIndicator(index)}>
                      {t("removeIndicator")}
                    </Button>
                  )}
                </div>
              </div>
              {indicator.aiAnalysis && (
                <p className="mt-2 rounded-md bg-brand-cream/60 p-2 text-xs text-slate-700">
                  <strong>{t("analysisLabel")}:</strong> {indicator.aiAnalysis}
                </p>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addIndicator}>
            {t("addIndicator")}
          </Button>
        )}
      </div>

      <div className="rounded-md border border-slate-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium">{t("reflectionLabel")}</h2>
          {canEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={generateReflection} disabled={generatingReflection}>
              {generatingReflection ? t("generatingReflection") : t("generateReflection")}
            </Button>
          )}
        </div>
        <Textarea
          rows={3}
          value={reflection}
          placeholder={t("reflectionPlaceholder")}
          disabled={readOnly}
          onChange={(e) => setReflection(e.target.value)}
        />
      </div>

      <AIQualityFeedback generationLogId={generationLogId} quality={quality} fieldNamespace="initiatives" />

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        {!readOnly && !conflict && (
          <Button onClick={save} disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        )}
        {conflict && (
          <Button onClick={() => window.location.reload()} variant="outline">
            {t("reload")}
          </Button>
        )}
        {canEdit && status === "DRAFT" && (
          <Button onClick={markActive} variant="outline" disabled={isTransitioning}>
            {t("markActive")}
          </Button>
        )}
        {canEdit && status === "ACTIVE" && (
          <Button onClick={markCompleted} variant="outline" disabled={isTransitioning}>
            {t("markCompleted")}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={generateReport} disabled={generatingReport}>
          {generatingReport ? t("generatingReport") : t("generateReport")}
        </Button>
        <Button onClick={print} variant="outline" disabled={isPrinting}>
          {isPrinting ? t("preparingPdf") : common("print")}
        </Button>
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
        {reportReady && <span className="text-sm text-green-700">{t("reportGeneratedNote")}</span>}
        {readOnly && status === "COMPLETED" && <span className="text-sm text-slate-500">{t("completedReadOnly")}</span>}
      </div>
    </div>
  );
}