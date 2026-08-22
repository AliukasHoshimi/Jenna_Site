import { contactsCol } from "@/lib/firestore-collections";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>;
}) {
  const { contactId } = await searchParams;
  const snap = await contactsCol().orderBy("lastActivityAt", "desc").get();
  const contacts = snap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">New invoice</h1>
      <NewInvoiceForm contacts={contacts} defaultContactId={contactId} />
    </div>
  );
}
