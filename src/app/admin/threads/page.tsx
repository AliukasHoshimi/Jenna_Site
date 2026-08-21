import Link from "next/link";
import { threadsCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";

export default async function ThreadsPage() {
  const threadsSnap = await threadsCol().orderBy("lastMessageAt", "desc").get();
  const threads = threadsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const contactIds = Array.from(new Set(threads.map((t) => t.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-foreground">Inbox</h1>
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {threads.length === 0 && <p className="p-4 text-sm text-muted">No conversations yet.</p>}
        {threads.map((thread) => {
          const contact = contactsById.get(thread.contactId);
          return (
            <Link
              key={thread.id}
              href={`/admin/threads/${thread.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{contact?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted">{thread.subject}</p>
              </div>
              <StatusBadge status={thread.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
