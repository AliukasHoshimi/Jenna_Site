"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" in the *viewer's* local
// time, not raw ISO (which is UTC) — this only runs client-side, so
// `new Date(iso)` and the getters below resolve in the browser's own zone.
function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventEditor({
  eventId,
  title: initialTitle,
  description: initialDescription,
  startIso,
  endIso,
  htmlLink,
}: {
  eventId: string;
  title: string;
  description: string;
  startIso: string;
  endIso: string;
  htmlLink: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [start, setStart] = useState(toLocalInputValue(startIso));
  const [end, setEnd] = useState(toLocalInputValue(endIso));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!title.trim() || !start || !end) {
      setError("Title, start, and end are required.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after the start time.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/calendar-events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save changes.");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This removes it from Google Calendar too.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/calendar-events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/calendar");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Could not delete event.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Start</label>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">End</label>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-warm">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {htmlLink && (
          <a
            href={htmlLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
          >
            Open in Google Calendar
          </a>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-warm hover:opacity-80 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete event"}
        </button>
      </div>
    </div>
  );
}
