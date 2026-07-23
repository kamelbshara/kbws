"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resetPasswordAction, type PasswordResetState } from "@/actions/passwordReset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<PasswordResetState, FormData>(resetPasswordAction, undefined);

  if (state?.success) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-green-700">{t("passwordReset.resetSuccess")}</p>
        <Link href="/login" className="text-sm text-slate-600 underline">
          {t("passwordReset.signInWithNewPassword")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("passwordReset.newPassword")}</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">{t("passwordReset.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? t("passwordReset.resetting") : t("passwordReset.resetButton")}
      </Button>
    </form>
  );
}
