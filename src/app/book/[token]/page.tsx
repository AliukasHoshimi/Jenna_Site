import { threadsCol, contactsCol } from "@/lib/firestore-collections";
import { BookingPicker } from "./booking-picker";

export default async function BookPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await threadsCol().where("bookingToken", "==", token).limit(1).get();

  if (snap.empty) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
        <p className="text-sm text-muted">This booking link isn&apos;t valid.</p>
      </main>
    );
  }

  const thread = snap.docs[0].data();
  const contactSnap = await contactsCol().doc(thread.contactId).get();
  const contact = contactSnap.data();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-12">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-1 font-display text-2xl text-foreground">Book a session</h1>
      {contact && <p className="mb-6 text-sm text-muted">for {contact.name}</p>}
      <BookingPicker token={token} />
    </main>
  );
}
