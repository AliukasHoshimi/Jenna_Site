"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ThreadStatusToggle({
  threadId,
  status,
}: {
  threadId: string;
  status: "open" | "closed";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "open" ? "closed" : "open" }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={busy} className="text-xs text-muted hover:text-foreground">
      Mark as {status === "open" ? "closed" : "open"}
    </button>
  );
}
