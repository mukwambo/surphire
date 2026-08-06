"use server";

import { revalidatePath } from "next/cache";
import { getBookingById, updateBookingStatus, type BookingAction } from "@/lib/staff/bookings";
import { notify, type NotificationType } from "@/lib/notifications";

const NOTIFICATION_FOR: Partial<Record<BookingAction, NotificationType>> = {
  CONFIRMED: "booking_confirmed",
  CANCELLED: "booking_cancelled",
  COMPLETED: "booking_completed",
};

export async function setBookingStatus(id: string, status: BookingAction) {
  const booking = await getBookingById(id);
  await updateBookingStatus(id, status);

  const type = NOTIFICATION_FOR[status];
  if (booking && type) {
    await notify({
      bookingId: id,
      type,
      recipient: "customer",
      context: { reference: booking.reference, startsAt: booking.starts_at },
    });
  }

  revalidatePath(`/staff/bookings/${id}`);
  revalidatePath("/staff/dashboard");
}
