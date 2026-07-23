"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordResetAction, type PasswordResetState } from "@/actions/passwordReset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<PasswordResetState, FormData>(requestPasswordResetAction, undefined);

  if (state?.success) {
    return <p className="text-sm text-slate-700">{t("passwordReset.requestSuccess")}</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@school.edu" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("passwordReset.sending") : t("passwordReset.sendButton")}
      </Button>
    </form>
  );
}
