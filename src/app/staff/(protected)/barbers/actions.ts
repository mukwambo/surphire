"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffShop } from "@/lib/staff/queries";

export async function createBarber(formData: FormData) {
  const shop = await getStaffShop();
  if (!shop) throw new Error("No shop linked to this account.");

  const supabase = await createClient();
  const { error } = await supabase.from("barbers").insert({
    shop_id: shop.id,
    display_name: String(formData.get("display_name")),
  });
  if (error) throw error;
  revalidatePath("/staff/barbers");
  updateTag("barbers");
}

export async function toggleBarberStatus(id: string, nextStatus: "active" | "inactive") {
  const supabase = await createClient();
  const { error } = await supabase.from("barbers").update({ status: nextStatus }).eq("id", id);
  if (error) throw error;
  revalidatePath("/staff/barbers");
  updateTag("barbers");
}
