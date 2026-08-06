import { requireStaffUser, getStaffShop } from "@/lib/staff/queries";
import { getTodayBookings, getUpcomingBookings } from "@/lib/staff/bookings";
import { AppointmentCard } from "@/components/staff/AppointmentCard";
import { EmptyState } from "@/components/ui/States";
import { redirect } from "next/navigation";

export default async function StaffDashboardPage() {
  await requireStaffUser();
  const shop = await getStaffShop();
  if (!shop) redirect("/staff/no-shop");

  const [today, upcoming] = await Promise.all([
    getTodayBookings(shop.id, shop.timezone),
    getUpcomingBookings(shop.id, shop.timezone),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase">{shop.name}</p>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase text-cream">Today</h1>
        <div className="mt-4 flex flex-col gap-2">
          {today.length === 0 ? (
            <EmptyState label="No appointments today." />
          ) : (
            today.map((b) => <AppointmentCard key={b.id} booking={b} timezone={shop.timezone} />)
          )}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold uppercase text-cream">Upcoming</h2>
        <div className="mt-4 flex flex-col gap-2">
          {upcoming.length === 0 ? (
            <EmptyState label="Nothing else on the books yet." />
          ) : (
            upcoming.map((b) => <AppointmentCard key={b.id} booking={b} timezone={shop.timezone} />)
          )}
        </div>
      </div>
    </div>
  );
}
