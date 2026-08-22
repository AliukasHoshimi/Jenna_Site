"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContractTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
}

export function ContractTemplateRow({ template }: { template: ContractTemplate }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [title, setTitle] = useState(template.title);
  const [body, setBody] = useState(template.body);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    setBusy(true);
    await fetch(`/api/contract-templates/${template.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, title, body }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template.name}"?`)) return;
    setBusy(true);
    await fetch(`/api/contract-templates/${template.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{template.name}</p>
        <div className="flex gap-3 text-xs">
          <button onClick={() => setEditing(true)} className="text-muted hover:text-foreground">
            Edit
          </button>
          <button onClick={handleDelete} disabled={busy} className="text-warm hover:opacity-80">
            Delete
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">{template.title}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{template.body}</p>
    </div>
  );
}
