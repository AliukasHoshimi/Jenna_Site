import { NextRequest, NextResponse } from "next/server";
import { threadsCol } from "@/lib/firestore-collections";
import { getAvailableSlots, getBookingSettings } from "@/lib/booking-availability";

// Public, no-auth route — resolves straight off the thread's bookingToken,
// same lookup shape as /sign/[token] and /respond/[token]. getAvailableSlots
// clamps the effective window to the booking settings itself regardless of
// what from/to are requested here, so this route just needs basic sanity
// checks on the input, not to enforce the real bounds itself.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await threadsCol().where("bookingToken", "==", token).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ error: "This booking link isn't valid." }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const sessionTypeId = searchParams.get("sessionTypeId");
  if (!sessionTypeId) {
    return NextResponse.json({ error: "sessionTypeId is required" }, { status: 400 });
  }

  const settings = await getBookingSettings();
  const now = new Date();
  const defaultEnd = new Date(now.getTime() + settings.bookingWindowDays * 24 * 60 * 60_000);

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : now;
  const to = toParam ? new Date(toParam) : defaultEnd;
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    return NextResponse.json({ error: "Invalid from/to range" }, { status: 400 });
  }

  const slots = await getAvailableSlots(from, to, sessionTypeId);
  return NextResponse.json({
    slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })),
  });
}
