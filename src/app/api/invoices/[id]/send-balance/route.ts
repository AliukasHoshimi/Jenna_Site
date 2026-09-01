import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoicesCol, contactsCol, threadsCol, messagesCol } from "@/lib/firestore-collections";
import { stripe } from "@/lib/stripe";
import { sendEmail, replyAddressForToken } from "@/lib/mailgun";
import { renderInvoicePdf } from "@/lib/pdf/render-invoice-pdf";
import { renderEmailHtml } from "@/lib/email-html";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const invoiceRef = invoicesCol().doc(id);
  const invoiceSnap = await invoiceRef.get();
  if (!invoiceSnap.exists) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const invoice = invoiceSnap.data()!;
  if (invoice.status !== "deposit_paid" || invoice.depositAmount == null) {
    return NextResponse.json({ error: "This invoice has no deposit awaiting a balance" }, { status: 400 });
  }

  const contactSnap = await contactsCol().doc(invoice.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const balanceDue = invoice.amountTotal - invoice.depositAmount;

  try {
    const origin = request.nextUrl.origin;
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      customer_email: contact.email,
      line_items: [
        {
          price_data: {
            currency: invoice.currency,
            unit_amount: Math.round(balanceDue * 100),
            product_data: { name: `Balance — Invoice #${invoice.invoiceNumber}` },
          },
          quantity: 1,
        },
      ],
      metadata: { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
      success_url: `${origin}/pay/${id}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pay/${id}/cancelled`,
    });
    const checkoutUrl = session.url;
    const checkoutSessionId = session.id;

    const pdfBuffer = await renderInvoicePdf(
      { ...invoice, stripeCheckoutUrl: checkoutUrl },
      contact,
      { depositAmount: invoice.depositAmount, stage: "balance" }
    );

    let replyTo = `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`;
    if (invoice.threadId) {
      const threadSnap = await threadsCol().doc(invoice.threadId).get();
      const thread = threadSnap.data();
      if (thread) replyTo = replyAddressForToken(thread.replyToken);
    }

    const emailText = `Hi ${contact.name},\n\nThe remaining balance on invoice #${invoice.invoiceNumber} is now due: ${invoice.currency.toUpperCase()} ${balanceDue.toFixed(
      2
    )}. You can pay securely here:\n${checkoutUrl}\n\nThanks,\nJenna`;

    await sendEmail({
      to: contact.email,
      from: `Samsarafilmss Billing <${process.env.MAILGUN_FROM_INVOICES}>`,
      subject: `Balance due: Invoice #${invoice.invoiceNumber} from Samsarafilmss`,
      text: emailText,
      html: renderEmailHtml(
        `Hi ${contact.name},\n\nThe remaining balance on invoice #${invoice.invoiceNumber} is now due: ${invoice.currency.toUpperCase()} ${balanceDue.toFixed(2)}.`,
        { ctaLabel: "Pay balance", ctaUrl: checkoutUrl ?? undefined }
      ),
      replyTo,
      attachment: [{ filename: `invoice-${invoice.invoiceNumber}-balance.pdf`, data: pdfBuffer }],
    });

    await invoiceRef.update({
      status: "sent",
      stripeCheckoutSessionId: checkoutSessionId,
      stripeCheckoutUrl: checkoutUrl,
      lastReminderSentAt: null,
    });

    if (invoice.threadId) {
      await messagesCol(invoice.threadId).add({
        direction: "system",
        body: `Invoice #${invoice.invoiceNumber} — balance invoice sent, ${invoice.currency.toUpperCase()} ${balanceDue.toFixed(2)} due`,
        mailgunMessageId: null,
        createdAt: FieldValue.serverTimestamp(),
        linkHref: `/admin/invoices/${id}`,
      });
      await threadsCol().doc(invoice.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
    }

    return NextResponse.json({ ok: true, checkoutUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send balance invoice" },
      { status: 502 }
    );
  }
}
