import { redirect } from "next/navigation";
import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { createClient } from "@/lib/supabase/server";
import { ServiceRow } from "@/components/staff/ServiceRow";
import { AddServiceForm } from "@/components/staff/AddServiceForm";
import { EmptyState } from "@/components/ui/States";
import type { Service } from "@/lib/supabase/database.types";

export default async function StaffServicesPage() {
  await requireStaffUser();
  const shop = await getStaffShop();
  if (!shop) redirect("/staff/no-shop");

  const supabase = await createClient();
  const { data: services, error } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shop.id)
    .order("name");
  if (error) throw error;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold uppercase text-cream">Services</h1>
      <div className="flex flex-col gap-3">
        {(services as Service[]).length === 0 ? (
          <EmptyState label="No services yet." />
        ) : (
          (services as Service[]).map((s) => <ServiceRow key={s.id} service={s} />)
        )}
      </div>
      <AddServiceForm />
    </div>
  );
}
