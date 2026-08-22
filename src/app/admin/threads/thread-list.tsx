"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

interface ThreadRow {
  id: string;
  subject: string;
  status: string;
  needsReply: boolean;
  contactName: string;
  contactEmail: string;
}

export function ThreadList({ threads }: { threads: ThreadRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = threads.filter((t) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.contactName.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by client or subject…"
        className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted">
            {threads.length === 0 ? "No conversations here." : "No matches."}
          </p>
        )}
        {filtered.map((thread) => (
          <Link
            key={thread.id}
            href={`/admin/threads/${thread.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-background"
          >
            <div className="flex items-center gap-2">
              {thread.needsReply && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-warm" title="Needs reply" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">{thread.contactName}</p>
                <p className="text-xs text-muted">{thread.subject}</p>
              </div>
            </div>
            <StatusBadge status={thread.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
