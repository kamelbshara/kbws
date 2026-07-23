import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { CreateTeamForm } from "@/components/team/CreateTeamForm";

export default async function NewTeamPage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">New Team</h1>
        <p className="mt-1 text-sm text-slate-500">
          You&apos;ll be set as the team leader. An empty operational plan is created automatically for the team.
        </p>
        <div className="mt-6">
          <CreateTeamForm />
        </div>
      </main>
    </div>
  );
}
