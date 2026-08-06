import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Shop } from "@/lib/supabase/database.types";

/** Redirects to login if there's no session; otherwise returns the user. */
export async function requireStaffUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/staff/login");
  return user;
}

/**
 * Resolves the shop the current staff member belongs to. Checked in order:
 * shop owner first, then a barber row linking their login to a shop. V1
 * assumes one shop per staff account (matches the doc's single-shop pilot
 * scope) -- multi-shop staff is a Stage 4 concern, not tonight's.
 */
export async function getStaffShop(): Promise<Shop | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ownedShop } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (ownedShop) return ownedShop;

  const { data: barberRow } = await supabase
    .from("barbers")
    .select("shop_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!barberRow) return null;

  const { data: shop } = await supabase
    .from("shops")
    .select("*")
    .eq("id", barberRow.shop_id)
    .maybeSingle();
  return shop;
}
