"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { saveAssessmentQuestionsAction } from "@/actions/assessments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AssessmentGeneration, QuestionItem } from "@/lib/ai/questionSchema";

const DIFFICULTIES: QuestionItem["difficulty"][] = ["EASY", "MEDIUM", "ADVANCED", "CHALLENGE"];

export function AssessmentEditor({
  assessmentId,
  initialContent,
}: {
  assessmentId: string;
  initialContent: AssessmentGeneration | null;
}) {
  const t = useTranslations("assessments");
  const router = useRouter();
  const [content, setContent] = useState<AssessmentGeneration | null>(initialContent);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      setContent(data.content);
    } catch {
      setError(t("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<QuestionItem>) {
    if (!content) return;
    const questions = [...content.questions];
    questions[index] = { ...questions[index], ...patch };
    setContent({ ...content, questions });
  }

  function updateChoice(qIndex: number, cIndex: number, value: string) {
    if (!content) return;
    const question = content.questions[qIndex];
    const choices = [...(question.choices ?? [])];
    choices[cIndex] = value;
    updateQuestion(qIndex, { choices });
  }

  function removeQuestion(index: number) {
    if (!content) return;
    setContent({ ...content, questions: content.questions.filter((_, i) => i !== index) });
  }

  function save() {
    if (!content) return;
    startSaving(async () => {
      const result = await saveAssessmentQuestionsAction(assessmentId, content);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setSaveMessage(t("saved"));
      router.refresh();
      setTimeout(() => setSaveMessage(null), 2000);
    });
  }

  if (!content) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 p-6 text-center">
        <p className="text-sm text-slate-600">{t("noQuestionsYet")}</p>
        <Button className="mt-4" onClick={generate} disabled={generating}>
          {generating ? t("generating") : t("generateQuestions")}
        </Button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{t("questionCount", { count: content.questions.length })}</p>
        <Button type="button" variant="ghost" size="sm" onClick={generate} disabled={generating}>
          {generating ? t("regenerating") : t("regenerateAll")}
        </Button>
      </div>

      {content.questions.map((question, index) => (
        <div key={index} className="rounded-md border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">{t("questionLabel", { n: index + 1 })}</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
              {t("remove")}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs text-slate-500">{t("typeLabel")}</Label>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  updateQuestion(index, {
                    type: value as QuestionItem["type"],
                    choices: value === "MULTIPLE_CHOICE" ? (question.choices ?? ["", "", "", ""]) : undefined,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">{t("multipleChoice")}</SelectItem>
                  <SelectItem value="OPEN">{t("open")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">{t("difficultyLabel")}</Label>
              <Select
                value={question.difficulty}
                onValueChange={(value) => updateQuestion(index, { difficulty: value as QuestionItem["difficulty"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(`difficulties.${value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-500">{t("skillLabel")}</Label>
              <Input value={question.skill} onChange={(e) => updateQuestion(index, { skill: e.target.value })} />
            </div>
          </div>

          <div className="mt-3">
            <Label className="text-xs text-slate-500">{t("questionTextLabel")}</Label>
            <Textarea
              rows={2}
              value={question.questionText}
              onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
            />
          </div>

          {question.type === "MULTIPLE_CHOICE" && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(question.choices ?? ["", "", "", ""]).map((choice, cIndex) => (
                <Input
                  key={cIndex}
                  value={choice}
                  placeholder={t("choicePlaceholder", { n: cIndex + 1 })}
                  onChange={(e) => updateChoice(index, cIndex, e.target.value)}
                />
              ))}
            </div>
          )}

          <div className="mt-3">
            <Label className="text-xs text-slate-500">{t("correctAnswerLabel")}</Label>
            <Input
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(index, { correctAnswer: e.target.value })}
            />
          </div>

          <div className="mt-3">
            <Label className="text-xs text-slate-500">{t("explanationLabel")}</Label>
            <Textarea
              rows={2}
              value={question.explanation}
              onChange={(e) => updateQuestion(index, { explanation: e.target.value })}
            />
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? t("saving") : t("save")}
        </Button>
        {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
      </div>
    </div>
  );
}
