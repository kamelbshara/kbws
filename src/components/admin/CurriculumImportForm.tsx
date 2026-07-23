"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { importCurriculumAction, type CurriculumImportState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CurriculumImportForm() {
  const t = useTranslations("curriculumPage");
  const [state, action, pending] = useActionState<CurriculumImportState, FormData>(importCurriculumAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">{t("csvFile")}</Label>
        <input
          id="file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="rounded-md border border-slate-300 bg-white p-2 text-sm"
        />
      </div>
      <a href="/templates/curriculum-import-template.csv" download className="w-fit text-sm text-slate-500 underline">
        {t("downloadTemplate")}
      </a>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("importing") : t("import")}
      </Button>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.created !== undefined && (
        <div className="rounded-md bg-slate-50 p-3 text-sm">
          <p className="text-green-700">{t("importedCount", { count: state.created })}</p>
          {state.rowErrors.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-amber-700">
              {state.rowErrors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
