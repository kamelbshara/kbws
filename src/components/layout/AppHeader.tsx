import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function AppHeader({ userName, role }: { userName: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <div className="text-sm font-semibold">AI School Intelligence Platform</div>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-slate-600">
          {userName} · {role}
        </span>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
