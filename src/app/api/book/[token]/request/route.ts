import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { threadsCol, bookingRequestsCol, contactsCol, messagesCol, bookingSessionTypesCol } from "@/lib/firestore-collections";
import { getFreeBusy } from "@/lib/google-calendar";
import { getBookingSettings, overlaps, expandByBuffer, formatBusinessTime } from "@/lib/booking-availability";
import { sendEmail } from "@/lib/mailgun";

const MAX_NOTE_LENGTH = 500;

// Public, no-auth route — the "light lock." A slot pick here immediately
// creates a `pending` BookingRequest that blocks the time for everyone
// else; Jenna still has to explicitly approve it (see
// /api/booking-requests/[id]/approve) before it becomes a real Google
// Calendar event.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const threadSnap = await threadsCol().where("bookingToken", "==", token).limit(1).get();
  if (threadSnap.empty) {
    return NextResponse.json({ error: "This booking link isn't valid." }, { status: 404 });
  }
  const threadDoc = threadSnap.docs[0];
  const thread = threadDoc.data();

  const settings = await getBookingSettings();
  if (!settings.bookingEnabled) {
    return NextResponse.json({ error: "Booking is currently paused — please reply to the email instead." }, { status: 400 });
  }

  const payload = await request.json().catch(() => null);
  const { start, end, note, sessionTypeId } = (payload ?? {}) as {
    start?: string;
    end?: string;
    note?: string;
    sessionTypeId?: string;
  };
  if (!start || !end || !sessionTypeId) {
    return NextResponse.json({ error: "start, end, and sessionTypeId are required" }, { status: 400 });
  }
  const sessionTypeSnap = await bookingSessionTypesCol().doc(sessionTypeId).get();
  const sessionType = sessionTypeSnap.data();
  if (!sessionType) {
    return NextResponse.json({ error: "Invalid session type" }, { status: 400 });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }
  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60_000;
  if (durationMinutes !== sessionType.durationMinutes) {
    return NextResponse.json({ error: "Invalid session length" }, { status: 400 });
  }
  const now = new Date();
  const earliestAllowed = new Date(now.getTime() + settings.minNoticeHours * 60 * 60_000);
  const latestAllowed = new Date(now.getTime() + settings.bookingWindowDays * 24 * 60 * 60_000);
  if (startDate < earliestAllowed || endDate > latestAllowed) {
    return NextResponse.json({ error: "That time is outside the bookable window" }, { status: 400 });
  }
  const clientNote = typeof note === "string" && note.trim() ? note.trim().slice(0, MAX_NOTE_LENGTH) : null;

  // Pre-transaction: check the real calendar. External HTTP calls can't
  // safely live inside a Firestore transaction callback (it can silently
  // retry on contention) — the transaction below only re-checks
  // Firestore-native state (concurrent booking-request writes).
  const busy = await getFreeBusy(startDate, endDate);
  const bufferedRequested = expandByBuffer(startDate, endDate, settings.bufferMinutes);
  const calendarConflict = busy.some((b) => overlaps(bufferedRequested.start, bufferedRequested.end, b.start, b.end));
  if (calendarConflict) {
    return NextResponse.json({ error: "That time was just taken — please pick another." }, { status: 409 });
  }

  const newRef = bookingRequestsCol().doc();
  try {
    await adminDb().runTransaction(async (tx) => {
      // Firestore can't range-filter two fields at once — this covers
      // requestedStart via the (status, requestedStart) index; the rest of
      // the overlap check happens in memory below, same shape as
      // getAvailableSlots so the two never drift apart.
      const overlapQuery = bookingRequestsCol()
        .where("status", "==", "pending")
        .where("requestedStart", "<", bufferedRequested.end);
      const pendingSnap = await tx.get(overlapQuery);
      const nowMs = Date.now();
      const conflict = pendingSnap.docs.some((d) => {
        const r = d.data();
        if (r.expiresAt.toDate().getTime() <= nowMs) return false; // expired, non-blocking
        const buffered = expandByBuffer(r.requestedStart.toDate(), r.requestedEnd.toDate(), settings.bufferMinutes);
        return overlaps(bufferedRequested.start, bufferedRequested.end, buffered.start, buffered.end);
      });
      if (conflict) {
        throw new Error("SLOT_TAKEN");
      }

      tx.set(newRef, {
        contactId: thread.contactId,
        threadId: threadDoc.id,
        requestedStart: Timestamp.fromDate(startDate),
        requestedEnd: Timestamp.fromDate(endDate),
        clientNote,
        sessionTypeId,
        sessionTypeName: sessionType.name,
        status: "pending",
        googleEventId: null,
        calendarEventId: null,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + settings.requestExpiryHours * 60 * 60_000)),
        respondedAt: null,
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return NextResponse.json({ error: "That time was just taken — please pick another." }, { status: 409 });
    }
    throw err;
  }

  // Best-effort notifications from here — a failure shouldn't undo the
  // booking request, which has already committed.
  const contactSnap = await contactsCol().doc(thread.contactId).get();
  const contact = contactSnap.data();
  const notifyTo = process.env.NOTIFY_EMAIL;
  if (notifyTo) {
    await sendEmail({
      to: notifyTo,
      from: `Studio <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: `New booking request${contact ? ` from ${contact.name}` : ""}`,
      text: `${contact?.name ?? "A client"} requested ${sessionType.name} — ${formatBusinessTime(
        startDate,
        settings.timezone
      )}${clientNote ? `\n\nNote: ${clientNote}` : ""}\n\nOpen Studio to approve or decline.`,
      replyTo: notifyTo,
    }).catch(() => {});
  }

  await messagesCol(threadDoc.id).add({
    direction: "system",
    body: `Booking requested: ${sessionType.name} — ${formatBusinessTime(startDate, settings.timezone)}`,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await threadsCol().doc(threadDoc.id).update({ lastMessageAt: FieldValue.serverTimestamp() });

  return NextResponse.json({ ok: true });
}
