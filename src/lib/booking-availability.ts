import "server-only";
import { getFreeBusy } from "@/lib/google-calendar";
import { bookingRequestsCol, bookingSettingsDoc } from "@/lib/firestore-collections";
import type { BookingSettings } from "@/types/firestore";

/**
 * Used whenever settings/booking doesn't exist yet, so self-booking works
 * before Jenna ever visits the settings page.
 */
export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  timezone: "America/Los_Angeles",
  bufferMinutes: 30,
  minNoticeHours: 24,
  bookingWindowDays: 60,
  requestExpiryHours: 48,
  bookingEnabled: true,
  workingHours: {
    2: { start: "10:00", end: "17:00" }, // Tue
    3: { start: "10:00", end: "17:00" }, // Wed
    4: { start: "10:00", end: "17:00" }, // Thu
    5: { start: "10:00", end: "17:00" }, // Fri
    6: { start: "10:00", end: "17:00" }, // Sat
  },
  sessionTypes: [{ id: "default", name: "Session", durationMinutes: 60, description: null }],
};

export async function getBookingSettings(): Promise<BookingSettings> {
  const snap = await bookingSettingsDoc().get();
  return snap.data() ?? DEFAULT_BOOKING_SETTINGS;
}

export interface Slot {
  start: Date;
  end: Date;
}

/**
 * Converts a wall-clock date+time in a given IANA timezone into the correct
 * UTC instant, DST-aware. No date library in this repo — this is the
 * standard Intl-based trick: format a UTC guess in the target zone, measure
 * the offset that reveals, then apply it once.
 */
function zonedTimeToUtc(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(utcGuess)) {
    if (p.type !== "literal") parts[p.type] = p.value;
  }
  const displayedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const offsetMs = displayedAsUtc - utcGuess.getTime();
  return new Date(utcGuess.getTime() - offsetMs);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// Exported so the transactional recheck in the request route uses the exact
// same overlap/buffer semantics as this engine — a divergence there would
// silently defeat the buffer setting for concurrent submissions.
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export function expandByBuffer(start: Date, end: Date, bufferMinutes: number) {
  return {
    start: new Date(start.getTime() - bufferMinutes * 60_000),
    end: new Date(end.getTime() + bufferMinutes * 60_000),
  };
}

// Plain-text emails have no client-side component to lean on the way
// LocalDateTime does for the admin UI — the server always renders in UTC,
// so format explicitly in the business timezone instead, or the times
// quoted back to Jenna/the client would silently be wrong.
export function formatBusinessTime(date: Date, timezone: string) {
  return date.toLocaleString("en-US", { timeZone: timezone, dateStyle: "medium", timeStyle: "short" });
}

/**
 * Generates candidate slots of `sessionDurationMinutes` from
 * settings.workingHours across [rangeStart, rangeEnd], with no
 * conflict-checking — kept as a pure function of the settings so the
 * calendar-walking logic is easy to reason about separately from the
 * Google/Firestore reads in getAvailableSlots below.
 */
