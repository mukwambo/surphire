import { getActiveServices, getShopBySlug } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return fail(404, "Shop not found");

  const services = await getActiveServices(shop.id);
  return ok(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.duration_minutes,
    })),
  );
}
