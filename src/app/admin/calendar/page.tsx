import Link from "next/link";
import { calendarEventsCol, contactsCol, googleCalendarSettingsDoc, bookingRequestsCol } from "@/lib/firestore-collections";
import { DisconnectButton } from "./disconnect-button";
import { CalendarGrid } from "./calendar-grid";
import { PendingRequestsPanel } from "./pending-requests-panel";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const { connected, error } = await searchParams;
  const settingsSnap = await googleCalendarSettingsDoc().get();
  const settings = settingsSnap.data();

  if (!settings) {
    return (
      <div className="max-w-xl">
        <h1 className="mb-6 font-display text-2xl text-foreground">Calendar</h1>
        {error && (
          <p className="mb-4 text-sm text-warm">Couldn&apos;t link Google Calendar. Try again.</p>
        )}
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="mb-4 text-sm text-muted">
            Link Jenna&apos;s Google Calendar to schedule shoots and view upcoming events here.
          </p>
          <a
            href="/api/google-calendar/connect"
            className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            Link Google Calendar
          </a>
        </div>
      </div>
    );
  }

  const [snap, pendingSnap] = await Promise.all([
    calendarEventsCol().orderBy("start", "asc").get(),
    bookingRequestsCol().where("status", "==", "pending").orderBy("requestedStart", "asc").get(),
  ]);
  const events = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      googleEventId: data.googleEventId,
      title: data.title,
      contactId: data.contactId,
      start: data.start.toDate().toISOString(),
      end: data.end.toDate().toISOString(),
    };
  });
  // Expired-but-unflipped requests (the cron hasn't caught up yet) aren't
  // real pending decisions anymore — hide them here too, matching how the
  // availability engine already treats them as non-blocking.
  const now = Date.now();
  const pendingRequests = pendingSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => r.expiresAt.toDate().getTime() > now);

  const contactIds = Array.from(
    new Set([
      ...events.map((e) => e.contactId),
      ...pendingRequests.map((r) => r.contactId),
    ].filter((id): id is string => !!id))
  );
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = Object.fromEntries(
    contactDocs.filter((d) => d.exists).map((d) => [d.id, { name: d.data()!.name }])
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Calendar</h1>
          {connected && <p className="mt-1 text-xs text-success">Linked to {settings.connectedEmail}.</p>}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/calendar/settings" className="text-xs text-muted hover:text-foreground">
            Booking settings
          </Link>
          <DisconnectButton connectedEmail={settings.connectedEmail} />
          <Link
            href="/admin/calendar/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            + New event
          </Link>
        </div>
      </div>
      {pendingRequests.length > 0 && (
        <PendingRequestsPanel
          requests={pendingRequests.map((r) => ({
            id: r.id,
            contactName: contactsById[r.contactId]?.name ?? "Unknown client",
            threadId: r.threadId,
            sessionTypeName: r.sessionTypeName,
            startIso: r.requestedStart.toDate().toISOString(),
            endIso: r.requestedEnd.toDate().toISOString(),
            clientNote: r.clientNote,
          }))}
        />
      )}
      <CalendarGrid
        events={events}
        pendingRequests={pendingRequests.map((r) => ({
          id: r.id,
          sessionTypeName: r.sessionTypeName,
          contactId: r.contactId,
          contactName: contactsById[r.contactId]?.name ?? "Unknown client",
          threadId: r.threadId,
          start: r.requestedStart.toDate().toISOString(),
          end: r.requestedEnd.toDate().toISOString(),
          clientNote: r.clientNote,
        }))}
        contactsById={contactsById}
      />
    </div>
  );
}
