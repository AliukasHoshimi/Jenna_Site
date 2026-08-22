"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm("Mark this invoice as paid? Use this only for payments that happened outside Stripe.")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/invoices/${invoiceId}/mark-paid`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not mark invoice as paid.");
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={busy}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
      >
        {busy ? "Marking paid…" : "Mark as paid"}
      </button>
      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
    </div>
  );
}
