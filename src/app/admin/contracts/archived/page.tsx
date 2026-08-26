import Link from "next/link";
import { contractsCol, contactsCol } from "@/lib/firestore-collections";
import { ArchivedContractList } from "./archived-contract-list";

export default async function ArchivedContractsPage() {
  const snap = await contractsCol().orderBy("createdAt", "desc").get();
  const archived = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((contract) => contract.archivedAt);

  const contactIds = Array.from(new Set(archived.map((c) => c.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = archived.map((contract) => {
    const contact = contactsById.get(contract.contactId);
    return {
      id: contract.id,
      title: contract.title,
      contactName: contact?.name ?? "Unknown",
      contactEmail: contact?.email ?? "",
      status: contract.status,
      createdAtIso: contract.createdAt.toDate().toISOString(),
    };
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Archived contracts</h1>
        <Link href="/admin/contracts" className="text-sm text-muted hover:text-foreground">
          Back to contracts
        </Link>
      </div>
      <ArchivedContractList contracts={rows} />
    </div>
  );
}
