"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SendContractButton({ contractId }: { contractId: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/contracts/${contractId}/send`, { method: "POST" });
    setSending(false);
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not send contract.");
    }
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={sending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send for signature"}
      </button>
      {error && <p className="mt-2 text-sm text-warm">{error}</p>}
    </div>
  );
}
