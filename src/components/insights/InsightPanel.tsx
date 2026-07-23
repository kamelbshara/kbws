"use client";

import { useState } from "react";
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
        setError(data.error ?? "Generation failed.");
        return;
      }
      setContent(data.content);
      setGeneratedAt(data.createdAt);
    } catch {
      setError("Network error while generating. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {generatedAt ? `Last generated: ${new Date(generatedAt).toISOString().replace("T", " ").slice(0, 16)} UTC` : "No report generated yet."}
        </p>
        <Button onClick={generate} disabled={generating}>
          {generating ? "Generating..." : content ? "Regenerate" : "Generate Insights"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {content && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">{content.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-700">Strengths</CardTitle>
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
                <CardTitle className="text-base text-amber-700">Concerns</CardTitle>
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
                <CardTitle className="text-base text-blue-700">Recommendations</CardTitle>
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
