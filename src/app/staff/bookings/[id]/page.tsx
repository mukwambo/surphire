import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { getBookingById } from "@/lib/staff/bookings";
import { BookingActions } from "@/components/staff/BookingActions";
import { redirect } from "next/navigation";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaffUser();
  const shop = await getStaffShop();
  if (!shop) redirect("/staff/no-shop");

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  const when = format(toZonedTime(new Date(booking.starts_at), shop.timezone), "EEE d MMM, h:mm a");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase">{booking.status}</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase text-cream">
          {booking.customer?.name ?? "Unknown customer"}
        </h1>
      </div>

      <dl className="flex flex-col gap-2 rounded-sm border border-charcoal bg-ink-raised/40 px-4 py-4">
        <Row label="When" value={when} />
        <Row label="Service" value={booking.service?.name ?? "—"} />
        <Row label="Barber" value={booking.barber?.display_name ?? "—"} />
        <Row label="Phone" value={booking.customer?.phone ?? "—"} />
        <Row label="Reference" value={booking.reference} />
        {booking.notes && <Row label="Notes" value={booking.notes} />}
      </dl>

      <BookingActions id={booking.id} status={booking.status} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-smoke">{label}</dt>
      <dd className="text-right text-cream">{value}</dd>
    </div>
  );
}
