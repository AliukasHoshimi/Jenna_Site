"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function InvoicePresetForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/invoice-line-item-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group, description }),
    });
    setSubmitting(false);
    setOpen(false);
    setGroup("");
    setDescription("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent"
      >
        + New preset
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <input
        required
        placeholder="Group (e.g. Session fees, Add-ons)"
        value={group}
        onChange={(e) => setGroup(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        required
        placeholder="Description (e.g. Engagement session (1.5 hrs))"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save preset"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
