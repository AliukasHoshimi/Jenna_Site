"use client";

import { useState } from "react";

export function PortalLinkButton({ contactId }: { contactId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/contacts/${contactId}/portal-link`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (data.url) {
      setUrl(data.url);
      await navigator.clipboard.writeText(data.url);
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
      {copied ? "Copied!" : loading ? "…" : url ? "Copy portal link" : "Get portal link"}
    </button>
  );
}
