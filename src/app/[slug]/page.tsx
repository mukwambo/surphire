import { notFound } from "next/navigation";
import { getActiveServices, getShopBySlug } from "@/lib/booking/queries";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const services = await getActiveServices(shop.id);

  return (
    <main className="flex-1">
      <header className="border-b border-charcoal px-4 py-6 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-brass uppercase">Surphire</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-cream uppercase">{shop.name}</h1>
        {shop.location && <p className="mt-1 text-sm text-smoke">{shop.location}</p>}
      </header>
      <BookingWizard
        shopSlug={shop.slug}
        shopName={shop.name}
        timezone={shop.timezone}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price,
          durationMinutes: s.duration_minutes,
        }))}
      />
    </main>
  );
}
