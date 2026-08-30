import Link from "next/link";
import { notFound } from "next/navigation";
import { threadsCol, messagesCol, contactsCol, templatesCol, calendarEventsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { ReplyComposer } from "./reply-composer";
import { ThreadStatusToggle } from "./thread-status-toggle";

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const threadSnap = await threadsCol().doc(id).get();
  if (!threadSnap.exists) notFound();
  const thread = threadSnap.data()!;

  const [messagesSnap, contactSnap, templatesSnap, calendarEventsSnap] = await Promise.all([
    messagesCol(id).orderBy("createdAt", "asc").get(),
    contactsCol().doc(thread.contactId).get(),
    templatesCol().orderBy("name", "asc").get(),
    calendarEventsCol().where("contactId", "==", thread.contactId).orderBy("start", "asc").get(),
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl text-foreground">{thread.subject}</h1>
          <p className="text-sm text-muted">
            {contact?.name} · {contact?.email}
          </p>
          {nextEvent && (
            <Link
              href={`/admin/calendar/${nextEvent.id}`}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
            >
              {nextEvent.title} · <LocalDateTime iso={nextEvent.start.toDate().toISOString()} />
            </Link>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={thread.status} />
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/invoices/new?contactId=${thread.contactId}`}
              className="text-xs text-accent hover:underline"
            >
              New invoice
            </Link>
            <Link
              href={`/admin/contracts/new?contactId=${thread.contactId}&threadId=${id}`}
              className="text-xs text-accent hover:underline"
            >
              New contract
            </Link>
            <Link
              href={`/admin/questionnaires/new?contactId=${thread.contactId}&threadId=${id}`}
              className="text-xs text-accent hover:underline"
            >
              New questionnaire
            </Link>
            <ThreadStatusToggle threadId={id} status={thread.status} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {messagesSnap.docs.map((doc) => {
          const message = doc.data();
          if (message.direction === "system") {
            return (
              <div
                key={doc.id}
                className="mx-auto max-w-md rounded-md bg-surface px-3 py-1.5 text-center text-xs text-muted"
              >
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
  );
}
