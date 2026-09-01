"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

interface ThreadRow {
  id: string;
  subject: string;
  status: string;
  needsReply: boolean;
  contactName: string;
  contactEmail: string;
  estimatedBudget: string | null;
}

export function ThreadList({ threads }: { threads: ThreadRow[] }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"open" | "closed">("open");

  const filtered = threads.filter((t) => {
    if (t.status !== view) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.contactName.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-3 flex gap-1 text-sm">
        <button
          onClick={() => setView("open")}
          className={`rounded-md px-3 py-1.5 ${
            view === "open" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setView("closed")}
          className={`rounded-md px-3 py-1.5 ${
            view === "closed" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Closed
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by client or subject…"
        className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted">
            {threads.filter((t) => t.status === view).length === 0 ? "No conversations here." : "No matches."}
          </p>
        )}
        {filtered.map((thread) => {
          const isActive = pathname === `/admin/threads/${thread.id}`;
          return (
            <Link
              key={thread.id}
              href={`/admin/threads/${thread.id}`}
              className={`flex items-center justify-between px-4 py-3 ${
                isActive ? "bg-accent/10" : "hover:bg-background"
              }`}
            >
              <div className="flex items-center gap-2">
                {thread.needsReply && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-warm" title="Needs reply" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{thread.contactName}</p>
                  <p className="text-xs text-muted">
                    {thread.subject}
                    {thread.estimatedBudget && ` · ${thread.estimatedBudget}`}
                  </p>
                </div>
              </div>
              <StatusBadge status={thread.status} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
