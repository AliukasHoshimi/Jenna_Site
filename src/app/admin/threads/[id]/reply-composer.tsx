"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

function applyTemplate(body: string, clientName: string) {
  return body.replace(/\{\{\s*client_name\s*\}\}/g, clientName);
}

export function ReplyComposer({
  threadId,
  contactName,
  templates,
}: {
  threadId: string;
  contactName: string;
  templates: Template[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) setBody(applyTemplate(template.body, contactName));
  }

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send message.");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      {templates.length > 0 && (
        <select
          onChange={(e) => handleTemplateSelect(e.target.value)}
          defaultValue=""
          className="mb-2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted"
        >
          <option value="" disabled>
            Insert a template…
          </option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder="Write a reply…"
        className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSend}
          disabled={sending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
