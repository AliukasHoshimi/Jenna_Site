"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LocalDateTime } from "@/components/local-date-time";

interface PendingRequest {
  id: string;
  contactName: string;
  threadId: string;
  sessionTypeName: string;
  startIso: string;
  endIso: string;
  clientNote: string | null;
}

export function PendingRequestsPanel({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDecide(id: string, action: "approve" | "decline") {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/booking-requests/${id}/${action}`, { method: "POST" });
    setBusyId(null);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update this request.");
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-accent">
        Pending requests ({requests.length})
      </h2>
      {error && <p className="mb-3 text-sm text-warm">{error}</p>}
      <div className="divide-y divide-border rounded-md border border-border bg-surface">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {r.contactName} ·{" "}
                <Link href={`/admin/threads/${r.threadId}`} className="text-accent hover:underline">
                  thread
                </Link>
              </p>
              <p className="text-xs text-muted">
                {r.sessionTypeName} · <LocalDateTime iso={r.startIso} />
              </p>
              {r.clientNote && <p className="mt-1 text-xs text-muted">&ldquo;{r.clientNote}&rdquo;</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecide(r.id, "decline")}
                disabled={busyId === r.id}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-warm hover:text-warm disabled:opacity-60"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleDecide(r.id, "approve")}
                disabled={busyId === r.id}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast disabled:opacity-60"
              >
                {busyId === r.id ? "…" : "Approve"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
