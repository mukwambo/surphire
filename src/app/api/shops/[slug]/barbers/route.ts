import { getActiveBarbers, getShopBySlug } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return fail(404, "Shop not found");

  const barbers = await getActiveBarbers(shop.id);
  return ok(barbers.map((b) => ({ id: b.id, displayName: b.display_name })));
}
