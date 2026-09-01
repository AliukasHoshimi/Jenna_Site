import { NextRequest, NextResponse } from "next/server";
import { threadsCol, bookingSessionTypesCol } from "@/lib/firestore-collections";
import { getBookingSettings } from "@/lib/booking-availability";

// Public, no-auth route — the booking picker's first step: which visit
// type is this for. Also surfaces bookingEnabled so the picker can show a
// "not currently accepting requests" state instead of an empty type list.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await threadsCol().where("bookingToken", "==", token).limit(1).get();
  if (snap.empty) {
    return NextResponse.json({ error: "This booking link isn't valid." }, { status: 404 });
  }

  const [settings, typesSnap] = await Promise.all([getBookingSettings(), bookingSessionTypesCol().get()]);
  return NextResponse.json({
    bookingEnabled: settings.bookingEnabled,
    sessionTypes: typesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  });
}
