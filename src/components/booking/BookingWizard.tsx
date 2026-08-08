"use client";

import { useMemo, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { addDays, format } from "date-fns";
import { TicketCard } from "./TicketCard";
import { SelectableCard } from "./SelectableCard";
import { SlotChip } from "./SlotChip";
import { StepHeader } from "./StepHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { apiFetch, type BarberDTO, type ServiceDTO, type SlotDTO } from "@/lib/booking/client-types";

type Step = "service" | "barber" | "datetime" | "details" | "confirmation";

const ANY_BARBER = "any";

interface Props {
  shopSlug: string;
  shopName: string;
  timezone: string;
  services: ServiceDTO[];
}

export function BookingWizard({ shopSlug, shopName, timezone, services }: Props) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<ServiceDTO | null>(null);
  const [barbers, setBarbers] = useState<BarberDTO[] | null>(null);
  const [barberChoice, setBarberChoice] = useState<string | null>(null); // barber id or ANY_BARBER
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotDTO[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotDTO | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const today = toZonedTime(new Date(), timezone);
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, [timezone]);

  const barberName =
    barberChoice === ANY_BARBER
      ? "Any available"
      : barbers?.find((b) => b.id === barberChoice)?.displayName ?? null;

  const slotLabel = selectedSlot
    ? format(toZonedTime(new Date(selectedSlot.startsAt), timezone), "EEE d MMM, h:mm a")
    : null;

  // Group slots by time of day so a busy schedule reads as three short lists
  // instead of one long wall of identical buttons.
  const slotGroups = useMemo(() => {
    const groups = [
      { label: "Morning", slots: [] as SlotDTO[] },
      { label: "Afternoon", slots: [] as SlotDTO[] },
      { label: "Evening", slots: [] as SlotDTO[] },
    ];
    for (const slot of slots ?? []) {
      const hour = toZonedTime(new Date(slot.startsAt), timezone).getHours();
      const group = hour < 12 ? groups[0] : hour < 17 ? groups[1] : groups[2];
      group.slots.push(slot);
    }
    return groups;
  }, [slots, timezone]);

  async function chooseService(s: ServiceDTO) {
    setService(s);
    setStep("barber");
    setError(null);
    if (!barbers) {
      setLoading(true);
      try {
        const data = await apiFetch<BarberDTO[]>(`/api/shops/${shopSlug}/barbers`);
        setBarbers(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
  }

  function chooseBarber(id: string) {
    setBarberChoice(id);
    setStep("datetime");
  }

  async function chooseDate(d: Date) {
    const dateStr = format(d, "yyyy-MM-dd");
    setDate(dateStr);
    setSelectedSlot(null);
    setSlots(null);
    setError(null);
    if (!service) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({ serviceId: service.id, date: dateStr });
      if (barberChoice && barberChoice !== ANY_BARBER) params.set("barberId", barberChoice);
      const data = await apiFetch<SlotDTO[]>(`/api/shops/${shopSlug}/availability?${params}`);
      setSlots(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function chooseSlot(slot: SlotDTO) {
    setSelectedSlot(slot);
    setStep("details");
  }

  async function confirmBooking() {
    if (!service || !selectedSlot) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ reference: string }>(`/api/shops/${shopSlug}/bookings`, {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          barberId: barberChoice !== ANY_BARBER ? (barberChoice ?? selectedSlot.barberId) : selectedSlot.barberId,
          startsAt: selectedSlot.startsAt,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
        }),
      });
      setReference(data.reference);
      setStep("confirmation");
    } catch (e) {
      setError((e as Error).message);
      // Slot likely taken between selection and submit -- send them back to
      // reselect a time rather than let them resubmit into the same wall.
      setStep("datetime");
      setSlots(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start">
      <div className="flex-1">
        {step === "service" && (
          <div>
            <StepHeader step={1} total={4} title="Choose a service" />
            <div className="flex flex-col gap-3">
              {services.map((s) => (
                <SelectableCard
                  key={s.id}
                  title={s.name}
                  subtitle={s.description ?? `${s.durationMinutes} min`}
                  meta={`KES ${s.price}`}
                  selected={service?.id === s.id}
                  onClick={() => chooseService(s)}
                />
              ))}
            </div>
          </div>
        )}

        {step === "barber" && (
          <div>
            <StepHeader step={2} total={4} title="Choose a barber" />
            {loading && <LoadingState />}
            {error && <ErrorState label={error} />}
            {!loading && barbers && (
              <div className="flex flex-col gap-3">
                <SelectableCard
                  title="Any available barber"
                  subtitle="Fastest way to get a slot"
                  selected={barberChoice === ANY_BARBER}
                  onClick={() => chooseBarber(ANY_BARBER)}
                />
                {barbers.map((b) => (
                  <SelectableCard
                    key={b.id}
                    title={b.displayName}
                    selected={barberChoice === b.id}
                    onClick={() => chooseBarber(b.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {step === "datetime" && (
          <div>
            <StepHeader step={3} total={4} title="Pick a date & time" />
            <div className="mb-5 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const dateStr = format(d, "yyyy-MM-dd");
                return (
                  <button
                    key={dateStr}
                    onClick={() => chooseDate(d)}
                    className={`flex min-w-14 flex-col items-center rounded-sm border px-2 py-2 transition-colors ${
                      date === dateStr
                        ? "border-brass bg-ink-raised"
                        : "border-charcoal bg-ink-raised/40 hover:border-smoke"
                    }`}
                  >
                    <span className="font-mono text-[10px] text-smoke uppercase">
                      {format(d, "EEE")}
                    </span>
                    <span className="font-display text-lg font-bold text-cream">
                      {format(d, "d")}
                    </span>
                  </button>
                );
              })}
            </div>

            {loading && <LoadingState />}
            {error && <ErrorState label={error} />}
            {!loading && date && slots && slots.length === 0 && (
              <EmptyState label="No open slots that day. Try another date." />
            )}
            {!loading && slots && slots.length > 0 && (
              <div className="flex flex-col gap-4">
                {slotGroups.map(
                  ({ label, slots: groupSlots }) =>
                    groupSlots.length > 0 && (
                      <div key={label} className="flex flex-col gap-2">
                        <p className="font-mono text-[11px] uppercase tracking-widest text-smoke">
                          {label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {groupSlots.map((slot) => (
                            <SlotChip
                              key={slot.startsAt}
                              label={format(toZonedTime(new Date(slot.startsAt), timezone), "h:mm a")}
                              selected={selectedSlot?.startsAt === slot.startsAt}
                              onClick={() => chooseSlot(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    ),
                )}
              </div>
            )}
          </div>
        )}

        {step === "details" && (
          <div>
            <StepHeader step={4} total={4} title="Your details" />
            {error && <ErrorState label={error} />}
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                confirmBooking();
              }}
            >
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">
                  Name
                </span>
                <input
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">
                  Phone
                </span>
                <input
                  required
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[11px] text-smoke uppercase tracking-widest">
                  Email (optional)
                </span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="rounded-sm border border-charcoal bg-ink-raised px-3 py-2 text-cream outline-none focus:border-brass"
                />
              </label>
              <Button type="submit" disabled={loading}>
                {loading ? "Booking…" : "Confirm booking"}
              </Button>
            </form>
          </div>
        )}

        {step === "confirmation" && reference && (
          <div className="stamp-in">
            <p className="mb-2 font-mono text-sm text-brass uppercase tracking-widest">
              Booked
            </p>
            <h2 className="mb-4 font-display text-3xl font-bold text-cream">
              See you then, {customerName.split(" ")[0]}.
            </h2>
            <p className="mb-6 text-smoke">
              Keep your reference to look up or cancel this booking later.
            </p>
            <a href={`/b/${reference}`} className="font-mono text-sm text-pole-blue underline">
              View booking →
            </a>
          </div>
        )}
      </div>

      <TicketCard
        shopName={shopName}
        status={step === "confirmation" ? "Pending" : undefined}
        reference={reference ?? undefined}
        rows={[
          { label: "Service", value: service?.name ?? null },
          { label: "Barber", value: barberName },
          { label: "When", value: slotLabel },
          { label: "Name", value: customerName || null },
        ]}
      />
    </div>
  );
}
