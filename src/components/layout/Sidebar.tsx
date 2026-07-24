import { getTranslations } from "next-intl/server";
import type { Role } from "@/generated/prisma/enums";
import { SidebarClient } from "@/components/layout/SidebarClient";

export async function Sidebar({ role, isManagement }: { role: Role; isManagement: boolean }) {
  const t = await getTranslations("admin");
  const nav = await getTranslations("nav");
  const common = await getTranslations("common");

  let links: ({ href: string; label: string } | false)[];

  if (isManagement) {
    links = [
      { href: "/admin", label: nav("overview") },
      { href: "/dashboard", label: nav("dashboard") },
      { href: "/admin/users", label: t("users") },
      { href: "/admin/academic-years", label: t("academicYears") },
      { href: "/admin/classes", label: t("classes") },
      { href: "/admin/curriculum", label: t("curriculum") },
      { href: "/admin/timetable", label: t("timetable") },
      { href: "/admin/audit-log", label: t("auditLog") },
      role === "SYSTEM_ADMIN" && { href: "/admin/translations", label: t("translations") },
      role === "SYSTEM_ADMIN" && { href: "/admin/schools", label: t("schools") },
      role === "SYSTEM_ADMIN" && { href: "/admin/permissions", label: t("permissions") },
      role === "SYSTEM_ADMIN" && { href: "/admin/master-data", label: t("masterData") },
      { href: "/insights", label: nav("insights") },
      role === "SYSTEM_ADMIN" && { href: "/knowledge-memory", label: nav("knowledgeMemory") },
      { href: "/professional-goals", label: nav("professionalGoals") },
      { href: "/messages", label: nav("messages") },
      { href: "/impact-report", label: nav("impactReport") },
      { href: "/initiatives", label: nav("initiatives") },
      { href: "/teams", label: nav("teams") },
      { href: "/operational-plan", label: nav("schoolPlan") },
    ];
  } else {
    links = [
      role === "TEACHER" && { href: "/schedule", label: nav("schedule") },
      role === "TEACHER" && { href: "/assessments", label: nav("assessments") },
      role === "TEACHER" && { href: "/question-bank", label: nav("questionBank") },
      role === "TEACHER" && { href: "/insights", label: nav("insights") },
      { href: "/professional-goals", label: nav("professionalGoals") },
      { href: "/messages", label: nav("messages") },
      { href: "/initiatives", label: nav("initiatives") },
      { href: "/teams", label: nav("teams") },
    ];
  }

  return <SidebarClient links={links.filter(Boolean) as { href: string; label: string }[]} toggleLabel={common("collapseExpand")} />;
}
