import Link from "next/link";
import { calendarEventsCol, contactsCol, googleCalendarSettingsDoc } from "@/lib/firestore-collections";
import { LocalDateTime } from "@/components/local-date-time";
import { DisconnectButton } from "./disconnect-button";

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

  const snap = await calendarEventsCol().orderBy("start", "asc").get();
  const now = new Date();
  const events = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((e) => e.end.toDate() >= now);

  const contactIds = Array.from(new Set(events.map((e) => e.contactId).filter((id): id is string => !!id)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">Calendar</h1>
          {connected && <p className="mt-1 text-xs text-success">Linked to {settings.connectedEmail}.</p>}
        </div>
        <div className="flex items-center gap-4">
          <DisconnectButton connectedEmail={settings.connectedEmail} />
          <Link
            href="/admin/calendar/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            + New event
          </Link>
        </div>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {events.length === 0 && <p className="p-4 text-sm text-muted">No upcoming events.</p>}
        {events.map((event) => {
          const contact = event.contactId ? contactsById.get(event.contactId) : null;
          return (
            <Link
              key={event.id}
              href={`/admin/calendar/${event.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{event.title}</p>
                <p className="text-xs text-muted">
                  <LocalDateTime iso={event.start.toDate().toISOString()} />
                  {contact ? ` · ${contact.name}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
