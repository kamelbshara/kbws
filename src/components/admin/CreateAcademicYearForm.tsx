"use client";

import { useActionState } from "react";
import { createAcademicYearAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export function CreateAcademicYearForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createAcademicYearAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="e.g. 2026-2027" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name="isActive" />
        Make this the active academic year
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Academic year created.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating..." : "Create Academic Year"}
      </Button>
    </form>
  );
}
