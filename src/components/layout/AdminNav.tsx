import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AdminNav() {
  const t = await getTranslations("admin");

  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: t("users") },
    { href: "/admin/classes", label: t("classes") },
    { href: "/admin/timetable", label: t("timetable") },
  ];

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
