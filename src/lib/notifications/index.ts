import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "booking_completed";

export type NotificationRecipient = "customer" | "staff";

export interface NotificationEvent {
  bookingId: string;
  type: NotificationType;
  recipient: NotificationRecipient;
  /** Free-form context for the channel implementation (name, phone, shop, time, etc). */
  context: Record<string, string>;
}

/**
 * V1 notification strategy (Section 8): record every event so nothing is
 * silently dropped, and log it as the "simplest reliable channel" for
 * tonight. Swap the body of `deliver` for real email/SMS/WhatsApp later
 * without touching any call site -- every call site only knows about
 * `notify`, never the transport.
 */
export async function notify(event: NotificationEvent): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("notifications").insert({
    booking_id: event.bookingId,
    recipient: event.recipient,
    type: event.type,
    status: "sent",
    sent_at: new Date().toISOString(),
  });
  if (error) throw error;

  await deliver(event);
}

async function deliver(event: NotificationEvent): Promise<void> {
  console.log(`[notify] ${event.recipient}/${event.type}`, event.context);
}