function generateCandidateSlots(
  rangeStart: Date,
  rangeEnd: Date,
  settings: BookingSettings,
  sessionDurationMinutes: number
): Slot[] {
  const { timezone, workingHours } = settings;
  const slots: Slot[] = [];

  // Walk one calendar day at a time in the *business* timezone, not UTC —
  // a UTC day boundary can land mid-afternoon local time depending on the
  // zone, which would silently skip or duplicate a working day.
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const startParts: Record<string, string> = {};
  for (const p of dtf.formatToParts(rangeStart)) {
    if (p.type !== "literal") startParts[p.type] = p.value;
  }
  let cursorDate = new Date(
    Date.UTC(Number(startParts.year), Number(startParts.month) - 1, Number(startParts.day))
  );
  // One extra day of slack so a timezone offset near the range boundary
  // never causes the walk to stop one day too early — out-of-range slots
  // get dropped by the per-slot start/end check below regardless.
  const walkUntil = addDays(rangeEnd, 1);

  while (cursorDate.getTime() <= walkUntil.getTime()) {
    const weekday = cursorDate.getUTCDay(); // cursorDate anchors a calendar date, not a real instant, so getUTCDay() reads the correct local weekday
    const hours = workingHours[weekday];
    if (hours) {
      const [startH, startM] = hours.start.split(":").map(Number);
      const [endH, endM] = hours.end.split(":").map(Number);
      const y = cursorDate.getUTCFullYear();
      const m = cursorDate.getUTCMonth() + 1;
      const d = cursorDate.getUTCDate();
      const dayStart = zonedTimeToUtc(y, m, d, startH, startM, timezone);
      const dayEnd = zonedTimeToUtc(y, m, d, endH, endM, timezone);

      let slotStart = dayStart;
      while (slotStart.getTime() + sessionDurationMinutes * 60_000 <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + sessionDurationMinutes * 60_000);
        if (slotStart >= rangeStart && slotEnd <= rangeEnd) {
          slots.push({ start: slotStart, end: slotEnd });
        }
        slotStart = slotEnd;
      }
    }
    cursorDate = addDays(cursorDate, 1);
  }

  return slots;
}

/**
 * Returns the open slots a client can request within [rangeStart, rangeEnd]
 * for a given session type (further clamped to the minimum-notice/
 * booking-window settings). Returns [] if bookingEnabled is false or
 * sessionTypeId doesn't match any configured type.
 *
 * Conflict sources, in order:
 * 1. Google freebusy — the single source of truth for "busy." Deliberately
 *    does NOT also check calendarEventsCol; that's just a local mirror that
 *    would drift if Jenna ever edits/deletes an event directly in Google.
 *    Freebusy against the real calendar can't go stale. Don't "helpfully"
 *    add a redundant calendarEventsCol check here.
 * 2. Pending, non-expired booking requests — the "light lock." Approved
 *    requests are already real Calendar events, already covered by #1.
 */
export async function getAvailableSlots(rangeStart: Date, rangeEnd: Date, sessionTypeId: string): Promise<Slot[]> {
  const settings = await getBookingSettings();
  if (!settings.bookingEnabled) return [];
  const sessionType = settings.sessionTypes.find((t) => t.id === sessionTypeId);
  if (!sessionType) return [];

  const { bufferMinutes, minNoticeHours, bookingWindowDays } = settings;

  const now = new Date();
  const earliestAllowed = new Date(now.getTime() + minNoticeHours * 60 * 60_000);
  const latestAllowed = new Date(now.getTime() + bookingWindowDays * 24 * 60 * 60_000);
  const effectiveStart = rangeStart > earliestAllowed ? rangeStart : earliestAllowed;
  const effectiveEnd = rangeEnd < latestAllowed ? rangeEnd : latestAllowed;
  if (effectiveStart >= effectiveEnd) return [];

  const candidates = generateCandidateSlots(effectiveStart, effectiveEnd, settings, sessionType.durationMinutes);
  if (candidates.length === 0) return [];

  const [busy, pendingSnap] = await Promise.all([
    getFreeBusy(effectiveStart, effectiveEnd),
    // Firestore can't range-filter two different fields at once — this
    // covers requestedStart via the index, the rest is filtered in memory
    // below (matches the same shape the transactional recheck must use).
    bookingRequestsCol().where("status", "==", "pending").where("requestedStart", "<", effectiveEnd).get(),
  ]);

  const nowMs = Date.now();
  const pendingBlocks = pendingSnap.docs
    .map((d) => d.data())
    .filter((r) => r.expiresAt.toDate().getTime() > nowMs) // expired-but-unflipped is non-blocking
    .filter((r) => r.requestedEnd.toDate().getTime() > effectiveStart.getTime())
    .map((r) => ({ start: r.requestedStart.toDate(), end: r.requestedEnd.toDate() }));

  const blockers = [...busy, ...pendingBlocks].map((b) => expandByBuffer(b.start, b.end, bufferMinutes));

  return candidates.filter((slot) => !blockers.some((b) => overlaps(slot.start, slot.end, b.start, b.end)));
}
