import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSchoolId, isPlatformAdmin } from "@/lib/activeSchool";
import { SchoolSwitcherClient } from "@/components/layout/SchoolSwitcherClient";

export async function SchoolSwitcher() {
  const session = await auth();
  if (!session?.user || !isPlatformAdmin(session)) {
    return null;
  }

  const schools = await prisma.school.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
  if (schools.length === 0) {
    return null;
  }
  const activeSchoolId = await getActiveSchoolId(session);

  return <SchoolSwitcherClient schools={schools} activeSchoolId={activeSchoolId} />;
}
