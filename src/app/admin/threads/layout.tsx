import { threadsCol, contactsCol } from "@/lib/firestore-collections";
import { ThreadList } from "./thread-list";

export default async function ThreadsLayout({ children }: { children: React.ReactNode }) {
  const threadsSnap = await threadsCol().orderBy("lastMessageAt", "desc").get();

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
    <div className="flex gap-6">
      <div className="w-80 shrink-0">
        <h1 className="mb-4 font-display text-2xl text-foreground">Inbox</h1>
        <ThreadList threads={threads} />
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
