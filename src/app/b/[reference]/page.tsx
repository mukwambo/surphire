import { notFound } from "next/navigation";
import { getBookingByReference } from "@/lib/booking/queries";
import { TicketCard } from "@/components/booking/TicketCard";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default async function BookingLookupPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const booking = await getBookingByReference(reference);
  if (!booking) notFound();

  const tz = booking.shop.timezone as string;
  const when = format(toZonedTime(new Date(booking.starts_at), tz), "EEE d MMM, h:mm a");
  const cancellable = booking.status === "PENDING" || booking.status === "CONFIRMED";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
      <TicketCard
        shopName={booking.shop.name}
        status={booking.status}
        reference={booking.reference}
        rows={[
          { label: "Service", value: booking.service.name },
          { label: "Barber", value: booking.barber.display_name },
          { label: "When", value: when },
        ]}
      />
      {cancellable && <CancelBookingButton reference={booking.reference} />}
    </main>
  );
}
