"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function setWorkingHours(barberId: string, formData: FormData) {
  const supabase = await createClient();

  const rows = DAYS.filter((day) => formData.get(`closed_${day}`) !== "on").map((day) => ({
    barber_id: barberId,
    day_of_week: day,
    open_time: String(formData.get(`open_${day}`)),
    close_time: String(formData.get(`close_${day}`)),
  }));

  const { error: deleteError } = await supabase
    .from("working_hours")
    .delete()
    .eq("barber_id", barberId);
  if (deleteError) throw deleteError;

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("working_hours").insert(rows);
    if (insertError) throw insertError;
  }

  revalidatePath("/staff/hours");
}
