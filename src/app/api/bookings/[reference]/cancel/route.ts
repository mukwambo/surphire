import { cancelBooking } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

export async function POST(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const booking = await cancelBooking(reference);
  if (!booking) return fail(404, "Booking not found or already cancelled/completed");

  return ok({ reference: booking.reference, status: booking.status });
}
