import { notFound } from "next/navigation";
import { calendarEventsCol, contactsCol } from "@/lib/firestore-collections";
import { EventEditor } from "./event-editor";

export default async function CalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventSnap = await calendarEventsCol().doc(id).get();
  if (!eventSnap.exists) notFound();
  const event = eventSnap.data()!;
  const contact = event.contactId ? (await contactsCol().doc(event.contactId).get()).data() : null;

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 font-display text-2xl text-foreground">Event</h1>
      {contact && <p className="mb-6 text-sm text-muted">Invited: {contact.name} ({contact.email})</p>}
      <EventEditor
        eventId={id}
        title={event.title}
        description={event.description ?? ""}
        startIso={event.start.toDate().toISOString()}
        endIso={event.end.toDate().toISOString()}
        htmlLink={event.htmlLink}
      />
    </div>
  );
}
