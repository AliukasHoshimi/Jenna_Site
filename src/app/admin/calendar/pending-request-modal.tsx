"use client";

import { useState } from "react";
import Link from "next/link";
import { LocalDateTime } from "@/components/local-date-time";

export interface PendingModalItem {
  id: string;
  sessionTypeName: string;
  contactName: string;
  threadId: string;
  startIso: string;
  endIso: string;
  clientNote: string | null;
}

export function PendingRequestModal({ item, onClose, onDone }: { item: PendingModalItem; onClose: () => void; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(action: "approve" | "decline") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/booking-requests/${item.id}/${action}`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      onDone();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update this request.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={busy ? undefined : onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg text-foreground">Booking request</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="text-muted hover:text-foreground disabled:opacity-60"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground">{item.sessionTypeName}</p>
            <p className="text-muted">{item.contactName}</p>
          </div>
          <p className="text-foreground">
            <LocalDateTime iso={item.startIso} /> – <LocalDateTime iso={item.endIso} />
          </p>
          {item.clientNote && (
            <p className="rounded-md bg-background p-3 text-xs text-muted">&ldquo;{item.clientNote}&rdquo;</p>
          )}
          <Link href={`/admin/threads/${item.threadId}`} className="inline-block text-xs text-accent hover:underline">
            View thread →
          </Link>
        </div>

        {error && <p className="mt-3 text-sm text-warm">{error}</p>}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleDecide("decline")}
            disabled={busy}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted hover:border-warm hover:text-warm disabled:opacity-60"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => handleDecide("approve")}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
          >
            {busy ? "…" : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
