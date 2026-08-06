"use server";

import { revalidatePath } from "next/cache";
import { fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";

export async function createBlockedTime(barberId: string, timezone: string, formData: FormData) {
  const supabase = await createClient();

  const startsAt = fromZonedTime(String(formData.get("starts_at")), timezone).toISOString();
  const endsAt = fromZonedTime(String(formData.get("ends_at")), timezone).toISOString();

  const { error } = await supabase.from("blocked_times").insert({
    barber_id: barberId,
    starts_at: startsAt,
    ends_at: endsAt,
    reason: (formData.get("reason") as string) || null,
  });
  if (error) throw error;
  revalidatePath("/staff/blocked-times");
}

export async function deleteBlockedTime(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/staff/blocked-times");
}
