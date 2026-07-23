import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const EMAIL = process.env.SUPER_ADMIN_EMAIL ?? "kamelbesharah@gmail.com";
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "Freed@2045";
const NAME = process.env.SUPER_ADMIN_NAME ?? "Kamel";
const NAME_AR = process.env.SUPER_ADMIN_NAME_AR ?? "كامل";

/**
 * Idempotent: upserts a platform-wide SYSTEM_ADMIN with no schoolId, which
 * makes it a "platform admin" (see src/lib/activeSchool.ts) that can switch
 * between every school in the system via SchoolSwitcher instead of being
 * locked to one. Safe to re-run -- re-running only resets the password to
 * PASSWORD/SUPER_ADMIN_PASSWORD, it never touches an existing role/schoolId.
 */
async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      passwordHash,
      name: NAME,
      nameAr: NAME_AR,
      role: "SYSTEM_ADMIN",
      schoolId: null,
    },
    update: {
      passwordHash,
      role: "SYSTEM_ADMIN",
      isActive: true,
    },
  });

  console.log(`Super admin ready: ${user.email} (role: ${user.role}, schoolId: ${user.schoolId ?? "none — platform admin"})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
