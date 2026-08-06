import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { createClient } from "@/lib/supabase/server";
import { WorkingHoursForm } from "@/components/staff/WorkingHoursForm";
import { EmptyState } from "@/components/ui/States";
import type { Barber, WorkingHour } from "@/lib/supabase/database.types";

export default async function StaffHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ barberId?: string }>;
}) {
  await requireStaffUser();
  const shop = await getStaffShop();
  if (!shop) redirect("/staff/no-shop");

  const supabase = await createClient();
  const { data: barbers, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("status", "active")
    .order("display_name");
  if (error) throw error;

  const { barberId: requestedId } = await searchParams;
  const barberList = barbers as Barber[];
  const activeBarber = barberList.find((b) => b.id === requestedId) ?? barberList[0];

  let workingHours: WorkingHour[] = [];
  if (activeBarber) {
    const { data, error: whError } = await supabase
      .from("working_hours")
      .select("*")
      .eq("barber_id", activeBarber.id);
    if (whError) throw whError;
    workingHours = data as WorkingHour[];
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold uppercase text-cream">Working hours</h1>

      {barberList.length === 0 && <EmptyState label="Add a barber first." />}

      {barberList.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {barberList.map((b) => (
              <Link
                key={b.id}
                href={`/staff/hours?barberId=${b.id}`}
                className={`rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-widest ${
                  activeBarber?.id === b.id
                    ? "border-brass text-brass"
                    : "border-charcoal text-smoke hover:border-smoke"
                }`}
              >
                {b.display_name}
              </Link>
            ))}
          </div>
          {activeBarber && <WorkingHoursForm barberId={activeBarber.id} workingHours={workingHours} />}
        </>
      )}
    </div>
  );
}
