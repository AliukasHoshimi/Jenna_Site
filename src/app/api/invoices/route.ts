import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoicesCol } from "@/lib/firestore-collections";
import { nextInvoiceNumber } from "@/lib/invoice-number";

interface LineItemInput {
  description: string;
  amount: number;
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const payload = await request.json();
  const { contactId, threadId, lineItems, dueDate, currency, depositAmount } = payload as {
    contactId: string;
    threadId?: string | null;
    lineItems: LineItemInput[];
    dueDate: string;
    currency?: string;
    depositAmount?: number | null;
  };

  if (!contactId || !Array.isArray(lineItems) || lineItems.length === 0 || !dueDate) {
    return NextResponse.json(
      { error: "contactId, lineItems, and dueDate are required" },
      { status: 400 }
    );
  }
  if (lineItems.some((item) => !item.description || typeof item.amount !== "number" || item.amount <= 0)) {
    return NextResponse.json(
      { error: "Each line item needs a description and a positive amount" },
      { status: 400 }
    );
  }

  const amountTotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  if (depositAmount != null && (depositAmount <= 0 || depositAmount >= amountTotal)) {
    return NextResponse.json(
      { error: "Deposit must be a positive amount less than the total" },
      { status: 400 }
    );
  }
  const invoiceNumber = await nextInvoiceNumber();

  const docRef = await invoicesCol().add({
    contactId,
    threadId: threadId ?? null,
    invoiceNumber,
    lineItems,
    amountTotal,
    currency: currency ?? "usd",
    status: "draft",
    stripeCheckoutSessionId: null,
    stripeCheckoutUrl: null,
    dueDate: Timestamp.fromDate(new Date(dueDate)),
    createdAt: FieldValue.serverTimestamp() as unknown as Timestamp,
    sentAt: null,
    paidAt: null,
    lastReminderSentAt: null,
    depositAmount: depositAmount ?? null,
    depositPaidAt: null,
    depositStripeCheckoutSessionId: null,
  });

  return NextResponse.json({ ok: true, id: docRef.id, invoiceNumber });
}
