import Link from "next/link";
import { notFound } from "next/navigation";
import { contactsCol, threadsCol, invoicesCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { NewThreadForm } from "./new-thread-form";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contactSnap = await contactsCol().doc(id).get();
  if (!contactSnap.exists) notFound();
  const contact = contactSnap.data()!;

  const [threadsSnap, invoicesSnap] = await Promise.all([
    threadsCol().where("contactId", "==", id).orderBy("lastMessageAt", "desc").get(),
    invoicesCol().where("contactId", "==", id).orderBy("createdAt", "desc").get(),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-foreground">{contact.name}</h1>
      <p className="mb-1 text-sm text-muted">{contact.email}</p>
      {contact.phone && <p className="text-sm text-muted">{contact.phone}</p>}
      {contact.instagram && <p className="text-sm text-muted">@{contact.instagram}</p>}

      <div className="mt-6 flex gap-2">
        <Link
          href={`/admin/invoices/new?contactId=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          New invoice
        </Link>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Threads</h2>
        <NewThreadForm contactId={id} />
        <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
          {threadsSnap.empty && <p className="p-4 text-sm text-muted">No threads yet.</p>}
          {threadsSnap.docs.map((doc) => {
            const thread = doc.data();
            return (
              <Link
                key={doc.id}
                href={`/admin/threads/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">{thread.subject}</span>
                <StatusBadge status={thread.status} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Invoices</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {invoicesSnap.empty && <p className="p-4 text-sm text-muted">No invoices yet.</p>}
          {invoicesSnap.docs.map((doc) => {
            const invoice = doc.data();
            return (
              <Link
                key={doc.id}
                href={`/admin/invoices/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">#{invoice.invoiceNumber}</span>
                <StatusBadge status={invoice.status} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
