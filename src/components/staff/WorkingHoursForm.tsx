"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { setWorkingHours } from "@/app/staff/(protected)/hours/actions";
import type { WorkingHour } from "@/lib/supabase/database.types";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WorkingHoursForm({
  barberId,
  workingHours,
}: {
  barberId: string;
  workingHours: WorkingHour[];
}) {
  const [isPending, startTransition] = useTransition();
  const byDay = new Map(workingHours.map((wh) => [wh.day_of_week, wh]));

  return (
    <form
      action={(formData) => startTransition(() => setWorkingHours(barberId, formData))}
      className="flex flex-col gap-3"
    >
      {DAY_LABELS.map((label, day) => {
        const existing = byDay.get(day);
        return (
          <div key={day} className="flex items-center gap-3 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-3">
            <span className="w-28 font-mono text-sm text-cream">{label}</span>
            <label className="flex items-center gap-2 text-sm text-smoke">
              <input type="checkbox" name={`closed_${day}`} defaultChecked={!existing} />
              Closed
            </label>
            <input
              type="time"
              name={`open_${day}`}
              defaultValue={existing?.open_time?.slice(0, 5) ?? "09:00"}
              className="rounded-sm border border-charcoal bg-ink px-2 py-1 text-cream"
            />
            <span className="text-smoke">–</span>
            <input
              type="time"
              name={`close_${day}`}
              defaultValue={existing?.close_time?.slice(0, 5) ?? "18:00"}
              className="rounded-sm border border-charcoal bg-ink px-2 py-1 text-cream"
            />
          </div>
        );
      })}
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Saving…" : "Save hours"}
      </Button>
    </form>
  );
}
