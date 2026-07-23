import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Role } from "@/generated/prisma/enums";

export async function AdminNav({ role }: { role?: Role } = {}) {
  const t = await getTranslations("admin");
  const nav = await getTranslations("nav");

  const links = [
    { href: "/admin", label: nav("overview") },
    { href: "/dashboard", label: nav("dashboard") },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/academic-years", label: t("academicYears") },
    { href: "/admin/classes", label: t("classes") },
    { href: "/admin/curriculum", label: t("curriculum") },
    { href: "/admin/timetable", label: t("timetable") },
    { href: "/admin/audit-log", label: t("auditLog") },
    { href: "/admin/translations", label: t("translations") },
    role === "SYSTEM_ADMIN" && { href: "/admin/schools", label: t("schools") },
    role === "SYSTEM_ADMIN" && { href: "/admin/permissions", label: t("permissions") },
    { href: "/insights", label: nav("insights") },
    { href: "/initiatives", label: nav("initiatives") },
    { href: "/teams", label: nav("teams") },
    { href: "/operational-plan", label: nav("schoolPlan") },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <nav className="flex gap-4 border-b border-slate-200 bg-white px-6 py-2 text-sm">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-slate-600 hover:text-slate-900">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
