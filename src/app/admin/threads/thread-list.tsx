"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";

interface ThreadRow {
  id: string;
  subject: string;
  status: string;
  needsReply: boolean;
  contactName: string;
  contactEmail: string;
  estimatedBudget: string | null;
  archived: boolean;
}

type View = "open" | "closed" | "archived";

export function ThreadList({ threads }: { threads: ThreadRow[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("open");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = threads.filter((t) => {
    if (view === "archived") {
      if (!t.archived) return false;
    } else {
      if (t.archived || t.status !== view) return false;
    }
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return t.contactName.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function switchView(next: View) {
    setView(next);
    setSelected(new Set());
  }

  async function handleArchiveToggle(archived: boolean) {
    setBusy(true);
    await fetch("/api/threads/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), archived }),
    });
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex gap-1 text-sm">
        <button
          onClick={() => switchView("open")}
          className={`rounded-md px-3 py-1.5 ${
            view === "open" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => switchView("closed")}
          className={`rounded-md px-3 py-1.5 ${
            view === "closed" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Closed
        </button>
        <button
          onClick={() => switchView("archived")}
          className={`rounded-md px-3 py-1.5 ${
            view === "archived" ? "bg-accent/10 text-accent" : "text-muted hover:text-foreground"
          }`}
        >
          Archived
        </button>
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by client or subject…"
        className="mb-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />

      {selected.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
          <p className="text-xs text-muted">{selected.size} selected</p>
          <button
            onClick={() => handleArchiveToggle(view !== "archived")}
            disabled={busy}
            className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-accent disabled:opacity-60"
          >
            {busy ? "…" : view === "archived" ? "Restore selected" : "Archive selected"}
          </button>
        </div>
      )}

      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted">
            {threads.filter((t) => (view === "archived" ? t.archived : !t.archived && t.status === view)).length === 0
              ? "No conversations here."
              : "No matches."}
          </p>
        )}
        {filtered.map((thread) => {
          const isActive = pathname === `/admin/threads/${thread.id}`;
          return (
            <div
              key={thread.id}
              className={`flex items-center gap-2 px-3 py-3 ${isActive ? "bg-accent/10" : "hover:bg-background"}`}
            >
              <input
                type="checkbox"
                checked={selected.has(thread.id)}
                onChange={() => toggle(thread.id)}
                className="h-4 w-4 shrink-0 accent-accent"
              />
              <Link href={`/admin/threads/${thread.id}`} className="flex flex-1 items-center justify-between gap-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
