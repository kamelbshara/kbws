"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function TeacherReportButton({ teacherId }: { teacherId: string }) {
  const t = useTranslations("adminLessonPlansPage");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{ teacherName: string; summary: string; strengths: string[]; concerns: string[]; recommendations: string[] } | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/admin/teacher-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("reportFailed"));
        return;
      }
      setReport({ teacherName: data.teacherName, ...data.content });
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" size="sm" variant="outline" onClick={generate} disabled={loading}>
        {loading ? t("generatingReport") : t("generateReport")}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {report && (
        <div className="mt-2 max-w-md rounded-md border border-brand-gold/30 bg-brand-cream/40 p-3 text-xs">
          <p className="font-medium">{report.teacherName}</p>
          <p className="mt-1">{report.summary}</p>
          {report.strengths.length > 0 && (
            <p className="mt-1">
              <strong>{t("strengths")}:</strong> {report.strengths.join("; ")}
            </p>
          )}
          {report.concerns.length > 0 && (
            <p className="mt-1">
              <strong>{t("concerns")}:</strong> {report.concerns.join("; ")}
            </p>
          )}
          {report.recommendations.length > 0 && (
            <p className="mt-1">
              <strong>{t("recommendations")}:</strong> {report.recommendations.join("; ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
