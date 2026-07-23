"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { updateTranslationAction, resetTranslationAction } from "@/actions/translations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function LocaleCell({
  path,
  locale,
  defaultValue,
  currentValue,
  isOverridden,
}: {
  path: string;
  locale: "en" | "ar";
  defaultValue: string;
  currentValue: string;
  isOverridden: boolean;
}) {
  const t = useTranslations("translationsPage");
  const [value, setValue] = useState(currentValue);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [overridden, setOverridden] = useState(isOverridden);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateTranslationAction(locale, path, value);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOverridden(true);
    });
  }

  function reset() {
    setError(null);
    startTransition(async () => {
      await resetTranslationAction(locale, path);
      setValue(defaultValue);
      setOverridden(false);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Input
          value={value}
          dir={locale === "ar" ? "rtl" : "ltr"}
          onChange={(e) => setValue(e.target.value)}
          disabled={isPending}
          className="text-sm"
        />
        <Button type="button" size="sm" variant="outline" onClick={save} disabled={isPending}>
          {t("save")}
        </Button>
        {overridden && (
          <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={isPending}>
            {t("reset")}
          </Button>
        )}
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export function TranslationRow({
  path,
  enDefault,
  arDefault,
  enValue,
  arValue,
  enOverridden,
  arOverridden,
}: {
  path: string;
  enDefault: string;
  arDefault: string;
  enValue: string;
  arValue: string;
  enOverridden: boolean;
  arOverridden: boolean;
}) {
  return (
    <tr className="border-b border-slate-100 align-top last:border-0">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">{path}</td>
      <td className="px-4 py-3">
        <LocaleCell path={path} locale="en" defaultValue={enDefault} currentValue={enValue} isOverridden={enOverridden} />
      </td>
      <td className="px-4 py-3">
        <LocaleCell path={path} locale="ar" defaultValue={arDefault} currentValue={arValue} isOverridden={arOverridden} />
      </td>
    </tr>
  );
}
