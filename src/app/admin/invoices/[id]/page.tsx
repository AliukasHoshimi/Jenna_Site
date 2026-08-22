import Link from "next/link";
import { notFound } from "next/navigation";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { SendInvoiceButton } from "./send-invoice-button";
import { MarkPaidButton } from "./mark-paid-button";
import { SendBalanceButton } from "./send-balance-button";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoiceSnap = await invoicesCol().doc(id).get();
  if (!invoiceSnap.exists) notFound();
  const invoice = invoiceSnap.data()!;
  const contactSnap = await contactsCol().doc(invoice.contactId).get();
  const contact = contactSnap.data();
  const status = displayInvoiceStatus(invoice);

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Invoice #{invoice.invoiceNumber}</h1>
        <StatusBadge status={status} />
      </div>

      <p className="mb-1 text-sm text-muted">
        {contact?.name} · {contact?.email}
      </p>
      <p className="mb-6 text-sm text-muted">
        Due{" "}
        {invoice.dueDate.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC",
        })}
      </p>

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {invoice.lineItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">{item.description}</span>
            <span className="text-sm text-foreground">${item.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-sm font-medium text-foreground">
            {invoice.currency.toUpperCase()} ${invoice.amountTotal.toFixed(2)}
          </span>
        </div>
        {invoice.depositAmount != null && (
          <>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-muted">{invoice.depositPaidAt ? "Deposit paid" : "Deposit due"}</span>
              <span className="text-sm text-muted">
                {invoice.currency.toUpperCase()} ${invoice.depositAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-foreground">Balance</span>
              <span className="text-sm text-foreground">
                {invoice.currency.toUpperCase()} ${(invoice.amountTotal - invoice.depositAmount).toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <a
          href={`/api/invoices/${id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          View PDF
        </a>
        <Link
          href={`/admin/invoices/new?duplicateFrom=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          Duplicate
        </Link>
        {invoice.stripeCheckoutUrl && (
          <a
            href={invoice.stripeCheckoutUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
          >
            Payment link
          </a>
        )}
        {invoice.status === "draft" && <SendInvoiceButton invoiceId={id} />}
        {invoice.status === "sent" && <MarkPaidButton invoiceId={id} />}
        {invoice.status === "deposit_paid" && (
          <>
            <SendBalanceButton invoiceId={id} />
            <MarkPaidButton invoiceId={id} />
          </>
        )}
      </div>
    </div>
  );
}
