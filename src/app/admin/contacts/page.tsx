import Link from "next/link";
import { contactsCol } from "@/lib/firestore-collections";
import { NewContactForm } from "./new-contact-form";

export default async function ContactsPage() {
  const snap = await contactsCol().orderBy("createdAt", "desc").get();
  const contacts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-foreground">Contacts</h1>
      <NewContactForm />
      <div className="mt-6 divide-y divide-border rounded-lg border border-border bg-surface">
        {contacts.length === 0 && <p className="p-4 text-sm text-muted">No contacts yet.</p>}
        {contacts.map((contact) => (
          <Link
            key={contact.id}
            href={`/admin/contacts/${contact.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-background"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{contact.name}</p>
              <p className="text-xs text-muted">{contact.email}</p>
            </div>
            <span className="text-xs text-muted">{contact.source}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
