"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContactData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  instagram: string | null;
  source: string;
  bookingStage: string;
}

const STAGE_LABELS: Record<string, string> = {
  inquiry: "Inquiry",
  booked: "Booked",
  active: "Active",
  delivered: "Delivered",
};

export function ContactHeader({ contact }: { contact: ContactData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name);
  const [phone, setPhone] = useState(contact.phone ?? "");
  const [instagram, setInstagram] = useState(contact.instagram ?? "");
  const [source, setSource] = useState(contact.source);
  const [stageBusy, setStageBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), phone: phone.trim(), instagram: instagram.trim(), source }),
    });
    setBusy(false);
    if (res.ok) {
      setEditing(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save changes.");
    }
  }

  async function handleStageChange(newStage: string) {
    setStageBusy(true);
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contact.name,
        phone: contact.phone,
        instagram: contact.instagram,
        source: contact.source,
        bookingStage: newStage,
      }),
    });
    setStageBusy(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Email (can&apos;t be changed here)</label>
          <input
            disabled
            value={contact.email}
            className="w-full cursor-not-allowed rounded-md border border-border bg-background px-3 py-2 text-sm text-muted"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Instagram</label>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Source</label>
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        {error && <p className="text-sm text-warm">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-display text-2xl text-foreground">{contact.name}</h1>
        <p className="mb-1 text-sm text-muted">{contact.email}</p>
        {contact.phone && <p className="text-sm text-muted">{contact.phone}</p>}
        {contact.instagram && <p className="text-sm text-muted">@{contact.instagram}</p>}
      </div>
      <div className="flex items-center gap-2">
        <select
          value={contact.bookingStage}
          disabled={stageBusy}
          onChange={(e) => handleStageChange(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-accent disabled:opacity-60"
        >
          {Object.entries(STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:border-accent"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
