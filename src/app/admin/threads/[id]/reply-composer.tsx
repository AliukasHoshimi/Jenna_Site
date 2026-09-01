"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScheduleEventModal } from "./schedule-event-modal";

const MAX_TEXTAREA_HEIGHT = 320; // px — grows with content up to this, then scrolls

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
  contactId,
  contactName,
  templates,
  defaultStyled,
}: {
  threadId: string;
  contactId: string;
  contactName: string;
  templates: Template[];
  defaultStyled: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [styled, setStyled] = useState(defaultStyled);
  const [sending, setSending] = useState(false);
  const [sendingLinkKind, setSendingLinkKind] = useState<"booking" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [body]);

  function handleTemplateSelect(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) setBody(applyTemplate(template.body, contactName));
  }

  async function handleInsertLink(kind: string) {
    if (kind !== "booking" && kind !== "portal") return;
    setSendingLinkKind(kind);
    setError(null);
    const res = await fetch(
      kind === "booking" ? `/api/threads/${threadId}/booking-link` : `/api/contacts/${contactId}/portal-link`,
      { method: "POST" }
    );
    const data = await res.json().catch(() => ({}));
    setSendingLinkKind(null);
    if (res.ok && data.url) {
      const line =
        kind === "booking"
          ? `Pick a time that works for you: ${data.url}`
          : `Here's a link to everything on your account: ${data.url}`;
      setBody((prev) => (prev.trim() ? `${prev}\n\n${line}` : line));
    } else {
      setError(data.error ?? `Could not generate a ${kind === "booking" ? "booking" : "portal"} link.`);
    }
  }

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/threads/${threadId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, useHtml: styled }),
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
      <div className="mb-2 flex items-center gap-3">
        {templates.length > 0 && (
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted"
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
        <ScheduleEventModal threadId={threadId} contactId={contactId} contactName={contactName} />
        <select
          onChange={(e) => handleInsertLink(e.target.value)}
          disabled={sendingLinkKind !== null}
          value=""
          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-muted disabled:opacity-60"
        >
          <option value="" disabled>
            {sendingLinkKind ? "…" : "Insert a link…"}
          </option>
          <option value="booking">Booking link</option>
          <option value="portal">Portal link</option>
        </select>
      </div>
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder="Write a reply…"
        style={{ maxHeight: MAX_TEXTAREA_HEIGHT }}
        className="w-full resize-none overflow-y-auto rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={styled} onChange={(e) => setStyled(e.target.checked)} />
          Styled formatting
        </label>
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
