"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContractEditor({
  contractId,
  title,
  body,
}: {
  contractId: string;
  title: string;
  body: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!titleValue.trim() || !bodyValue.trim()) {
      setError("Title and body are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/contracts/${contractId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: titleValue, body: bodyValue }),
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

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <input
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          rows={14}
          value={bodyValue}
          onChange={(e) => setBodyValue(e.target.value)}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-2 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:border-accent"
        >
          Edit
        </button>
      </div>
      <p className="whitespace-pre-wrap text-sm text-foreground/80">{bodyValue}</p>
    </div>
  );
}
