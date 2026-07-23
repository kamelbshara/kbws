"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InsightGeneration } from "@/lib/ai/insightSchema";

export function InsightPanel({
  scope,
  initialContent,
  initialGeneratedAt,
}: {
  scope: "TEACHER" | "SCHOOL";
  initialContent: InsightGeneration | null;
  initialGeneratedAt: string | null;
}) {
  const t = useTranslations("insights");
  const [content, setContent] = useState<InsightGeneration | null>(initialContent);
  const [generatedAt, setGeneratedAt] = useState<string | null>(initialGeneratedAt);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generationFailed"));
        return;
      }
      setContent(data.content);
      setGeneratedAt(data.createdAt);
    } catch {
      setError(t("networkError"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {generatedAt
            ? t("lastGenerated", { date: new Date(generatedAt).toISOString().replace("T", " ").slice(0, 16) })
            : t("noReportYet")}
        </p>
        <Button onClick={generate} disabled={generating}>
          {generating ? t("generating") : content ? t("regenerate") : t("generate")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {content && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{content.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-700">{t("strengths")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-slate-700">
                  {content.strengths.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-amber-700">{t("concerns")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-slate-700">
                  {content.concerns.map((c, i) => (
                    <li key={i}>• {c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base text-blue-700">{t("recommendations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2 text-sm text-slate-700">
                  {content.recommendations.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
