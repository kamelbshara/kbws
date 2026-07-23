import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PermissionGroupEditor } from "@/components/admin/PermissionGroupEditor";
import { PERMISSION_GROUP_NAMES, DEFAULT_PERMISSION_GROUPS, ADMIN_ROLES } from "@/lib/permissions";
import { AppShell } from "@/components/layout/AppShell";

export default async function AdminPermissionsPage() {
  const session = await auth();
  const user = session!.user;
  const t = await getTranslations("permissionsPage");

  // Deliberately checked against the static ADMIN_ROLES constant, not a
  // dynamic group lookup — see the note in src/actions/permissions.ts.
  if (!ADMIN_ROLES.includes(user.role)) {
    redirect("/admin");
  }

  const rows = await prisma.permissionGroup.findMany();
  const stored = new Map(rows.map((r) => [r.name, r.roles]));

  return (
      <AppShell userName={user.name} role={user.role} isManagement>
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>

        <div className="mt-6 flex flex-col gap-4">
          {PERMISSION_GROUP_NAMES.map((name) => (
            <PermissionGroupEditor
              key={name}
              groupName={name}
              label={t(`groups.${name}`)}
              initialRoles={stored.get(name) ?? DEFAULT_PERMISSION_GROUPS[name]}
            />
          ))}
        </div>
      </main>
    </AppShell>
  );
}
