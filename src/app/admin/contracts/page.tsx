import Link from "next/link";
import { contractsCol, contactsCol } from "@/lib/firestore-collections";
import { StatusBadge } from "@/components/status-badge";

export default async function ContractsPage() {
  const snap = await contractsCol().orderBy("createdAt", "desc").get();
  const contracts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const contactIds = Array.from(new Set(contracts.map((c) => c.contactId)));
  const contactDocs = await Promise.all(contactIds.map((id) => contactsCol().doc(id).get()));
  const contactsById = new Map(contactDocs.filter((d) => d.exists).map((d) => [d.id, d.data()!]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Contracts</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/contract-templates" className="text-sm text-muted hover:text-foreground">
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
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {contracts.length === 0 && <p className="p-4 text-sm text-muted">No contracts yet.</p>}
        {contracts.map((contract) => {
          const contact = contactsById.get(contract.contactId);
          return (
            <Link
              key={contract.id}
              href={`/admin/contracts/${contract.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-background"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{contract.title}</p>
                <p className="text-xs text-muted">{contact?.name ?? "Unknown"}</p>
              </div>
              <StatusBadge status={contract.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
