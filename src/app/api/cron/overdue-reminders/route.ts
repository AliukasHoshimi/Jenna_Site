import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { sendEmail } from "@/lib/mailgun";
import { renderEmailHtml } from "@/lib/email-html";

const REMINDER_INTERVAL_MS = 5 * 24 * 60 * 60 * 1000; // don't nag more than once per ~5 days

// Vercel Cron sends this as `Authorization: Bearer <CRON_SECRET>` — see
// vercel.json for the schedule. Rejects anyone else hitting this route.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const snap = await invoicesCol().where("status", "==", "sent").get();

  let remindersSent = 0;
  for (const doc of snap.docs) {
    const invoice = doc.data();
    if (invoice.dueDate.toDate().getTime() >= now) continue; // not overdue yet
    if (invoice.lastReminderSentAt && now - invoice.lastReminderSentAt.toDate().getTime() < REMINDER_INTERVAL_MS) {
      continue; // reminded recently, don't nag
    }
    if (!invoice.stripeCheckoutUrl) continue; // nothing to pay yet, shouldn't happen for "sent"

    const contactSnap = await contactsCol().doc(invoice.contactId).get();
    const contact = contactSnap.data();
    if (!contact) continue;

    const amountDue = invoice.depositPaidAt ? invoice.amountTotal - (invoice.depositAmount ?? 0) : invoice.amountTotal;
    const emailText = `Hi ${contact.name},\n\nJust a friendly reminder that invoice #${invoice.invoiceNumber} for ${invoice.currency.toUpperCase()} ${amountDue.toFixed(
      2
    )} is now past due. You can pay securely here:\n${invoice.stripeCheckoutUrl}\n\nThanks,\nJenna`;

    try {
      await sendEmail({
        to: contact.email,
        from: `Samsarafilmss Billing <${process.env.MAILGUN_FROM_INVOICES}>`,
        subject: `Reminder: Invoice #${invoice.invoiceNumber} is past due`,
        text: emailText,
        html: renderEmailHtml(
          `Hi ${contact.name},\n\nJust a friendly reminder that invoice #${invoice.invoiceNumber} for ${invoice.currency.toUpperCase()} ${amountDue.toFixed(
            2
          )} is now past due.`,
          { ctaLabel: "Pay now", ctaUrl: invoice.stripeCheckoutUrl }
        ),
        replyTo: `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`,
      });
      await doc.ref.update({ lastReminderSentAt: FieldValue.serverTimestamp() });
      remindersSent++;
    } catch {
      // Don't let one bad send abort reminders for the rest of the batch.
      continue;
    }
  }

  return NextResponse.json({ ok: true, remindersSent });
}
