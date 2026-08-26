import Link from "next/link";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { InvoiceList } from "./invoice-list";

export default async function InvoicesPage() {
  const snap = await invoicesCol().orderBy("createdAt", "desc").get();
  const invoices = snap.docs
    .map((d) => ({ id: d.id, ...d.data(), displayStatus: displayInvoiceStatus(d.data()) }))
    .filter((invoice) => !invoice.archivedAt)
    .sort((a, b) => {
      const priority = (s: string) => (s === "balance_due" || s === "overdue" ? 0 : 1);
      return priority(a.displayStatus) - priority(b.displayStatus);
    });
  const contactIds = Array.from(new Set(invoices.map((i) => i.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = invoices.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    contactName: contactsById.get(invoice.contactId)?.name ?? "Unknown",
    amountTotal: invoice.amountTotal,
    currency: invoice.currency,
    displayStatus: invoice.displayStatus,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Invoices</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices/archived" className="text-sm text-muted hover:text-foreground">
            Archived
          </Link>
          <Link
            href="/admin/invoices/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            + New invoice
          </Link>
        </div>
      </div>
      <InvoiceList invoices={rows} />
    </div>
  );
}
