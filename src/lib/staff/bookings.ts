import "server-only";
import { fromZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";

export interface StaffBookingRow {
  id: string;
  reference: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  customer: { name: string; phone: string } | null;
  barber: { display_name: string } | null;
  service: { name: string } | null;
}

const SELECT = "*, customer:customers(name, phone), barber:barbers(display_name), service:services(name)";

export async function getTodayBookings(shopId: string, timezone: string): Promise<StaffBookingRow[]> {
  const supabase = await createClient();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dayStart = fromZonedTime(`${todayStr}T00:00:00`, timezone).toISOString();
  const dayEnd = fromZonedTime(`${todayStr}T23:59:59`, timezone).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .eq("shop_id", shopId)
    .gte("starts_at", dayStart)
    .lte("starts_at", dayEnd)
    .order("starts_at");
  if (error) throw error;
  return (data ?? []) as unknown as StaffBookingRow[];
}

export async function getUpcomingBookings(shopId: string, timezone: string): Promise<StaffBookingRow[]> {
  const supabase = await createClient();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dayEnd = fromZonedTime(`${todayStr}T23:59:59`, timezone).toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .select(SELECT)
    .eq("shop_id", shopId)
    .gt("starts_at", dayEnd)
    .in("status", ["PENDING", "CONFIRMED"])
    .order("starts_at")
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as StaffBookingRow[];
}

export async function getBookingById(id: string): Promise<StaffBookingRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as StaffBookingRow | null;
}

export type BookingAction = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export async function updateBookingStatus(id: string, status: BookingAction) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}
