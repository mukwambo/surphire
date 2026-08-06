export interface TicketRow {
  label: string;
  value: string | null;
}

interface TicketCardProps {
  shopName: string;
  rows: TicketRow[];
  reference?: string;
  status?: string;
  className?: string;
}

/**
 * The signature element of the booking flow: a perforated appointment
 * ticket that fills in as the customer moves through service -> barber ->
 * time -> details, mirroring the paper slip a real barbershop hands out.
 */
export function TicketCard({ shopName, rows, reference, status, className = "" }: TicketCardProps) {
  return (
    <div className={`w-full max-w-sm ${className}`}>
      <div className="ticket-perforation" aria-hidden />
      <div className="bg-ticket px-6 py-5 text-charcoal">
        <div className="flex items-baseline justify-between border-b border-charcoal/20 pb-3">
          <span className="font-display text-xl font-bold uppercase tracking-wide">{shopName}</span>
          {status && (
            <span className="font-mono text-[11px] tracking-widest text-pole-red uppercase">{status}</span>
          )}
        </div>
        <dl className="mt-4 space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-charcoal/60">
                {row.label}
              </dt>
              <dd
                className={`font-mono text-sm text-right ${row.value ? "text-charcoal" : "text-charcoal/30"}`}
              >
                {row.value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
        {reference && (
          <div className="mt-5 border-t border-dashed border-charcoal/30 pt-3 text-center">
            <div className="font-mono text-[11px] uppercase tracking-widest text-charcoal/60">
              Reference
            </div>
            <div className="font-display text-2xl font-bold tracking-[0.2em]">{reference}</div>
          </div>
        )}
      </div>
      <div className="ticket-perforation" aria-hidden />
    </div>
  );
}
