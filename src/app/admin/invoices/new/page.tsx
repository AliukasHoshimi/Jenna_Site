import { contactsCol, invoicesCol } from "@/lib/firestore-collections";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string; duplicateFrom?: string }>;
}) {
  const { contactId, duplicateFrom } = await searchParams;
  const snap = await contactsCol().orderBy("lastActivityAt", "desc").get();
  const contacts = snap.docs.map((d) => ({ id: d.id, name: d.data().name, email: d.data().email }));

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
        defaultContactId={resolvedContactId}
        defaultLineItems={defaultLineItems}
        defaultDepositAmount={defaultDepositAmount}
      />
    </div>
  );
}
