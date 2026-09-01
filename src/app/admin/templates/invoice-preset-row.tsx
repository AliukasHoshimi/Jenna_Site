"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface InvoicePreset {
  id: string;
  group: string;
  description: string;
}

export function InvoicePresetRow({ preset }: { preset: InvoicePreset }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [group, setGroup] = useState(preset.group);
  const [description, setDescription] = useState(preset.description);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    await fetch(`/api/invoice-line-item-presets/${preset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group, description }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${preset.description}"?`)) return;
    setBusy(true);
    await fetch(`/api/invoice-line-item-presets/${preset.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
          >
            Save
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
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{preset.group}</p>
        <p className="text-sm text-foreground">{preset.description}</p>
      </div>
      <div className="flex shrink-0 gap-3 text-xs">
        <button onClick={() => setEditing(true)} className="text-muted hover:text-foreground">
          Edit
        </button>
        <button onClick={handleDelete} disabled={busy} className="text-warm hover:opacity-80">
          Delete
        </button>
      </div>
    </div>
  );
}
