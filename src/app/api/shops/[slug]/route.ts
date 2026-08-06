import { getShopBySlug } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return fail(404, "Shop not found");

  return ok({
    name: shop.name,
    slug: shop.slug,
    phone: shop.phone,
    location: shop.location,
    timezone: shop.timezone,
  });
}
