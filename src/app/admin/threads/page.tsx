import Link from "next/link";
import { threadsCol, contactsCol } from "@/lib/firestore-collections";
import { ThreadList } from "./thread-list";

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const status = view === "closed" ? "closed" : "open";

  const threadsSnap = await threadsCol()
    .where("status", "==", status)
    .orderBy("lastMessageAt", "desc")
    .get();

  const contactIds = Array.from(new Set(threadsSnap.docs.map((d) => d.data().contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const threads = threadsSnap.docs.map((doc) => {
    const t = doc.data();
    const contact = contactsById.get(t.contactId);
    return {
      id: doc.id,
      subject: t.subject,
      status: t.status,
      needsReply: t.lastMessageDirection === "inbound",
      contactName: contact?.name ?? "Unknown",
      contactEmail: contact?.email ?? "",
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Inbox</h1>
        <div className="flex gap-1 text-sm">
          <Link
            href="/admin/threads"
            className={`rounded-md px-3 py-1.5 ${
              status === "open" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Open
          </Link>
          <Link
            href="/admin/threads?view=closed"
            className={`rounded-md px-3 py-1.5 ${
              status === "closed" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            Closed
          </Link>
        </div>
      </div>
      <ThreadList threads={threads} />
    </div>
  );
}
