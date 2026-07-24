"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireRole, ADMIN_ROLES, PERMISSION_GROUP_NAMES, invalidatePermissionCache } from "@/lib/permissions";

export type PermissionActionState = { error?: string; success?: boolean } | undefined;

const ALL_ROLES = ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "INITIATIVE_OWNER"] as const;

const updateSchema = z.object({
  groupName: z.enum(PERMISSION_GROUP_NAMES),
  roles: z.array(z.enum(ALL_ROLES)).min(1, "At least one role must be selected."),
});

export async function updatePermissionGroupAction(
  _prevState: PermissionActionState,
  formData: FormData,
): Promise<PermissionActionState> {
  const session = await auth();
  // Gated by the static ADMIN_ROLES constant, not the dynamic group of the same
  // name — this screen must remain reachable even if a "ADMIN_ROLES" override
  // in the database is misconfigured.
  requireRole(session, ADMIN_ROLES);

  const groupName = formData.get("groupName");
  const roles = formData.getAll("roles");

  const parsed = updateSchema.safeParse({ groupName, roles });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid selection." };
  }

  if (parsed.data.groupName === "ADMIN_ROLES" && !parsed.data.roles.includes("SYSTEM_ADMIN")) {
    return { error: "SYSTEM_ADMIN cannot be removed from this group — it would lock out the ability to manage permissions." };
  }

  const existing = await prisma.permissionGroup.findUnique({ where: { name: parsed.data.groupName } });

  await prisma.permissionGroup.upsert({
    where: { name: parsed.data.groupName },
    create: { name: parsed.data.groupName, roles: parsed.data.roles },
    update: { roles: parsed.data.roles },
  });

  invalidatePermissionCache();

  await logAudit({
    userId: session!.user.id,
    action: existing ? "UPDATE" : "CREATE",
    module: "PermissionGroups",
    entityId: parsed.data.groupName,
    before: existing ? { roles: existing.roles } : undefined,
    after: { roles: parsed.data.roles },
  });

  revalidatePath("/admin/permissions");
  return { success: true };
}
