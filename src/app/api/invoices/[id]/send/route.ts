import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoicesCol, contactsCol, threadsCol } from "@/lib/firestore-collections";
import { stripe } from "@/lib/stripe";
import { sendEmail, replyAddressForToken } from "@/lib/mailgun";
import { renderInvoicePdf } from "@/lib/pdf/render-invoice-pdf";
import { renderEmailHtml } from "@/lib/email-html";

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

  const contactSnap = await contactsCol().doc(invoice.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  let checkoutUrl = invoice.stripeCheckoutUrl;
  let checkoutSessionId = invoice.stripeCheckoutSessionId;
  const isDeposit = invoice.depositAmount != null;
  const amountDue = isDeposit ? invoice.depositAmount! : invoice.amountTotal;

  try {
    if (!checkoutSessionId) {
      const origin = request.nextUrl.origin;
      const session = await stripe().checkout.sessions.create({
        mode: "payment",
        customer_email: contact.email,
        line_items: isDeposit
          ? [
              {
                price_data: {
                  currency: invoice.currency,
                  unit_amount: Math.round(amountDue * 100),
                  product_data: { name: `Deposit — Invoice #${invoice.invoiceNumber}` },
                },
                quantity: 1,
              },
            ]
          : invoice.lineItems.map((item) => ({
              price_data: {
                currency: invoice.currency,
                unit_amount: Math.round(item.amount * 100),
                product_data: { name: item.description },
              },
              quantity: 1,
            })),
        metadata: { invoiceId: id, invoiceNumber: invoice.invoiceNumber },
        success_url: `${origin}/admin/invoices/${id}?paid=1`,
        cancel_url: `${origin}/admin/invoices/${id}`,
      });
      checkoutUrl = session.url;
      checkoutSessionId = session.id;
    }

    const pdfBuffer = await renderInvoicePdf(
      { ...invoice, stripeCheckoutUrl: checkoutUrl },
      contact,
      isDeposit ? { depositAmount: amountDue, stage: "deposit" } : undefined
    );

    // If this invoice is tied to a thread, route replies back into that
    // conversation instead of a generic address.
    let replyTo = `Jenna | Samsarafilmss <${process.env.MAILGUN_FROM_REPLIES}>`;
    if (invoice.threadId) {
      const threadSnap = await threadsCol().doc(invoice.threadId).get();
      const thread = threadSnap.data();
      if (thread) replyTo = replyAddressForToken(thread.replyToken);
    }

    const amountLabel = isDeposit
      ? `a deposit of ${invoice.currency.toUpperCase()} ${amountDue.toFixed(2)} (total ${invoice.currency.toUpperCase()} ${invoice.amountTotal.toFixed(2)}, balance due later)`
      : `${invoice.currency.toUpperCase()} ${invoice.amountTotal.toFixed(2)}`;
    const emailText = `Hi ${contact.name},\n\nYour invoice #${invoice.invoiceNumber} is attached — ${amountLabel} is due now. You can pay securely here:\n${checkoutUrl}\n\nThanks,\nJenna`;

    await sendEmail({
      to: contact.email,
      from: `Samsarafilmss Billing <${process.env.MAILGUN_FROM_INVOICES}>`,
      subject: `Invoice #${invoice.invoiceNumber} from Samsarafilmss`,
      text: emailText,
      html: renderEmailHtml(`Hi ${contact.name},\n\nYour invoice #${invoice.invoiceNumber} is attached — ${amountLabel} is due now.`, {
        ctaLabel: "Pay now",
        ctaUrl: checkoutUrl ?? undefined,
      }),
      replyTo,
      attachment: [{ filename: `invoice-${invoice.invoiceNumber}.pdf`, data: pdfBuffer }],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not send invoice" },
      { status: 502 }
    );
  }

  await invoiceRef.update({
    status: "sent",
    stripeCheckoutSessionId: checkoutSessionId,
    stripeCheckoutUrl: checkoutUrl,
    sentAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, checkoutUrl });
}
