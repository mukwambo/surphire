import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

export interface WorkingHourRow {
  open_time: string; // "HH:MM:SS"
  close_time: string;
}

export interface TimeRange {
  starts_at: string; // ISO timestamptz
  ends_at: string;
}

export interface AvailabilityInput {
  /** Shop-local calendar date, "YYYY-MM-DD". */
  date: string;
  /** IANA timezone the shop operates in, e.g. "Africa/Nairobi". */
  timezone: string;
  /** This barber's working-hour row(s) for that day of week (0 or 1, given the unique constraint). */
  workingHours: WorkingHourRow[];
  blockedTimes: TimeRange[];
  /** Active (PENDING/CONFIRMED) bookings for this barber that day. */
  bookings: TimeRange[];
  durationMinutes: number;
  slotIntervalMinutes?: number;
}

function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Section 7 slot-generation logic. Returns candidate start instants (UTC)
 * for a single barber/day/service. This is a pure function so it's cheap to
 * unit test against the doc's business rules directly.
 */
export function computeAvailableSlots(input: AvailabilityInput): Date[] {
  const {
    date,
    timezone,
    workingHours,
    blockedTimes,
    bookings,
    durationMinutes,
    slotIntervalMinutes = 15,
  } = input;

  const blocked = blockedTimes.map((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));
  const booked = bookings.map((b) => ({
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
  }));

  const slots: Date[] = [];

  for (const wh of workingHours) {
    const windowStart = fromZonedTime(`${date}T${wh.open_time}`, timezone);
    const windowEnd = fromZonedTime(`${date}T${wh.close_time}`, timezone);

    let candidateStart = windowStart;
    while (true) {
      const candidateEnd = addMinutes(candidateStart, durationMinutes);
      if (candidateEnd > windowEnd) break;

      const hitsBlocked = blocked.some((b) =>
        rangesOverlap(candidateStart, candidateEnd, b.start, b.end),
      );
      const hitsBooking = booked.some((b) =>
        rangesOverlap(candidateStart, candidateEnd, b.start, b.end),
      );

      if (!hitsBlocked && !hitsBooking) {
        slots.push(candidateStart);
      }

      candidateStart = addMinutes(candidateStart, slotIntervalMinutes);
    }
  }

  return slots;
}

/** Postgres exclusion-constraint violation code (see supabase/migrations/0001_init.sql). */
export const EXCLUSION_VIOLATION_CODE = "23P01";
