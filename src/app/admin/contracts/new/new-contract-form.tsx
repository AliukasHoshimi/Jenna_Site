"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ContactOption {
  id: string;
  name: string;
  email: string;
}

interface ContractTemplateOption {
  id: string;
  name: string;
  title: string;
  body: string;
}

function applyTemplate(text: string, clientName: string) {
  return text.replace(/\{\{\s*client_name\s*\}\}/g, clientName);
}

export function NewContractForm({
  contacts,
  templates,
  defaultContactId,
  defaultThreadId,
}: {
  contacts: ContactOption[];
  templates: ContractTemplateOption[];
  defaultContactId?: string;
  defaultThreadId?: string;
}) {
  const router = useRouter();
  const [contactId, setContactId] = useState(defaultContactId ?? "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    const contact = contacts.find((c) => c.id === contactId);
    const clientName = contact?.name ?? "";
    setTitle(applyTemplate(template.title, clientName));
    setBody(applyTemplate(template.body, clientName));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!contactId || !title.trim() || !body.trim()) {
      setError("Pick a client and fill in a title and body.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactId, threadId: defaultThreadId, title, body }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok && data.id) {
      router.push(`/admin/contracts/${data.id}`);
    } else {
      setError(data.error ?? "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Client</label>
        <select
          required
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="" disabled>
            Select a client…
          </option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.email}
            </option>
          ))}
        </select>
      </div>

      {templates.length > 0 && (
        <div>
          <label className="mb-1 block text-sm text-muted">Start from a template</label>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="" disabled>
              Choose a contract template…
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm text-muted">Contract title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Contract body</label>
        <textarea
          required
          rows={14}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-warm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        {submitting ? "Creating…" : "Create draft contract"}
      </button>
    </form>
  );
}
