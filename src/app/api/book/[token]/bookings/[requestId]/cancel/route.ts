import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { threadsCol, bookingRequestsCol, contactsCol, messagesCol, calendarEventsCol } from "@/lib/firestore-collections";
import { deleteGoogleCalendarEvent } from "@/lib/google-calendar";
import { getBookingSettings, formatBusinessTime } from "@/lib/booking-availability";
import { sendEmail } from "@/lib/mailgun";
import type { BookingRequest as BookingRequestDoc } from "@/types/firestore";

// Public, no-auth route — a client cancelling their own booking. Token-gated
// the same way every /api/book/[token]/* route is; the requestId is also
// checked against the resolved thread so a client can't cancel a booking
// that belongs to a different thread just by guessing another id.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string; requestId: string }> }) {
  const { token, requestId } = await params;
  const threadSnap = await threadsCol().where("bookingToken", "==", token).limit(1).get();
  if (threadSnap.empty) {
    return NextResponse.json({ error: "This booking link isn't valid." }, { status: 404 });
  }
  const thread = threadSnap.docs[0];

  const requestRef = bookingRequestsCol().doc(requestId);

  // Transactional status guard, same shape as approve/decline: a
  // double-click or two open tabs both cancelling bounce off this before
  // either can touch Google. Pending needs no external call (nothing's on
  // the real calendar yet) so it goes straight to "cancelled"; approved
  // goes through the short-lived "cancelling" state first since deleting
  // the Google event is an external call that can't safely live inside the
  // transaction itself.
  let data: BookingRequestDoc;
  let wasApproved: boolean;
  try {
    const result = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      const d = snap.data()!;
      if (d.threadId !== thread.id) throw new Error("NOT_FOUND"); // don't leak that a different thread's id exists
      if (d.status === "pending") {
        tx.update(requestRef, { status: "cancelled", respondedAt: FieldValue.serverTimestamp() });
        return { data: d, wasApproved: false };
      }
      if (d.status === "approved") {
        tx.update(requestRef, { status: "cancelling" });
        return { data: d, wasApproved: true };
      }
      throw new Error("NOT_CANCELLABLE");
    });
    data = result.data;
    wasApproved = result.wasApproved;
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "NOT_CANCELLABLE") {
      return NextResponse.json({ error: "This booking can no longer be cancelled." }, { status: 409 });
    }
    throw err;
  }

  if (wasApproved) {
    if (data.googleEventId) {
      try {
        await deleteGoogleCalendarEvent(data.googleEventId);
      } catch (err) {
        // Leave it at "cancelling" for manual follow-up rather than
        // silently marking "cancelled" while a real event still exists —
        // same reasoning as the approve flow's crash-window edge case.
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Could not cancel the calendar event" },
          { status: 502 }
        );
      }
    }
    if (data.calendarEventId) {
      await calendarEventsCol().doc(data.calendarEventId).delete();
    }
    await requestRef.update({ status: "cancelled", respondedAt: FieldValue.serverTimestamp() });
  }

  const settings = await getBookingSettings();
  const timeLabel = formatBusinessTime(data.requestedStart.toDate(), settings.timezone);

  await messagesCol(thread.id).add({
    direction: "system",
    body: `Booking cancelled by client: ${data.sessionTypeName} — ${timeLabel}`,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await threadsCol().doc(thread.id).update({ lastMessageAt: FieldValue.serverTimestamp() });

  const notifyTo = process.env.NOTIFY_EMAIL;
  if (notifyTo) {
    const contactSnap = await contactsCol().doc(data.contactId).get();
    const contact = contactSnap.data();
    await sendEmail({
      to: notifyTo,
      from: `Studio <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: `Booking cancelled${contact ? ` by ${contact.name}` : ""}`,
      text: `${contact?.name ?? "A client"} cancelled their ${data.sessionTypeName} — ${timeLabel}.`,
      replyTo: notifyTo,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
