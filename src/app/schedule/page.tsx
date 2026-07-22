import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";

export default async function SchedulePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <main className="p-6">
        <h1 className="text-xl font-semibold">My Schedule</h1>
        <p className="mt-2 text-sm text-slate-600">
          The weekly schedule grid will be built here in a later phase.
        </p>
      </main>
    </div>
  );
}
