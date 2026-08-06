"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { toggleBarberStatus } from "@/app/staff/(protected)/barbers/actions";
import type { Barber } from "@/lib/supabase/database.types";

export function BarberRow({ barber }: { barber: Barber }) {
  const [isPending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-3">
      <span className="font-display text-lg font-semibold uppercase text-cream">
        {barber.display_name}
      </span>
      <Button
        variant={barber.status === "active" ? "danger" : "primary"}
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            toggleBarberStatus(barber.id, barber.status === "active" ? "inactive" : "active"),
          )
        }
      >
        {barber.status === "active" ? "Deactivate" : "Activate"}
      </Button>
    </div>
  );
}
