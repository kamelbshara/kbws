"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

const STORAGE_KEY = "kbws-sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

function setCollapsed(next: boolean) {
  localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  listeners.forEach((callback) => callback());
}

export function SidebarClient({
  links,
  toggleLabel,
}: {
  links: { href: string; label: string }[];
  toggleLabel: string;
}) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <aside
      className={`flex shrink-0 flex-col border-e border-slate-200 bg-white transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        title={toggleLabel}
        className="flex items-center justify-center border-b border-slate-100 p-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
      <nav className="flex flex-col gap-1 overflow-y-auto p-2 text-sm">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href + "/"));
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              className={`flex items-center rounded-md transition-colors ${
                collapsed ? "justify-center px-0 py-3" : "px-3 py-2"
              } ${active ? "bg-brand-navy text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
            >
              {collapsed ? (
                <span className={`h-2 w-2 rounded-full ${active ? "bg-white" : "bg-slate-400"}`} />
              ) : (
                link.label
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
