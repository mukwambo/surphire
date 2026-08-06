import { redirect } from "next/navigation";
import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { createClient } from "@/lib/supabase/server";
import { BarberRow } from "@/components/staff/BarberRow";
import { AddBarberForm } from "@/components/staff/AddBarberForm";
import { EmptyState } from "@/components/ui/States";
import type { Barber } from "@/lib/supabase/database.types";

export default async function StaffBarbersPage() {
  await requireStaffUser();
  const shop = await getStaffShop();
  if (!shop) redirect("/staff/no-shop");

  const supabase = await createClient();
  const { data: barbers, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("shop_id", shop.id)
    .order("display_name");
  if (error) throw error;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold uppercase text-cream">Barbers</h1>
      <div className="flex flex-col gap-3">
        {(barbers as Barber[]).length === 0 ? (
          <EmptyState label="No barbers yet." />
        ) : (
          (barbers as Barber[]).map((b) => <BarberRow key={b.id} barber={b} />)
        )}
      </div>
      <AddBarberForm />
    </div>
  );
}
