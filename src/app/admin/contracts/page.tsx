import Link from "next/link";
import { contractsCol, contactsCol } from "@/lib/firestore-collections";
import { ContractList } from "./contract-list";

export default async function ContractsPage() {
  const snap = await contractsCol().orderBy("createdAt", "desc").get();
  const contracts = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((contract) => !contract.archivedAt);
  const contactIds = Array.from(new Set(contracts.map((c) => c.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  const rows = contracts.map((contract) => ({
    id: contract.id,
    title: contract.title,
    contactName: contactsById.get(contract.contactId)?.name ?? "Unknown",
    status: contract.status,
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Contracts</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/contracts/archived" className="text-sm text-muted hover:text-foreground">
            Archived
          </Link>
          <Link href="/admin/templates?tab=contracts" className="text-sm text-muted hover:text-foreground">
            Manage templates
          </Link>
          <Link
            href="/admin/contracts/new"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast"
          >
            + New contract
          </Link>
        </div>
      </div>
      <ContractList contracts={rows} />
    </div>
  );
}
