"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createUserAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLE_VALUES = [
  "SYSTEM_ADMIN",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "TEAM_LEADER",
  "TEACHER",
  "INITIATIVE_OWNER",
  "EVALUATOR",
] as const;

export function CreateUserForm() {
  const t = useTranslations("usersPage");
  const [state, action, pending] = useActionState<ActionState, FormData>(createUserAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t("nameEnglish")}</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nameAr">{t("nameArabic")}</Label>
          <Input id="nameAr" name="nameAr" dir="rtl" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">{t("role")}</Label>
          <Select name="role" defaultValue="TEACHER">
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`roles.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t("tempPassword")}</Label>
          <Input id="password" name="password" type="text" required minLength={8} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{t("created")}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? t("creating") : t("create")}
      </Button>
    </form>
  );
}
