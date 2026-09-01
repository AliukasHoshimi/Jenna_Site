import Link from "next/link";
import {
  contactsCol,
  invoicesCol,
  contractsCol,
  questionnairesCol,
  calendarEventsCol,
  bookingRequestsCol,
} from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { displayInvoiceStatus } from "@/lib/invoice-status";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contactSnap = await contactsCol().where("portalToken", "==", token).limit(1).get();

  if (contactSnap.empty) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
        <p className="text-sm text-muted">This link isn&apos;t valid.</p>
      </main>
    );
  }

  const contactDoc = contactSnap.docs[0];
  const contact = contactDoc.data();
  const contactId = contactDoc.id;
  const now = new Date();

  const [invoicesSnap, contractsSnap, questionnairesSnap, eventsSnap, requestsSnap] = await Promise.all([
    invoicesCol().where("contactId", "==", contactId).orderBy("createdAt", "desc").get(),
    contractsCol().where("contactId", "==", contactId).orderBy("createdAt", "desc").get(),
    questionnairesCol().where("contactId", "==", contactId).orderBy("createdAt", "desc").get(),
    calendarEventsCol().where("contactId", "==", contactId).orderBy("start", "asc").get(),
    bookingRequestsCol().where("contactId", "==", contactId).get(),
  ]);

  const invoices = invoicesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((i) => i.status !== "draft" && !i.archivedAt);
  const contracts = contractsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.status !== "draft" && !c.archivedAt);
  const questionnaires = questionnairesSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((q) => q.status !== "draft" && !q.archivedAt);
  const upcomingEvents = eventsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((e) => e.end.toDate() >= now);
  const pendingRequests = requestsSnap.docs
    .map((d) => d.data())
    .filter((r) => r.status === "pending" && r.expiresAt.toDate() > now);

  const hasNothing =
    invoices.length === 0 &&
    contracts.length === 0 &&
    questionnaires.length === 0 &&
    upcomingEvents.length === 0 &&
    pendingRequests.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-12">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-6 font-display text-2xl text-foreground">Hi {contact.name}</h1>

      {hasNothing && <p className="text-sm text-muted">Nothing here yet — check back after your next booking.</p>}

      {(upcomingEvents.length > 0 || pendingRequests.length > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Upcoming sessions</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {upcomingEvents.map((e) => (
              <div key={e.id} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{e.title}</p>
                <p className="text-xs text-muted">
                  <LocalDateTime iso={e.start.toDate().toISOString()} />
                </p>
              </div>
            ))}
            {pendingRequests.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <p className="text-sm font-medium text-foreground">{r.sessionTypeName}</p>
                <p className="text-xs text-muted">
                  <LocalDateTime iso={r.requestedStart.toDate().toISOString()} /> ·{" "}
                  <span className="text-warm">Awaiting confirmation</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {invoices.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Invoices</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {invoices.map((inv) => {
              const displayStatus = displayInvoiceStatus(inv);
              const canPay = inv.status === "sent" && inv.stripeCheckoutUrl;
              return (
                <div key={inv.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Invoice #{inv.invoiceNumber} — {inv.currency.toUpperCase()} {inv.amountTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted">
                      Due {inv.dueDate.toDate().toLocaleDateString("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={displayStatus} />
                    {canPay && (
                      <a
                        href={inv.stripeCheckoutUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-contrast"
                      >
                        Pay now
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {contracts.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Contracts</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {contracts.map((c) => (
              <Link
                key={c.id}
                href={`/sign/${c.signToken}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">{c.title}</span>
                <StatusBadge status={c.status} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {questionnaires.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Questionnaires</h2>
          <div className="divide-y divide-border rounded-lg border border-border bg-surface">
            {questionnaires.map((q) => (
              <Link
                key={q.id}
                href={`/respond/${q.respondToken}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-background"
              >
                <span className="text-sm text-foreground">{q.title}</span>
                <StatusBadge status={q.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
