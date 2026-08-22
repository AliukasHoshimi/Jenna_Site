import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { contractsCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";
import { LocalDateTime } from "@/components/local-date-time";
import { ContractEditor } from "./contract-editor";
import { SendContractButton } from "./send-contract-button";

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contractSnap = await contractsCol().doc(id).get();
  if (!contractSnap.exists) notFound();
  const contract = contractSnap.data()!;
  const contactSnap = await contactsCol().doc(contract.contactId).get();
  const contact = contactSnap.data();

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const signUrl = `${protocol}://${host}/sign/${contract.signToken}`;

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">{contract.title}</h1>
          <p className="text-sm text-muted">{contact?.name}</p>
        </div>
        <StatusBadge status={contract.status} />
      </div>

      {contract.status === "signed" && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="font-medium text-foreground">
            Signed by {contract.signerName} —{" "}
            {contract.signedAt && <LocalDateTime iso={contract.signedAt.toDate().toISOString()} />}
          </p>
          {contract.signedIp && <p className="mt-1 text-xs text-muted">IP address: {contract.signedIp}</p>}
        </div>
      )}

      {contract.status === "sent" && (
        <div className="mb-6 rounded-lg border border-border bg-surface p-4 text-sm">
          <p className="text-muted">
            Awaiting signature — sent{" "}
            {contract.sentAt && <LocalDateTime iso={contract.sentAt.toDate().toISOString()} />}
          </p>
          <p className="mt-2 break-all text-xs text-muted">
            Signing link: <span className="text-foreground">{signUrl}</span>
          </p>
        </div>
      )}

      <ContractEditor contractId={id} title={contract.title} body={contract.body} />

      {contract.status === "draft" && (
        <div className="mt-4">
          <SendContractButton contractId={id} />
        </div>
      )}
    </div>
  );
}
