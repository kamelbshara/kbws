"use client";

import { useActionState } from "react";
import { createMeetingAction, type ActionState } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateMeetingForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createMeetingAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="title" className="text-xs text-slate-500">
            Meeting Title
          </Label>
          <Input id="title" name="title" required />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="date" className="text-xs text-slate-500">
            Date
          </Label>
          <Input id="date" name="date" type="date" required />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="agenda" className="text-xs text-slate-500">
          Agenda (optional)
        </Label>
        <Textarea id="agenda" name="agenda" rows={2} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} variant="outline" className="w-fit">
        {pending ? "Creating..." : "Schedule Meeting"}
      </Button>
    </form>
  );
}
