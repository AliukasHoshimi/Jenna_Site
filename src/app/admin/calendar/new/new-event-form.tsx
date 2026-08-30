"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ContactSearchSelect } from "@/components/contact-search-select";

interface ContactOption {
  id: string;
  name: string;
  email: string;
}

export function NewEventForm({
  contacts,
  defaultContactId,
  defaultThreadId,
}: {
  contacts: ContactOption[];
  defaultContactId?: string;
  defaultThreadId?: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        contactId: contactId || null,
        threadId: defaultThreadId ?? null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok && data.id) {
      router.push(`/admin/calendar/${data.id}`);
    } else {
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
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
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">End</label>
          <input
            required
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
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
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">
          Client <span className="text-muted/70">(optional — invites them to the event)</span>
        </label>
        <ContactSearchSelect contacts={contacts} value={contactId} onChange={setContactId} />
      </div>

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
