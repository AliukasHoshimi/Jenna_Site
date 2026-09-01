import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { bookingRequestsCol, threadsCol, messagesCol, contactsCol } from "@/lib/firestore-collections";
import { formatBusinessTime, getBookingSettings } from "@/lib/booking-availability";
import { sendEmail } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";

// Vercel Cron sends this as `Authorization: Bearer <CRON_SECRET>` — see
// vercel.json for the schedule. Rejects anyone else hitting this route.
//
// This is UI-hygiene/courtesy only, not a correctness dependency:
// getAvailableSlots already treats an expired-but-unflipped "pending"
// request as non-blocking by comparing expiresAt at read time, so a slow
// or missed cron run never actually blocks a slot longer than it should.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getBookingSettings();
  const now = Date.now();
  const snap = await bookingRequestsCol().where("status", "==", "pending").get();

  let expiredCount = 0;
  for (const doc of snap.docs) {
    const req = doc.data();
    if (req.expiresAt.toDate().getTime() > now) continue; // not expired yet

    try {
      await doc.ref.update({ status: "expired", respondedAt: FieldValue.serverTimestamp() });

      await messagesCol(req.threadId).add({
        direction: "system",
        body: `Booking request expired (no response): ${req.sessionTypeName} — ${formatBusinessTime(
          req.requestedStart.toDate(),
          settings.timezone
        )}`,
        mailgunMessageId: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      await threadsCol().doc(req.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });

      const contactSnap = await contactsCol().doc(req.contactId).get();
      const contact = contactSnap.data();
      if (contact) {
        const emailText = `Hi ${contact.name},\n\nYour requested time (${formatBusinessTime(
          req.requestedStart.toDate(),
          settings.timezone
        )}) wasn't confirmed in time and has expired. Feel free to use the same booking link to try again.\n\nThanks,\nJenna`;
        await sendEmail({
          to: contact.email,
          from: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
          subject: "Your booking request expired",
          text: emailText,
          html: renderEmailHtml(emailText),
          replyTo: process.env.MAILGUN_FROM_REPLIES!,
        }).catch(() => {});
      }
      expiredCount++;
    } catch {
      // Don't let one bad update/send abort the rest of the batch.
      continue;
    }
  }

  return NextResponse.json({ ok: true, expired: expiredCount });
}
