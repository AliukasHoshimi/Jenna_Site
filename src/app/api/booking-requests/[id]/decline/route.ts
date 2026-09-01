import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/auth/require-auth";
import { bookingRequestsCol, contactsCol, threadsCol, messagesCol } from "@/lib/firestore-collections";
import { formatBusinessTime, getBookingSettings } from "@/lib/booking-availability";
import { sendEmail } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";
import type { BookingRequest as BookingRequestDoc } from "@/types/firestore";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const requestRef = bookingRequestsCol().doc(id);

  // Same transactional status guard as approve — only "pending" can be
  // declined, so a race against a concurrent approve can't leave the
  // request in an inconsistent state.
  let data: BookingRequestDoc;
  try {
    data = await adminDb().runTransaction(async (tx) => {
      const snap = await tx.get(requestRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      const d = snap.data()!;
      if (d.status !== "pending") throw new Error("NOT_PENDING");
      tx.update(requestRef, { status: "declined", respondedAt: FieldValue.serverTimestamp() });
      return d;
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

  await messagesCol(data.threadId).add({
    direction: "system",
    body: `Booking request declined: ${data.sessionTypeName} — ${formatBusinessTime(
      data.requestedStart.toDate(),
      settings.timezone
    )}`,
    mailgunMessageId: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  await threadsCol().doc(data.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });

  const contactSnap = await contactsCol().doc(data.contactId).get();
  const contact = contactSnap.data();
  if (contact) {
    // The thread's bookingToken is untouched by a decline, so the same
    // link still works for the client to pick a different time.
    const emailText = `Hi ${contact.name},\n\nUnfortunately ${formatBusinessTime(
      data.requestedStart.toDate(),
      settings.timezone
    )} doesn't work — feel free to use the same booking link to pick another time, or just reply to this email.\n\nThanks,\nJenna`;
    await sendEmail({
      to: contact.email,
      from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      subject: "About your requested session time",
      text: emailText,
      html: renderEmailHtml(emailText),
      replyTo: process.env.MAILGUN_FROM_REPLIES!,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
