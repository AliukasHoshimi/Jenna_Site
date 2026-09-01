import { NextRequest, NextResponse } from "next/server";
import { threadsCol, bookingRequestsCol } from "@/lib/firestore-collections";

// Public, no-auth route — lets a client see (and, via the cancel route,
// manage) their own upcoming bookings on this thread. Queries by threadId
// alone (single equality, auto-indexed) and filters status/upcoming in
// memory rather than adding a new composite index — per-thread booking
// counts are small, matching the "small collection, filter in memory"
// pattern used elsewhere in this app.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const threadSnap = await threadsCol().where("bookingToken", "==", token).limit(1).get();
  if (threadSnap.empty) {
    return NextResponse.json({ error: "This booking link isn't valid." }, { status: 404 });
  }
  const threadId = threadSnap.docs[0].id;

  const snap = await bookingRequestsCol().where("threadId", "==", threadId).get();
  const now = Date.now();
  const bookings = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => (r.status === "pending" || r.status === "approved") && r.requestedStart.toDate().getTime() > now)
    .sort((a, b) => a.requestedStart.toDate().getTime() - b.requestedStart.toDate().getTime())
    .map((r) => ({
      id: r.id,
      sessionTypeName: r.sessionTypeName,
      status: r.status,
      start: r.requestedStart.toDate().toISOString(),
      end: r.requestedEnd.toDate().toISOString(),
    }));

  return NextResponse.json({ bookings });
}
