import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { StaffBookingRow } from "@/lib/staff/bookings";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-brass",
  CONFIRMED: "text-pole-blue",
  COMPLETED: "text-smoke",
  CANCELLED: "text-pole-red",
  NO_SHOW: "text-pole-red",
};

export function AppointmentCard({ booking, timezone }: { booking: StaffBookingRow; timezone: string }) {
  const time = format(toZonedTime(new Date(booking.starts_at), timezone), "h:mm a");
  return (
    <Link
      href={`/staff/bookings/${booking.id}`}
      className="flex items-center justify-between gap-4 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-3 hover:border-smoke"
    >
      <div className="flex items-center gap-4">
        <span className="font-mono text-lg text-cream">{time}</span>
        <div>
          <div className="font-display text-base font-semibold uppercase text-cream">
            {booking.customer?.name ?? "Unknown customer"}
          </div>
          <div className="text-sm text-smoke">
            {booking.service?.name} · {booking.barber?.display_name}
          </div>
        </div>
      </div>
      <span className={`font-mono text-xs uppercase tracking-widest ${STATUS_COLOR[booking.status]}`}>
        {booking.status}
      </span>
    </Link>
  );
}
