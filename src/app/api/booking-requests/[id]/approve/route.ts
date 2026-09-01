import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { bookingRequestsCol, contactsCol, threadsCol, messagesCol } from "@/lib/firestore-collections";
import { getFreeBusy, insertGoogleCalendarEvent, createCalendarEventMirror } from "@/lib/google-calendar";
import { overlaps, expandByBuffer, getBookingSettings, formatBusinessTime } from "@/lib/booking-availability";
import { sendEmail } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";
import type { BookingRequest as BookingRequestDoc } from "@/types/firestore";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const requestRef = bookingRequestsCol().doc(id);

  // Transactional status guard: only a "pending" request can move to
  // "approving." A double-click, two open tabs, or an approve racing a
  // decline all bounce off this before either ever touches Google —
  // closing the exact race a naive `.update()` would leave open.
  let pendingData: BookingRequestDoc;
  try {
    pendingData = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      const data = snap.data()!;
      if (data.status !== "pending") throw new Error("NOT_PENDING");
      tx.update(requestRef, { status: "approving" });
      return data;
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Booking request not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "NOT_PENDING") {
      return NextResponse.json({ error: "This request has already been handled" }, { status: 409 });
    }
    throw err;
  }

  const settings = await getBookingSettings();
  const requestedStart = pendingData.requestedStart.toDate();
  const requestedEnd = pendingData.requestedEnd.toDate();

  // Defensive re-check: Jenna may have manually added a conflicting event
  // since the request came in. No Google event exists yet, so it's safe to
  // revert straight back to "pending" here.
  const buffered = expandByBuffer(requestedStart, requestedEnd, settings.bufferMinutes);
  const busy = await getFreeBusy(requestedStart, requestedEnd);
  if (busy.some((b) => overlaps(buffered.start, buffered.end, b.start, b.end))) {
    await requestRef.update({ status: "pending" });
    return NextResponse.json(
      { error: "This time now conflicts with something on the calendar — check manually." },
      { status: 409 }
    );
  }

  const contactSnap = await contactsCol().doc(pendingData.contactId).get();
  const contact = contactSnap.data();
  const startIso = requestedStart.toISOString();
  const endIso = requestedEnd.toISOString();
  const title = contact ? `${pendingData.sessionTypeName} with ${contact.name}` : pendingData.sessionTypeName;

  let googleEventId: string;
  let htmlLink: string;
  try {
    const inserted = await insertGoogleCalendarEvent({
      title,
      description: pendingData.clientNote,
      start: startIso,
      end: endIso,
      attendeeEmail: contact?.email ?? null,
    });
    googleEventId = inserted.googleEventId;
    htmlLink = inserted.htmlLink;
  } catch (err) {
    // No Google event was created — safe to revert so Jenna can retry.
    await requestRef.update({ status: "pending" });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create the calendar event" },
      { status: 502 }
    );
  }

  // Written immediately, before anything else: a real Google Calendar event
  // now exists, so nothing past this point may ever call
  // insertGoogleCalendarEvent again for this request. If the mirror-doc
  // write below somehow fails, this request is deliberately left at
  // "approving" with googleEventId set (not auto-reverted to "pending") —
  // a narrow crash-window edge case meant for manual inspection, since a
  // blind auto-retry here risks creating a second Google event.
  await requestRef.update({ googleEventId });

  const calendarEventId = await createCalendarEventMirror({
    googleEventId,
    htmlLink,
    title,
    description: pendingData.clientNote,
    start: startIso,
    end: endIso,
    contactId: pendingData.contactId,
    threadId: pendingData.threadId,
  });

  await requestRef.update({
    status: "approved",
    calendarEventId,
    respondedAt: FieldValue.serverTimestamp(),
  });

  await messagesCol(pendingData.threadId).add({
    direction: "system",
    body: `Booking confirmed: ${pendingData.sessionTypeName} — ${formatBusinessTime(requestedStart, settings.timezone)}`,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp(),
    linkHref: `/admin/calendar/${calendarEventId}`,
  });
  await threadsCol().doc(pendingData.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });

  if (contact) {
    const emailText = `Hi ${contact.name},\n\nYour ${pendingData.sessionTypeName.toLowerCase()} is confirmed for ${formatBusinessTime(
      requestedStart,
      settings.timezone
    )}.\n\nSee you then!\nJenna`;
    await sendEmail({
      to: contact.email,
      from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: "Your session is confirmed",
      text: emailText,
      html: renderEmailHtml(emailText),
      replyTo: process.env.MAILGUN_FROM_REPLIES!,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, calendarEventId });
}
