"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateWorksheetContentAction } from "@/actions/worksheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { WorksheetContent } from "@/lib/ai/worksheetSchema";

export function WorksheetEditor({ worksheetId, initialContent }: { worksheetId: string; initialContent: WorksheetContent }) {
  const t = useTranslations("worksheet");
  const common = useTranslations("common");
  const [content, setContent] = useState<WorksheetContent>(initialContent);
  const [isSaving, startSaving] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(index: number, patch: Partial<WorksheetContent["questions"][number]>) {
    setContent({
      ...content,
      questions: content.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    });
  }

  function updateChoice(qIndex: number, cIndex: number, value: string) {
    const question = content.questions[qIndex];
    const choices = [...(question.choices ?? [])];
    choices[cIndex] = value;
    updateQuestion(qIndex, { choices });
  }

  function addChoice(qIndex: number) {
    const question = content.questions[qIndex];
    updateQuestion(qIndex, { choices: [...(question.choices ?? []), ""] });
  }

  function removeQuestion(index: number) {
    setContent({ ...content, questions: content.questions.filter((_, i) => i !== index) });
  }

  function addQuestion() {
    setContent({
      ...content,
      questions: [...content.questions, { text: "", type: "SHORT_ANSWER" }],
    });
  }

  function save() {
    startSaving(async () => {
      const result = await updateWorksheetContentAction(worksheetId, content);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaveMessage(t("saved"));
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  async function print() {
    setIsPrinting(true);
    try {
      const res = await fetch(`/api/worksheets/${worksheetId}/pdf`, { method: "POST" });
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

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-500">{t("worksheetTitle")}</Label>
        <Input value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-xs text-slate-500">{t("instructions")}</Label>
        <Textarea rows={2} value={content.instructions} onChange={(e) => setContent({ ...content, instructions: e.target.value })} />
      </div>

      <div className="flex flex-col gap-4">
        {content.questions.map((question, qIndex) => (
          <div key={qIndex} className="rounded-md border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">{t("questionLabel", { n: qIndex + 1 })}</h3>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  value={question.type}
                  onChange={(e) => updateQuestion(qIndex, { type: e.target.value as "SHORT_ANSWER" | "MULTIPLE_CHOICE" })}
                >
                  <option value="SHORT_ANSWER">{t("shortAnswer")}</option>
                  <option value="MULTIPLE_CHOICE">{t("multipleChoice")}</option>
                </select>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(qIndex)}>
                  {common("remove")}
                </Button>
              </div>
            </div>
            <Textarea
              rows={2}
              value={question.text}
              onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
            />
            {question.type === "MULTIPLE_CHOICE" && (
              <div className="mt-2 flex flex-col gap-2">
                {(question.choices ?? []).map((choice, cIndex) => (
                  <Input
                    key={cIndex}
                    value={choice}
                    placeholder={t("choicePlaceholder", { n: cIndex + 1 })}
                    onChange={(e) => updateChoice(qIndex, cIndex, e.target.value)}
                  />
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => addChoice(qIndex)}>
                  {t("addChoice")}
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
          {t("addQuestion")}
        </Button>
      </div>

      <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? t("saving") : t("save")}
        </Button>
        <Button onClick={print} variant="outline" disabled={isPrinting}>
          {isPrinting ? t("preparingPdf") : common("print")}
        </Button>
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
      </div>
    </div>
  );
}
