"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" placeholder="you@school.edu" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("common.password")}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{t("login.invalidCredentials")}</p>}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? t("common.loading") : t("common.signIn")}
      </Button>
    </form>
  );
}
