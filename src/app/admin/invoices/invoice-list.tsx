"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  contactName: string;
  amountTotal: number;
  currency: string;
  displayStatus: string;
}

export function InvoiceList({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archiving, setArchiving] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleArchive() {
    setArchiving(true);
    await fetch("/api/invoices/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), archived: true }),
    });
    setSelected(new Set());
    setArchiving(false);
    router.refresh();
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface px-4 py-2">
          <p className="text-sm text-muted">{selected.size} selected</p>
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-accent disabled:opacity-60"
          >
            {archiving ? "Archiving…" : "Archive selected"}
          </button>
        </div>
      )}
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {invoices.length === 0 && <p className="p-4 text-sm text-muted">No invoices yet.</p>}
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center gap-3 px-4 py-3 hover:bg-background">
            <input
              type="checkbox"
              checked={selected.has(invoice.id)}
              onChange={() => toggle(invoice.id)}
              className="h-4 w-4 shrink-0 accent-accent"
            />
            <Link href={`/admin/invoices/${invoice.id}`} className="flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  #{invoice.invoiceNumber} · {invoice.contactName}
                </p>
                <p className="text-xs text-muted">
                  {invoice.currency.toUpperCase()} {invoice.amountTotal.toFixed(2)}
                </p>
              </div>
              <StatusBadge status={invoice.displayStatus} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
