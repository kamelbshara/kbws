import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoleGroup } from "@/lib/permissions";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "TEACHER") {
    redirect("/schedule");
  }
  if (role === "TEAM_LEADER") {
    redirect("/teams");
  }
  if (role === "INITIATIVE_OWNER") {
    redirect("/initiatives");
  }
  if (role === "EVALUATOR") {
    redirect("/evaluator");
  }

  const managementRoles = await getRoleGroup("MANAGEMENT_ROLES");
  if (managementRoles.includes(role)) {
    redirect("/admin");
  }

  // A role with no dedicated landing page (e.g. reassigned via the dynamic
  // permission groups) still has access to these shared screens.
  redirect("/initiatives");
}
