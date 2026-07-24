"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Paperclip } from "lucide-react";
import { addInitiativeEvidenceAction, type ActionState } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Evidence = {
  id: string;
  description: string;
  link: string | null;
  fileUrl: string | null;
  fileName: string | null;
  createdAt: string;
  createdBy: { name: string };
};

export function EvidenceSection({
  initiativeId,
  evidence,
  canEdit = true,
}: {
  initiativeId: string;
  evidence: Evidence[];
  canEdit?: boolean;
}) {
  const t = useTranslations("initiatives");
  const [state, action, pending] = useActionState<ActionState, FormData>(addInitiativeEvidenceAction, undefined);

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h2 className="mb-2 font-medium">{t("evidence")}</h2>
      <ul className="mb-4 flex flex-col gap-2">
        {evidence.map((e) => (
          <li key={e.id} className="rounded-md bg-slate-50 p-2 text-sm">
            <div>{e.description}</div>
            {e.link && (
              <a href={e.link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                {e.link}
              </a>
            )}
            {e.fileUrl && (
              <a
                href={e.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Paperclip className="h-3 w-3" />
                {e.fileName}
              </a>
            )}
            <div className="text-xs text-slate-400">
              {e.createdBy.name} · {e.createdAt}
            </div>
          </li>
        ))}
        {evidence.length === 0 && <li className="text-sm text-slate-400">{t("noEvidenceYet")}</li>}
      </ul>
      {canEdit && (
        <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <input type="hidden" name="initiativeId" value={initiativeId} />
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="description" className="text-xs text-slate-500">
              {t("descriptionLabel")}
            </Label>
            <Input id="description" name="description" required placeholder={t("descriptionPlaceholder")} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor="link" className="text-xs text-slate-500">
              {t("linkLabel")}
            </Label>
            <Input id="link" name="link" type="url" placeholder="https://..." />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="file" className="text-xs text-slate-500">
              {t("fileLabel")}
            </Label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              className="w-48 rounded-md border border-slate-300 bg-white p-1.5 text-xs"
            />
          </div>
          <Button type="submit" disabled={pending} variant="outline">
            {pending ? t("adding") : t("addEvidence")}
          </Button>
        </form>
      )}
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  );
}
