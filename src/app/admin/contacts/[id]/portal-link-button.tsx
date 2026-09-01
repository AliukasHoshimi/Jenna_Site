"use client";

import { useState } from "react";

export function PortalLinkButton({
  contactId,
  action = "copy",
}: {
  contactId: string;
  // "copy" (Contacts page): she's grabbing the link to send to the client.
  // "open" (Thread page): she wants to view the client's own portal herself.
  action?: "copy" | "open";
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchUrl() {
    const res = await fetch(`/api/contacts/${contactId}/portal-link`, { method: "POST" });
    const data = await res.json();
    return data.url as string | undefined;
  }

  async function handleClick() {
    if (action === "open") {
      setLoading(true);
      const existing = url ?? (await fetchUrl());
      setLoading(false);
      if (existing) {
        setUrl(existing);
        window.open(existing, "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setLoading(true);
    const fetched = await fetchUrl();
    setLoading(false);
    if (fetched) {
      setUrl(fetched);
      await navigator.clipboard.writeText(fetched);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-md border border-border bg-surface px-4 py-2 text-sm hover:border-accent disabled:opacity-60"
    >
      {action === "open"
        ? loading ? "…" : "View portal"
        : copied ? "Copied!" : loading ? "…" : url ? "Copy portal link" : "Get portal link"}
    </button>
  );
}
