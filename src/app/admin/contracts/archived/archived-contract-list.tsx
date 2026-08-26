"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

interface ArchivedContractRow {
  id: string;
  title: string;
  contactName: string;
  contactEmail: string;
  status: string;
  createdAtIso: string;
}

export function ArchivedContractList({ contracts }: { contracts: ArchivedContractRow[] }) {
  const router = useRouter();
  const [contactQuery, setContactQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState(false);

  const rows = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    let filtered = contracts.filter((contract) => {
      const matchesContact =
        !q || contract.contactName.toLowerCase().includes(q) || contract.contactEmail.toLowerCase().includes(q);
      const matchesDate = !dateFilter || contract.createdAtIso.slice(0, 10) === dateFilter;
      return matchesContact && matchesDate;
    });
    filtered = filtered.sort((a, b) => {
      const diff = new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
      return sortDir === "asc" ? diff : -diff;
    });
    return filtered;
  }, [contracts, contactQuery, dateFilter, sortDir]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleRestore() {
    setRestoring(true);
    await fetch("/api/contracts/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), archived: false }),
    });
    setSelected(new Set());
    setRestoring(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={contactQuery}
          onChange={(e) => setContactQuery(e.target.value)}
          placeholder="Search by contact name or email…"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter("")} className="text-xs text-muted hover:text-foreground">
            Clear date
          </button>
        )}
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm hover:border-accent"
        >
          Created: {sortDir === "desc" ? "newest first" : "oldest first"}
        </button>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2">
          <p className="text-sm text-muted">{selected.size} selected</p>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent disabled:opacity-60"
          >
            {restoring ? "Restoring…" : "Restore selected"}
          </button>
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.length === 0 && (
          <p className="p-4 text-sm text-muted">{contracts.length === 0 ? "No archived contracts." : "No matches."}</p>
        )}
        {rows.map((contract) => (
          <div key={contract.id} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
            <input
              type="checkbox"
              checked={selected.has(contract.id)}
              onChange={() => toggle(contract.id)}
              className="h-4 w-4 shrink-0 accent-accent"
            />
            <Link href={`/admin/contracts/${contract.id}`} className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{contract.title}</p>
                <p className="text-xs text-muted">
                  {contract.contactName} · Created{" "}
                  {new Date(contract.createdAtIso).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge status={contract.status} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
