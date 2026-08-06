"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/Button";
import { deleteBlockedTime } from "@/app/staff/(protected)/blocked-times/actions";
import type { BlockedTime } from "@/lib/supabase/database.types";

export function BlockedTimeRow({ blockedTime, timezone }: { blockedTime: BlockedTime; timezone: string }) {
  const [isPending, startTransition] = useTransition();
  const range = `${format(toZonedTime(new Date(blockedTime.starts_at), timezone), "d MMM, h:mm a")} – ${format(toZonedTime(new Date(blockedTime.ends_at), timezone), "h:mm a")}`;

  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-3">
      <div>
        <div className="font-mono text-sm text-cream">{range}</div>
        {blockedTime.reason && <div className="text-sm text-smoke">{blockedTime.reason}</div>}
      </div>
      <Button
        variant="danger"
        disabled={isPending}
        onClick={() => startTransition(() => deleteBlockedTime(blockedTime.id))}
      >
        Remove
      </Button>
    </div>
  );
}
