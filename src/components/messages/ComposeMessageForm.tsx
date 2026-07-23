"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendMessageAction, type ActionState } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ComposeMessageForm({ recipients }: { recipients: { id: string; name: string }[] }) {
  const t = useTranslations("messages");
  const [state, action, pending] = useActionState<ActionState, FormData>(sendMessageAction, undefined);

  if (recipients.length === 0) {
    return <p className="text-sm text-slate-400">{t("noRecipients")}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="recipientId">{t("recipient")}</Label>
        <Select name="recipientId" defaultValue={recipients[0]?.id}>
          <SelectTrigger id="recipientId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {recipients.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject">{t("subject")}</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">{t("body")}</Label>
        <Textarea id="body" name="body" rows={5} required />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("sent")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
