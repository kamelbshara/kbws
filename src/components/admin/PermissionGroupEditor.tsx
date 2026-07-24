"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePermissionGroupAction, type PermissionActionState } from "@/actions/permissions";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma/enums";

const ALL_ROLES: Role[] = ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "INITIATIVE_OWNER"];

export function PermissionGroupEditor({
  groupName,
  label,
  initialRoles,
}: {
  groupName: string;
  label: string;
  initialRoles: Role[];
}) {
  const t = useTranslations("permissionsPage");
  const common = useTranslations("common");
  const [state, action, pending] = useActionState<PermissionActionState, FormData>(updatePermissionGroupAction, undefined);

  return (
    <form action={action} className="rounded-md border border-slate-200 p-4">
      <input type="hidden" name="groupName" value={groupName} />
      <h3 className="font-medium">{groupName}</h3>
      <p className="mt-1 text-sm text-slate-500">{label}</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ALL_ROLES.map((role) => (
          <label key={role} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="roles" value={role} defaultChecked={initialRoles.includes(role)} />
            {role}
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? t("saving") : common("save")}
        </Button>
        {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        {state?.success && <span className="text-sm text-green-700">{t("saved")}</span>}
      </div>
    </form>
  );
}
