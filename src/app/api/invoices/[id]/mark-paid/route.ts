import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoicesCol, messagesCol, threadsCol } from "@/lib/firestore-collections";

// For payments that land outside Stripe (cash, check, Venmo, etc). Mirrors
// what the Stripe webhook does on checkout.session.completed.
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
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
  }

  await invoiceRef.update({ status: "paid", paidAt: FieldValue.serverTimestamp() });

  if (invoice.threadId) {
    await messagesCol(invoice.threadId).add({
      direction: "system",
      body: `Invoice #${invoice.invoiceNumber} — paid, ${invoice.currency.toUpperCase()} ${invoice.amountTotal.toFixed(2)} (marked paid manually)`,
      mailgunMessageId: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    await threadsCol().doc(invoice.threadId).update({ lastMessageAt: FieldValue.serverTimestamp() });
  }

  return NextResponse.json({ ok: true });
}
