import { getBookingByReference } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

export async function GET(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const booking = await getBookingByReference(reference);
  if (!booking) return fail(404, "Booking not found");

  return ok({
    reference: booking.reference,
    status: booking.status,
    startsAt: booking.starts_at,
    endsAt: booking.ends_at,
    shop: booking.shop,
    barber: booking.barber,
    service: booking.service,
  });
}
