import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { bookingSettingsDoc } from "@/lib/firestore-collections";
import { getBookingSettings } from "@/lib/booking-availability";
import type { BookingSettings } from "@/types/firestore";

export async function GET() {
  const { user, response } = await requireAuth();
  if (!user) return response;
  const settings = await getBookingSettings();
  return NextResponse.json(settings);
}

function isValidTimeString(s: unknown): s is string {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

export async function PATCH(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { timezone, bufferMinutes, minNoticeHours, bookingWindowDays, requestExpiryHours, bookingEnabled, workingHours } =
    payload as Partial<BookingSettings>;

  if (typeof timezone !== "string" || !timezone.trim()) {
    return NextResponse.json({ error: "timezone is required" }, { status: 400 });
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }

  for (const [label, value] of [
    ["bufferMinutes", bufferMinutes],
    ["minNoticeHours", minNoticeHours],
    ["bookingWindowDays", bookingWindowDays],
    ["requestExpiryHours", requestExpiryHours],
  ] as const) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return NextResponse.json({ error: `${label} must be a non-negative number` }, { status: 400 });
    }
  }

  if (typeof bookingEnabled !== "boolean") {
    return NextResponse.json({ error: "bookingEnabled must be a boolean" }, { status: 400 });
  }

  if (!workingHours || typeof workingHours !== "object") {
    return NextResponse.json({ error: "Invalid workingHours" }, { status: 400 });
  }
  const cleanWorkingHours: Partial<Record<number, { start: string; end: string }>> = {};
  for (const key of Object.keys(workingHours)) {
    const day = Number(key);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    const val = (workingHours as Record<string, unknown>)[key];
    if (val === null || val === undefined) continue;
    const { start, end } = val as { start?: unknown; end?: unknown };
    if (!isValidTimeString(start) || !isValidTimeString(end)) {
      return NextResponse.json({ error: `Invalid hours for day ${day}` }, { status: 400 });
    }
    if (start >= end) {
      return NextResponse.json({ error: `Start must be before end for day ${day}` }, { status: 400 });
    }
    cleanWorkingHours[day] = { start, end };
  }

  const clean: BookingSettings = {
    timezone: timezone.trim(),
    // Non-null assertions: the loop above already validated each of these
    // is a real number, returning a 400 response before we ever get here
    // otherwise — TS just can't carry that narrowing through the tuple loop.
    bufferMinutes: bufferMinutes!,
    minNoticeHours: minNoticeHours!,
    bookingWindowDays: bookingWindowDays!,
    requestExpiryHours: requestExpiryHours!,
    bookingEnabled,
    workingHours: cleanWorkingHours,
  };

  await bookingSettingsDoc().set(clean);
  return NextResponse.json({ ok: true });
}
