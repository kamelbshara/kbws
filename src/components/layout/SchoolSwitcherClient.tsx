"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setActiveSchoolAction } from "@/actions/schools";

export function SchoolSwitcherClient({
  schools,
  activeSchoolId,
}: {
  schools: { id: string; name: string }[];
  activeSchoolId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const schoolId = e.target.value;
    startTransition(async () => {
      await setActiveSchoolAction(schoolId);
      router.refresh();
    });
  }

  return (
    <select
      value={activeSchoolId ?? ""}
      onChange={onChange}
      disabled={isPending}
      className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm"
    >
      {schools.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
