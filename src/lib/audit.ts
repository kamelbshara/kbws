import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/generated/prisma/enums";

export async function logAudit(params: {
  userId: string | null;
  action: AuditAction;
  module: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      module: params.module,
      entityId: params.entityId,
      beforeJson: params.before === undefined ? undefined : (params.before as object),
      afterJson: params.after === undefined ? undefined : (params.after as object),
    },
  });
}
