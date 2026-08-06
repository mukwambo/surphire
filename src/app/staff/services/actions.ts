"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStaffShop } from "@/lib/staff/queries";

export async function createService(formData: FormData) {
  const shop = await getStaffShop();
  if (!shop) throw new Error("No shop linked to this account.");

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    shop_id: shop.id,
    name: String(formData.get("name")),
    description: (formData.get("description") as string) || null,
    price: Number(formData.get("price")),
    duration_minutes: Number(formData.get("duration_minutes")),
  });
  if (error) throw error;
  revalidatePath("/staff/services");
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: String(formData.get("name")),
      description: (formData.get("description") as string) || null,
      price: Number(formData.get("price")),
      duration_minutes: Number(formData.get("duration_minutes")),
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/staff/services");
}

export async function toggleServiceStatus(id: string, nextStatus: "active" | "inactive") {
  const supabase = await createClient();
  const { error } = await supabase.from("services").update({ status: nextStatus }).eq("id", id);
  if (error) throw error;
  revalidatePath("/staff/services");
}
