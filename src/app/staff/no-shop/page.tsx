export default function NoShopPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-2xl font-bold uppercase text-cream">No shop linked yet</h1>
      <p className="max-w-sm text-smoke">
        This account isn&apos;t set up as an owner or barber on any shop yet. Ask whoever is
        setting up BarberBook for your shop to add you.
      </p>
    </main>
  );
}
