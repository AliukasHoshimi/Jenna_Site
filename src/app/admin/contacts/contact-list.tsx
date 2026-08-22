"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  source: string;
  bookingStage: string;
}

export function ContactList({ contacts }: { contacts: ContactRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = contacts.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q) ||
      (c.instagram ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, phone, or Instagram…"
        className="mb-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-surface">
        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted">{contacts.length === 0 ? "No contacts yet." : "No matches."}</p>
        )}
        {filtered.map((contact) => (
          <Link
            key={contact.id}
            href={`/admin/contacts/${contact.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-background"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{contact.name}</p>
              <p className="text-xs text-muted">{contact.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted">{contact.source}</span>
              <StatusBadge status={contact.bookingStage} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
