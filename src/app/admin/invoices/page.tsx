import Link from "next/link";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { displayInvoiceStatus } from "@/lib/invoice-status";

export default async function InvoicesPage() {
  const snap = await invoicesCol().orderBy("createdAt", "desc").get();
  const invoices = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const contactIds = Array.from(new Set(invoices.map((i) => i.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Invoices</h1>
        <Link
          href="/admin/invoices/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
        >
          + New invoice
        </Link>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {invoices.length === 0 && <p className="p-4 text-sm text-muted">No invoices yet.</p>}
        {invoices.map((invoice) => {
          const contact = contactsById.get(invoice.contactId);
          return (
            <Link
              key={invoice.id}
              href={`/admin/invoices/${invoice.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  #{invoice.invoiceNumber} · {contact?.name ?? "Unknown"}
                </p>
                <p className="text-xs text-muted">
                  {invoice.currency.toUpperCase()} {invoice.amountTotal.toFixed(2)}
                </p>
              </div>
              <StatusBadge status={displayInvoiceStatus(invoice)} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
