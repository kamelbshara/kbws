"use client";

import { useActionState } from "react";
import { createUserAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = [
  { value: "SYSTEM_ADMIN", label: "System Administrator" },
  { value: "PRINCIPAL", label: "Principal" },
  { value: "VICE_PRINCIPAL", label: "Vice Principal" },
  { value: "TEAM_LEADER", label: "Team Leader" },
  { value: "TEACHER", label: "Teacher" },
  { value: "INITIATIVE_OWNER", label: "Initiative Owner" },
];

export function CreateUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUserAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name (English)</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="nameAr">Name (Arabic)</Label>
          <Input id="nameAr" name="nameAr" dir="rtl" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="role">Role</Label>
          <Select name="role" defaultValue="TEACHER">
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Temporary Password</Label>
          <Input id="password" name="password" type="text" required minLength={8} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">User created.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}
