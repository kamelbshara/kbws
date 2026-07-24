"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { addInitiativeCommentAction, type CommentActionState } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function InitiativeCommentsSection({
  initiativeId,
  comments,
}: {
  initiativeId: string;
  comments: { id: string; body: string; authorName: string; createdAt: string }[];
}) {
  const t = useTranslations("initiatives");
  const [state, action, pending] = useActionState<CommentActionState, FormData>(addInitiativeCommentAction, undefined);

  return (
    <div className="rounded-md border border-slate-200 p-4">
      <h2 className="font-medium">{t("commentsTitle")}</h2>
      {comments.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md bg-slate-50 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">{c.authorName}</span>
                <span>{c.createdAt}</span>
              </div>
              <p className="mt-1">{c.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{t("noCommentsYet")}</p>
      )}

      <form action={action} className="mt-4 flex flex-col gap-2">
        <input type="hidden" name="initiativeId" value={initiativeId} />
        <Textarea name="body" rows={2} placeholder={t("commentPlaceholder")} required />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending} className="w-fit">
          {pending ? t("posting") : t("postComment")}
        </Button>
      </form>
    </div>
  );
}
