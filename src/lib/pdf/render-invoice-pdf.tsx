import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "./invoice-pdf";
import type { Invoice, Contact } from "@/types/firestore";

export async function renderInvoicePdf(
  invoice: Invoice,
  contact: Contact,
  depositInfo?: { depositAmount: number; stage: "deposit" | "balance" }
) {
  const element = (
    <InvoicePdf
      invoiceNumber={invoice.invoiceNumber}
      dueDateLabel={invoice.dueDate.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      clientName={contact.name}
      clientEmail={contact.email}
      lineItems={invoice.lineItems}
      amountTotal={invoice.amountTotal}
      currency={invoice.currency}
      checkoutUrl={invoice.stripeCheckoutUrl}
      depositAmount={depositInfo?.depositAmount}
      depositStage={depositInfo?.stage}
    />
  );
  return renderToBuffer(element);
}
