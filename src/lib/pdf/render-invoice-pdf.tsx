import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdf } from "./invoice-pdf";
import type { Invoice, Contact } from "@/types/firestore";

export async function renderInvoicePdf(invoice: Invoice, contact: Contact) {
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
    />
  );
  return renderToBuffer(element);
}
