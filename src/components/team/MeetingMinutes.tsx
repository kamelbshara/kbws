"use client";

import { useState, useTransition } from "react";
import { saveMeetingMinutesAction } from "@/actions/teams";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MeetingMinutes({ meetingId, initialMinutes }: { meetingId: string; initialMinutes: string }) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [isSaving, startSaving] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startSaving(async () => {
      await saveMeetingMinutesAction(meetingId, minutes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Textarea
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        rows={2}
        placeholder="Meeting minutes / decisions..."
      />
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={save} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Minutes"}
        </Button>
        {saved && <span className="text-xs text-green-700">Saved.</span>}
      </div>
    </div>
  );
}
