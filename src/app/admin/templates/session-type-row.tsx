"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SessionType {
  id: string;
  name: string;
  durationMinutes: number;
  description: string | null;
}

export function SessionTypeRow({ sessionType, canDelete }: { sessionType: SessionType; canDelete: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sessionType.name);
  const [durationMinutes, setDurationMinutes] = useState(String(sessionType.durationMinutes));
  const [description, setDescription] = useState(sessionType.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const duration = Number(durationMinutes);
    if (!name.trim() || !duration || duration <= 0) {
      setError("Name and a positive duration are required.");
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/booking-session-types/${sessionType.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), durationMinutes: duration, description: description.trim() || null }),
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

  async function handleDelete() {
    if (!confirm(`Delete "${sessionType.name}"?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/booking-session-types/${sessionType.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not delete this session type.");
    }
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description shown to clients (optional)"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-warm">{error}</p>}
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {sessionType.name} <span className="font-normal text-muted">· {sessionType.durationMinutes} min</span>
        </p>
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-foreground">
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={busy || !canDelete}
            title={!canDelete ? "At least one session type is required" : undefined}
            className="text-warm hover:opacity-80 disabled:opacity-30"
          >
            Delete
          </button>
        </div>
      </div>
      {sessionType.description && <p className="mt-1 text-xs text-muted">{sessionType.description}</p>}
      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
    </div>
  );
}
