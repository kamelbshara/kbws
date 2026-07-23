import { auth } from "@/lib/auth";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainNav } from "@/components/layout/MainNav";
import { CreateInitiativeForm } from "@/components/initiative/CreateInitiativeForm";

export default async function NewInitiativePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <MainNav role={user.role} />
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-semibold">New Initiative</h1>
        <p className="mt-1 text-sm text-slate-500">
          Describe your idea in a few sentences — the AI will help turn it into a structured plan with a SMART goal,
          phases, and measurable indicators.
        </p>
        <div className="mt-6">
          <CreateInitiativeForm />
        </div>
      </main>
    </div>
  );
}
