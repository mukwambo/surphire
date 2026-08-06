"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { setBookingStatus } from "@/app/staff/(protected)/bookings/[id]/actions";
import type { BookingAction } from "@/lib/staff/bookings";

const ACTIONS_FOR_STATUS: Record<string, { label: string; status: BookingAction; variant: "primary" | "secondary" | "danger" }[]> = {
  PENDING: [
    { label: "Confirm", status: "CONFIRMED", variant: "primary" },
    { label: "Cancel", status: "CANCELLED", variant: "danger" },
  ],
  CONFIRMED: [
    { label: "Mark completed", status: "COMPLETED", variant: "primary" },
    { label: "No-show", status: "NO_SHOW", variant: "secondary" },
    { label: "Cancel", status: "CANCELLED", variant: "danger" },
  ],
};

export function BookingActions({ id, status }: { id: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const actions = ACTIONS_FOR_STATUS[status] ?? [];

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant}
          disabled={isPending}
          onClick={() => startTransition(() => setBookingStatus(id, action.status))}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
