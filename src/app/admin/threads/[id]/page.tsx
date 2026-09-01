import Link from "next/link";
import { notFound } from "next/navigation";
import {
  threadsCol,
  messagesCol,
  contactsCol,
  templatesCol,
  calendarEventsCol,
  invoicesCol,
} from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { displayInvoiceStatus } from "@/lib/invoice-status";
import { ReplyComposer } from "./reply-composer";
import { ThreadStatusToggle } from "./thread-status-toggle";
import { PortalLinkButton } from "../../contacts/[id]/portal-link-button";

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadSnap = await threadsCol().doc(id).get();
  if (!threadSnap.exists) notFound();
  const thread = threadSnap.data()!;

  const [messagesSnap, contactSnap, templatesSnap, calendarEventsSnap, invoicesSnap] = await Promise.all([
    messagesCol(id).orderBy("createdAt", "asc").get(),
    contactsCol().doc(thread.contactId).get(),
    templatesCol().orderBy("name", "asc").get(),
    calendarEventsCol().where("contactId", "==", thread.contactId).orderBy("start", "asc").get(),
    invoicesCol().where("threadId", "==", id).orderBy("createdAt", "desc").get(),
  ]);

  const contact = contactSnap.data();
  const hasPriorOutbound = messagesSnap.docs.some((d) => d.data().direction === "outbound");
  const templates = templatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, subject: data.subject, body: data.body };
  });
  const now = new Date();
  const nextEventDoc = calendarEventsSnap.docs.find((d) => d.data().end.toDate() >= now);
  const nextEvent = nextEventDoc && { id: nextEventDoc.id, ...nextEventDoc.data() };
  const invoices = invoicesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((inv) => !inv.archivedAt);

  function formatDue(ts: { toDate(): Date }) {
    return ts.toDate().toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-foreground">{thread.subject}</h1>
          <p className="text-sm text-muted">
            {contact?.name} · {contact?.email}
            {contact?.instagram && (
              <>
                {" · "}
                <a
                  href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent hover:underline"
                >
                  @{contact.instagram.replace(/^@/, "")}
                </a>
              </>
            )}
            {thread.estimatedBudget && ` · Budget: ${thread.estimatedBudget}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={thread.status} />
          <ThreadStatusToggle threadId={id} status={thread.status} />
        </div>
      </div>

      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1">
          <div className="space-y-3">
            {messagesSnap.docs.map((doc) => {
              const message = doc.data();
              if (message.direction === "system") {
                const className =
                  "mx-auto block max-w-md rounded-md bg-surface px-3 py-1.5 text-center text-xs text-muted";
                return message.linkHref ? (
                  <Link key={doc.id} href={message.linkHref} className={`${className} hover:text-accent hover:underline`}>
                    {message.body}
                  </Link>
                ) : (
                  <div key={doc.id} className={className}>
                    {message.body}
                  </div>
                );
              }
              const isOutbound = message.direction === "outbound";
              return (
                <div
                  key={doc.id}
                  className={`max-w-md whitespace-pre-wrap rounded-lg border border-border p-3 text-sm ${
                    isOutbound ? "ml-auto bg-accent/5" : "bg-surface"
                  }`}
                >
                  {message.body}
                </div>
              );
            })}
            {messagesSnap.empty && <p className="text-sm text-muted">No messages yet.</p>}
          </div>

          <div className="mt-6">
            <ReplyComposer
              threadId={id}
              contactId={thread.contactId}
              contactName={contact?.name ?? ""}
              templates={templates}
              defaultStyled={!hasPriorOutbound}
            />
          </div>
        </div>

        <div className="w-64 shrink-0 space-y-4">
          <div className="space-y-2">
            <Link
              href={`/admin/invoices/new?contactId=${thread.contactId}&threadId=${id}`}
              className="block rounded-md border border-border bg-surface px-4 py-2 text-center text-sm hover:border-accent"
            >
              New invoice
            </Link>
            <Link
              href={`/admin/contracts/new?contactId=${thread.contactId}&threadId=${id}`}
              className="block rounded-md border border-border bg-surface px-4 py-2 text-center text-sm hover:border-accent"
            >
              New contract
            </Link>
            <Link
              href={`/admin/questionnaires/new?contactId=${thread.contactId}&threadId=${id}`}
              className="block rounded-md border border-border bg-surface px-4 py-2 text-center text-sm hover:border-accent"
            >
              New questionnaire
            </Link>
            <div className="flex justify-center">
              <PortalLinkButton contactId={thread.contactId} action="open" />
            </div>
          </div>

          {nextEvent && (
            <Link
              href={`/admin/calendar/${nextEvent.id}`}
              className="block rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 hover:bg-accent/20"
            >
              <p className="text-sm font-medium text-accent">{nextEvent.title}</p>
              <p className="text-xs text-accent/80">
                <LocalDateTime iso={nextEvent.start.toDate().toISOString()} />
              </p>
            </Link>
          )}

          <div className="space-y-2">
            {invoices.length === 0 && <p className="text-xs text-muted">No invoice yet.</p>}
            {invoices.map((inv) => {
              const displayStatus = displayInvoiceStatus(inv);
              return (
                <Link
                  key={inv.id}
                  href={`/admin/invoices/${inv.id}`}
                  className="block rounded-lg border border-border bg-surface p-3 hover:border-accent"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">#{inv.invoiceNumber}</p>
                    <StatusBadge status={displayStatus} />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {inv.currency.toUpperCase()} {inv.amountTotal.toFixed(2)}
                  </p>
                  {inv.depositAmount != null ? (
                    <p className="text-xs text-muted">
                      Deposit {inv.depositPaidAt ? "paid" : `due ${formatDue(inv.dueDate)}`}
                      {" · Balance "}
                      {inv.balanceDueDate ? `due ${formatDue(inv.balanceDueDate)}` : "—"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">Due {formatDue(inv.dueDate)}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
