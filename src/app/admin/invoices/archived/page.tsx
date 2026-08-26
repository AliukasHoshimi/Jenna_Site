import Link from "next/link";
import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { ArchivedInvoiceList } from "./archived-invoice-list";

export default async function ArchivedInvoicesPage() {
  const snap = await invoicesCol().orderBy("createdAt", "desc").get();
  const archived = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((invoice) => invoice.archivedAt);

  const contactIds = Array.from(new Set(archived.map((i) => i.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = archived.map((invoice) => {
    const contact = contactsById.get(invoice.contactId);
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: contact?.name ?? "Unknown",
      contactEmail: contact?.email ?? "",
      amountTotal: invoice.amountTotal,
      currency: invoice.currency,
      displayStatus: displayInvoiceStatus(invoice),
      dueDateIso: invoice.dueDate.toDate().toISOString(),
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Archived invoices</h1>
        <Link href="/admin/invoices" className="text-sm text-muted hover:text-foreground">
          Back to invoices
        </Link>
      </div>
      <ArchivedInvoiceList invoices={rows} />
    </div>
  );
}
