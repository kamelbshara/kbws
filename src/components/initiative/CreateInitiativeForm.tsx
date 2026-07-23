"use client";

import { useActionState } from "react";
import { createInitiativeAction, type ActionState } from "@/actions/initiatives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INITIATIVE_CATEGORY_LABELS } from "@/lib/initiativeLabels";

export function CreateInitiativeForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createInitiativeAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Initiative Name</Label>
        <Input id="title" name="title" required placeholder="e.g. Read to Rise" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <Select name="category" defaultValue="EDUCATIONAL">
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INITIATIVE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="initialIdea">Describe your idea</Label>
        <Textarea
          id="initialIdea"
          name="initialIdea"
          rows={4}
          required
          placeholder="What problem are you trying to solve, and what's your rough idea for addressing it?"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating..." : "Create Initiative"}
      </Button>
    </form>
  );
}
