import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { renderInvoicePdf } from "@/lib/pdf/render-invoice-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAuth();
  if (!user) return response;

  const { id } = await params;
  const invoiceSnap = await invoicesCol().doc(id).get();
  if (!invoiceSnap.exists) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  const invoice = invoiceSnap.data()!;
  const contactSnap = await contactsCol().doc(invoice.contactId).get();
  const contact = contactSnap.data();
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const depositInfo: { depositAmount: number; stage: "deposit" | "balance" } | undefined =
    invoice.depositAmount != null
      ? { depositAmount: invoice.depositAmount, stage: invoice.depositPaidAt ? "balance" : "deposit" }
      : undefined;
  const pdfBuffer = await renderInvoicePdf(invoice, contact, depositInfo);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    },
  });
}
