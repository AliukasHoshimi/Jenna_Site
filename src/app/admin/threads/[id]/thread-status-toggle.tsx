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
    const nextStatus = status === "open" ? "closed" : "open";
    await fetch(`/api/threads/${threadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (nextStatus === "closed") {
      // Closed threads are hidden from the default inbox view, so closing
      // one from here should take you back to the list, not leave you
      // sitting on a thread you'd have to search "Closed" to find again.
      router.push("/admin/threads");
    } else {
      router.refresh();
    }
  }

  return (
    <button onClick={toggle} disabled={busy} className="text-xs text-muted hover:text-foreground">
      Mark as {status === "open" ? "closed" : "open"}
    </button>
  );
}
