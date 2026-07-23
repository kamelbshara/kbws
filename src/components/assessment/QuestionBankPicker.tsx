"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { QuestionItem } from "@/lib/ai/questionSchema";

type BankItem = {
  id: string;
  subjectName: string;
  gradeName: string;
  skill: string;
  difficulty: QuestionItem["difficulty"];
  type: QuestionItem["type"];
  questionText: string;
  choices: string[] | null;
  correctAnswer: string;
  explanation: string | null;
};

export function QuestionBankPicker({ onAdd }: { onAdd: (question: QuestionItem) => void }) {
  const t = useTranslations("questionBank");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function search(q: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/question-bank/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openPanel() {
    setOpen(true);
    if (results.length === 0) search("");
  }

  return (
    <div className="rounded-md border border-dashed border-slate-300 p-3">
      {!open ? (
        <Button type="button" variant="outline" size="sm" onClick={openPanel}>
          {t("browseButton")}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search(query)}
              placeholder={t("searchPlaceholder")}
              className="text-sm"
            />
            <Button type="button" size="sm" variant="outline" onClick={() => search(query)} disabled={loading}>
              {loading ? t("searching") : t("search")}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              {t("close")}
            </Button>
          </div>
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {results.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 p-2 text-xs">
                <div>
                  <p className="font-medium text-slate-700">{item.questionText}</p>
                  <p className="text-slate-400">
                    {item.subjectName} · {item.gradeName} · {item.skill}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    onAdd({
                      type: item.type,
                      difficulty: item.difficulty,
                      skill: item.skill,
                      questionText: item.questionText,
                      choices: item.choices ?? undefined,
                      correctAnswer: item.correctAnswer,
                      explanation: item.explanation ?? "",
                    })
                  }
                >
                  {t("add")}
                </Button>
              </div>
            ))}
            {!loading && results.length === 0 && <p className="p-2 text-center text-xs text-slate-400">{t("empty")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
