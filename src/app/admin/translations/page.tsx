import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/layout/AppHeader";
import { AdminNav } from "@/components/layout/AdminNav";
import { TranslationRow } from "@/components/admin/TranslationRow";
import { flattenMessages, type MessageTree } from "@/lib/messageTree";
import enMessages from "../../../../messages/en.json";
import arMessages from "../../../../messages/ar.json";

export default async function AdminTranslationsPage() {
  const session = await auth();
  const user = session!.user;

  const enFlat = flattenMessages(enMessages as MessageTree);
  const arFlat = flattenMessages(arMessages as MessageTree);
  const overrides = await prisma.translationOverride.findMany();
  const overrideMap = new Map(overrides.map((o) => [`${o.locale}:${o.key}`, o.value]));

  const paths = Object.keys(enFlat).sort();

  return (
    <div>
      <AppHeader userName={user.name} role={user.role} />
      <AdminNav role={user.role} />
      <main className="p-6">
        <h1 className="text-xl font-semibold">Translations</h1>
        <p className="mt-1 text-sm text-slate-500">
          Edit UI text without a code change. Changes take effect within about 30 seconds.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Key</th>
                <th className="px-4 py-2 font-medium">English</th>
                <th className="px-4 py-2 font-medium">Arabic</th>
              </tr>
            </thead>
            <tbody>
              {paths.map((path) => {
                const enOverride = overrideMap.get(`en:${path}`);
                const arOverride = overrideMap.get(`ar:${path}`);
                return (
                  <TranslationRow
                    key={path}
                    path={path}
                    enDefault={enFlat[path]}
                    arDefault={arFlat[path] ?? ""}
                    enValue={enOverride ?? enFlat[path]}
                    arValue={arOverride ?? arFlat[path] ?? ""}
                    enOverridden={enOverride !== undefined}
                    arOverridden={arOverride !== undefined}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
