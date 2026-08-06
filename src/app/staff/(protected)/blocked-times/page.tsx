import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { createClient } from "@/lib/supabase/server";
import { AddBlockedTimeForm } from "@/components/staff/AddBlockedTimeForm";
import { BlockedTimeRow } from "@/components/staff/BlockedTimeRow";
import { EmptyState } from "@/components/ui/States";
import type { Barber, BlockedTime } from "@/lib/supabase/database.types";

export default async function StaffBlockedTimesPage({
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

  let blockedTimes: BlockedTime[] = [];
  if (activeBarber) {
    const { data, error: btError } = await supabase
      .from("blocked_times")
      .select("*")
      .eq("barber_id", activeBarber.id)
      .order("starts_at");
    if (btError) throw btError;
    blockedTimes = data as BlockedTime[];
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-bold uppercase text-cream">Blocked time</h1>

      {barberList.length === 0 && <EmptyState label="Add a barber first." />}

      {barberList.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {barberList.map((b) => (
              <Link
                key={b.id}
                href={`/staff/blocked-times?barberId=${b.id}`}
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

          <div className="flex flex-col gap-3">
            {blockedTimes.length === 0 ? (
              <EmptyState label="No blocked periods." />
            ) : (
              blockedTimes.map((bt) => (
                <BlockedTimeRow key={bt.id} blockedTime={bt} timezone={shop.timezone} />
              ))
            )}
          </div>

          {activeBarber && <AddBlockedTimeForm barberId={activeBarber.id} timezone={shop.timezone} />}
        </>
      )}
    </div>
  );
}
