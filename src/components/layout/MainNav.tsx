import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Role } from "@/generated/prisma/enums";

export async function MainNav({ role }: { role: Role }) {
  const t = await getTranslations("nav");

  const links = [
    role === "TEACHER" && { href: "/schedule", label: t("schedule") },
    { href: "/initiatives", label: t("initiatives") },
    { href: "/teams", label: t("teams") },
    (role === "PRINCIPAL" || role === "VICE_PRINCIPAL" || role === "SYSTEM_ADMIN") && {
      href: "/operational-plan",
      label: t("schoolPlan"),
    },
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
