import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeAvailableSlots, EXCLUSION_VIOLATION_CODE } from "./availability";
import type { Barber, Booking, Customer, Service, Shop } from "@/lib/supabase/database.types";
import { notify } from "@/lib/notifications";

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"] as const;

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("shops")
    .select("id, owner_id, name, slug, phone, location, timezone, status, created_at")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getActiveServices(shopId: string): Promise<Service[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getActiveBarbers(shopId: string): Promise<Barber[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("display_name");

  if (error) throw error;
  return data ?? [];
}

/** Calendar day-of-week (0 = Sunday) for a "YYYY-MM-DD" string, independent of timezone conversion. */
function dayOfWeekFor(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

async function slotsForBarber(params: {
  shop: Shop;
  barber: Barber;
  date: string;
  durationMinutes: number;
}): Promise<Date[]> {
  const { shop, barber, date, durationMinutes } = params;
  const supabase = createAdminClient();
  const dayOfWeek = dayOfWeekFor(date);

  const { data: workingHours, error: whError } = await supabase
    .from("working_hours")
    .select("open_time, close_time")
    .eq("barber_id", barber.id)
    .eq("day_of_week", dayOfWeek);
  if (whError) throw whError;
  if (!workingHours || workingHours.length === 0) return [];

  // Widest possible window across the day's working-hour rows, used to scope
  // the blocked-time/booking queries below.
  const windowStartLocal = `${date}T${workingHours[0].open_time}`;
  const windowEndLocal = `${date}T${workingHours[workingHours.length - 1].close_time}`;

  const { data: blockedTimes, error: btError } = await supabase
    .from("blocked_times")
    .select("starts_at, ends_at")
    .eq("barber_id", barber.id)
    .lt("starts_at", `${date}T23:59:59`)
    .gt("ends_at", `${date}T00:00:00`);
  if (btError) throw btError;

  const { data: bookings, error: bkError } = await supabase
    .from("bookings")
    .select("starts_at, ends_at")
    .eq("barber_id", barber.id)
    .in("status", ACTIVE_BOOKING_STATUSES)
    .lt("starts_at", `${date}T23:59:59`)
    .gt("ends_at", `${date}T00:00:00`);
  if (bkError) throw bkError;

  void windowStartLocal;
  void windowEndLocal;

  return computeAvailableSlots({
    date,
    timezone: shop.timezone,
    workingHours,
    blockedTimes: blockedTimes ?? [],
    bookings: bookings ?? [],
    durationMinutes,
  });
}

export interface AvailabilitySlot {
  startsAt: string; // ISO
  endsAt: string;
  barberId: string;
}

/**
 * Returns available slots. When barberId is omitted ("Any available
 * barber"), slots from every active barber are merged and de-duplicated by
 * start time, each tagged with one barber known to be free at that instant.
 */
export async function getAvailability(params: {
  shop: Shop;
  date: string;
  serviceId: string;
  barberId?: string;
}): Promise<AvailabilitySlot[]> {
  const { shop, date, serviceId, barberId } = params;
  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("shop_id", shop.id)
    .single();
  if (serviceError) throw serviceError;

  const barbers = barberId
    ? [
        await supabase
          .from("barbers")
          .select("*")
          .eq("id", barberId)
          .eq("shop_id", shop.id)
          .eq("status", "active")
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            return data as Barber;
          }),
      ]
    : await getActiveBarbers(shop.id);

  const byStart = new Map<string, AvailabilitySlot>();

  for (const barber of barbers) {
    const slots = await slotsForBarber({
      shop,
      barber,
      date,
      durationMinutes: service.duration_minutes,
    });
    for (const start of slots) {
      const key = start.toISOString();
      if (!byStart.has(key)) {
        byStart.set(key, {
          startsAt: key,
          endsAt: new Date(start.getTime() + service.duration_minutes * 60_000).toISOString(),
          barberId: barber.id,
        });
      }
    }
  }

  return Array.from(byStart.values()).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("That slot is no longer available. Please choose another.");
    this.name = "SlotUnavailableError";
  }
}

export interface CreateBookingInput {
  shop: Shop;
  serviceId: string;
  barberId?: string; // omitted => "any available barber"
  startsAt: string; // ISO
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  notes?: string;
}

/**
 * Creates a booking. The DB's exclusion constraint (see migration 0001) is
 * the real transactional recheck required by Section 7 -- it atomically
 * rejects an overlapping insert even if two customers raced for the same
 * slot. We just need to attempt the insert and interpret that failure.
 */
export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const supabase = createAdminClient();

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", input.serviceId)
    .eq("shop_id", input.shop.id)
    .single();
  if (serviceError) throw serviceError;

  const endsAt = new Date(
    new Date(input.startsAt).getTime() + service.duration_minutes * 60_000,
  ).toISOString();

  const candidateBarberIds = input.barberId
    ? [input.barberId]
    : (await getActiveBarbers(input.shop.id)).map((b) => b.id);

  if (candidateBarberIds.length === 0) {
    throw new SlotUnavailableError();
  }

  let customer: Customer;
  {
    const { data: existing, error: findError } = await supabase
      .from("customers")
      .select("*")
      .eq("shop_id", input.shop.id)
      .eq("phone", input.customerPhone)
      .maybeSingle();
    if (findError) throw findError;

    if (existing) {
      customer = existing;
    } else {
      const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
          shop_id: input.shop.id,
          name: input.customerName,
          phone: input.customerPhone,
          email: input.customerEmail ?? null,
        })
        .select()
        .single();
      if (createError) throw createError;
      customer = created;
    }
  }

  for (const barberId of candidateBarberIds) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        shop_id: input.shop.id,
        customer_id: customer.id,
        barber_id: barberId,
        service_id: input.serviceId,
        starts_at: input.startsAt,
        ends_at: endsAt,
        status: "PENDING",
        notes: input.notes ?? null,
      })
      .select()
      .single();

    if (!error) {
      const context = {
        shop: input.shop.name,
        customer: input.customerName,
        startsAt: input.startsAt,
        reference: data.reference,
      };
      await notify({ bookingId: data.id, type: "booking_created", recipient: "customer", context });
      await notify({ bookingId: data.id, type: "booking_created", recipient: "staff", context });
      return data;
    }

    // Exclusion violation on this barber -> try the next candidate when the
    // caller asked for "any available barber"; otherwise it's a hard no.
    if (error.code !== EXCLUSION_VIOLATION_CODE) throw error;
  }

  throw new SlotUnavailableError();
}

export async function getBookingByReference(reference: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "*, shop:shops(name, slug, phone, timezone), barber:barbers(display_name), service:services(name, price, duration_minutes)",
    )
    .eq("reference", reference.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function cancelBooking(reference: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("reference", reference.toUpperCase())
    .in("status", ACTIVE_BOOKING_STATUSES)
    .select()
    .maybeSingle();
  if (error) throw error;

  if (data) {
    const context = { reference: data.reference, startsAt: data.starts_at };
    await notify({ bookingId: data.id, type: "booking_cancelled", recipient: "customer", context });
    await notify({ bookingId: data.id, type: "booking_cancelled", recipient: "staff", context });
  }

  return data;
}
