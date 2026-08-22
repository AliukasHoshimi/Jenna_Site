import { contactsCol } from "@/lib/firestore-collections";
import { NewContactForm } from "./new-contact-form";
import { ContactList } from "./contact-list";

export default async function ContactsPage() {
  const snap = await contactsCol().orderBy("createdAt", "desc").get();
  const contacts = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      instagram: data.instagram,
      source: data.source,
      bookingStage: data.bookingStage ?? "inquiry",
    };
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl text-foreground">Contacts</h1>
      <NewContactForm />
      <div className="mt-6">
        <ContactList contacts={contacts} />
      </div>
    </div>
  );
}
