"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ScheduleEventModal({
  threadId,
  contactId,
  contactName,
}: {
  threadId: string;
  contactId: string;
  contactName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setStart("");
    setEnd("");
    setError(null);
  }

  function close() {
    if (submitting) return;
    setOpen(false);
    reset();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !start || !end) {
      setError("Title, start, and end are required.");
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setError("End time must be after the start time.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/calendar-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || null,
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        contactId,
        threadId,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) {
      setOpen(false);
      reset();
      router.refresh();
    } else {
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-accent hover:underline">
        Schedule
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-border bg-surface p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground">Schedule with {contactName}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="text-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-muted">Title</label>
                <input
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-muted">Start</label>
                  <input
                    required
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted">End</label>
                  <input
                    required
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-muted">
                  Description <span className="text-muted/70">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              {error && <p className="text-sm text-warm">{error}</p>}

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={close} className="text-sm text-muted hover:text-foreground">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
                >
                  {submitting ? "Creating…" : "Create event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
