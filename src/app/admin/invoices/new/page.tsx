import { contactsCol, invoicesCol, invoiceLineItemPresetsCol } from "@/lib/firestore-collections";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; duplicateFrom?: string }>;
}) {
  const { contactId, duplicateFrom } = await searchParams;
  const [snap, presetsSnap] = await Promise.all([
    contactsCol().orderBy("lastActivityAt", "desc").get(),
    invoiceLineItemPresetsCol().orderBy("group", "asc").orderBy("description", "asc").get(),
  ]);
  const contacts = snap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));
  const presets = presetsSnap.docs.map((d) => ({ group: d.data().group, description: d.data().description }));

  let defaultLineItems: { description: string; amount: string }[] | undefined;
  let defaultDepositAmount: string | undefined;
  let resolvedContactId = contactId;
  if (duplicateFrom) {
    const sourceSnap = await invoicesCol().doc(duplicateFrom).get();
    const source = sourceSnap.data();
    if (source) {
      defaultLineItems = source.lineItems.map((item) => ({
        description: item.description,
        amount: String(item.amount),
      }));
      defaultDepositAmount = source.depositAmount != null ? String(source.depositAmount) : undefined;
      resolvedContactId = resolvedContactId ?? source.contactId;
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 font-display text-2xl text-foreground">New invoice</h1>
      <NewInvoiceForm
        contacts={contacts}
        presets={presets}
        defaultContactId={resolvedContactId}
        defaultLineItems={defaultLineItems}
        defaultDepositAmount={defaultDepositAmount}
      />
    </div>
  );
}
