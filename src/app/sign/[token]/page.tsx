import { contractsCol, contactsCol } from "@/lib/firestore-collections";
import { SignForm } from "./sign-form";

export default async function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const snap = await contractsCol().where("signToken", "==", token).limit(1).get();

  if (snap.empty) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
        <p className="text-sm text-muted">This contract link isn&apos;t valid.</p>
      </main>
    );
  }

  const doc = snap.docs[0];
  const contract = doc.data();
  const contactSnap = await contactsCol().doc(contract.contactId).get();
  const contact = contactSnap.data();

  return (
    <main className="mx-auto min-h-screen max-w-xl px-6 py-12">
      <p className="mb-1 font-display text-lg tracking-wide text-foreground">SAMSARAFILMSS</p>
      <h1 className="mb-6 font-display text-2xl text-foreground">{contract.title}</h1>

      {contract.status === "signed" ? (
        <div className="rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-foreground">
            Signed by {contract.signerName} on{" "}
            {contract.signedAt?.toDate().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      ) : contract.status !== "sent" ? (
        <p className="text-sm text-muted">This contract isn&apos;t ready to be signed yet.</p>
      ) : (
        <>
          <div className="mb-6 whitespace-pre-wrap rounded-lg border border-border bg-surface p-5 text-sm leading-relaxed text-foreground/90">
            {contract.body}
          </div>
          <SignForm token={token} defaultName={contact?.name ?? ""} />
        </>
      )}
    </main>
  );
}
