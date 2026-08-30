import { contactsCol } from "@/lib/firestore-collections";
import { NewEventForm } from "./new-event-form";

export default async function NewCalendarEventPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; threadId?: string }>;
}) {
  const { contactId, threadId } = await searchParams;
  const snap = await contactsCol().orderBy("lastActivityAt", "desc").get();
  const contacts = snap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">New event</h1>
      <NewEventForm contacts={contacts} defaultContactId={contactId} defaultThreadId={threadId} />
    </div>
  );
}
