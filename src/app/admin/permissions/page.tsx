import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { PermissionGroupEditor } from "@/components/admin/PermissionGroupEditor";
import { PERMISSION_GROUP_NAMES, PERMISSION_GROUP_LABELS, DEFAULT_PERMISSION_GROUPS, ADMIN_ROLES } from "@/lib/permissions";

export default async function AdminPermissionsPage() {
  const session = await auth();
  const user = session!.user;

  // Deliberately checked against the static ADMIN_ROLES constant, not a
  // dynamic group lookup — see the note in src/actions/permissions.ts.
  if (!ADMIN_ROLES.includes(user.role)) {
    redirect("/admin");
  }

  const rows = await prisma.permissionGroup.findMany();
  const stored = new Map(rows.map((r) => [r.name, r.roles]));

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-xl font-semibold">Permission Templates</h1>
        <p className="mt-1 text-sm text-slate-500">
          Control which roles can perform each capability. Changes take effect within about 30 seconds.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {PERMISSION_GROUP_NAMES.map((name) => (
            <PermissionGroupEditor
              key={name}
              groupName={name}
              label={PERMISSION_GROUP_LABELS[name]}
              initialRoles={stored.get(name) ?? DEFAULT_PERMISSION_GROUPS[name]}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
