import { PrismaClient } from "../src/generated/prisma/client.js";
import type { Role } from "../src/generated/prisma/enums.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Pre-populates the admin-configurable permission groups so /admin/permissions
 * shows editable rows from the start. Safe to run any number of times, and
 * safe even if never run: src/lib/permissions.ts falls back to the same
 * hardcoded defaults when no PermissionGroup rows exist.
 */
const defaultPermissionGroups: { name: string; roles: Role[] }[] = [
  { name: "ADMIN_ROLES", roles: ["SYSTEM_ADMIN"] },
  { name: "MANAGEMENT_ROLES", roles: ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
  { name: "TEACHER_ROLES", roles: ["TEACHER"] },
  { name: "INITIATIVE_CREATOR_ROLES", roles: ["TEACHER", "INITIATIVE_OWNER", "SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
  { name: "TEAM_CREATOR_ROLES", roles: ["SYSTEM_ADMIN", "PRINCIPAL", "VICE_PRINCIPAL"] },
];

async function main() {
  for (const group of defaultPermissionGroups) {
    await prisma.permissionGroup.upsert({
      where: { name: group.name },
      create: group,
      update: {},
    });
  }
  console.log("Permission groups seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
