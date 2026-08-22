import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { invoicesCol, messagesCol, threadsCol } from "@/lib/firestore-collections";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification needs the raw body — never JSON.parse this first.
  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceSnap = await invoicesCol()
      .where("stripeCheckoutSessionId", "==", session.id)
      .limit(1)
      .get();

    if (!invoiceSnap.empty) {
      const invoiceDoc = invoiceSnap.docs[0];
      const invoice = invoiceDoc.data();

      // A deposit-flow invoice whose deposit hasn't been paid yet: this
      // completed session is the deposit, not the full amount. Otherwise
      // (no deposit, or the deposit's already paid so this must be the
      // balance session) it's the final payment.
      const isDepositPayment = invoice.depositAmount != null && !invoice.depositPaidAt;

      if (isDepositPayment) {
        await invoiceDoc.ref.update({
          status: "deposit_paid",
          depositPaidAt: FieldValue.serverTimestamp(),
          depositStripeCheckoutSessionId: session.id,
        });
        if (invoice.threadId) {
          await messagesCol(invoice.threadId).add({
            direction: "system",
            body: `Invoice #${invoice.invoiceNumber} — deposit paid, ${invoice.currency.toUpperCase()} ${invoice.depositAmount!.toFixed(2)} (balance due later)`,
            mailgunMessageId: null,
            createdAt: FieldValue.serverTimestamp(),
          });
          await threadsCol().doc(invoice.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
        }
      } else {
        const amountPaid = invoice.depositAmount != null ? invoice.amountTotal - invoice.depositAmount : invoice.amountTotal;
        await invoiceDoc.ref.update({ status: "paid", paidAt: FieldValue.serverTimestamp() });
        if (invoice.threadId) {
          await messagesCol(invoice.threadId).add({
            direction: "system",
            body: `Invoice #${invoice.invoiceNumber} — paid, ${invoice.currency.toUpperCase()} ${amountPaid.toFixed(2)}`,
            mailgunMessageId: null,
            createdAt: FieldValue.serverTimestamp(),
          });
          await threadsCol().doc(invoice.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
