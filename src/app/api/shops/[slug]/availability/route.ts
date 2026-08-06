import { z } from "zod";
import { getAvailability, getShopBySlug } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

const querySchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  barberId: z.string().uuid().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return fail(404, "Shop not found");

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    serviceId: url.searchParams.get("serviceId"),
    date: url.searchParams.get("date"),
    barberId: url.searchParams.get("barberId") ?? undefined,
  });
  if (!parsed.success) return fail(400, "Invalid query", parsed.error.flatten());

  const slots = await getAvailability({ shop, ...parsed.data });
  return ok(slots);
}
