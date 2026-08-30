"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DisconnectButton({ connectedEmail }: { connectedEmail: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDisconnect() {
    if (!confirm(`Unlink ${connectedEmail} from Studio's calendar?`)) return;
    setBusy(true);
    await fetch("/api/google-calendar/disconnect", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleDisconnect}
      disabled={busy}
      className="text-xs text-muted hover:text-warm disabled:opacity-60"
    >
      {busy ? "Unlinking…" : `Unlink ${connectedEmail}`}
    </button>
  );
}
