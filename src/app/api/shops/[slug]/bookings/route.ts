import { z } from "zod";
import { createBooking, getShopBySlug, SlotUnavailableError } from "@/lib/booking/queries";
import { fail, ok } from "@/lib/api/response";

const bodySchema = z.object({
  serviceId: z.string().uuid(),
  barberId: z.string().uuid().optional(),
  startsAt: z.string().datetime(),
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z.string().trim().min(6).max(20),
  customerEmail: z.string().trim().email().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return fail(404, "Shop not found");

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return fail(400, "Invalid booking request", parsed.error.flatten());

  try {
    const booking = await createBooking({ shop, ...parsed.data });
    return ok(
      {
        reference: booking.reference,
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        status: booking.status,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SlotUnavailableError) return fail(409, err.message);
    throw err;
  }
}
