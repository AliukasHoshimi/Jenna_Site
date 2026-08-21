"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-xs text-muted hover:text-foreground">
      Sign out
    </button>
  );
}
