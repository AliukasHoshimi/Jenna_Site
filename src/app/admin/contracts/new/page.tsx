import { contactsCol, contractTemplatesCol } from "@/lib/firestore-collections";
import { NewContractForm } from "./new-contract-form";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; threadId?: string }>;
}) {
  const { contactId, threadId } = await searchParams;
  const [contactsSnap, templatesSnap] = await Promise.all([
    contactsCol().orderBy("lastActivityAt", "desc").get(),
    contractTemplatesCol().orderBy("name", "asc").get(),
  ]);

  const contacts = contactsSnap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));
  const templates = templatesSnap.docs.map((d) => {
    const data = d.data();
    return { id: d.id, name: data.name, title: data.title, body: data.body };
  });

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">New contract</h1>
      <NewContractForm
        contacts={contacts}
        templates={templates}
        defaultContactId={contactId}
        defaultThreadId={threadId}
      />
    </div>
  );
}
