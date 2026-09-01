import Link from "next/link";
import { notFound } from "next/navigation";
import {
  contactsCol,
  threadsCol,
  invoicesCol,
  contractsCol,
  questionnairesCol,
  calendarEventsCol,
} from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { NewThreadForm } from "./new-thread-form";
import { ContactHeader } from "./contact-header";
import { PortalLinkButton } from "./portal-link-button";

export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contactSnap = await contactsCol().doc(id).get();
  if (!contactSnap.exists) notFound();
  const contact = contactSnap.data()!;

  const [threadsSnap, invoicesSnap, contractsSnap, questionnairesSnap, calendarEventsSnap] = await Promise.all([
    threadsCol().where("contactId", "==", id).orderBy("lastMessageAt", "desc").get(),
    invoicesCol().where("contactId", "==", id).orderBy("createdAt", "desc").get(),
    contractsCol().where("contactId", "==", id).orderBy("createdAt", "desc").get(),
    questionnairesCol().where("contactId", "==", id).orderBy("createdAt", "desc").get(),
    calendarEventsCol().where("contactId", "==", id).orderBy("start", "asc").get(),
  ]);

  const now = new Date();
  const allEvents = calendarEventsSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, title: data.title, startIso: data.start.toDate().toISOString(), isPast: data.end.toDate() < now };
  });
  // Soonest upcoming first, then most-recent past — more useful at a glance
  // than strict chronological order, which would bury "what's next" behind
  // every past shoot.
  const scheduledEvents = [...allEvents.filter((e) => !e.isPast), ...allEvents.filter((e) => e.isPast).reverse()];

  return (
    <div className="max-w-2xl">
      <ContactHeader
        contact={{
          id,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          instagram: contact.instagram,
          source: contact.source,
          bookingStage: contact.bookingStage ?? "inquiry",
        }}
      />

      <div className="mt-6 flex gap-2">
        <Link
          href={`/admin/calendar/new?contactId=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          New event
        </Link>
        <Link
          href={`/admin/invoices/new?contactId=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          New invoice
        </Link>
        <Link
          href={`/admin/contracts/new?contactId=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          New contract
        </Link>
        <Link
          href={`/admin/questionnaires/new?contactId=${id}`}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
        >
          New questionnaire
        </Link>
        <PortalLinkButton contactId={id} />
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
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Scheduled</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {scheduledEvents.length === 0 && <p className="p-4 text-sm text-muted">Nothing scheduled yet.</p>}
          {scheduledEvents.map((event) => (
            <Link
              key={event.id}
              href={`/admin/calendar/${event.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted">
                  <LocalDateTime iso={event.startIso} />
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  event.isPast ? "bg-muted/10 text-muted" : "bg-accent/10 text-accent"
                }`}
              >
                {event.isPast ? "Past" : "Upcoming"}
              </span>
            </Link>
          ))}
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

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Contracts</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {contractsSnap.empty && <p className="p-4 text-sm text-muted">No contracts yet.</p>}
          {contractsSnap.docs.map((doc) => {
            const contract = doc.data();
            return (
              <Link
                key={doc.id}
                href={`/admin/contracts/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">{contract.title}</span>
                <StatusBadge status={contract.status} />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Questionnaires</h2>
        <div className="divide-y divide-border rounded-lg border border-border bg-surface">
          {questionnairesSnap.empty && <p className="p-4 text-sm text-muted">No questionnaires yet.</p>}
          {questionnairesSnap.docs.map((doc) => {
            const q = doc.data();
            return (
              <Link
                key={doc.id}
                href={`/admin/questionnaires/${doc.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">{q.title}</span>
                <StatusBadge status={q.status} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
