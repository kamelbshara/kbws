"use client";

import { useActionState } from "react";
import { createTimetableSlotAction, type ActionState } from "@/actions/school-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

type Option = { id: string; label: string };

export function CreateTimetableSlotForm({
  teachers,
  classSections,
  subjects,
}: {
  teachers: Option[];
  classSections: Option[];
  subjects: Option[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTimetableSlotAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="teacherId">Teacher</Label>
        <Select name="teacherId" defaultValue={teachers[0]?.id}>
          <SelectTrigger id="teacherId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="classSectionId">Class Section</Label>
        <Select name="classSectionId" defaultValue={classSections[0]?.id}>
          <SelectTrigger id="classSectionId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {classSections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subjectId">Subject</Label>
        <Select name="subjectId" defaultValue={subjects[0]?.id}>
          <SelectTrigger id="subjectId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dayOfWeek">Day</Label>
          <Select name="dayOfWeek" defaultValue="SUNDAY">
            <SelectTrigger id="dayOfWeek">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="periodNumber">Period #</Label>
          <Input id="periodNumber" name="periodNumber" type="number" min={1} max={12} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input id="startTime" name="startTime" type="time" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input id="endTime" name="endTime" type="time" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Timetable slot created.</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Creating..." : "Create Slot"}
      </Button>
    </form>
  );
}
