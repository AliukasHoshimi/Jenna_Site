import { invoicesCol, contactsCol } from "@/lib/firestore-collections";
import { stripe } from "@/lib/stripe";

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  const invoiceSnap = await invoicesCol().doc(id).get();
  const invoice = invoiceSnap.exists ? invoiceSnap.data()! : null;
  const contact = invoice ? (await contactsCol().doc(invoice.contactId).get()).data() : null;

  let amountLabel: string | null = null;
  if (sessionId) {
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid" && session.amount_total != null) {
        amountLabel = `${session.currency?.toUpperCase()} $${(session.amount_total / 100).toFixed(2)}`;
      }
    } catch {
      // Stripe lookup is a nice-to-have for the confirmation copy — the
      // payment already succeeded (that's why we're on this page), so a
      // failed lookup here shouldn't block a paying client from seeing a
      // thank-you page.
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-3 font-display text-3xl text-foreground">Payment received</h1>
      <p className="max-w-sm text-sm text-muted">
        {amountLabel ? `Thanks — your payment of ${amountLabel}` : "Thanks — your payment"}
        {invoice ? ` for invoice #${invoice.invoiceNumber}` : ""} has gone through.
        {contact?.name ? ` We'll be in touch, ${contact.name.split(" ")[0]}.` : " We'll be in touch."}
      </p>
    </main>
  );
}
