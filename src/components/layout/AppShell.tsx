import type { Role } from "@/generated/prisma/enums";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";

export async function AppShell({
  userName,
  role,
  isManagement = false,
  children,
}: {
  userName: string;
  role: Role;
  isManagement?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader userName={userName} role={role} />
      <div className="flex flex-1">
        <Sidebar role={role} isManagement={isManagement} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
